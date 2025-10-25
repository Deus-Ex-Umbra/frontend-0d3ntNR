import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_acceso');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token_acceso');
      
      if (window.location.pathname !== '/inicio-sesion' && window.location.pathname !== '/registro') {
        window.location.href = '/inicio-sesion';
      }
    }
    return Promise.reject(error);
  }
);

export const verificarConexion = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_URL}/api`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

export const autenticacionApi = {
  registrar: async (datos: { nombre: string; correo: string; contrasena: string }) => {
    const respuesta = await api.post('/autenticacion/registro', datos);
    return respuesta.data;
  },
  iniciarSesion: async (credenciales: { correo: string; contrasena: string }) => {
    const respuesta = await api.post('/autenticacion/inicio-sesion', credenciales);
    return respuesta.data;
  },
};

export const usuariosApi = {
  obtenerPerfil: async () => {
    const respuesta = await api.get('/usuarios/perfil');
    return respuesta.data;
  },
  actualizarPerfil: async (datos: { nombre?: string; avatar?: string }) => {
    const respuesta = await api.put('/usuarios/perfil', datos);
    return respuesta.data;
  },
  cambiarContrasena: async (datos: { contrasena_actual: string; nueva_contrasena: string }) => {
    const respuesta = await api.put('/usuarios/perfil/cambiar-contrasena', datos);
    return respuesta.data;
  },
};

export const pacientesApi = {
  crear: async (datos: any) => {
    const respuesta = await api.post('/pacientes', datos);
    return respuesta.data;
  },
  obtenerTodos: async (termino_busqueda?: string) => {
    const params = termino_busqueda ? `?termino_busqueda=${termino_busqueda}` : '';
    const respuesta = await api.get(`/pacientes${params}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}`);
    return respuesta.data;
  },
  obtenerAnamnesis: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/anamnesis`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/pacientes/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/pacientes/${id}`);
    return respuesta.data;
  },
};

export const tratamientosApi = {
  crear: async (datos: { nombre: string; numero_citas: number; costo_total: number }) => {
    const respuesta = await api.post('/tratamientos', datos);
    return respuesta.data;
  },
  obtenerTodos: async () => {
    const respuesta = await api.get('/tratamientos');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/tratamientos/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/tratamientos/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/tratamientos/${id}`);
    return respuesta.data;
  },
};

export const planesTratamientoApi = {
  asignar: async (datos: { paciente_id: number; tratamiento_id: number; fecha_inicio: string; hora_inicio: string }) => {
  const respuesta = await api.post('/planes-tratamiento', datos);
  return respuesta.data;
  },
  obtenerTodos: async () => {
    const respuesta = await api.get('/planes-tratamiento');
    return respuesta.data;
  },
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/planes-tratamiento/paciente/${paciente_id}`);
    return respuesta.data;
  },
};

export const agendaApi = {
  crear: async (datos: any) => {
    const respuesta = await api.post('/agenda', datos);
    return respuesta.data;
  },
  obtenerPorMes: async (mes: number, ano: number) => {
    const respuesta = await api.get(`/agenda?mes=${mes}&ano=${ano}`);
    return respuesta.data;
  },
  obtenerCitasSinPagar: async () => {
    const respuesta = await api.get('/agenda/sin-pagar');
    return respuesta.data;
  },
  obtenerCitasSinPago: async () => {
    const respuesta = await api.get('/agenda/sin-pago');
    return respuesta.data;
  },
  actualizar: async (id: number, datos: any) => {
    const respuesta = await api.put(`/agenda/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/agenda/${id}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/agenda/${id}`);
    return respuesta.data;
  },
};

export const notasApi = {
  crear: async (contenido: string) => {
    const respuesta = await api.post('/notas', { contenido });
    return respuesta.data;
  },
  obtenerUltimas: async (dias: number) => {
    const respuesta = await api.get(`/notas?dias=${dias}`);
    return respuesta.data;
  },
};

export const asistenteApi = {
  obtenerFraseMotivacional: async (dias: number = 7) => {
    const respuesta = await api.post('/asistente/frase-motivacional', { dias });
    return respuesta.data;
  },
  digitalizarCitas: async (imagen_base64: string) => {
    const respuesta = await api.post('/asistente/ocr-citas', { imagen_base64 });
    return respuesta.data;
  },
};

export const finanzasApi = {
  registrarEgreso: async (datos: { concepto: string; fecha: Date; monto: number }) => {
    const respuesta = await api.post('/finanzas/egresos', datos);
    return respuesta.data;
  },
  actualizarEgreso: async (id: number, datos: { concepto?: string; fecha?: Date; monto?: number }) => {
    const respuesta = await api.put(`/finanzas/egresos/${id}`, datos);
    return respuesta.data;
  },
  eliminarEgreso: async (id: number) => {
    const respuesta = await api.delete(`/finanzas/egresos/${id}`);
    return respuesta.data;
  },
  registrarPago: async (datos: { cita_id: number; fecha: Date; monto: number; concepto?: string }) => {
    const respuesta = await api.post('/finanzas/pagos', datos);
    return respuesta.data;
  },
  actualizarPago: async (id: number, datos: { fecha?: Date; monto?: number; concepto?: string }) => {
    const respuesta = await api.put(`/finanzas/pagos/${id}`, datos);
    return respuesta.data;
  },
  eliminarPago: async (id: number) => {
    const respuesta = await api.delete(`/finanzas/pagos/${id}`);
    return respuesta.data;
  },
  obtenerReporte: async (fecha_inicio?: string, fecha_fin?: string) => {
    const params = new URLSearchParams();
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);
    
    const respuesta = await api.get(`/finanzas/reporte?${params.toString()}`);
    return respuesta.data;
  },
  obtenerDatosGrafico: async (tipo: 'dia' | 'mes' | 'ano', fecha_referencia?: string) => {
    const params = new URLSearchParams();
    params.append('tipo', tipo);
    if (fecha_referencia) params.append('fecha_referencia', fecha_referencia);
    
    const respuesta = await api.get(`/finanzas/grafico?${params.toString()}`);
    return respuesta.data;
  },
};

export const estadisticasApi = {
  obtenerDashboard: async () => {
    const respuesta = await api.get('/estadisticas/dashboard');
    return respuesta.data;
  },
};

export const catalogoApi = {
  obtenerAlergias: async () => {
    const respuesta = await api.get('/catalogo/alergias');
    return respuesta.data;
  },
  crearAlergia: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/alergias', datos);
    return respuesta.data;
  },
  actualizarAlergia: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/alergias/${id}`, datos);
    return respuesta.data;
  },
  eliminarAlergia: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/alergias/${id}`);
    return respuesta.data;
  },
  obtenerEnfermedades: async () => {
    const respuesta = await api.get('/catalogo/enfermedades');
    return respuesta.data;
  },
  crearEnfermedad: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/enfermedades', datos);
    return respuesta.data;
  },
  actualizarEnfermedad: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/enfermedades/${id}`, datos);
    return respuesta.data;
  },
  eliminarEnfermedad: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/enfermedades/${id}`);
    return respuesta.data;
  },
  obtenerMedicamentos: async () => {
    const respuesta = await api.get('/catalogo/medicamentos');
    return respuesta.data;
  },
  crearMedicamento: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/medicamentos', datos);
    return respuesta.data;
  },
  actualizarMedicamento: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/medicamentos/${id}`, datos);
    return respuesta.data;
  },
  eliminarMedicamento: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/medicamentos/${id}`);
    return respuesta.data;
  },
  obtenerColores: async () => {
    const respuesta = await api.get('/catalogo/colores');
    return respuesta.data;
  },
  crearColor: async (datos: { nombre: string; color: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/colores', datos);
    return respuesta.data;
  },
  actualizarColor: async (id: number, datos: { nombre?: string; color?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/colores/${id}`, datos);
    return respuesta.data;
  },
  eliminarColor: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/colores/${id}`);
    return respuesta.data;
  },
  obtenerSimbologias: async () => {
    const respuesta = await api.get('/catalogo/simbologia');
    return respuesta.data;
  },
  crearSimbologia: async (datos: { nombre: string; descripcion?: string; imagen_base64: string }) => {
    const respuesta = await api.post('/catalogo/simbologia', datos);
    return respuesta.data;
  },
  actualizarSimbologia: async (id: number, datos: { nombre?: string; descripcion?: string; imagen_base64?: string }) => {
    const respuesta = await api.put(`/catalogo/simbologia/${id}`, datos);
    return respuesta.data;
  },
  eliminarSimbologia: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/simbologia/${id}`);
    return respuesta.data;
  },
};

export const archivosApi = {
  subir: async (datos: {
    nombre_archivo: string;
    tipo_mime: string;
    descripcion?: string;
    contenido_base64: string;
    paciente_id: number;
    plan_tratamiento_id?: number;
  }) => {
    const respuesta = await api.post('/archivos-adjuntos', datos);
    return respuesta.data;
  },
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/paciente/${paciente_id}`);
    return respuesta.data;
  },
  obtenerPorPlan: async (plan_id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/plan-tratamiento/${plan_id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: { nombre_archivo?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/archivos-adjuntos/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/archivos-adjuntos/${id}`);
    return respuesta.data;
  },
};

export const edicionesImagenesApi = {
  crear: async (datos: {
    archivo_original_id: number;
    edicion_padre_id?: number;
    nombre?: string;
    descripcion?: string;
    datos_canvas: object;
    imagen_resultado_base64: string;
  }) => {
    const respuesta = await api.post('/ediciones-imagenes', datos);
    return respuesta.data;
  },
  obtenerPorArchivo: async (archivo_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/archivo/${archivo_id}`);
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    descripcion?: string;
    datos_canvas?: object;
    imagen_resultado_base64?: string;
  }) => {
    const respuesta = await api.put(`/ediciones-imagenes/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/ediciones-imagenes/${id}`);
    return respuesta.data;
  },
  duplicar: async (id: number) => {
    const respuesta = await api.post(`/ediciones-imagenes/${id}/duplicar`);
    return respuesta.data;
  },
};