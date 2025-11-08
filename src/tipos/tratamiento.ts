import { PacienteBasico } from './paciente';

export interface Tratamiento {
  id: number;
  nombre: string;
  numero_citas: number;
  costo_total: number;
  intervalo_dias: number;
  intervalo_semanas: number;
  intervalo_meses: number;
  horas_aproximadas_citas: number;
  minutos_aproximados_citas: number;
}

export interface PlanTratamiento {
  id: number;
  costo_total: number;
  total_abonado: number;
  paciente: PacienteBasico;
  tratamiento: {
    id: number;
    nombre: string;
  };
  fecha_inicio: Date;
  estado: string;
  citas?: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    estado_pago: string;
    monto_esperado: number;
  }>;
}

