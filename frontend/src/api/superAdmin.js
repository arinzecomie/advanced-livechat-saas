import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with auth token
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: `${API_BASE_URL}/api/super-admin`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// User & Tenant Management APIs
export const getAllUsers = async (params = {}) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/users', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const banUser = async (userId, reason, duration = null) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/users/${userId}/ban`, { reason, duration });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const unbanUser = async (userId) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/users/${userId}/unban`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const impersonateUser = async (userId) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post(`/users/${userId}/impersonate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetUserPassword = async (userId, temporaryPassword = null, sendEmail = true) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post(`/users/${userId}/reset-password`, {
      temporaryPassword,
      sendEmail
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateUserDetails = async (userId, updates) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/users/${userId}/update`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Site & Domain Control APIs
export const getAllSites = async (params = {}) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/sites', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const blockDomain = async (siteId, reason, duration = null) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/sites/${siteId}/block`, { reason, duration });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const unblockDomain = async (siteId) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/sites/${siteId}/unblock`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyDomain = async (siteId) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/sites/${siteId}/verify`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const limitWidgetConnections = async (siteId, maxConnections, duration = null) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.put(`/sites/${siteId}/limit-connections`, {
      maxConnections,
      duration
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Subscription & Revenue Management APIs
export const getSubscriptionStatus = async (params = {}) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/subscriptions', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const grantLifetimeAccess = async (userId) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post(`/users/${userId}/grant-lifetime`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const extendFreeTrial = async (userId, days) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post(`/users/${userId}/extend-trial`, { days });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const forceDowngrade = async (userId, reason) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post(`/users/${userId}/force-downgrade`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRevenueMetrics = async (params = {}) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/revenue-metrics', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// System & Communication APIs
export const createGlobalAnnouncement = async (announcementData) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post('/announcements', announcementData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const sendPushNotification = async (notificationData) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post('/push-notifications', notificationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const toggleMaintenanceMode = async (maintenanceData) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post('/maintenance-mode', maintenanceData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Content & Compliance APIs
export const getGlobalStorageUsage = async () => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/storage-usage');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const purgeOldData = async (purgeData) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.post('/purge-data', purgeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getReportedChats = async (params = {}) => {
  try {
    const instance = createAuthInstance();
    const response = await instance.get('/reported-chats', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};