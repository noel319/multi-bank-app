class AuthAPI {
    constructor() {
      this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    }
  
    async makeRequest(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };
  
      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
  
      try {
        const response = await fetch(url, config);
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
  
        return data;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }
  
    async login(email, password) {
      return this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    }
  
    async register(email, password, userData = {}) {
      return this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...userData }),
      });
    }
  
    async googleLogin(credential) {
      return this.makeRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
    }
  
    async logout() {
      return this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    }
  
    async validateToken() {
      return this.makeRequest('/auth/validate');
    }
  
    async refreshToken() {
      return this.makeRequest('/auth/refresh', {
        method: 'POST',
      });
    }
  
    async forgotPassword(email) {
      return this.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }
  
    async resetPassword(token, newPassword) {
      return this.makeRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    }
  }
  
  export const authAPI = new AuthAPI();