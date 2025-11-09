import { UsuarioInventario } from './usuario';

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
  tipo_gestion: 'consumible' | 'activo_serializado' | 'activo_general';
  unidad_medida?: string;
  cantidad_actual?: number;
  punto_reorden?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  descripcion?: string;
  activo?: boolean;
  notificar_stock_bajo?: boolean;
  lotes?: Lote[];
  activos?: Activo[];
  inventario_id?: number;
  en_catalogo?: boolean;
}

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
  nro_serie?: string;
  nombre_asignado?: string;
  estado: string;
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

