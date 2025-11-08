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
  inventario_id: number; // Inventario del que proviene el producto
  inventario_nombre?: string; // Nombre del inventario para mostrar
  producto_nombre?: string;
  tipo_gestion?: string;
  unidad_medida?: string;
  items: ItemMaterialCita[]; // Lista de lotes/activos dentro del producto
}

export interface MaterialCitaConfirmacion {
  material_cita_id: number;
  producto_nombre: string;
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
  cantidad_por_cita?: number; // Solo para consumibles
  nro_lote?: string;
  nro_serie?: string;
  nombre_asignado?: string;
}

export interface MaterialGeneral {
  producto_id: number;
  inventario_id: number; // Inventario del que proviene el producto
  inventario_nombre?: string; // Nombre del inventario para mostrar
  producto_nombre?: string;
  tipo_gestion?: string;
  unidad_medida?: string;
  items: ItemMaterialGeneral[]; // Lista de lotes/activos dentro del producto
}

