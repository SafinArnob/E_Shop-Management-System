import { STORAGE_KEYS } from './constants';

export const getStoredToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const getStoredUserRole = () => {
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
};

export const setStoredAuth = (token, role) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
};

export const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT'
  }).format(price);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const canManageProducts = (userRole) => {
  return userRole === 'admin' || userRole === 'employee';
};
