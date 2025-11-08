import { PacienteBasico } from './paciente';

export interface Cita {
  id: number;
  fecha: Date;
  descripcion: string;
  estado_pago: string | null;
  monto_esperado: number | null;
  horas_aproximadas: number;
  minutos_aproximados: number;
  materiales_confirmados?: boolean;
  paciente?: PacienteBasico | null;
  plan_tratamiento?: {
    id: number;
  } | null;
}

export interface HoraLibre {
  fecha: Date;
  duracion_minutos: number;
  horas_aproximadas: number;
  minutos_aproximados: number;
  descripcion: string;
}

export type ElementoAgenda = (Cita | HoraLibre) & { es_hora_libre?: boolean };

