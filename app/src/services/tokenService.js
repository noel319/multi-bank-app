class TokenService {
    constructor() {
      this.tokenKey = 'auth_token';
      this.refreshTokenKey = 'refresh_token';
    }
  
    setToken(token) {
      localStorage.setItem(this.tokenKey, token);
    }
  
    getToken() {
      return localStorage.getItem(this.tokenKey);
    }
  
    setRefreshToken(refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  
    getRefreshToken() {
      return localStorage.getItem(this.refreshTokenKey);
    }
  
    removeToken() {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
  
    isTokenExpired(token) {
      if (!token) return true;
  
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
      } catch (error) {
        console.error('Error parsing token:', error);
        return true;
      }
    }
  
    getTokenPayload(token) {
      if (!token) return null;
  
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error('Error parsing token payload:', error);
        return null;
      }
    }
  
    shouldRefreshToken(token) {
      if (!token) return false;
  
      try {
        const payload = this.getTokenPayload(token);
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        // Refresh if token expires in less than 5 minutes
        return timeUntilExpiry < 300;
      } catch (error) {
        return false;
      }
    }
  }
  
  export const tokenService = new TokenService();