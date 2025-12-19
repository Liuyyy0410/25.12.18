from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from fastapi import UploadFile, File
# 训练模型
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
# 导入p口的包
import pickle
#导入pdf包
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fastapi.responses import FileResponse
import datetime


app = FastAPI()

# 允许跨域（给前端访问后端用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.DataFrame({
    "area": [80, 120, 150, 200],
    "rooms": [2, 3, 4, 5],
    "age": [5, 10, 20, 25],
    "price": [100, 180, 220, 350]
})


@app.get('/data')
def get_data():
  return{
    'columns':list(df.columns),
    'rows':df.shape[0],
    'preview':df.head(20).to_dict(orient= 'records'),
  }

# 上传文件
@app.post("/upload")
async def upload_data(file:UploadFile = File(...)):
  global df
  df= pd.read_csv(file.file)
  return{
    'status':'ok',
    'rows':len(df)
  }

# 训练模型
@app.post('/train')
def train_model():
    global df

    # 1️⃣ 检查表是否有所需的列
    require_cols = {'area', 'rooms', 'age', 'price'}
    if not require_cols.issubset(set(df.columns)):
        return {"error": "数据必须包含 area, rooms, age, price"}

    # 2️⃣ 准备特征和标签
    X = df[['area', 'rooms', 'age']]
    y = df['price']

    # 3️⃣ 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 4️⃣ 创建线性回归模型
    model = LinearRegression()

    # 5️⃣ 训练模型
    model.fit(X_train, y_train)

    # 6️⃣ 预测
    y_pred = model.predict(X_test)

    # 7️⃣ 评估结果
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # 8️⃣ 返回训练结果
    return {
        "message": "成功啦！！！",
        "status": "trained",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "coefficients": {
            "area": model.coef_[0],
            "rooms": model.coef_[1],
            "age": model.coef_[2]
        },
        "intercept": model.intercept_
    }


# 输入新数据，模型能够预测
from pydantic import BaseModel
class PredictInput(BaseModel):
  area: float
  rooms: int
  age: float

@app.post('/predict')
def predict_values(input:PredictInput):
  try:
       # 保存模型
    model = pickle.dump(model, open("model.pkl","rb"))
  except:
    return {"error":"模型未训练，请先点击train"}

  X_new=[[input.area, input.rooms,input.age]]
  prediction= model.predict(X_new)[0]

  return {"prediction":float(prediction)}

# 预测结果的报告
#X -> y
@app.get('/generate-report')
def  generate_report(
        area: float,
        rooms: int,
        age: float,
        prediction: float):
  # PDF文件
  pdfmetrics.registerFont(
    TTFont("SimHei", "simhei.ttf")
  )

  # 创建一张白纸
  filename="report.pdf"
  c = canvas.Canvas(filename)

  # 标题和时间
  c.setFont("SimHei",20)
  c.drawCentredString(300,800,"机器学习预测报告")

  c.setFont("SimHei", 12)
  timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
  c.drawString(50, 770, f"报告生成时间：{timestamp}")

  # 预测的输入特征
  c.drawString(50, 740, "输入参数：")
  c.drawString(70, 720, f"面积（area）：{area} 平方米")
  c.drawString(70, 700, f"房间数（rooms）：{rooms} 间")
  c.drawString(70, 680, f"屋龄（age）：{age} 年")

  # 预测的结果
  c.setFont("SimHei", 14)
  c.drawString(50, 650, f"预测房价：{prediction:.2f} 万元")

  # 保存结果
  c.showPage()
  c.save()

  return FileResponse(
      filename,
      media_type="application/pdf", # 告知浏览器：这是一个pdf文件
      filename="ML_Report.pdf"
    )
