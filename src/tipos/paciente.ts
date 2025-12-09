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
}

export interface PacienteBasico {
  id: number;
  nombre: string;
  apellidos: string;
  color_categoria?: string;
}

