import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Select, Table, Typography,
  Spin, Tag, message,
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { insightsApi, employeesApi } from '../services/api';
import {
  TeamOutlined, DollarOutlined, GlobalOutlined, TrophyOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const fmt = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);

const COLORS = [
  '#1677ff', '#52c41a', '#fa8c16', '#722ed1',
  '#f5222d', '#13c2c2', '#eb2f96', '#faad14',
];

export default function InsightsDashboard() {
  const [summary, setSummary] = useState(null);
  const [byCountry, setByCountry] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [byJobCountry, setByJobCountry] = useState([]);
  const [topPaid, setTopPaid] = useState([]);
  const [empBreakdown, setEmpBreakdown] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(undefined);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sum, bc, bd, eb, meta] = await Promise.all([
          insightsApi.summary(),
          insightsApi.byCountry(),
          insightsApi.byDepartment(),
          insightsApi.employmentBreakdown(),
          employeesApi.filters(),
        ]);
        setSummary(sum);
        setByCountry(bc);
        setByDept(bd);
        setEmpBreakdown(eb);
        setCountries(meta.countries ?? []);
      } catch {
        setCountries([]);
        message.error('Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const [jc, tp] = await Promise.all([
          insightsApi.byJobCountry(selectedCountry),
          insightsApi.topPaid({ limit: 10, country: selectedCountry }),
        ]);
        setByJobCountry(jc);
        setTopPaid(tp);
      } catch {
        setByJobCountry([]);
        setTopPaid([]);
        message.error('Could not load country insights');
      }
    };
    fetchCountryData();
  }, [selectedCountry]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const topCountries = byCountry.slice(0, 8);
  const topDepts = byDept.slice(0, 8);
  const visibleCountryStats = selectedCountry
    ? byCountry.filter((row) => row.country === selectedCountry)
    : byCountry;

  const jobColumns = [
    { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    { title: 'Headcount', dataIndex: 'employee_count', key: 'employee_count' },
    {
      title: 'Min Salary',
      dataIndex: 'min_salary',
      key: 'min_salary',
      render: fmt,
    },
    {
      title: 'Avg Salary',
      dataIndex: 'avg_salary',
      key: 'avg_salary',
      render: (v) => <Text strong style={{ color: '#1677ff' }}>{fmt(v)}</Text>,
    },
    { title: 'Max Salary', dataIndex: 'max_salary', key: 'max_salary', render: fmt },
  ];

  const topPaidColumns = [
    {
      title: '#',
      key: 'rank',
      render: (_, __, i) => (
        <Tag color={i < 3 ? 'gold' : 'default'}>{i + 1}</Tag>
      ),
      width: 50,
    },
    { title: 'Name', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Title', dataIndex: 'job_title', key: 'job_title' },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (v) => <Text strong style={{ color: '#1677ff' }}>{fmt(v)}</Text>,
    },
  ];

  const countryColumns = [
    { title: 'Country', dataIndex: 'country', key: 'country' },
    {
      title: 'Employees',
      dataIndex: 'employee_count',
      key: 'employee_count',
      render: (v) => v.toLocaleString(),
    },
    {
      title: 'Min Salary',
      dataIndex: 'min_salary',
      key: 'min_salary',
      render: fmt,
    },
    {
      title: 'Avg Salary',
      dataIndex: 'avg_salary',
      key: 'avg_salary',
      render: (v) => <Text strong style={{ color: '#1677ff' }}>{fmt(v)}</Text>,
    },
    {
      title: 'Max Salary',
      dataIndex: 'max_salary',
      key: 'max_salary',
      render: fmt,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary KPI cards */}
      <Row gutter={16}>
        {[
          {
            title: 'Total Employees',
            value: summary?.total_employees,
            icon: <TeamOutlined />,
            color: '#1677ff',
            formatter: (v) => v?.toLocaleString(),
          },
          {
            title: 'Global Avg Salary',
            value: summary?.global_avg,
            icon: <DollarOutlined />,
            color: '#52c41a',
            formatter: fmt,
          },
          {
            title: 'Highest Salary',
            value: summary?.global_max,
            icon: <TrophyOutlined />,
            color: '#fa8c16',
            formatter: fmt,
          },
          {
            title: 'Countries',
            value: summary?.total_countries,
            icon: <GlobalOutlined />,
            color: '#722ed1',
          },
        ].map(({ title, value, icon, color, formatter }) => (
          <Col span={6} key={title}>
            <Card bordered={false}>
              <Statistic
                title={title}
                value={value}
                formatter={formatter ? () => formatter(value) : undefined}
                prefix={React.cloneElement(icon, { style: { color } })}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts row */}
      <Row gutter={16}>
        <Col span={14}>
          <Card title="Avg Salary by Country (Top 8)" bordered={false}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCountries} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="country"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="avg_salary" fill="#1677ff" name="Avg Salary" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="Employment Type Breakdown" bordered={false}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={empBreakdown}
                  dataKey="count"
                  nameKey="employment_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ employment_type, percent }) =>
                    `${employment_type} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {empBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Dept chart */}
      <Card title="Salary by Department" bordered={false}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topDepts} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="department" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="avg_salary" fill="#52c41a" name="Avg Salary" radius={[0, 4, 4, 0]} />
            <Bar dataKey="max_salary" fill="#fa8c16" name="Max Salary" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Country Salary Benchmarks"
        bordered={false}
        extra={
          <Text type="secondary">
            {selectedCountry || 'All countries'}
          </Text>
        }
      >
        <Table
          rowKey="country"
          dataSource={visibleCountryStats}
          columns={countryColumns}
          pagination={{ pageSize: 8 }}
          size="small"
        />
      </Card>

      {/* Country filter for job-level insights */}
      <Card
        title="Salary by Job Title"
        bordered={false}
        extra={
          <Select
            placeholder="Filter by country"
            allowClear
            style={{ width: 200 }}
            onChange={setSelectedCountry}
            value={selectedCountry}
            showSearch
          >
            {countries.map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        }
      >
        <Table
          rowKey={(r) => `${r.job_title}-${r.country}`}
          dataSource={byJobCountry}
          columns={jobColumns}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Top earners */}
      <Card
        title="Top 10 Highest Earners"
        bordered={false}
        extra={
          <Select
            placeholder="Filter by country"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => {
              setSelectedCountry(v);
            }}
            value={selectedCountry}
            showSearch
          >
            {countries.map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        }
      >
        <Table
          rowKey="id"
          dataSource={topPaid}
          columns={topPaidColumns}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
