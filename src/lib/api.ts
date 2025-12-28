import axios from 'axios';
import { formatearFechaISO } from './utilidades';

const API_URL = (import.meta as any).env.VITE_API_URL || 'https://backend-0d3nt.ddns.net';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

function transformarFechasALocal(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return formatearFechaISO(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(transformarFechasALocal);
  }

  if (typeof obj === 'object') {
    const resultado: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        resultado[key] = transformarFechasALocal(obj[key]);
      }
    }
    return resultado;
  }

  return obj;
}

api.interceptors.request.use(
  (config) => {
    if (config.data) {
      config.data = transformarFechasALocal(config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      const url = error.config?.url || '';
      const esCambioContrasena = url.includes('/cambiar-contrasena');

      if (!esCambioContrasena) {
        localStorage.removeItem('token_acceso');

        if (window.location.pathname !== '/inicio-sesion' && window.location.pathname !== '/registro') {
          window.location.href = '/inicio-sesion';
        }
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
  obtenerTodos: async () => {
    const respuesta = await api.get('/usuarios');
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
  obtenerUltimaCita: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/ultima-cita`);
    return respuesta.data;
  },
  obtenerUltimoTratamiento: async (id: number) => {
    const respuesta = await api.get(`/pacientes/${id}/ultimo-tratamiento`);
    return respuesta.data;
  },
};

export const historiasClinicasApi = {
  listarPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/historias-clinicas`);
    return respuesta.data;
  },
  obtener: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/historias-clinicas/${version_id}`);
    return respuesta.data;
  },
  crear: async (
    paciente_id: number,
    datos: { nombre?: string; contenido_html?: string; config?: any; clonar_de_version_id?: number }
  ) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas`, datos);
    return respuesta.data;
  },
  actualizar: async (
    paciente_id: number,
    version_id: number,
    datos: { nombre?: string; contenido_html?: string; config?: any }
  ) => {
    const respuesta = await api.put(`/pacientes/${paciente_id}/historias-clinicas/${version_id}`, datos);
    return respuesta.data;
  },
  finalizar: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas/${version_id}/finalizar`);
    return respuesta.data;
  },
  clonar: async (paciente_id: number, version_id: number) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/historias-clinicas/${version_id}/clonar`);
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
  obtenerMaterialesPlantilla: async (id: number) => {
    const respuesta = await api.get(`/tratamientos/${id}/materiales`);
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
  actualizar: async (id: number, datos: { costo_total: number }) => {
    const respuesta = await api.put(`/planes-tratamiento/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/planes-tratamiento/eliminar/${id}`);
    return respuesta.data;
  },
};

export const agendaApi = {
  crear: async (datos: any) => {
    const respuesta = await api.post('/agenda', datos);
    return respuesta.data;
  },
  obtenerPorMes: async (mes: number, ano: number, ligero: boolean = true) => {
    const respuesta = await api.get(`/agenda?mes=${mes}&ano=${ano}&ligero=${ligero}`);
    return respuesta.data;
  },
  filtrarCitas: async (fecha_inicio: Date, fecha_fin: Date) => {
    const respuesta = await api.get(`/agenda/filtrar?fecha_inicio=${formatearFechaISO(fecha_inicio)}&fecha_fin=${formatearFechaISO(fecha_fin)}`);
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
  obtenerEspaciosLibres: async (mes: number, ano: number) => {
    const respuesta = await api.get(`/agenda/espacios-libres?mes=${mes}&ano=${ano}`);
    return respuesta.data;
  },
  filtrarEspaciosLibres: async (fecha_inicio: Date, fecha_fin: Date) => {
    const respuesta = await api.get(`/agenda/espacios-libres-filtrar?fecha_inicio=${formatearFechaISO(fecha_inicio)}&fecha_fin=${formatearFechaISO(fecha_fin)}`);
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
  obtenerPorIdCompleto: async (id: number) => {
    const respuesta = await api.get(`/agenda/${id}/completo`);
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
  obtenerAnalisis: async (filtros: { fecha_inicio: string; fecha_fin: string; glosa?: string; sensible_mayusculas?: boolean; nivel_precision?: 'alta' | 'equilibrio' | 'global' }) => {
    const respuesta = await api.post('/finanzas/analisis', filtros);
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
  obtenerEtiquetas: async () => {
    const respuesta = await api.get('/catalogo/etiquetas');
    return respuesta.data;
  },
  crearEtiqueta: async (datos: { nombre: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/etiquetas', datos);
    return respuesta.data;
  },
  actualizarEtiqueta: async (id: number, datos: { nombre?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/etiquetas/${id}`, datos);
    return respuesta.data;
  },
  eliminarEtiqueta: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/etiquetas/${id}`);
    return respuesta.data;
  },
  obtenerEtiquetasPlantilla: async () => {
    const respuesta = await api.get('/catalogo/etiquetas-plantilla');
    return respuesta.data;
  },
  crearEtiquetaPlantilla: async (datos: { nombre: string; codigo: string; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/etiquetas-plantilla', datos);
    return respuesta.data;
  },
  actualizarEtiquetaPlantilla: async (id: number, datos: { nombre?: string; codigo?: string; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/etiquetas-plantilla/${id}`, datos);
    return respuesta.data;
  },
  eliminarEtiquetaPlantilla: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/etiquetas-plantilla/${id}`);
    return respuesta.data;
  },
  obtenerTamanosHoja: async () => {
    const respuesta = await api.get('/catalogo/tamanos-papel');
    return respuesta.data;
  },
  crearTamanoHoja: async (datos: { nombre: string; ancho: number; alto: number; descripcion?: string }) => {
    const respuesta = await api.post('/catalogo/tamanos-papel', datos);
    return respuesta.data;
  },
  actualizarTamanoHoja: async (id: number, datos: { nombre?: string; ancho?: number; alto?: number; descripcion?: string }) => {
    const respuesta = await api.put(`/catalogo/tamanos-papel/${id}`, datos);
    return respuesta.data;
  },
  eliminarTamanoHoja: async (id: number) => {
    const respuesta = await api.delete(`/catalogo/tamanos-papel/${id}`);
    return respuesta.data;
  },
  obtenerConfiguracionClinica: async () => {
    const respuesta = await api.get('/catalogo/configuracion-clinica');
    return respuesta.data;
  },
  actualizarConfiguracionClinica: async (datos: {
    logo?: string;
    nombre_clinica?: string;
    mensaje_bienvenida_antes?: string;
    mensaje_bienvenida_despues?: string;
    tema_personalizado?: string;
  }) => {
    const respuesta = await api.put('/catalogo/configuracion-clinica', datos);
    return respuesta.data;
  },
  obtenerHoraServidor: async (): Promise<Date> => {
    const respuesta = await api.get('/catalogo/hora-servidor');
    return new Date(respuesta.data);
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
  obtenerContenido: async (id: number) => {
    const respuesta = await api.get(`/archivos-adjuntos/${id}/contenido`);
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
  crearComentario: async (edicion_id: number, datos: {
    x: number;
    y: number;
    titulo: string;
    contenido: string;
    color?: string;
  }) => {
    const respuesta = await api.post(`/ediciones-imagenes/${edicion_id}/comentarios`, datos);
    return respuesta.data;
  },
  obtenerComentarios: async (edicion_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/${edicion_id}/comentarios`);
    return respuesta.data;
  },
  obtenerComentario: async (comentario_id: number) => {
    const respuesta = await api.get(`/ediciones-imagenes/comentarios/${comentario_id}`);
    return respuesta.data;
  },
  actualizarComentario: async (comentario_id: number, datos: {
    x?: number;
    y?: number;
    titulo?: string;
    contenido?: string;
    color?: string;
  }) => {
    const respuesta = await api.put(`/ediciones-imagenes/comentarios/${comentario_id}`, datos);
    return respuesta.data;
  },
  eliminarComentario: async (comentario_id: number) => {
    const respuesta = await api.delete(`/ediciones-imagenes/comentarios/${comentario_id}`);
    return respuesta.data;
  },
};

export const plantillasConsentimientoApi = {
  crear: async (datos: {
    nombre: string;
    contenido: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.post('/plantillas-consentimiento', datos);
    return respuesta.data;
  },
  obtenerTodas: async () => {
    const respuesta = await api.get('/plantillas-consentimiento');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/plantillas-consentimiento/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    contenido?: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.put(`/plantillas-consentimiento/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/plantillas-consentimiento/${id}`);
    return respuesta.data;
  },
  generarConsentimiento: async (paciente_id: number, datos: {
    plantilla_id: number;
    pdf_firmado_base64: string;
  }) => {
    const respuesta = await api.post(`/plantillas-consentimiento/pacientes/${paciente_id}/generar-consentimiento`, datos);
    return respuesta.data;
  },
};

export const plantillasRecetasApi = {
  crear: async (datos: {
    nombre: string;
    contenido: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.post('/plantillas-recetas', datos);
    return respuesta.data;
  },
  obtenerTodas: async () => {
    const respuesta = await api.get('/plantillas-recetas');
    return respuesta.data;
  },
  obtenerPorId: async (id: number) => {
    const respuesta = await api.get(`/plantillas-recetas/${id}`);
    return respuesta.data;
  },
  actualizar: async (id: number, datos: {
    nombre?: string;
    contenido?: string;
    tamano_papel?: 'carta' | 'legal' | 'a4';
    tamano_hoja_id?: number | null;
    ancho_mm?: number | null;
    alto_mm?: number | null;
    margen_superior?: number;
    margen_inferior?: number;
    margen_izquierdo?: number;
    margen_derecho?: number;
  }) => {
    const respuesta = await api.put(`/plantillas-recetas/${id}`, datos);
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/plantillas-recetas/${id}`);
    return respuesta.data;
  },
};

export const inventarioApi = {
  crearInventario: async (datos: { nombre: string; modo_estricto?: boolean }) => {
    const respuesta = await api.post('/inventario', datos);
    return respuesta.data;
  },
  obtenerInventarios: async () => {
    const respuesta = await api.get('/inventario');
    return respuesta.data;
  },
  obtenerInventarioPorId: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}`);
    return respuesta.data;
  },
  actualizarInventario: async (inventario_id: number, datos: { nombre?: string; modo_estricto?: boolean }) => {
    const respuesta = await api.put(`/inventario/${inventario_id}`, datos);
    return respuesta.data;
  },
  eliminarInventario: async (inventario_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}`);
    return respuesta.data;
  },
  crearProducto: async (datos: {
    inventario_id: number;
    nombre: string;
    tipo?: 'material' | 'activo_fijo';
    subtipo_material?: 'con_lote_vencimiento' | 'con_serie' | 'sin_lote';
    subtipo_activo_fijo?: 'instrumental' | 'mobiliario_equipo';
    tipo_gestion?: string;
    stock_minimo?: number;
    unidad_medida?: string;
    descripcion?: string;
    notificar_stock_bajo?: boolean;
  }) => {
    const respuesta = await api.post('/inventario/productos', datos);
    return respuesta.data;
  },
  obtenerProductos: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos`);
    return respuesta.data;
  },
  obtenerProductoPorId: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos/${producto_id}`);
    return respuesta.data;
  },
  obtenerStockProducto: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/productos/${producto_id}/stock`);
    return respuesta.data;
  },
  actualizarProducto: async (inventario_id: number, producto_id: number, datos: any) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/productos/${producto_id}`, datos);
    return respuesta.data;
  },
  eliminarProducto: async (inventario_id: number, producto_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/productos/${producto_id}`);
    return respuesta.data;
  },
  registrarCompra: async (inventario_id: number, datos: {
    producto_id: number;
    cantidad: number;
    costo_total: number;
    fecha_vencimiento?: string;
    nro_lote?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    fecha_compra: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/registrar-compra`, datos);
    return respuesta.data;
  },
  registrarEntradaMaterial: async (inventario_id: number, datos: {
    producto_id: number;
    cantidad: number;
    costo_unitario: number;
    tipo_entrada: 'compra' | 'regalo' | 'donacion' | 'otro_ingreso';
    nro_lote?: string;
    nro_serie?: string;
    fecha_vencimiento?: string;
    fecha_ingreso?: string;
    observaciones?: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/entrada`, datos);
    return respuesta.data;
  },
  registrarEntradaActivo: async (inventario_id: number, datos: {
    producto_id: number;
    costo_compra: number;
    tipo_entrada: 'compra' | 'regalo' | 'donacion' | 'otro_ingreso';
    codigo_interno?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    ubicacion?: string;
    fecha_compra: string;
    observaciones?: string;
    generar_egreso?: boolean;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/activos/entrada`, datos);
    return respuesta.data;
  },
  registrarSalidaMaterial: async (inventario_id: number, datos: {
    producto_id: number;
    material_id?: number;
    cantidad: number;
    tipo_salida: 'consumo_cita' | 'consumo_tratamiento' | 'venta' | 'desecho' | 'robo' | 'ajuste';
    observaciones?: string;
    generar_ingreso?: boolean;
    monto_venta?: number;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/materiales/salida`, datos);
    return respuesta.data;
  },
  confirmarConsumibles: async (cita_id: number, datos: {
    consumibles: Array<{ producto_id: number; cantidad: number }>;
  }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/confirmar-consumibles`, datos);
    return respuesta.data;
  },
  asignarMaterialesCita: async (cita_id: number, datos: { materiales: { producto_id: number; cantidad_planeada: number }[] }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/asignar-materiales`, datos);
    return respuesta.data;
  },

  agregarMaterialesCita: async (cita_id: number, datos: { materiales: { producto_id: number; cantidad_planeada: number }[] }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/agregar-materiales`, datos);
    return respuesta.data;
  },
  obtenerMaterialesCita: async (cita_id: number) => {
    const respuesta = await api.get(`/inventario/citas/${cita_id}/reservas`);
    return respuesta.data;
  },
  confirmarMaterialesCita: async (cita_id: number, datos: {
    materiales: Array<{ material_cita_id: number; cantidad_usada: number }>;
  }) => {
    const respuesta = await api.post(`/inventario/citas/${cita_id}/confirmar-materiales`, datos);
    return respuesta.data;
  },
  asignarMaterialesTratamiento: async (plan_tratamiento_id: number, datos: {
    materiales: Array<{
      producto_id: number;
      tipo: string;
      cantidad_planeada: number;
      momento_confirmacion?: string;
    }>;
  }) => {
    const respuesta = await api.post(`/inventario/tratamientos/${plan_tratamiento_id}/asignar-materiales`, datos);
    return respuesta.data;
  },
  obtenerMaterialesTratamiento: async (plan_tratamiento_id: number) => {
    const respuesta = await api.get(`/inventario/tratamientos/${plan_tratamiento_id}/reservas`);
    return respuesta.data;
  },
  confirmarMaterialesGenerales: async (plan_tratamiento_id: number, datos: any) => {
    const respuesta = await api.post(`/inventario/tratamientos/${plan_tratamiento_id}/confirmar-materiales-generales`, datos);
    return respuesta.data;
  },
  cambiarEstadoActivo: async (inventario_id: number, activo_id: number, datos: { estado: string }) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/activos/${activo_id}/estado`, datos);
    return respuesta.data;
  },
  obtenerHistorialActivo: async (inventario_id: number, activo_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/activos/${activo_id}/historial`);
    return respuesta.data;
  },
  obtenerHistorialMovimientos: async (
    inventario_id: number,
    filtros?: {
      producto_id?: number;
      tipos?: string[];
      fecha_inicio?: Date;
      fecha_fin?: Date;
      usuario_id?: number;
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams();

    if (filtros?.producto_id) {
      params.append('producto_id', filtros.producto_id.toString());
    }

    if (filtros?.tipos && filtros.tipos.length > 0) {
      params.append('tipos', filtros.tipos.join(','));
    }

    if (filtros?.fecha_inicio) {
      params.append('fecha_inicio', formatearFechaISO(filtros.fecha_inicio));
    }

    if (filtros?.fecha_fin) {
      params.append('fecha_fin', formatearFechaISO(filtros.fecha_fin));
    }

    if (filtros?.usuario_id) {
      params.append('usuario_id', filtros.usuario_id.toString());
    }

    if (filtros?.limit) {
      params.append('limit', filtros.limit.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/historial-movimientos${query}`);
    return respuesta.data;
  },
  obtenerReporteValor: async (inventario_id: number) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/reporte/valor`);
    return respuesta.data;
  },
  eliminarLote: async (inventario_id: number, lote_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/lotes/${lote_id}`);
    return respuesta.data;
  },
  actualizarActivo: async (inventario_id: number, activo_id: number, datos: any) => {
    const respuesta = await api.put(`/inventario/${inventario_id}/activos/${activo_id}`, datos);
    return respuesta.data;
  },
  eliminarActivo: async (inventario_id: number, activo_id: number) => {
    const respuesta = await api.delete(`/inventario/${inventario_id}/activos/${activo_id}`);
    return respuesta.data;
  },
  ajustarStock: async (inventario_id: number, datos: {
    producto_id: number;
    material_id?: number;
    tipo_ajuste: 'incremento' | 'decremento' | 'establecer';
    cantidad: number;
    motivo: string;
    observaciones?: string;
    fecha?: string;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/ajustar-stock`, datos);
    return respuesta.data;
  },
  venderActivo: async (inventario_id: number, activo_id: number, datos: {
    monto_venta?: number;
    registrar_pago?: boolean;
    tipo_salida: 'venta' | 'desecho' | 'robo';
    observaciones?: string;
    fecha_venta?: string;
  }) => {
    const respuesta = await api.post(`/inventario/${inventario_id}/activos/${activo_id}/vender`, datos);
    return respuesta.data;
  },
  obtenerKardex: async (inventario_id: number, filtros?: {
    tipo?: string;
    operacion?: 'entrada' | 'salida';
    producto_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.operacion) params.append('operacion', filtros.operacion);
    if (filtros?.producto_id) params.append('producto_id', filtros.producto_id.toString());
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex${query}`);
    return respuesta.data;
  },
  obtenerKardexProducto: async (inventario_id: number, producto_id: number, filtros?: {
    tipo?: string;
    operacion?: 'entrada' | 'salida';
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.operacion) params.append('operacion', filtros.operacion);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex/producto/${producto_id}${query}`);
    return respuesta.data;
  },
  generarReporteKardex: async (inventario_id: number, fecha_inicio: string, fecha_fin: string) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/kardex/reporte?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
    return respuesta.data;
  },
  obtenerBitacora: async (inventario_id: number, filtros?: {
    tipo?: string;
    producto_id?: number;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.producto_id) params.append('producto_id', filtros.producto_id.toString());
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora${query}`);
    return respuesta.data;
  },
  obtenerBitacoraActivo: async (inventario_id: number, activo_id: number, filtros?: {
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora/activo/${activo_id}${query}`);
    return respuesta.data;
  },
  obtenerEventosRecientes: async (inventario_id: number, limite?: number) => {
    const query = limite ? `?limite=${limite}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/bitacora/recientes${query}`);
    return respuesta.data;
  },
  buscarAuditoria: async (inventario_id: number, filtros?: {
    accion?: string;
    tipo_entidad?: 'producto' | 'material' | 'activo' | 'inventario';
    usuario_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.accion) params.append('accion', filtros.accion);
    if (filtros?.tipo_entidad) params.append('tipo_entidad', filtros.tipo_entidad);
    if (filtros?.usuario_id) params.append('usuario_id', filtros.usuario_id.toString());
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria${query}`);
    return respuesta.data;
  },
  obtenerAuditoriaProducto: async (inventario_id: number, producto_id: number, filtros?: {
    accion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filtros?.accion) params.append('accion', filtros.accion);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria/producto/${producto_id}${query}`);
    return respuesta.data;
  },
  generarReporteAntiSabotaje: async (inventario_id: number, fecha_inicio: string, fecha_fin: string) => {
    const respuesta = await api.get(`/inventario/${inventario_id}/auditoria/reporte-antisabotaje?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
    return respuesta.data;
  },
};

export const reportesApi = {
  generar: async (datos: {
    areas: string[];
    fecha_inicio?: string;
    fecha_fin?: string;
    incluir_sugerencias?: boolean;
  }) => {
    const respuesta = await api.post('/reportes/generar', datos);
    return respuesta.data;
  },
  obtener: async () => {
    const respuesta = await api.get('/reportes');
    return respuesta.data;
  },
  descargar: async (id: number) => {
    const respuesta = await api.get(`/reportes/${id}/descargar`, {
      responseType: 'blob',
    });
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/reportes/${id}`);
    return respuesta.data;
  },
};

export const consentimientosApi = {
  obtenerPorPaciente: async (paciente_id: number) => {
    const respuesta = await api.get(`/pacientes/${paciente_id}/consentimientos`);
    return respuesta.data;
  },
  crear: async (paciente_id: number, datos: { plantilla_id: number; nombre: string }) => {
    const respuesta = await api.post(`/pacientes/${paciente_id}/consentimientos`, datos);
    return respuesta.data;
  },
  descargar: async (id: number) => {
    const respuesta = await api.get(`/consentimientos/${id}/descargar`, {
      responseType: 'blob',
    });
    return respuesta.data;
  },
  eliminar: async (id: number) => {
    const respuesta = await api.delete(`/consentimientos/${id}`);
    return respuesta.data;
  },
};

export const pdfApi = {
  generarDesdeHtml: async (datos: {
    contenido_html: string;
    config: {
      widthMm: number;
      heightMm: number;
      margenes: { top: number; right: number; bottom: number; left: number };
    };
  }): Promise<string> => {
    const respuesta = await api.post('/pdf/generar-desde-html', datos);
    return respuesta.data.pdf_base64;
  },
};
