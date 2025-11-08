export interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  notas_generales?: string;
  alergias?: number[];
  enfermedades?: number[];
  medicamentos?: number[];
  notas_medicas?: string;
  color_categoria?: string;
}

export interface PacienteBasico {
  id: number;
  nombre: string;
  apellidos: string;
  color_categoria?: string;
}

