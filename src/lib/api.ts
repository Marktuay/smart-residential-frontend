import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL 
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api/v1') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api/v1`)
  : 'https://api.ncsecurity.net/api/v1';

// Creamos una instancia de axios con la URL base del backend
const api = axios.create({
  baseURL,
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
	},
  actualizarEstado: async (id: number, estado: string): Promise<void> => {
    await api.put(`/visitas/${id}/estado`, { estado });
  }
};

// --- Módulo de Gestión Residencial ---

export interface Casa {
	id?: number;
	residencial_id?: string;
	numero_casa: string;
	bloque: string;
	estado: string;
	tiene_contrato_seguridad?: boolean;
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

export interface ResidencialInfo {
	id: string;
	nombre: string;
	direccion: string;
	latitud_centro: number;
	longitud_centro: number;
	zoom_defecto: number;
	tolerancia_ronda_mins?: number;
	frecuencia_gps_seg?: number;
	email_alerta_incidentes?: string;
	telefono_emergencia?: string;
	created_at?: string;
}

export const residencialApi = {
	getResidenciales: async (): Promise<ResidencialInfo[]> => {
		const response = await api.get('/residenciales');
		return response.data;
	},
	createResidencial: async (data: ResidencialInfo): Promise<ResidencialInfo> => {
		const response = await api.post('/residenciales', data);
		return response.data;
	},
	getInfo: async (): Promise<ResidencialInfo> => {
		const response = await api.get('/residencial/info');
		return response.data;
	},
	updateConfig: async (data: Partial<ResidencialInfo>): Promise<void> => {
		await api.put('/residencial/config', data);
	},
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
  tiene_contrato_seguridad?: boolean;
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

// --- Módulo de Tracking (Geolocalización) ---

export interface Ubicacion {
  usuario_id: number;
  latitud: number;
  longitud: number;
  ultima_actualizacion?: string;
  nombre?: string; // Podríamos cruzarlo en el componente o pedirlo al backend
}

export interface HistorialUbicacion {
  latitud: number;
  longitud: number;
  registrado_en: string;
}

export const trackingApi = {
  getUbicaciones: async (): Promise<Ubicacion[]> => {
    const response = await api.get('/tracking/live');
    return response.data;
  },
  getHistorial: async (usuarioId: number, fechaInicio: string, fechaFin: string): Promise<HistorialUbicacion[]> => {
    const response = await api.get(`/tracking/historial?usuario_id=${usuarioId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
    return response.data;
  },
  updateLocation: async (data: { usuario_id: number; latitud: number; longitud: number }): Promise<void> => {
    await api.post('/tracking/location', data);
  }
};

// --- Módulo de Turnos ---

export interface Turno {
  id?: number;
  residencial_id?: string;
  guardia_id: number;
  guardia_email?: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  descripcion: string;
  ubicacion: string;
  estado: string; // PROGRAMADO, EN_CURSO, FINALIZADO, CANCELADO
}

export const turnosApi = {
  getTurnos: async (): Promise<Turno[]> => {
    const response = await api.get('/turnos');
    return response.data;
  },
  createTurno: async (data: Turno): Promise<Turno> => {
    const response = await api.post('/turnos', data);
    return response.data;
  },
  updateTurno: async (id: number, data: Turno): Promise<Turno> => {
    const response = await api.put(`/turnos/${id}`, data);
    return response.data;
  },
  deleteTurno: async (id: number): Promise<void> => {
    await api.delete(`/turnos/${id}`);
  }
};

// --- Módulo de Notificaciones Push ---

export interface SuscripcionPush {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const pushApi = {
  getVAPIDPublicKey: async (): Promise<string> => {
    const response = await api.get('/push/vapid-public-key');
    return response.data.public_key;
  },
  subscribe: async (data: SuscripcionPush): Promise<void> => {
    await api.post('/push/subscribe', data);
  },
  sendNotification: async (data: { guardia_id?: number; titulo: string; cuerpo: string }): Promise<any> => {
    const response = await api.post('/push/send', data);
    return response.data;
  }
};
