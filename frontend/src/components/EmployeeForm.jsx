import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];

export default function EmployeeForm({
  open,
  employee,
  onSubmit,
  onCancel,
  loading,
  countries = [],
  departments = [],
  jobTitles = [],
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (employee) {
        form.setFieldsValue({
          ...employee,
          hire_date: dayjs(employee.hire_date),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, employee]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...values,
        hire_date: values.hire_date.format('YYYY-MM-DD'),
      });
    } catch {}
  };

  return (
    <Modal
      title={employee ? 'Edit Employee' : 'Add Employee'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      okText={employee ? 'Save Changes' : 'Add Employee'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Jane Doe" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input placeholder="jane.doe@company.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="job_title"
              label="Job Title"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select or type"
                options={jobTitles.map((t) => ({ value: t, label: t }))}
                dropdownRender={(menu) => menu}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select department"
                options={departments.map((d) => ({ value: d, label: d }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="country"
              label="Country"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Select country"
                options={countries.map((c) => ({ value: c, label: c }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salary"
              label="Annual Salary (USD)"
              rules={[
                { required: true, message: 'Required' },
                {
                  type: 'number',
                  min: 0,
                  message: 'Salary must be non-negative',
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(v) =>
                  `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(v) => v.replace(/\$\s?|(,*)/g, '')}
                placeholder="80000"
                min={0}
                step={1000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="employment_type"
              label="Employment Type"
              initialValue="Full-time"
            >
              <Select
                options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="hire_date"
              label="Hire Date"
              rules={[{ required: true, message: 'Required' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
