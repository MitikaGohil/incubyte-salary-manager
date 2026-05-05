import React, { useState } from 'react';
import { Layout, Menu, Typography, ConfigProvider, theme } from 'antd';
import {
  TeamOutlined,
  BarChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import EmployeeManagement from './components/EmployeeManagement';
import InsightsDashboard from './components/InsightsDashboard';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const NAV_ITEMS = [
  { key: 'employees', icon: <TeamOutlined />, label: 'Employees' },
  { key: 'insights', icon: <BarChartOutlined />, label: 'Salary Insights' },
];

export default function App() {
  const [page, setPage] = useState('employees');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={220}
        >
          <div
            style={{
              padding: '16px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <DollarOutlined style={{ fontSize: 24 }} />
            {!collapsed && (
              <span style={{ fontWeight: 700, fontSize: 16 }}>SalaryMS</span>
            )}
          </div>
          <Menu
            theme="dark"
            selectedKeys={[page]}
            items={NAV_ITEMS}
            onClick={({ key }) => setPage(key)}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#1a1a2e' }}>
              {page === 'employees' ? 'Employee Management' : 'Salary Insights'}
            </Title>
          </Header>

          <Content style={{ padding: 24, background: '#f5f5f5' }}>
            {page === 'employees' ? (
              <EmployeeManagement />
            ) : (
              <InsightsDashboard />
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
