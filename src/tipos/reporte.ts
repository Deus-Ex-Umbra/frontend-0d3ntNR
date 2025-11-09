export interface Reporte {
  id?: number;
  areas: AreaReporte[];
  fecha_inicio?: string;
  fecha_fin?: string;
  pdf_url?: string;
  fecha_creacion?: Date;
}

export enum AreaReporte {
  FINANZAS = 'finanzas',
  AGENDA = 'agenda',
  TRATAMIENTOS = 'tratamientos',
  INVENTARIO = 'inventario',
}

export interface ReporteGenerado {
  blob: Blob;
  url: string;
}
