import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Input, Select, Tag, Popconfirm,
  message, Card, Typography, Tooltip, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { employeesApi } from '../services/api';
import EmployeeForm from './EmployeeForm';

const { Text } = Typography;
const { Option } = Select;

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const EMP_TYPE_COLOR = {
  'Full-time': 'green',
  'Part-time': 'blue',
  Contract: 'orange',
  Intern: 'purple',
};

export default function EmployeeManagement() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });
  const [sort, setSort] = useState({ sort_by: 'full_name', sort_order: 'asc' });
  const [search, setSearch] = useState('');
  const [metaFilters, setMetaFilters] = useState({
    countries: [], departments: [], job_titles: [],
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const fetchMeta = useCallback(async () => {
    try {
      const meta = await employeesApi.filters();
      setMetaFilters(meta);
    } catch {
      setMetaFilters({ countries: [], departments: [], job_titles: [] });
      message.error('Could not load employee filters');
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...pagination,
        ...sort,
        ...filters,
        ...(search ? { search } : {}),
      };
      const result = await employeesApi.list(params);
      setData(Array.isArray(result.data) ? result.data : []);
      setTotal(Number.isFinite(result.total) ? result.total : 0);
    } catch {
      setData([]);
      setTotal(0);
      message.error('Could not load employees');
    } finally {
      setLoading(false);
    }
  }, [pagination, sort, filters, search]);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleTableChange = (pag, _, sorter) => {
    setPagination({ page: pag.current, limit: pag.pageSize });
    if (sorter.columnKey) {
      setSort({
        sort_by: sorter.columnKey,
        sort_order: sorter.order === 'descend' ? 'desc' : 'asc',
      });
    }
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (editEmployee) {
        await employeesApi.update(editEmployee.id, values);
        message.success('Employee updated');
      } else {
        await employeesApi.create(values);
        message.success('Employee added');
      }
      setFormOpen(false);
      setEditEmployee(null);
      fetchEmployees();
      fetchMeta();
    } catch (err) {
      message.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await employeesApi.remove(id);
      message.success('Employee deleted');
      fetchEmployees();
    } catch {
      message.error('Delete failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: true,
      render: (name, rec) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{rec.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Job Title',
      dataIndex: 'job_title',
      key: 'job_title',
      sorter: true,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      sorter: true,
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      sorter: true,
      render: (s) => <Text strong style={{ color: '#1677ff' }}>{fmt(s)}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'employment_type',
      key: 'employment_type',
      render: (t) => <Tag color={EMP_TYPE_COLOR[t]}>{t}</Tag>,
    },
    {
      title: 'Hire Date',
      dataIndex: 'hire_date',
      key: 'hire_date',
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, rec) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => { setEditEmployee(rec); setFormOpen(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this employee?"
            onConfirm={() => handleDelete(rec.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card bordered={false}>
      {/* Toolbar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name, email, or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {
              setPagination((p) => ({ ...p, page: 1 }));
              fetchEmployees();
            }}
            allowClear
            style={{ maxWidth: 320 }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Country"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => {
              setFilters((f) => ({ ...f, country: v }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            showSearch
          >
            {(metaFilters.countries ?? []).map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Select
            placeholder="Department"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => {
              setFilters((f) => ({ ...f, department: v }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            {(metaFilters.departments ?? []).map((d) => (
              <Option key={d} value={d}>{d}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={fetchEmployees} />
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditEmployee(null); setFormOpen(true); }}
          >
            Add Employee
          </Button>
        </Col>
      </Row>

      <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
        {total.toLocaleString()} employees
      </Text>

      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        scroll={{ x: 1000 }}
        onChange={handleTableChange}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          showTotal: (t) => `${t.toLocaleString()} total`,
        }}
      />

      <EmployeeForm
        open={formOpen}
        employee={editEmployee}
        onSubmit={handleSubmit}
        onCancel={() => { setFormOpen(false); setEditEmployee(null); }}
        loading={formLoading}
        countries={metaFilters.countries ?? []}
        departments={metaFilters.departments ?? []}
        jobTitles={metaFilters.job_titles ?? []}
      />
    </Card>
  );
}
