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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- Módulo de Rondas ---

export interface ProgramaRonda {
  id?: number;
  residencial_id?: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  recurrencia: string;
  puntos?: number[]; // IDs de puntos QR
}

export interface AsignacionRonda {
  id?: number;
  residencial_id?: string;
  programa_id: number;
  usuario_id: number; // Guardia ID
  fecha: string; // YYYY-MM-DD
  estado?: string;
}

export const rondasApi = {
  getProgramas: async (): Promise<ProgramaRonda[]> => {
    const response = await api.get('/rondas/programas');
    return response.data;
  },
  createPrograma: async (data: ProgramaRonda): Promise<ProgramaRonda> => {
    const response = await api.post('/rondas/programas', data);
    return response.data;
  },
  getAsignaciones: async (): Promise<AsignacionRonda[]> => {
    const response = await api.get('/rondas/asignaciones');
    return response.data;
  },
  createAsignacion: async (data: AsignacionRonda): Promise<AsignacionRonda> => {
    const response = await api.post('/rondas/asignaciones', data);
    return response.data;
  }
};

// --- Módulo de Visitas ---

export interface Visita {
  id: number;
  residencial_id: string;
  nombre_visitante: string;
  cedula_visitante: string;
  estado: string; // PENDIENTE, EN_CURSO, FINALIZADA
  fecha_esperada: string;
  numero_casa: string;
  medio_ingreso: string;
  placa_vehiculo?: string;
  fecha_ingreso?: string;
  fecha_salida?: string;
}

export interface NuevaVisita {
  nombre_visitante: string;
  cedula_visitante: string;
  fecha_esperada: string;
  numero_casa: string;
  medio_ingreso: string;
  placa_vehiculo?: string;
}

export const visitasApi = {
  getVisitas: async (): Promise<Visita[]> => {
    const response = await api.get('/visitas');
    return response.data;
  },
	registrarVisita: async (data: Visita): Promise<Visita> => {
		const response = await api.post('/visitas', data);
		return response.data;
	}
};

// --- Módulo de Gestión Residencial ---

export interface Casa {
	id?: number;
	residencial_id?: string;
	numero_casa: string;
	bloque: string;
	estado: string;
	created_at?: string;
}

export interface Residente {
	id?: number;
	residencial_id?: string;
	casa_id?: number | null;
	numero_casa?: string;
	nombre: string;
	telefono: string;
	email: string;
	es_propietario: boolean;
	created_at?: string;
}

export const residencialApi = {
	getCasas: async (): Promise<Casa[]> => {
		const response = await api.get('/casas');
		return response.data;
	},
	createCasa: async (data: Casa): Promise<Casa> => {
		const response = await api.post('/casas', data);
		return response.data;
	},
	getResidentes: async (): Promise<Residente[]> => {
		const response = await api.get('/residentes');
		return response.data;
	},
	createResidente: async (data: Residente): Promise<Residente> => {
		const response = await api.post('/residentes', data);
		return response.data;
	}
};

// --- Módulo de Administración de Usuarios ---

export interface Usuario {
  id?: number;
  residencial_id?: string;
  email: string;
  password?: string; // Solo para creación
  rol: string;
  creado_en?: string;
}

export const usuariosApi = {
  getUsuarios: async (): Promise<Usuario[]> => {
    const response = await api.get('/usuarios');
    return response.data;
  },
  createUsuario: async (data: Usuario): Promise<Usuario> => {
    const response = await api.post('/usuarios', data);
    return response.data;
  }
};

// --- Módulo de Puntos QR ---

export interface PuntoQR {
  id?: number;
  residencial_id?: string;
  casa_id?: number | null;
  nombre: string;
  codigo_qr?: string;
  latitud?: number;
  longitud?: number;
  numero_casa?: string;
  residente_nombre?: string;
}

export const puntosQrApi = {
  getPuntos: async (): Promise<PuntoQR[]> => {
    const response = await api.get('/puntos');
    return response.data;
  },
  createPunto: async (data: PuntoQR): Promise<PuntoQR> => {
    const response = await api.post('/puntos', data);
    return response.data;
  }
};

// --- Módulo de Incidentes ---

export interface Incidente {
  id?: number;
  residencial_id?: string;
  reportado_por?: string;
  tipo: string;
  descripcion: string;
  nivel_gravedad: string;
  estado?: string;
  evidencia_url?: string;
  fecha_creacion?: string;
  fecha_resolucion?: string;
}

export const incidentesApi = {
  getIncidentes: async (): Promise<Incidente[]> => {
    const response = await api.get('/incidentes');
    return response.data;
  },
  createIncidente: async (data: Partial<Incidente>): Promise<Incidente> => {
    const response = await api.post('/incidentes', data);
    return response.data;
  },
  resolverIncidente: async (id: number): Promise<void> => {
    await api.put(`/incidentes/${id}/resolver`);
  }
};

// --- Módulo de Finanzas (Proxy) ---

export interface ResumenFinanzas {
  residencial_id: string;
  total_recaudado: number;
  total_morosidad: number;
  tasa_cumplimiento: number;
  cobros_pendientes: number;
  fuente?: string;
}

export const finanzasApi = {
  getResumen: async (): Promise<ResumenFinanzas> => {
    const response = await api.get('/finanzas/resumen');
    return response.data.data; // NestJS usually wraps in "data"
  }
};
