import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              refreshToken,
            },
          );

          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  refreshToken: (refreshToken) =>
    api.post("/auth/refresh-token", { refreshToken }),
};

// Teacher API
export const teacherAPI = {
  // Presets
  createPreset: (presetData) => api.post("/teacher/presets", presetData),
  getPresets: () => api.get("/teacher/presets"),
  updatePreset: (id, presetData) =>
    api.put(`/teacher/presets/${id}`, presetData),
  deletePreset: (id) => api.delete(`/teacher/presets/${id}`),

  // QR Generation
  generateQR: (presetId) => api.post(`/teacher/generate-qr/${presetId}`),
  getSessionStats: (sessionId) =>
    api.get(`/teacher/session-stats/${sessionId}`),

  // Attendance
  getAttendance: (presetId, params = {}) =>
    api.get(`/teacher/attendance/${presetId}`, { params }),
  exportAttendance: (presetId, params = {}) =>
    api.get(`/teacher/export/${presetId}`, {
      params,
      responseType: "blob",
    }),
};

// Student API
export const studentAPI = {
  markAttendance: (attendanceData) =>
    api.post("/student/mark-attendance", attendanceData),
  getMyAttendance: (params = {}) =>
    api.get("/student/my-attendance", { params }),
  getAttendanceSummary: () => api.get("/student/attendance-summary"),
};

// Admin API
export const adminAPI = {
  // Departments
  createDepartment: (departmentData) =>
    api.post("/admin/departments", departmentData),
  getDepartments: () => api.get("/admin/departments"),
  updateDepartment: (id, departmentData) =>
    api.put(`/admin/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),

  // Courses
  createCourse: (courseData) => api.post("/admin/courses", courseData),
  getCourses: () => api.get("/admin/courses"),
  updateCourse: (id, courseData) => api.put(`/admin/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),

  // Users
  createUser: (userData) => api.post("/admin/users", userData),
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Bulk Import
  bulkImportUsers: (formData) =>
    api.post("/admin/bulk-import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Reports
  getSystemReports: () => api.get("/admin/reports/system"),
  getAttendanceReports: (params = {}) =>
    api.get("/admin/reports/attendance", { params }),
  getActivityLogs: (params = {}) => api.get("/admin/activity-logs", { params }),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || "An error occurred";
    const errors = error.response.data?.errors || [];
    return { message, errors, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: "Network error. Please check your connection.",
      errors: [],
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      errors: [],
      status: 0,
    };
  }
};

export default api;
