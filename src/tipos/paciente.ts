export interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  notas_generales?: string;
  notas_generales_config?: {
    tamano_hoja_id?: number | null;
    nombre_tamano?: string | null;
    widthMm: number;
    heightMm: number;
    margenes: { top: number; right: number; bottom: number; left: number };
  } | null;
  alergias?: number[];
  enfermedades?: number[];
  medicamentos?: number[];
  notas_medicas?: string;
  notas_medicas_config?: {
    tamano_hoja_id?: number | null;
    nombre_tamano?: string | null;
    widthMm: number;
    heightMm: number;
    margenes: { top: number; right: number; bottom: number; left: number };
  } | null;
  color_categoria?: string;
  historia_clinica_activa_id?: number;
  total_versiones_historia_clinica?: number;
}

export interface PacienteBasico {
  id: number;
  nombre: string;
  apellidos: string;
  color_categoria?: string;
}

export interface HistoriaClinicaVersion {
  id: number;
  nombre: string;
  numero_version: number;
  contenido_html?: string;
  config?: {
    tamano_hoja_id?: number | null;
    nombre_tamano?: string | null;
    widthMm: number;
    heightMm: number;
    margenes: { top: number; right: number; bottom: number; left: number };
  } | null;
  finalizada: boolean;
  creado_en: string;
  actualizado_en: string;
}

