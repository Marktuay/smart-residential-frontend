import axios from 'axios';

// Creamos una instancia de axios con la URL base del backend
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token y el ID del residencial a cada petición
api.interceptors.request.use(
  (config) => {
    // Intentar obtener el token de localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      const residencialId = localStorage.getItem('residencial_id');

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (residencialId) {
        config.headers['X-Residencial-ID'] = residencialId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas globales (ej. 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Opcional: Redirigir al login si el token expira o es inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('residencial_id');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
