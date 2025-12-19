from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
from pydantic import BaseModel
import datetime
import os

# 导入机器学习模型
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# 导入PDF生成相关包
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

app = FastAPI()

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 全局变量 (用于简单演示，生产环境通常用数据库或文件存储) ---
global_df = pd.DataFrame({
    "area": [80, 120, 150, 200, 100, 90, 300, 250],
    "rooms": [2, 3, 4, 5, 2, 2, 6, 5],
    "age": [5, 10, 20, 25, 8, 12, 5, 3],
    "price": [100, 180, 220, 350, 130, 110, 500, 420]
})
trained_model = None  # 存储训练好的模型对象
current_model_name = "LinearRegression" # 当前使用的模型名称

# --- 1. 获取数据 ---
@app.get('/data')
def get_data():
    return {
        'columns': list(global_df.columns),
        'rows': global_df.shape[0],
        'preview': global_df.head(20).to_dict(orient='records'),
    }

# --- 2. 上传数据 ---
@app.post("/upload")
async def upload_data(file: UploadFile = File(...)):
    global global_df
    try:
        # 读取CSV
        global_df = pd.read_csv(file.file)
        return {
            'status': 'ok',
            'rows': len(global_df)
        }
    except Exception as e:
        return {"error": str(e)}

# --- 3. 训练模型 ---
class TrainRequest(BaseModel):
    model_type: str = "LinearRegression"

@app.post('/train')
def train_model(req: TrainRequest):
    global global_df, trained_model, current_model_name

    current_model_name = req.model_type

    # 1️⃣ 检查列
    require_cols = {'area', 'rooms', 'age', 'price'}
    if not require_cols.issubset(set(global_df.columns)):
        return {"error": "数据必须包含 area, rooms, age, price"}

    # 2️⃣ 准备数据
    X = global_df[['area', 'rooms', 'age']]
    y = global_df['price']

    # 3️⃣ 划分数据集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 4️⃣ 选择模型 (满足作业 P3-M3 要求: 添加3个回归模型选项)
    if req.model_type == "Ridge":
        model = Ridge()
    elif req.model_type == "Lasso":
        model = Lasso()
    elif req.model_type == "DecisionTree":
        model = DecisionTreeRegressor()
    else:
        model = LinearRegression()

    # 5️⃣ 训练
    model.fit(X_train, y_train)
    trained_model = model  # 更新全局模型

    # 6️⃣ 预测与评估
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # 获取系数 (决策树没有coef_属性，需要特殊处理)
    coefs = {}
    intercept = 0.0
    
    if hasattr(model, 'coef_'):
        coefs = {
            "area": float(model.coef_[0]),
            "rooms": float(model.coef_[1]),
            "age": float(model.coef_[2])
        }
        intercept = float(model.intercept_)
    elif hasattr(model, 'feature_importances_'):
         coefs = {
            "area (重要性)": float(model.feature_importances_[0]),
            "rooms (重要性)": float(model.feature_importances_[1]),
            "age (重要性)": float(model.feature_importances_[2])
        }

    return {
        "message": f"模型 ({req.model_type}) 训练成功！",
        "status": "trained",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "coefficients": coefs,
        "intercept": intercept
    }

# --- 4. 预测 ---
class PredictInput(BaseModel):
    area: float
    rooms: int
    age: float

@app.post('/predict')
def predict_values(input: PredictInput):
    global trained_model
    if trained_model is None:
        return {"error": "模型未训练，请先在 Step2 点击训练"}

    X_new = [[input.area, input.rooms, input.age]]
    prediction = trained_model.predict(X_new)[0]

    return {"prediction": float(prediction)}

# --- 5. 生成报告 (PDF) ---
@app.get('/generate-report')
def generate_report(area: float, rooms: int, age: float, prediction: float):
    # 注册字体 (确保 simhei.ttf 在同级目录下，或者上传到了对应文件夹)
    # 如果本地没有 simhei.ttf，为了防止报错，可以注释掉这块用默认字体，或者确保文件存在
    try:
        pdfmetrics.registerFont(TTFont("SimHei", "SimHei.ttf")) # 请确保文件名大小写一致
        font_name = "SimHei"
    except:
        font_name = "Helvetica" # 如果找不到字体，回退到默认英文

    filename = "report.pdf"
    c = canvas.Canvas(filename)

    # 标题
    c.setFont(font_name, 20)
    c.drawCentredString(300, 800, "机器学习房价预测报告")

    # 内容
    c.setFont(font_name, 12)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.drawString(50, 770, f"报告生成时间: {timestamp}")
    c.drawString(50, 750, f"使用模型: {current_model_name}")

    c.drawString(50, 720, "【输入参数】")
    c.drawString(70, 700, f"房屋面积: {area} 平方米")
    c.drawString(70, 680, f"房间数量: {rooms} 间")
    c.drawString(70, 660, f"房屋房龄: {age} 年")

    c.setFont(font_name, 16)
    c.drawString(50, 620, f"【预测结果】")
    c.drawString(70, 590, f"预估房价: {prediction:.2f} 万元")
    
    # 底部声明 (作业 P3-M4 要求)
    c.setFont(font_name, 10)
    c.drawString(50, 100, "免责声明: 预测结果仅供参考，不构成决策建议。")

    c.showPage()
    c.save()

    return FileResponse(
        filename,
        media_type="application/pdf",
        filename="ML_Prediction_Report.pdf"
    )

# --- 6. 系统状态接口 (供设置页面使用) ---
@app.get('/status')
def get_status():
    global trained_model, global_df, current_model_name
    return {
        "data_loaded": not global_df.empty,
        "model_trained": trained_model is not None,
        "current_model": current_model_name,
        "data_rows": len(global_df)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
