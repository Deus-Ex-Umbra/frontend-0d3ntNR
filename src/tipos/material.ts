export interface ItemMaterialCita {
  lote_id?: number;
  activo_id?: number;
  cantidad_planeada: number;
  nro_lote?: string;
  nro_serie?: string;
  nombre_asignado?: string;
}

export interface MaterialCita {
  producto_id: number;
  inventario_id: number;
  inventario_nombre?: string;
  producto_nombre?: string;
  tipo_gestion?: string;
  unidad_medida?: string;
  items: ItemMaterialCita[];
}

export interface MaterialCitaConfirmacion {
  material_cita_id: number;
  producto_nombre: string;
  inventario_nombre?: string;
  inventario_id?: number;
  tipo_gestion: string;
  cantidad_planeada: number;
  cantidad_usada: number;
  lote_id?: number;
  activo_id?: number;
  nro_lote?: string;
  nro_serie?: string;
  nombre_asignado?: string;
  unidad_medida?: string;
}

export interface ItemMaterialGeneral {
  lote_id?: number;
  activo_id?: number;
  cantidad_por_cita?: number;
  nro_lote?: string;
  nro_serie?: string;
  nombre_asignado?: string;
}

export interface MaterialGeneral {
  producto_id: number;
  inventario_id: number;
  inventario_nombre?: string;
  producto_nombre?: string;
  tipo_gestion?: string;
  unidad_medida?: string;
  items: ItemMaterialGeneral[];
}

