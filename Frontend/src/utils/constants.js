export const API_BASE_URL = 'http://localhost:5000/api';

export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer'
};

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id) => `/products/${id}`
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ROLE: 'userRole'
};
