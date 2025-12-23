import { UsuarioInventario } from './usuario';

export enum TipoProducto {
  MATERIAL = 'material',
  ACTIVO_FIJO = 'activo_fijo',
}

export enum SubtipoMaterial {
  CON_LOTE_VENCIMIENTO = 'con_lote_vencimiento',
  CON_SERIE = 'con_serie',
  SIN_LOTE = 'sin_lote',
}

export enum SubtipoActivoFijo {
  INSTRUMENTAL = 'instrumental',
  MOBILIARIO_EQUIPO = 'mobiliario_equipo',
}

export enum EstadoActivo {
  DISPONIBLE = 'disponible',
  EN_USO = 'en_uso',
  EN_MANTENIMIENTO = 'en_mantenimiento',
  DESECHADO = 'desechado',
  VENDIDO = 'vendido',
}

export enum TipoMovimientoKardex {
  COMPRA = 'compra',
  REGALO = 'regalo',
  DONACION = 'donacion',
  OTRO_INGRESO = 'otro_ingreso',
  CONSUMO_CITA = 'consumo_cita',
  CONSUMO_TRATAMIENTO = 'consumo_tratamiento',
  VENTA = 'venta',
  DESECHO = 'desecho',
  ROBO = 'robo',
  AJUSTE = 'ajuste',
}

export interface Inventario {
  id: number;
  nombre: string;
  activo: boolean;
  modo_estricto?: boolean;
  productos?: Producto[];
  resumen?: {
    valor_total: number;
    total_productos: number;
    total_consumibles: number;
    total_activos: number;
  };
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: TipoProducto;
  subtipo_material?: SubtipoMaterial;
  subtipo_activo_fijo?: SubtipoActivoFijo;
  unidad_medida?: string;
  cantidad_actual?: number;
  punto_reorden?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  descripcion?: string;
  activo?: boolean;
  notificar_stock_bajo?: boolean;
  permite_decimales?: boolean;
  materiales?: Material[];
  activos?: Activo[];
  inventario_id?: number;
  en_catalogo?: boolean;
  tipo_gestion?: 'consumible' | 'activo_individual' | 'activo_general';
  lotes?: Material[];
}

export interface Material {
  id: number;
  nro_lote?: string;
  nro_serie?: string;
  fecha_vencimiento?: Date | null;
  cantidad_actual: number;
  cantidad_reservada: number;
  costo_unitario: number;
  fecha_ingreso: Date;
  activo: boolean;
}

export interface Activo {
  id: number;
  codigo_interno?: string;
  nro_serie?: string;
  nombre_asignado?: string;
  estado: EstadoActivo | string;
  fecha_adquisicion?: Date;
  fecha_compra?: Date;
  costo_adquisicion?: number;
  costo_compra?: number;
  proveedor?: string;
  ubicacion?: string;
  notas?: string;
}

export interface ReporteValor {
  valor_consumibles: number;
  valor_activos: number;
  valor_total: number;
  cantidad_materiales: number;
  cantidad_activos: number;
  desglose_activos_por_estado: {
    disponible: number;
    en_uso: number;
    en_mantenimiento: number;
    desechado: number;
  };
}

export interface MovimientoKardex {
  id: number;
  tipo: TipoMovimientoKardex;
  operacion: 'entrada' | 'salida';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  monto?: number;
  costo_unitario?: number;
  referencia_tipo?: string;
  referencia_id?: number;
  observaciones?: string;
  fecha: Date;
  producto?: {
    id: number;
    nombre: string;
    permite_decimales?: boolean;
  };
  material?: Material;
  usuario?: UsuarioInventario;
}

export interface EventoBitacora {
  id: number;
  tipo: 'creacion' | 'cambio_estado' | 'asignacion' | 'mantenimiento' | 'desecho' | 'venta' | 'eliminacion';
  estado_anterior?: EstadoActivo;
  estado_nuevo?: EstadoActivo;
  descripcion?: string;
  fecha: Date;
  activo?: Activo;
  usuario?: UsuarioInventario;
}

export interface RegistroAuditoria {
  id: number;
  accion: string;
  categoria: 'producto' | 'material' | 'activo' | 'ajuste' | 'inventario';
  producto?: {
    id: number;
    nombre: string;
  };
  material?: Material;
  activo?: Activo;
  datos_anteriores?: any;
  datos_nuevos?: any;
  motivo?: string;
  ip_address?: string;
  user_agent?: string;
  fecha: Date;
  usuario?: UsuarioInventario;
}


