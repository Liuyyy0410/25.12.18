import React, { useState, useEffect } from "react";
import {
  Layout, Menu, Tabs, Card, Row, Col, Statistic, Button, Table,
  message, Select, Form, InputNumber, Tag, Descriptions, Divider,
  Upload, Spin, Alert, Typography
} from 'antd';
import {
  HomeOutlined, FileTextOutlined, SettingOutlined,
  CloudUploadOutlined, ExperimentOutlined, ThunderboltOutlined,
  InboxOutlined, CheckCircleOutlined, SyncOutlined
} from '@ant-design/icons';

const { Header, Sider, Content, Footer } = Layout;
const { Dragger } = Upload;
const { Title, Text } = Typography;

function App() {
  const [currentView, setCurrentView] = useState('workflow');
  const [modelType, setModelType] = useState("LinearRegression");

  const handleMenuClick = (e) => {
    setCurrentView(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="light"
        style={{
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 10
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            📊 ML 分析系统
          </Title>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['workflow']}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 16 }}
          items={[
            { key: 'workflow', icon: <HomeOutlined />, label: '操作流程 (主页)' },
            { key: 'docs', icon: <FileTextOutlined />, label: '使用帮助' },
            { key: 'settings', icon: <SettingOutlined />, label: '系统设置' }
          ]}
        />
      </Sider>

      <Layout className="site-layout">
        <Header style={{
          background: "#fff",
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1
        }}>
          <Title level={3} style={{ margin: 0, fontSize: '20px' }}>
            期末作业：基于机器学习的数据分析与统计系统
          </Title>
          <Tag color="blue">v1.0.0</Tag>
        </Header>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <div style={{
            padding: 24,
            background: '#fff',
            borderRadius: '8px',
            minHeight: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {currentView === 'workflow' && <WorkflowView modelType={modelType} />}
            {currentView === 'docs' && <DocsView />}
            {currentView === 'settings' && <SettingsView modelType={modelType} setModelType={setModelType} />}
          </div>
        </Content>
        
        <Footer style={{ textAlign: 'center', color: '#888' }}>
           Machine Learning System Project ©2025 Created for Final Assignment
        </Footer>
      </Layout>
    </Layout>
  );
}

// === P0: 核心操作流程视图 ===
const WorkflowView = ({ modelType }) => {
  return (
    <Tabs
      defaultActiveKey="1"
      type="card"
      size="large"
      items={[
        {
          key: '1',
          label: <span><CloudUploadOutlined /> Step 1 数据准备</span>,
          children: <Step1Data />
        },
        {
          key: '2',
          label: <span><ExperimentOutlined /> Step 2 模型训练</span>,
          children: <Step2Model modelType={modelType} />
        },
        {
          key: '3',
          label: <span><ThunderboltOutlined /> Step 3 智能预测</span>,
          children: <Step3Predict />
        }
      ]}
    />
  );
};

// Step 1: 数据上传与预览
const Step1Data = () => {
  const [rowCount, setRowCount] = useState(0);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/data");
      const json = await res.json();
      setRowCount(json.rows || 0);
      setPreview(json.preview || []);
      setColumns(json.columns || []);
    } catch (e) {
      console.error(e);
      message.error("连接后端失败，请检查 Python 服务是否启动");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // AntD Dragger 配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    action: 'http://localhost:8000/upload',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} 上传成功`);
        loadData();
      } else if (status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
    },
    showUploadList: false, // 不显示列表，直接刷新数据
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card title="📄 数据上传" bordered={false} style={{ height: '100%', background: '#fafafa' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Statistic title="当前数据量" value={rowCount} suffix="条" valueStyle={{ color: '#1890ff' }} />
            </div>
            
            <Dragger {...uploadProps} style={{ padding: '20px 0', background: '#fff' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#40a9ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽 CSV 文件到此上传</p>
              <p className="ant-upload-hint">
                支持 .csv 格式，必须包含 area, rooms, age, price 列
              </p>
            </Dragger>
            
            <Button block type="default" onClick={loadData} icon={<SyncOutlined />} style={{ marginTop: 16 }}>
              刷新数据状态
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="👀 数据预览 (Top 20)" bordered={false} bodyStyle={{ padding: 0 }}>
             {loading ? (
               <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
             ) : (
                <Table
                  dataSource={preview}
                  size="middle"
                  scroll={{ x: true }} // 防止列多时布局错乱
                  rowKey={(r, i) => i}
                  columns={columns.map(col => ({ 
                    title: col, 
                    dataIndex: col,
                    align: 'center'
                  }))}
                  pagination={false}
                  bordered
                />
             )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Step 2: 模型训练
const Step2Model = ({ modelType }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTrain = async () => {
    setLoading(true);
    setResult(null); // 清空旧结果
    try {
      const res = await fetch("http://localhost:8000/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_type: modelType })
      });
      const data = await res.json();
      
      if(data.error) {
        message.error(data.error);
      } else {
        setResult(data);
        message.success("模型训练完成！");
      }
    } catch (e) {
      message.error("请求失败，请检查后端控制台");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '20px auto' }}>
      <Card hoverable style={{ textAlign: 'center', marginBottom: 24, border: '1px solid #d9d9d9' }}>
        <Title level={4}>当前算法配置: <Tag color="geekblue" style={{ fontSize: 16, padding: '4px 10px' }}>{modelType}</Tag></Title>
        <p style={{ color: '#666' }}>系统将使用 <b>area (面积)</b>, <b>rooms (房间数)</b>, <b>age (房龄)</b> 来预测房价。</p>
        
        <Button 
          type="primary" 
          size="large" 
          onClick={handleTrain} 
          loading={loading}
          icon={<ExperimentOutlined />}
          style={{ height: 50, padding: '0 40px', fontSize: 18, borderRadius: 25 }}
        >
          {loading ? "正在全力训练中..." : "开始训练模型"}
        </Button>
      </Card>

      {result && (
        <Card title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 训练评估报告</span>} bordered={false} style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <Row gutter={24} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <Statistic title="训练样本数" value={result.train_samples} />
            </Col>
            <Col span={8}>
              <Statistic title="MAE (平均绝对误差)" value={result.mae} precision={2} valueStyle={{ color: '#cf1322' }} suffix="万元" />
            </Col>
            <Col span={8}>
              <Statistic title="RMSE (均方根误差)" value={result.rmse} precision={2} valueStyle={{ color: '#cf1322' }} />
            </Col>
          </Row>
          
          <Divider orientation="left">模型内部参数</Divider>
          <Descriptions bordered size="small" column={1}>
             <Descriptions.Item label="各特征权重 (Coefficients)">
               {Object.entries(result.coefficients).map(([key, val]) => (
                 <div key={key} style={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                    <span>{key}:</span> 
                    <Tag color="purple">{val.toFixed(4)}</Tag>
                 </div>
               ))}
             </Descriptions.Item>
             <Descriptions.Item label="截距 (Intercept)">{result.intercept.toFixed(4)}</Descriptions.Item>
          </Descriptions>
          
          <Alert 
            message="模型已就绪" 
            description="现在可以前往 Step 3 进行房价预测了。" 
            type="success" 
            showIcon 
            style={{ marginTop: 20 }}
          />
        </Card>
      )}
    </div>
  );
};

// Step 3: 预测与导出
const Step3Predict = () => {
  const [predResult, setPredResult] = useState(null);
  const [inputs, setInputs] = useState({ area: 100, rooms: 3, age: 10 });
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setInputs(values);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if(data.error) {
        message.error(data.error);
      } else {
        setPredResult(data.prediction);
        message.success("预测计算完成");
      }
    } catch (e) {
      message.error("预测请求失败");
    }
    setLoading(false);
  };

  const downloadReport = () => {
    if (predResult === null) return message.warning("请先进行预测");
    const url = `http://localhost:8000/generate-report?area=${inputs.area}&rooms=${inputs.rooms}&age=${inputs.age}&prediction=${predResult}`;
    window.open(url, "_blank");
  };

  return (
    <Row gutter={[32, 32]} justify="center">
      <Col xs={24} md={10}>
        <Card title="🏠 特征输入" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Form layout="vertical" onFinish={onFinish} initialValues={inputs} size="large">
            <Form.Item label="房屋面积 (平方米)" name="area" rules={[{ required: true, message: '请输入面积' }]}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="例如: 120" />
            </Form.Item>
            <Form.Item label="房间数量 (间)" name="rooms" rules={[{ required: true, message: '请输入房间数' }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={20} placeholder="例如: 3" />
            </Form.Item>
            <Form.Item label="房屋房龄 (年)" name="age" rules={[{ required: true, message: '请输入房龄' }]}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="例如: 5" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} icon={<ThunderboltOutlined />}>
              开始智能预测
            </Button>
          </Form>
        </Card>
      </Col>
      
      <Col xs={24} md={12}>
        <Card title="📊 预测结果面板" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1 }}>
          {predResult !== null ? (
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Text type="secondary">根据当前模型计算，该房屋估价为：</Text>
              <div style={{ margin: '20px 0' }}>
                 <Statistic 
                    value={predResult} 
                    precision={2} 
                    valueStyle={{ fontSize: 56, color: '#3f8600', fontWeight: 'bold' }} 
                    suffix="万元"
                 />
              </div>
              <Divider />
              <Button type="dashed" size="large" onClick={downloadReport} icon={<FileTextOutlined />}>
                下载 PDF 预测报告
              </Button>
            </div>
          ) : (
             <div style={{ padding: 40, textAlign: 'center', color: '#ccc', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 10 }} />
                  <p>请在左侧输入参数并点击预测</p>
                </div>
             </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

// === P2: 操作说明视图 ===
const DocsView = () => (
  <Card title="📖 系统操作指南">
    <Descriptions bordered column={1} labelStyle={{ width: '150px', fontWeight: 'bold' }}>
      <Descriptions.Item label="核心功能">
        本系统基于 Scikit-Learn 算法库，提供从数据清洗到房价预测的完整流程。
      </Descriptions.Item>
      <Descriptions.Item label="Step 1: 数据准备">
        请上传标准的 CSV 数据集。文件必须包含表头：<code>area</code>, <code>rooms</code>, <code>age</code>, <code>price</code>。<br/>
        系统会自动解析并在右侧表格预览前 20 条数据。
      </Descriptions.Item>
      <Descriptions.Item label="Step 2: 模型训练">
        点击“开始训练”按钮。后端会根据最新上传的数据进行 80% 训练集与 20% 测试集的划分。<br/>
        训练完成后，您可以看到 MAE（平均误差）指标，误差越低代表模型越精准。
      </Descriptions.Item>
      <Descriptions.Item label="Step 3: 预测应用">
        输入您感兴趣的房屋参数，系统会调用内存中的模型进行实时推演，并支持生成 PDF 格式的正式报告。
      </Descriptions.Item>
    </Descriptions>
  </Card>
);

// === P3: 系统设置视图 ===
const SettingsView = ({ modelType, setModelType }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/status")
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => message.error("无法获取系统状态"));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Divider orientation="left">系统状态监控 (P3-M1)</Divider>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
             <Statistic 
               title="数据状态" 
               value={status?.data_loaded ? "已加载" : "未加载"} 
               valueStyle={{ color: status?.data_loaded ? '#3f8600' : '#cf1322' }} 
             />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
             <Statistic 
               title="模型状态" 
               value={status?.model_trained ? "已训练" : "待训练"} 
               valueStyle={{ color: status?.model_trained ? '#3f8600' : '#faad14' }} 
             />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
             <Statistic title="当前算法" value={status?.current_model || "无"} valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">算法参数设置 (P3-M3)</Divider>
      <Card hoverable>
        <Form layout="vertical">
          <Form.Item label="选择核心回归算法" extra="修改后请回到 Step 2 重新训练模型以生效">
            <Select 
              size="large"
              value={modelType} 
              onChange={setModelType} 
              style={{ width: '100%' }}
              options={[
                { value: 'LinearRegression', label: '🟢 线性回归 (Linear Regression) - 推荐基础数据' },
                { value: 'Ridge', label: '🔵 岭回归 (Ridge Regression) - 防止过拟合' },
                { value: 'Lasso', label: '🟣 Lasso回归 - 稀疏特征选择' },
                { value: 'DecisionTree', label: '🌳 决策树回归 (Decision Tree) - 非线性关系' },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      <Alert 
        style={{ marginTop: 24 }}
        message="注意事项 (P3-M2)"
        description="系统重启后，所有数据和模型状态将被重置。上传新数据会覆盖旧的内存数据。"
        type="info"
        showIcon
      />
    </div>
  );
};

export default App;
