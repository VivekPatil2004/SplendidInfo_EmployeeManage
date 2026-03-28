import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Needed to send/receive httpOnly refresh token cookie
});

// ── Request Interceptor: Attach Access Token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Corrupted localStorage value — ignore, auth will fail, 401 handler will clean up
        localStorage.removeItem('userInfo');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle Token Expiry & Refresh ──────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 with TOKEN_EXPIRED code (not other 401s like wrong password)
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request while a refresh is already in progress
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        // Attempt token refresh using httpOnly cookie
        const { data } = await api.post('/auth/refresh');
        const newToken = data.token;

        // Update localStorage with new access token
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          parsed.token = newToken;
          localStorage.setItem('userInfo', JSON.stringify(parsed));
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — force logout
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For any other 401 (invalid token, account locked, etc.) — force logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
