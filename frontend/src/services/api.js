import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

const asArray = (value) => (Array.isArray(value) ? value : []);
const asNumber = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

const normalizeEmployeeList = (payload) => ({
  data: asArray(payload?.data),
  total: asNumber(payload?.total, 0),
  page: asNumber(payload?.page, 1),
  limit: asNumber(payload?.limit, 50),
});

const normalizeFilters = (payload) => ({
  countries: asArray(payload?.countries),
  departments: asArray(payload?.departments),
  job_titles: asArray(payload?.job_titles),
});

const normalizeSummary = (payload) => ({
  total_employees: asNumber(payload?.total_employees, 0),
  global_min: asNumber(payload?.global_min, 0),
  global_max: asNumber(payload?.global_max, 0),
  global_avg: asNumber(payload?.global_avg, 0),
  total_countries: asNumber(payload?.total_countries, 0),
  total_departments: asNumber(payload?.total_departments, 0),
  total_job_titles: asNumber(payload?.total_job_titles, 0),
});

export const employeesApi = {
  list: (params) =>
    api.get('/employees', { params }).then((r) => normalizeEmployeeList(r.data)),
  get: (id) => api.get(`/employees/${id}`).then((r) => r.data),
  create: (data) => api.post('/employees', data).then((r) => r.data),
  update: (id, data) => api.put(`/employees/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/employees/${id}`),
  filters: () => api.get('/employees/meta/filters').then((r) => normalizeFilters(r.data)),
};

export const insightsApi = {
  summary: () => api.get('/insights/summary').then((r) => normalizeSummary(r.data)),
  byCountry: () => api.get('/insights/salary-by-country').then((r) => asArray(r.data)),
  byJobCountry: (country) =>
    api
      .get('/insights/salary-by-job-country', { params: { country } })
      .then((r) => asArray(r.data)),
  byDepartment: () =>
    api.get('/insights/salary-by-department').then((r) => asArray(r.data)),
  topPaid: (params) =>
    api.get('/insights/top-paid', { params }).then((r) => asArray(r.data)),
  employmentBreakdown: () =>
    api.get('/insights/employment-type-breakdown').then((r) => asArray(r.data)),
};
