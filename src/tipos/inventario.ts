import { UsuarioInventario } from './usuario';

// Enums - Tipos principales de producto
export enum TipoProducto {
  MATERIAL = 'material',
  ACTIVO_FIJO = 'activo_fijo',
}

// Subtipos para Material (consumibles)
export enum SubtipoMaterial {
  CON_LOTE_VENCIMIENTO = 'con_lote_vencimiento', // Fármacos, medicamentos
  CON_SERIE = 'con_serie', // Implantes
  SIN_LOTE = 'sin_lote', // Papel toalla, guantes, etc.
}

// Subtipos para Activo Fijo
export enum SubtipoActivoFijo {
  INSTRUMENTAL = 'instrumental', // Ciclo de vida rápido
  MOBILIARIO_EQUIPO = 'mobiliario_equipo', // Ciclo de vida lento
}

// Estados de Activo
export enum EstadoActivo {
  DISPONIBLE = 'disponible',
  EN_USO = 'en_uso',
  EN_MANTENIMIENTO = 'en_mantenimiento',
  DESECHADO = 'desechado',
}

// Tipos de movimiento para Kardex
export enum TipoMovimientoKardex {
  // Entradas
  COMPRA = 'compra',
  REGALO = 'regalo',
  DONACION = 'donacion',
  OTRO_INGRESO = 'otro_ingreso',
  // Salidas
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
  visibilidad: 'privado' | 'publico';
  activo: boolean;
  modo_estricto?: boolean;
  propietario?: {
    id: number;
    nombre: string;
    correo: string;
  };
  permisos?: Array<{
    id: number;
    rol: string;
    usuario_invitado: {
      id: number;
      nombre: string;
      correo: string;
    };
  }>;
  productos?: Producto[];
  rol_usuario?: string;
  es_propietario?: boolean;
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
  // Nuevo sistema de tipos (opcional para compatibilidad)
  tipo?: TipoProducto;
  subtipo_material?: SubtipoMaterial;
  subtipo_activo_fijo?: SubtipoActivoFijo;
  // Campo legacy para compatibilidad temporal
  tipo_gestion?: 'consumible' | 'activo_serializado' | 'activo_general';
  unidad_medida?: string;
  cantidad_actual?: number;
  punto_reorden?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  descripcion?: string;
  activo?: boolean;
  notificar_stock_bajo?: boolean;
  // Nueva relación con Material
  materiales?: Material[];
  // Compatibilidad con lotes (legacy)
  lotes?: Lote[];
  activos?: Activo[];
  inventario_id?: number;
  en_catalogo?: boolean;
}

// Nueva interface Material (para el nuevo sistema)
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

// Interface Lote (mantener para compatibilidad)
export interface Lote {
  id: number;
  nro_lote: string;
  cantidad_actual: number;
  cantidad_inicial?: number;
  costo_unitario?: number;
  costo_unitario_compra?: number;
  fecha_vencimiento?: Date | null;
  fecha_ingreso?: Date;
  fecha_compra?: Date;
  proveedor?: string;
  ubicacion?: string;
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
  cantidad_lotes: number;
  cantidad_activos: number;
  desglose_activos_por_estado: {
    disponible: number;
    en_uso: number;
    en_mantenimiento: number;
    roto: number;
  };
}

// Movimiento Kardex (nuevo)
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
  };
  material?: Material;
  usuario?: UsuarioInventario;
}

// Evento Bitácora (historial de activos)
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

// Registro Auditoría
export interface RegistroAuditoria {
  id: number;
  accion: string;
  tipo_entidad: 'producto' | 'material' | 'activo' | 'inventario';
  entidad_id: number;
  datos_anteriores?: any;
  datos_nuevos?: any;
  justificacion?: string;
  ip_address?: string;
  user_agent?: string;
  fecha: Date;
  usuario?: UsuarioInventario;
}

// MovimientoInventario (mantener para compatibilidad con historial existente)
export interface MovimientoInventario {
  id: number;
  tipo: 'compra' | 'ajuste' | 'uso_cita' | 'uso_tratamiento' | 'devolucion' | 'entrada' | 'salida' |
  'producto_creado' | 'producto_editado' | 'producto_eliminado' |
  'lote_creado' | 'lote_eliminado' |
  'activo_creado' | 'activo_editado' | 'activo_eliminado' | 'activo_cambio_estado' | 'activo_vendido';
  cantidad?: number;
  stock_anterior?: number;
  stock_nuevo?: number;
  referencia?: string;
  observaciones?: string;
  fecha: Date;
  costo_total?: number;
  datos_anteriores?: any;
  datos_nuevos?: any;
  producto?: {
    id: number;
    nombre: string;
  };
  usuario: UsuarioInventario;
}

