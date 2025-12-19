import React, { useState } from "react";
import { Layout, Menu, Tabs, Card, Row, Statistic, Button, Table, Col, message } from 'antd'
const { Header, Sider, Content } = Layout;


function App() {
  return (

    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="Light">
        <Menu
          mode="inline"
          defaultSelectedKeys={['workflow']}
          style={{ height: "100%", borderRight: 0 }}
          items={[
            { key: 'workflow', label: '操作说明' },
            { key: 'docs', label: '帮助说明' },
            { key: 'settings', label: '系统设置' }
          ]}
        />
      </Sider>


      <Layout>

        <Header
          style={{
            background: "#fff",
            padding: '0 24px',
            fontSize: 20,
            fontWeight: 600,
            display: "flex",
            alignItems: "center"
          }}>
          React + AntD 小型数据分析仪表盘
        </Header>

        <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Step 1 数据',
                children: <Step1IData />
              },
              {
                key: '2',
                label: 'Step 2 模型',
                children: <Step2IData />
              },
              {
                key: '3',
                label: 'Step 3 预测',
                children: <Step3IData />
              }
            ]}
          />
        </Content>


      </Layout>


    </Layout>

  );
}


export default App;

// 单独的三个组件
const Step1IData = () => {

  const [rowCount, setRowCount] = useState(0)
  const [preview, setPreview] = useState([])

  const loadData = async () => {
    try {
      const res = await fetch("http://localhost:8000/data");
      const json = await res.json()
      setRowCount(json.rows || 0);
      setPreview(json.preview || []);
      message.success("已经成功加载后端数据")
    } catch (e) {
      console.error(e);
      message.error("加载失败")
    }

  }
  // 上传 CSV，并让后端用它覆盖 df
  const uploadCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: form
      });
      const json = await res.json();

      // 不强依赖 status 的具体值，只要 200 就当成功
      if (!res.ok) {
        message.error("上传失败");
        return;
      }

      message.success(`上传成功！共有 ${json.rows ?? "未知"} 行数据`);

      // 关键：立刻重新从 /data 拉一次，确保看到的是“真实最新 df”
      await loadData();
    } catch (err) {
      console.error(err);
      message.error("上传过程中出错，请检查后端。");
    }
  };
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="😺 趋势分析">
            <Statistic title='样本数量' value={rowCount} />
            <div style={{ marginTop: 16 }}>
              <input type="file" accept=".cvs" onChange={uploadCSV} />
            </div>
            <Button type="primary" style={{ marginTop: 16 }}>
              上传数据
            </Button>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="😸 历史数据">
            <p>这里可以放表格、图标、描述性数据......</p>
            <Button onClick={loadData}>查看全部数据</Button>
          </Card>
        </Col>

      </Row>
      <Card style={{ marginTop: 24 }} title='⭐数据准备说明'>
        <p>这里是对于Step1的说明文字，包括错误提示，操作指导等</p>
      </Card>
      <Card style={{ marginTop: 24 }} title="数据准备说明">
        <Table
          dataSource={preview}
          rowKey={(_, idx) => idx}
          columns={
            preview[0]
              ? Object.keys(preview[0]).map((col) => ({ title: col, dataIndex: col }))
              : []
          }

        />
      </Card>

    </> // 类似div，但不太一样，作用：不存在的玻璃罩，把里面的每一个组件包裹成一个整体
  );
};

const Step2IData = () => {
  return (
    <Card title='模型训练'>
      <p>这里放表单：参数选择，模型介绍等</p>
      <Button type="primary">开始训练模型</Button>
    </Card>
  );
};

const Step3IData = () => {
  return (
    <Card title='预测结果'>
      <Statistic title='预测值' value={97.2} precision={2} />
      <Button type="primary" style={{ marginTop: 10 }}>
        导出预测报告
      </Button>
    </Card>
  )
};


