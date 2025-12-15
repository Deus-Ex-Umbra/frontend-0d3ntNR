export interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: Date;
  monto: number;
  concepto: string;
  cita_id?: number;
  plan_tratamiento_id?: number;
}

export interface ReporteFinanzas {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  movimientos: Movimiento[];
}

export interface DatosGrafico {
  periodo: string;
  ingresos: number;
  egresos: number;
}

export interface FiltrosAnalisis {
  fecha_inicio: string;
  fecha_fin: string;
  glosa?: string;
  sensible_mayusculas?: boolean;
  nivel_precision?: 'alta' | 'equilibrio' | 'global';
}

export interface RespuestaAnalisis {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  movimientos: Movimiento[];
  datos_grafico: DatosGrafico[];
  granularidad: 'hora' | 'dia' | 'semana' | 'mes' | 'ano';
}
