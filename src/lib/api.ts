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

// --- Módulo de Dashboard / Centro de Mando ---

export interface ActividadDia {
  name: string;
  accesos: number;
  rondas: number;
}

export interface NovedadReciente {
  id: number;
  tipo: string;
  titulo: string;
  desc: string;
  nivel?: string;
  fecha: string;
  time: string;
}

export interface DashboardStats {
  activos: number;
  criticos: number;
  resueltos_hoy: number;
  total_historico: number;
  rondas_hoy: number;
  visitas_hoy: number;
  complejos: number;
  casas_qr: number;
  residentes: number;
  usuarios_activos: number;
  actividad_semanal?: ActividadDia[];
  ultimas_novedades?: NovedadReciente[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

// --- Módulo de Rondas ---

export interface ProgramaRonda {
  id?: number;
  residencial_id?: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  recurrencia: string;
  tolerancia_mins?: number;
  puntos?: number[]; // IDs de puntos QR
  puntos_detalle?: PuntoQR[];
  total_puntos?: number;
  created_at?: string;
}

export interface AsignacionRonda {
  id?: number;
  residencial_id?: string;
  programa_id: number;
  programa_nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  usuario_id: number; // Guardia ID
  guardia_nombre?: string;
  fecha: string; // YYYY-MM-DD
  estado?: string;
  puntos_completados?: number;
  puntos_total?: number;
  porcentaje_cumplimiento?: number;
  created_at?: string;
}

export interface MarcacionRonda {
  id?: number;
  residencial_id?: string;
  asignacion_ronda_id?: number | null;
  punto_qr_id: number;
  punto_nombre?: string;
  numero_casa?: string;
  guardia_id?: number;
  guardia_nombre?: string;
  fecha_hora?: string;
  latitud?: number;
  longitud?: number;
  observacion?: string;
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
  deletePrograma: async (id: number): Promise<any> => {
    const response = await api.delete(`/rondas/programas/${id}`);
    return response.data;
  },
  getAsignaciones: async (): Promise<AsignacionRonda[]> => {
    const response = await api.get('/rondas/asignaciones');
    return response.data;
  },
  createAsignacion: async (data: AsignacionRonda): Promise<AsignacionRonda> => {
    const response = await api.post('/rondas/asignaciones', data);
    return response.data;
  },
  registrarMarcacion: async (data: { codigo_qr: string; asignacion_ronda_id?: number | null; latitud?: number; longitud?: number; observacion?: string }): Promise<any> => {
    const response = await api.post('/rondas/marcacion', data);
    return response.data;
  },
  getMarcaciones: async (limit?: number): Promise<MarcacionRonda[]> => {
    const response = await api.get('/rondas/marcaciones', { params: { limit: limit || 25 } });
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
	residentes_nombres?: string;
	residentes_count?: number;
	activo?: boolean;
	created_at?: string;
	deleted_at?: string | null;
}

export interface CasasPaginadas {
	items: Casa[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface CasaFiltros {
	search?: string;
	bloque?: string;
	estado?: string;
	page?: number;
	limit?: number;
}

export interface Residente {
	id?: number;
	residencial_id?: string;
	casa_id?: number | null;
	numero_casa?: string;
	nombre: string;
	cedula?: string;
	telefono?: string;
	telefono_emergencia?: string;
	email?: string;
	es_propietario: boolean;
	casas_asignadas_ids?: number[];
	casas_detalle?: Casa[];
	activo?: boolean;
	created_at?: string;
	deleted_at?: string | null;
}

export interface ResidentesPaginados {
	items: Residente[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface ResidenteFiltros {
	search?: string;
	es_propietario?: boolean;
	page?: number;
	limit?: number;
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
	getCasasPaginadas: async (params?: CasaFiltros): Promise<CasasPaginadas> => {
		const response = await api.get('/casas', {
			params: {
				paginado: 'true',
				page: params?.page || 1,
				limit: params?.limit || 10,
				search: params?.search || '',
				bloque: params?.bloque || '',
				estado: params?.estado || ''
			}
		});
		return response.data;
	},
	createCasa: async (data: Casa): Promise<Casa> => {
		const response = await api.post('/casas', data);
		return response.data;
	},
	updateCasa: async (id: number, data: Partial<Casa>): Promise<any> => {
		const response = await api.put(`/casas/${id}`, data);
		return response.data;
	},
	deleteCasa: async (id: number): Promise<any> => {
		const response = await api.delete(`/casas/${id}`);
		return response.data;
	},
	getResidentes: async (): Promise<Residente[]> => {
		const response = await api.get('/residentes');
		return response.data;
	},
	getResidentesPaginados: async (params?: ResidenteFiltros): Promise<ResidentesPaginados> => {
		const response = await api.get('/residentes', {
			params: {
				paginado: 'true',
				page: params?.page || 1,
				limit: params?.limit || 10,
				search: params?.search || '',
				es_propietario: params?.es_propietario !== undefined ? String(params.es_propietario) : ''
			}
		});
		return response.data;
	},
	createResidente: async (data: Residente): Promise<Residente> => {
		const response = await api.post('/residentes', data);
		return response.data;
	},
	updateResidente: async (id: number, data: Partial<Residente>): Promise<any> => {
		const response = await api.put(`/residentes/${id}`, data);
		return response.data;
	},
	deleteResidente: async (id: number): Promise<any> => {
		const response = await api.delete(`/residentes/${id}`);
		return response.data;
	}
};

// --- Módulo de Administración de Usuarios ---

export interface Usuario {
  id?: number;
  residencial_id?: string;
  email: string;
  nombre_completo?: string;
  telefono?: string;
  cedula?: string;
  password?: string; // Solo para creación o cambio
  rol: string;
  activo?: boolean;
  creado_en?: string;
  deleted_at?: string | null;
}

export interface UsuariosPaginados {
  items: Usuario[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UsuarioFiltros {
  search?: string;
  rol?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export const usuariosApi = {
  getUsuarios: async (params?: UsuarioFiltros): Promise<Usuario[]> => {
    const response = await api.get('/usuarios', { params });
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return Array.isArray(response.data) ? response.data : [];
  },
  getUsuariosPaginados: async (params?: UsuarioFiltros): Promise<UsuariosPaginados> => {
    const response = await api.get('/usuarios', { params });
    if (response.data && Array.isArray(response.data.items)) {
      return response.data;
    }
    const items = Array.isArray(response.data) ? response.data : [];
    return {
      items,
      total: items.length,
      page: params?.page || 1,
      limit: params?.limit || items.length,
      total_pages: 1
    };
  },
  createUsuario: async (data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },
  updateUsuario: async (id: number, data: Partial<Usuario>): Promise<void> => {
    await api.put(`/usuarios/${id}`, data);
  },
  cambiarEstado: async (id: number, activo: boolean): Promise<void> => {
    await api.patch(`/usuarios/${id}/estado`, { activo });
  },
  deleteUsuario: async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },
  cargarCSV: async (file: File): Promise<{ status: string; procesados: number; total_filas: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/usuarios/bulk-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  cargarLoteJSON: async (items: Partial<Usuario>[]): Promise<{ status: string; procesados: number; total_filas: number }> => {
    const response = await api.post('/usuarios/bulk-csv', items);
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
  bloque?: string;
  residente_nombre?: string;
  tiene_contrato_seguridad?: boolean;
  ultima_marcacion?: string | null;
  total_marcaciones?: number;
  created_at?: string;
}

export const puntosQrApi = {
  getPuntos: async (): Promise<PuntoQR[]> => {
    const response = await api.get('/puntos');
    return response.data;
  },
  createPunto: async (data: Partial<PuntoQR>): Promise<PuntoQR> => {
    const response = await api.post('/puntos', data);
    return response.data;
  },
  updatePunto: async (id: number, data: Partial<PuntoQR>): Promise<PuntoQR> => {
    const response = await api.put(`/puntos/${id}`, data);
    return response.data;
  },
  deletePunto: async (id: number): Promise<any> => {
    const response = await api.delete(`/puntos/${id}`);
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
  ubicacion?: string;
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
  email?: string;
  latitud: number;
  longitud: number;
  ultima_actualizacion?: string;
  actualizado_en?: string;
  nombre?: string;
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
  guardia_nombre?: string;
  guardia_email?: string;
  guardia_cedula?: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  horas?: number;
  descripcion: string;
  ubicacion: string;
  estado: string; // PROGRAMADO, EN_CURSO, FINALIZADO, CANCELADO
  asistencia?: string; // PENDIENTE, PRESENTE, TARDANZA, AUSENTE
  marcado_entrada?: string;
  marcado_salida?: string;
  creado_por?: string;
  created_at?: string;
}

export interface ProgramacionMasivaPayload {
  guardia_ids: number[];
  fecha_desde: string;
  fecha_hasta: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_turno: string;
  ubicacion: string;
  notas?: string;
}

export interface ProgramacionMasivaResult {
  creados: number;
  conflictos: number;
  mensajes: string[];
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
  createTurnoMasivo: async (payload: ProgramacionMasivaPayload): Promise<ProgramacionMasivaResult> => {
    const response = await api.post('/turnos/masivo', payload);
    return response.data;
  },
  updateTurno: async (id: number, data: Turno): Promise<Turno> => {
    const response = await api.put(`/turnos/${id}`, data);
    return response.data;
  },
  marcarAsistencia: async (id: number, asistencia: string): Promise<void> => {
    await api.post(`/turnos/${id}/asistencia`, { asistencia });
  },
  getAuditoria: async (): Promise<any[]> => {
    const response = await api.get('/turnos/auditoria');
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

// --- Módulo de Flota Vehicular y Checklist 360 ---

export interface VehiculoFlota {
  id?: number;
  residencial_id?: string;
  codigo_unidad: string;
  tipo_unidad: string; // CAMION, RETROEXCAVADORA, CABEZAL, MONTACARGAS, GRUA, OTRO
  marca_modelo: string;
  placa?: string;
  qr_code?: string;
  horometro_km_actual?: number;
  estado?: string; // OPERATIVO, EN_MANTENIMIENTO, INACTIVO
  created_at?: string;
}

export interface SolicitudFlota {
  id?: number;
  residencial_id?: string;
  codigo_solicitud?: string;
  punto_origen_id: string;
  punto_destino_id: string;
  vehiculo_id?: number;
  vehiculo_codigo?: string;
  vehiculo_tipo?: string;
  conductor_id?: number;
  conductor_nombre?: string;
  estado_actual?: string;
  equipo_adicional_json?: string;
  creado_por?: number;
  creado_por_nombre?: string;
  creado_en?: string;
  actualizado_en?: string;
}

export interface ItemInspeccion360 {
  id?: number;
  inspeccion_id?: number;
  categoria: string;
  item_nombre: string;
  estado_item: string; // BUENO, REGULAR, MALO, NO_APLICA
  foto_url?: string;
}

export interface Inspeccion360 {
  id?: number;
  solicitud_id: number;
  residencial_id?: string;
  etapa: string; // TALLER_SALIDA, GARITA_SALIDA, GARITA_LLEGADA, TALLER_CIERRE
  inspector_id?: number;
  inspector_nombre?: string;
  resultado: string; // APROBADO, RECHAZADO, CON_OBSERVACION
  horometro_km?: number;
  nivel_combustible?: string;
  observaciones?: string;
  fecha_inspeccion?: string;
  detalles?: ItemInspeccion360[];
}

export const flotaApi = {
  getVehiculos: async (): Promise<VehiculoFlota[]> => {
    const response = await api.get('/flota/vehiculos');
    return response.data;
  },
  createVehiculo: async (data: VehiculoFlota): Promise<VehiculoFlota> => {
    const response = await api.post('/flota/vehiculos', data);
    return response.data;
  },
  getSolicitudes: async (): Promise<SolicitudFlota[]> => {
    const response = await api.get('/flota/solicitudes');
    return response.data;
  },
  createSolicitud: async (data: Partial<SolicitudFlota>): Promise<SolicitudFlota> => {
    const response = await api.post('/flota/solicitudes', data);
    return response.data;
  },
  asignarSolicitud: async (id: number, vehiculo_id: number, conductor_id: number): Promise<void> => {
    await api.put(`/flota/solicitudes/${id}/asignar`, { vehiculo_id, conductor_id });
  },
  registrarInspeccion: async (id: number, data: Inspeccion360): Promise<Inspeccion360> => {
    const response = await api.post(`/flota/solicitudes/${id}/inspeccion`, data);
    return response.data;
  },
  getInspecciones: async (id: number): Promise<Inspeccion360[]> => {
    const response = await api.get(`/flota/solicitudes/${id}/inspecciones`);
    return response.data;
  },
  transicionEstado: async (id: number, nuevo_estado: string): Promise<void> => {
    await api.put(`/flota/solicitudes/${id}/estado`, { nuevo_estado });
  }
};
