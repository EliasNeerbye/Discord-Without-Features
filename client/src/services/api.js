import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401) - could redirect to login page
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized, redirecting to login...');
      // Could dispatch an action or trigger a redirect here if needed
    }
    return Promise.reject(error);
  }
);

export default api;

// Chat API services
export const chatService = {
  getChats: () => api.get('/chats'),
  
  createChat: (data) => api.post('/chats', data),
  
  getMessages: (chatId, before = null) => {
    let url = `/chats/${chatId}/messages`;
    if (before) {
      url += `?before=${before}`;
    }
    return api.get(url);
  },
  
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages`, { content })
};

// User API services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (data) => api.put('/users/profile', data),
  
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  
  getFriends: () => api.get('/users/friends'),
  
  getFriendRequests: () => api.get('/users/friends/requests'),
  
  sendFriendRequest: (usernameOrEmail) => api.post('/users/friends/requests', { usernameOrEmail }),
  
  updateFriendRequest: (requestId, status) => api.put(`/users/friends/requests/${requestId}`, { status })
};

// Auth API services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => api.post('/auth/register', userData),
  
  logout: () => api.delete('/auth/logout'),
  
  verifyEmail: (email) => api.post('/auth/verify-email', { email }),
  
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email })
};