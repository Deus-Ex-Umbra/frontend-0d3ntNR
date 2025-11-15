export interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano: number;
  fecha_subida: Date;
  descripcion?: string;
  categoria?: string;
  url?: string;
}

export interface EdicionVersion {
  id: number;
  ruta_archivo: string;
  fecha_edicion: Date;
  observaciones?: string;
}


