import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Switch } from '@/componentes/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Lock, 
  Globe, 
  Users, 
  Eye,
  ArrowLeft,
  DollarSign,
  Box,
  AlertTriangle,
  UserPlus,
  Shield,
  History,
  X,
  Search,
  Archive,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Settings
} from 'lucide-react';
import { inventarioApi, usuariosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { DatePicker } from '@/componentes/ui/date-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

interface Inventario {
  id: number;
  nombre: string;
  visibilidad: 'privado' | 'publico';
  activo: boolean;
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
}

interface Lote {
  id: number;
  nro_lote: string;
  fecha_vencimiento: Date;
  cantidad_actual: number;
  costo_unitario_compra: number;
  fecha_compra: Date;
}

interface Activo {
  id: number;
  nro_serie?: string;
  nombre_asignado?: string;
  costo_compra: number;
  fecha_compra: Date;
  estado: string;
  ubicacion?: string;
}

interface Producto {
  id: number;
  nombre: string;
  tipo_gestion: 'consumible' | 'activo_serializado' | 'activo_general';
  stock_minimo: number;
  unidad_medida: string;
  activo: boolean;
  descripcion?: string;
  notificar_stock_bajo: boolean;
  lotes?: Lote[];
  activos?: Activo[];
}

interface ReporteValor {
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

interface MovimientoInventario {
  id: number;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia?: string;
  observaciones?: string;
  fecha: Date;
  costo_total?: number;
  producto: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
}

export default function Inventarios() {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [inventario_seleccionado, setInventarioSeleccionado] = useState<Inventario | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [reporte_valor, setReporteValor] = useState<ReporteValor | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  
  const [cargando, setCargando] = useState(true);
  const [cargando_detalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const [dialogo_inventario_abierto, setDialogoInventarioAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [dialogo_invitar_abierto, setDialogoInvitarAbierto] = useState(false);
  const [dialogo_producto_abierto, setDialogoProductoAbierto] = useState(false);
  const [dialogo_lote_abierto, setDialogoLoteAbierto] = useState(false);
  const [dialogo_activo_abierto, setDialogoActivoAbierto] = useState(false);
  const [dialogo_ajuste_stock_abierto, setDialogoAjusteStockAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_producto_abierto, setDialogoConfirmarEliminarProductoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_lote_abierto, setDialogoConfirmarEliminarLoteAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_activo_abierto, setDialogoConfirmarEliminarActivoAbierto] = useState(false);
  const [dialogo_remover_usuario_abierto, setDialogoRemoverUsuarioAbierto] = useState(false);
  
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_producto, setModoEdicionProducto] = useState(false);
  const [modo_edicion_lote, setModoEdicionLote] = useState(false);
  const [modo_edicion_activo, setModoEdicionActivo] = useState(false);
  
  const [inventario_a_eliminar, setInventarioAEliminar] = useState<Inventario | null>(null);
  const [producto_seleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [producto_a_eliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [lote_seleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [lote_a_eliminar, setLoteAEliminar] = useState<Lote | null>(null);
  const [activo_seleccionado, setActivoSeleccionado] = useState<Activo | null>(null);
  const [activo_a_eliminar, setActivoAEliminar] = useState<Activo | null>(null);
  const [usuario_a_remover, setUsuarioARemover] = useState<any>(null);
  
  const [busqueda_inventarios, setBusquedaInventarios] = useState('');
  const [busqueda_productos, setBusquedaProductos] = useState('');
  const [vista_actual, setVistaActual] = useState<'lista' | 'detalle'>('lista');
  const [tab_activo, setTabActivo] = useState<'productos' | 'historial' | 'usuarios'>('productos');
  const [filtro_tipo_producto, setFiltroTipoProducto] = useState<string>('todos');

  const [formulario_inventario, setFormularioInventario] = useState({
    nombre: '',
    visibilidad: 'privado' as 'privado' | 'publico',
  });

  const [formulario_invitar, setFormularioInvitar] = useState({
    usuarios_ids: [] as string[],
    rol: 'lector',
  });

  const [formulario_producto, setFormularioProducto] = useState({
    nombre: '',
    tipo_gestion: 'consumible',
    stock_minimo: '10',
    unidad_medida: '',
    descripcion: '',
    notificar_stock_bajo: true,
  });

  const [formulario_lote, setFormularioLote] = useState({
    nro_lote: '',
    cantidad: '',
    costo_total: '',
    fecha_vencimiento: undefined as Date | undefined,
    fecha_compra: new Date(),
    registrar_egreso: false,
  });

  const [formulario_activo, setFormularioActivo] = useState({
    nro_serie: '',
    nombre_asignado: '',
    costo_compra: '',
    fecha_compra: new Date(),
    estado: 'disponible',
    ubicacion: '',
    registrar_egreso: false,
  });

  const [formulario_ajuste, setFormularioAjuste] = useState({
    tipo: 'entrada' as 'entrada' | 'salida',
    cantidad: '',
    observaciones: '',
  });

  const roles = [
    { valor: 'lector', etiqueta: 'Lector' },
    { valor: 'editor', etiqueta: 'Editor' },
    { valor: 'administrador', etiqueta: 'Administrador' },
  ];

  const tipos_gestion = [
    { valor: 'consumible', etiqueta: 'Consumible (Lotes)' },
    { valor: 'activo_serializado', etiqueta: 'Activo Serializado (Individual)' },
    { valor: 'activo_general', etiqueta: 'Activo General (Agrupado)' },
  ];

  const estados_activo = [
    { valor: 'disponible', etiqueta: 'Disponible' },
    { valor: 'en_uso', etiqueta: 'En Uso' },
    { valor: 'en_mantenimiento', etiqueta: 'En Mantenimiento' },
    { valor: 'roto', etiqueta: 'Roto' },
  ];

  const opciones_roles: OpcionCombobox[] = roles.map(r => ({
    valor: r.valor,
    etiqueta: r.etiqueta
  }));

  const opciones_tipos_gestion: OpcionCombobox[] = tipos_gestion.map(t => ({
    valor: t.valor,
    etiqueta: t.etiqueta
  }));

  const opciones_estados: OpcionCombobox[] = estados_activo.map(e => ({
    valor: e.valor,
    etiqueta: e.etiqueta
  }));

  useEffect(() => {
    cargarInventarios();
    cargarUsuarios();
  }, []);

  const cargarInventarios = async () => {
    setCargando(true);
    try {
      const datos = await inventarioApi.obtenerInventarios();
      setInventarios(datos);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los inventarios',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const datos = await usuariosApi.obtenerTodos();
      setUsuarios(datos);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const verificarStockBajo = (productos: Producto[]) => {
    const productos_stock_bajo = productos.filter(p => {
      if (!p.notificar_stock_bajo) return false;
      
      const stock_actual = obtenerStockTotal(p);
      return stock_actual <= p.stock_minimo && stock_actual > 0;
    });

    const productos_sin_stock = productos.filter(p => {
      if (!p.notificar_stock_bajo) return false;
      const stock_actual = obtenerStockTotal(p);
      return stock_actual === 0;
    });

    if (productos_sin_stock.length > 0) {
      toast({
        title: '⚠️ Productos sin stock',
        description: `${productos_sin_stock.length} producto(s) sin stock: ${productos_sin_stock.map(p => p.nombre).join(', ')}`,
        variant: 'destructive',
      });
    }

    if (productos_stock_bajo.length > 0) {
      toast({
        title: '📉 Stock bajo detectado',
        description: `${productos_stock_bajo.length} producto(s) con stock bajo: ${productos_stock_bajo.map(p => p.nombre).join(', ')}`,
      });
    }
  };

  const cargarDetalleInventario = async (inventario: Inventario) => {
    setCargandoDetalle(true);
    try {
      const [detalle, productos_data, reporte, movimientos_data] = await Promise.all([
        inventarioApi.obtenerInventarioPorId(inventario.id),
        inventarioApi.obtenerProductos(inventario.id),
        inventarioApi.obtenerReporteValor(inventario.id),
        inventarioApi.obtenerHistorialMovimientos(inventario.id),
      ]);
      
      setInventarioSeleccionado(detalle);
      setProductos(productos_data);
      setReporteValor(reporte);
      setMovimientos(movimientos_data);
      setVistaActual('detalle');
      
      verificarStockBajo(productos_data);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle del inventario',
        variant: 'destructive',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirDialogoNuevo = () => {
    setFormularioInventario({
      nombre: '',
      visibilidad: 'privado',
    });
    setModoEdicion(false);
    setDialogoInventarioAbierto(true);
  };

  const abrirDialogoEditar = (inventario: Inventario) => {
    setFormularioInventario({
      nombre: inventario.nombre,
      visibilidad: inventario.visibilidad,
    });
    setInventarioSeleccionado(inventario);
    setModoEdicion(true);
    setDialogoInventarioAbierto(true);
  };

  const manejarGuardarInventario = async () => {
    if (!formulario_inventario.nombre) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario_inventario.nombre,
        visibilidad: formulario_inventario.visibilidad,
      };

      if (modo_edicion && inventario_seleccionado) {
        await inventarioApi.actualizarInventario(inventario_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Inventario actualizado correctamente',
        });
        if (vista_actual === 'detalle') {
          await cargarDetalleInventario(inventario_seleccionado);
        }
      } else {
        await inventarioApi.crearInventario(datos);
        toast({
          title: 'Éxito',
          description: 'Inventario creado correctamente',
        });
      }

      setDialogoInventarioAbierto(false);
      await cargarInventarios();
    } catch (error: any) {
      console.error('Error al guardar inventario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el inventario',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminar = (inventario: Inventario) => {
    setInventarioAEliminar(inventario);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarInventario = async () => {
    if (!inventario_a_eliminar) return;

    try {
      await inventarioApi.eliminarInventario(inventario_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Inventario eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setInventarioAEliminar(null);
      if (vista_actual === 'detalle' && inventario_seleccionado?.id === inventario_a_eliminar.id) {
        volverALista();
      }
      await cargarInventarios();
    } catch (error: any) {
      console.error('Error al eliminar inventario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el inventario',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoInvitar = () => {
    setFormularioInvitar({
      usuarios_ids: [],
      rol: 'lector',
    });
    setDialogoInvitarAbierto(true);
  };

  const manejarInvitarUsuarios = async () => {
    if (!inventario_seleccionado || formulario_invitar.usuarios_ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un usuario',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      for (const usuario_id of formulario_invitar.usuarios_ids) {
        await inventarioApi.invitarUsuario(inventario_seleccionado.id, {
          usuario_id: parseInt(usuario_id),
          rol: formulario_invitar.rol,
        });
      }

      toast({
        title: 'Éxito',
        description: 'Usuarios invitados correctamente',
      });
      setDialogoInvitarAbierto(false);
      if (vista_actual === 'detalle') {
        await cargarDetalleInventario(inventario_seleccionado);
      }
    } catch (error: any) {
      console.error('Error al invitar usuarios:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al invitar usuarios',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoRemoverUsuario = (usuario: any) => {
    setUsuarioARemover(usuario);
    setDialogoRemoverUsuarioAbierto(true);
  };

  const confirmarRemoverUsuario = async () => {
    if (!inventario_seleccionado || !usuario_a_remover) return;

    try {
      await inventarioApi.eliminarPermiso(inventario_seleccionado.id, usuario_a_remover.id);
      toast({
        title: 'Éxito',
        description: 'Usuario removido correctamente',
      });
      setDialogoRemoverUsuarioAbierto(false);
      setUsuarioARemover(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al remover usuario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al remover usuario',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoNuevoProducto = () => {
    setFormularioProducto({
      nombre: '',
      tipo_gestion: 'consumible',
      stock_minimo: '10',
      unidad_medida: '',
      descripcion: '',
      notificar_stock_bajo: true,
    });
    setModoEdicionProducto(false);
    setDialogoProductoAbierto(true);
  };

  const abrirDialogoEditarProducto = (producto: Producto) => {
    setFormularioProducto({
      nombre: producto.nombre,
      tipo_gestion: producto.tipo_gestion,
      stock_minimo: producto.stock_minimo.toString(),
      unidad_medida: producto.unidad_medida,
      descripcion: producto.descripcion || '',
      notificar_stock_bajo: producto.notificar_stock_bajo,
    });
    setProductoSeleccionado(producto);
    setModoEdicionProducto(true);
    setDialogoProductoAbierto(true);
  };

  const manejarGuardarProducto = async () => {
    if (!inventario_seleccionado || !formulario_producto.nombre) {
      toast({
        title: 'Error',
        description: 'El nombre del producto es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos_producto = {
        inventario_id: inventario_seleccionado.id,
        nombre: formulario_producto.nombre,
        tipo_gestion: formulario_producto.tipo_gestion,
        stock_minimo: parseInt(formulario_producto.stock_minimo) || 0,
        unidad_medida: formulario_producto.unidad_medida || 'unidad',
      };

      if (modo_edicion_producto && producto_seleccionado) {
        await inventarioApi.actualizarProducto(
          inventario_seleccionado.id,
          producto_seleccionado.id,
          datos_producto
        );
        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        });
      } else {
        await inventarioApi.crearProducto(datos_producto);
        toast({
          title: 'Éxito',
          description: 'Producto creado correctamente',
        });
      }

      setDialogoProductoAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el producto',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarProducto = (producto: Producto) => {
    setProductoAEliminar(producto);
    setDialogoConfirmarEliminarProductoAbierto(true);
  };

  const confirmarEliminarProducto = async () => {
    if (!inventario_seleccionado || !producto_a_eliminar) return;

    try {
      await inventarioApi.eliminarProducto(inventario_seleccionado.id, producto_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });
      setDialogoConfirmarEliminarProductoAbierto(false);
      setProductoAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el producto',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoNuevoLote = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormularioLote({
      nro_lote: '',
      cantidad: '',
      costo_total: '',
      fecha_vencimiento: undefined,
      fecha_compra: new Date(),
      registrar_egreso: false,
    });
    setModoEdicionLote(false);
    setDialogoLoteAbierto(true);
  };

  const abrirDialogoEditarLote = (producto: Producto, lote: Lote) => {
    setProductoSeleccionado(producto);
    setLoteSeleccionado(lote);
    setFormularioLote({
      nro_lote: lote.nro_lote,
      cantidad: lote.cantidad_actual.toString(),
      costo_total: (lote.cantidad_actual * lote.costo_unitario_compra).toString(),
      fecha_vencimiento: new Date(lote.fecha_vencimiento),
      fecha_compra: new Date(lote.fecha_compra),
      registrar_egreso: false,
    });
    setModoEdicionLote(true);
    setDialogoLoteAbierto(true);
  };

  const manejarGuardarLote = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_lote.nro_lote || !formulario_lote.cantidad || !formulario_lote.costo_total || !formulario_lote.fecha_vencimiento) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos_compra = {
        producto_id: producto_seleccionado.id,
        cantidad: parseFloat(formulario_lote.cantidad),
        costo_total: parseFloat(formulario_lote.costo_total),
        fecha_compra: format(formulario_lote.fecha_compra, 'yyyy-MM-dd'),
        nro_lote: formulario_lote.nro_lote,
        fecha_vencimiento: format(formulario_lote.fecha_vencimiento, 'yyyy-MM-dd'),
        generar_egreso: formulario_lote.registrar_egreso,
      };

      await inventarioApi.registrarCompra(inventario_seleccionado.id, datos_compra);
      
      toast({
        title: 'Éxito',
        description: formulario_lote.registrar_egreso 
          ? 'Lote registrado y egreso creado en finanzas'
          : 'Lote registrado correctamente',
      });

      setDialogoLoteAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al guardar lote:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el lote',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarLote = (lote: Lote) => {
    setLoteAEliminar(lote);
    setDialogoConfirmarEliminarLoteAbierto(true);
  };

  const confirmarEliminarLote = async () => {
    if (!inventario_seleccionado || !lote_a_eliminar) return;

    try {
      await inventarioApi.eliminarLote(inventario_seleccionado.id, lote_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Lote eliminado correctamente',
      });
      setDialogoConfirmarEliminarLoteAbierto(false);
      setLoteAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar lote:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el lote',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoNuevoActivo = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormularioActivo({
      nro_serie: '',
      nombre_asignado: '',
      costo_compra: '',
      fecha_compra: new Date(),
      estado: 'disponible',
      ubicacion: '',
      registrar_egreso: false,
    });
    setModoEdicionActivo(false);
    setDialogoActivoAbierto(true);
  };

  const abrirDialogoEditarActivo = (producto: Producto, activo: Activo) => {
    setProductoSeleccionado(producto);
    setActivoSeleccionado(activo);
    setFormularioActivo({
      nro_serie: activo.nro_serie || '',
      nombre_asignado: activo.nombre_asignado || '',
      costo_compra: activo.costo_compra.toString(),
      fecha_compra: new Date(activo.fecha_compra),
      estado: activo.estado,
      ubicacion: activo.ubicacion || '',
      registrar_egreso: false,
    });
    setModoEdicionActivo(true);
    setDialogoActivoAbierto(true);
  };

  const manejarGuardarActivo = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_activo.costo_compra && !modo_edicion_activo) {
      toast({
        title: 'Error',
        description: 'El costo de compra es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      if (modo_edicion_activo && activo_seleccionado) {
        await inventarioApi.actualizarActivo(
          inventario_seleccionado.id,
          activo_seleccionado.id,
          {
            estado: formulario_activo.estado,
            ubicacion: formulario_activo.ubicacion || undefined,
            nombre_asignado: formulario_activo.nombre_asignado || undefined,
          }
        );
        
        toast({
          title: 'Éxito',
          description: 'Activo actualizado correctamente',
        });
      } else {
        const datos_compra: any = {
          producto_id: producto_seleccionado.id,
          cantidad: 1,
          costo_total: parseFloat(formulario_activo.costo_compra),
          fecha_compra: format(formulario_activo.fecha_compra, 'yyyy-MM-dd'),
          generar_egreso: formulario_activo.registrar_egreso,
        };

        if (producto_seleccionado.tipo_gestion === 'activo_serializado') {
          datos_compra.nro_serie = formulario_activo.nro_serie;
        }

        if (formulario_activo.nombre_asignado) {
          datos_compra.nombre_asignado = formulario_activo.nombre_asignado;
        }

        await inventarioApi.registrarCompra(inventario_seleccionado.id, datos_compra);
        
        toast({
          title: 'Éxito',
          description: formulario_activo.registrar_egreso 
            ? 'Activo registrado y egreso creado en finanzas'
            : 'Activo registrado correctamente',
        });
      }

      setDialogoActivoAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al guardar activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el activo',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarActivo = (activo: Activo) => {
    setActivoAEliminar(activo);
    setDialogoConfirmarEliminarActivoAbierto(true);
  };

  const confirmarEliminarActivo = async () => {
    if (!inventario_seleccionado || !activo_a_eliminar) return;

    try {
      await inventarioApi.eliminarActivo(inventario_seleccionado.id, activo_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Activo eliminado correctamente',
      });
      setDialogoConfirmarEliminarActivoAbierto(false);
      setActivoAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el activo',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoAjusteStock = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormularioAjuste({
      tipo: 'entrada',
      cantidad: '',
      observaciones: '',
    });
    setDialogoAjusteStockAbierto(true);
  };

  const manejarAjusteStock = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_ajuste.cantidad || !formulario_ajuste.observaciones) {
      toast({
        title: 'Error',
        description: 'Cantidad y observaciones son obligatorias',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.ajustarStock(inventario_seleccionado.id, {
        producto_id: producto_seleccionado.id,
        tipo: formulario_ajuste.tipo,
        cantidad: parseFloat(formulario_ajuste.cantidad),
        observaciones: formulario_ajuste.observaciones,
      });

      toast({
        title: 'Éxito',
        description: 'Stock ajustado correctamente',
      });

      setDialogoAjusteStockAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al ajustar stock:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al ajustar el stock',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const volverALista = () => {
    setVistaActual('lista');
    setInventarioSeleccionado(null);
    setProductos([]);
    setReporteValor(null);
    setMovimientos([]);
    setTabActivo('productos');
  };

  const obtenerIconoVisibilidad = (visibilidad: string) => {
    return visibilidad === 'privado' ? Lock : Globe;
  };

  const obtenerColorTipoGestion = (tipo: string): string => {
    const colores: { [key: string]: string } = {
      consumible: 'bg-purple-500',
      activo_serializado: 'bg-blue-500',
      activo_general: 'bg-cyan-500',
    };
    return colores[tipo] || 'bg-gray-500';
  };

  const obtenerEtiquetaTipoGestion = (tipo: string): string => {
    const tipos: { [key: string]: string } = {
      consumible: 'Consumible',
      activo_serializado: 'Activo S.',
      activo_general: 'Activo G.',
    };
    return tipos[tipo] || tipo;
  };

  const obtenerStockTotal = (producto: Producto): number => {
    if (producto.tipo_gestion === 'consumible' && producto.lotes) {
      return producto.lotes.reduce((total, lote) => total + Number(lote.cantidad_actual), 0);
    }
    return producto.activos?.length || 0;
  };

  const obtenerValorTotal = (producto: Producto): number => {
    if (producto.tipo_gestion === 'consumible' && producto.lotes) {
      return producto.lotes.reduce((total, lote) => total + (Number(lote.cantidad_actual) * Number(lote.costo_unitario_compra)), 0);
    }
    if (producto.activos) {
      return producto.activos.reduce((total, activo) => total + Number(activo.costo_compra), 0);
    }
    return 0;
  };

  const inventarios_filtrados = inventarios.filter(inv =>
    inv.nombre.toLowerCase().includes(busqueda_inventarios.toLowerCase())
  );

  const productos_filtrados = productos.filter(p => {
    const coincide_busqueda = p.nombre.toLowerCase().includes(busqueda_productos.toLowerCase());
    const coincide_tipo = filtro_tipo_producto === 'todos' || p.tipo_gestion === filtro_tipo_producto;
    return coincide_busqueda && coincide_tipo;
  });

  const opciones_usuarios: OpcionCombobox[] = usuarios.map(u => ({
    valor: u.id.toString(),
    etiqueta: `${u.nombre} (${u.correo})`
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <MenuLateral />
      <Toaster />
      
      {vista_actual === 'lista' ? (
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Inventarios</h1>
                  <p className="text-muted-foreground mt-1">Gestiona tus inventarios y productos</p>
                </div>
                <Button onClick={abrirDialogoNuevo}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Inventario
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar inventarios..."
                  value={busqueda_inventarios}
                  onChange={(e) => setBusquedaInventarios(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mis Inventarios</CardTitle>
                <CardDescription>
                  {inventarios_filtrados.length} inventario(s) disponible(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cargando ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : inventarios_filtrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay inventarios disponibles</p>
                    <Button onClick={abrirDialogoNuevo} variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear tu primer inventario
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Visibilidad</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventarios_filtrados.map((inventario) => {
                        const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                        
                        return (
                          <TableRow 
                            key={inventario.id}
                            className="hover:bg-secondary/50 transition-colors cursor-pointer"
                            onClick={() => cargarDetalleInventario(inventario)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                                {inventario.nombre}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={inventario.visibilidad === 'privado' ? 'secondary' : 'default'}>
                                <IconoVisibilidad className="h-3 w-3 mr-1" />
                                {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inventario.propietario?.nombre}
                              {inventario.es_propietario && (
                                <Badge variant="outline" className="ml-2">Tú</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cargarDetalleInventario(inventario);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {inventario.es_propietario && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirDialogoEditar(inventario);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInventarioSeleccionado(inventario);
                                        abrirDialogoInvitar();
                                      }}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirDialogoConfirmarEliminar(inventario);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-6">
              <Button variant="ghost" onClick={volverALista} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a inventarios
              </Button>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{inventario_seleccionado?.nombre}</h1>
                  <p className="text-muted-foreground mt-1">
                    Propietario: {inventario_seleccionado?.propietario?.nombre}
                  </p>
                </div>
                {inventario_seleccionado?.es_propietario && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => inventario_seleccionado && abrirDialogoEditar(inventario_seleccionado)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" onClick={abrirDialogoInvitar}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invitar Usuario
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => inventario_seleccionado && abrirDialogoConfirmarEliminar(inventario_seleccionado)}
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {reporte_valor && (
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${reporte_valor.valor_total.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consumibles</CardTitle>
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${reporte_valor.valor_consumibles.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_lotes} lotes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activos</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${reporte_valor.valor_activos.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reporte_valor.desglose_activos_por_estado.disponible}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.desglose_activos_por_estado.en_uso} en uso
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs value={tab_activo} onValueChange={(value: any) => setTabActivo(value)}>
              <TabsList>
                <TabsTrigger value="productos">
                  <Package className="h-4 w-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="historial">
                  <History className="h-4 w-4 mr-2" />
                  Historial
                </TabsTrigger>
                <TabsTrigger value="usuarios">
                  <Users className="h-4 w-4 mr-2" />
                  Usuarios
                </TabsTrigger>
              </TabsList>

              <TabsContent value="productos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Productos</CardTitle>
                        <CardDescription>
                          {productos_filtrados.length} producto(s)
                        </CardDescription>
                      </div>
                      <Button onClick={abrirDialogoNuevoProducto}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-4">
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar productos..."
                            value={busqueda_productos}
                            onChange={(e) => setBusquedaProductos(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Select value={filtro_tipo_producto} onValueChange={setFiltroTipoProducto}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Tipo de producto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="consumible">Consumibles</SelectItem>
                            <SelectItem value="activo_serializado">Activos Serializados</SelectItem>
                            <SelectItem value="activo_general">Activos Generales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {cargando_detalle ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : productos_filtrados.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay productos en este inventario</p>
                        <Button onClick={abrirDialogoNuevoProducto} variant="outline" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar primer producto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productos_filtrados.map((producto) => {
                          const stock = obtenerStockTotal(producto);
                          const valor = obtenerValorTotal(producto);
                          const stock_bajo = producto.notificar_stock_bajo && stock <= producto.stock_minimo && stock > 0;
                          const sin_stock = producto.notificar_stock_bajo && stock === 0;

                          return (
                            <Card key={producto.id} className={`${stock_bajo ? 'border-yellow-500' : sin_stock ? 'border-red-500' : ''}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-lg ${obtenerColorTipoGestion(producto.tipo_gestion)} flex items-center justify-center text-white`}>
                                      <Package className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{producto.nombre}</h3>
                                        <Badge variant="outline">
                                          {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                        </Badge>
                                        {stock_bajo && (
                                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Stock Bajo
                                          </Badge>
                                        )}
                                        {sin_stock && (
                                          <Badge variant="outline" className="text-red-600 border-red-600">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Sin Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span>Stock: {stock} {producto.unidad_medida}</span>
                                        <span>Mínimo: {producto.stock_minimo}</span>
                                        <span>Valor: ${valor.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => abrirDialogoAjusteStock(producto)}
                                    >
                                      <Settings className="mr-2 h-4 w-4" />
                                      Ajustar Stock
                                    </Button>
                                    {producto.tipo_gestion === 'consumible' && (
                                      <Button
                                        size="sm"
                                        onClick={() => abrirDialogoNuevoLote(producto)}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Lote
                                      </Button>
                                    )}
                                    {(producto.tipo_gestion === 'activo_serializado' || producto.tipo_gestion === 'activo_general') && (
                                      <Button
                                        size="sm"
                                        onClick={() => abrirDialogoNuevoActivo(producto)}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Activo
                                      </Button>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => abrirDialogoEditarProducto(producto)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>

                              {producto.lotes && producto.lotes.length > 0 && (
                                <CardContent>
                                  <h4 className="font-medium mb-3">Lotes ({producto.lotes.length})</h4>
                                  <div className="space-y-2">
                                    {producto.lotes.map((lote) => (
                                      <div key={lote.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1 grid grid-cols-4 gap-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Nro. Lote</p>
                                            <p className="font-medium">{lote.nro_lote}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Cantidad</p>
                                            <p className="font-medium">{lote.cantidad_actual}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Vencimiento</p>
                                            <p className="font-medium">{format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Costo Unit.</p>
                                            <p className="font-medium">${lote.costo_unitario_compra}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => abrirDialogoEditarLote(producto, lote)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => abrirDialogoConfirmarEliminarLote(lote)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              )}

                              {producto.activos && producto.activos.length > 0 && (
                                <CardContent>
                                  <h4 className="font-medium mb-3">Activos ({producto.activos.length})</h4>
                                  <div className="space-y-2">
                                    {producto.activos.map((activo) => (
                                      <div key={activo.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1 grid grid-cols-4 gap-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Serie/Nombre</p>
                                            <p className="font-medium">{activo.nro_serie || activo.nombre_asignado || 'Sin nombre'}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Estado</p>
                                            <Badge>{activo.estado.replace('_', ' ')}</Badge>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Ubicación</p>
                                            <p className="font-medium">{activo.ubicacion || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Costo</p>
                                            <p className="font-medium">${activo.costo_compra}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => abrirDialogoEditarActivo(producto, activo)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => abrirDialogoConfirmarEliminarActivo(activo)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historial">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Movimientos</CardTitle>
                    <CardDescription>
                      Registro de entradas, salidas y ajustes de inventario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {movimientos.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movimientos.map((mov) => (
                              <TableRow key={mov.id}>
                                <TableCell>
                                  {format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={mov.tipo === 'entrada' ? 'default' : 'secondary'}>
                                    {mov.tipo === 'entrada' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {mov.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>{mov.producto.nombre}</TableCell>
                                <TableCell>
                                  {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                                </TableCell>
                                <TableCell>{mov.usuario.nombre}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {mov.observaciones || mov.referencia || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usuarios">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Usuarios con Acceso</CardTitle>
                        <CardDescription>
                          Gestiona quién puede acceder a este inventario
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{inventario_seleccionado?.propietario?.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {inventario_seleccionado?.propietario?.correo}
                              </p>
                            </div>
                          </div>
                          <Badge>Propietario</Badge>
                        </div>
                      </div>

                      {inventario_seleccionado?.permisos && inventario_seleccionado.permisos.length > 0 ? (
                        inventario_seleccionado.permisos.map((permiso) => (
                          <div key={permiso.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{permiso.usuario_invitado.nombre}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {permiso.usuario_invitado.correo}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{permiso.rol}</Badge>
                                {inventario_seleccionado?.es_propietario && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => abrirDialogoRemoverUsuario(permiso)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No hay usuarios invitados</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      <Dialog open={dialogo_inventario_abierto} onOpenChange={setDialogoInventarioAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Inventario' : 'Nuevo Inventario'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion
                ? 'Modifica la información del inventario'
                : 'Crea un nuevo inventario para gestionar tus productos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formulario_inventario.nombre}
                onChange={(e) => setFormularioInventario({ ...formulario_inventario, nombre: e.target.value })}
                placeholder="Ej: Inventario Principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibilidad">Visibilidad</Label>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {formulario_inventario.visibilidad === 'privado' ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {formulario_inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formulario_inventario.visibilidad === 'privado'
                        ? 'Solo tú y usuarios invitados pueden ver este inventario'
                        : 'Todos los usuarios pueden ver este inventario'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formulario_inventario.visibilidad === 'publico'}
                  onCheckedChange={(checked) =>
                    setFormularioInventario({
                      ...formulario_inventario,
                      visibilidad: checked ? 'publico' : 'privado',
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInventarioAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarGuardarInventario} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Guardar Cambios' : 'Crear Inventario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar inventario?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El inventario "{inventario_a_eliminar?.nombre}" será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarInventario}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_invitar_abierto} onOpenChange={setDialogoInvitarAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitar Usuarios</DialogTitle>
            <DialogDescription>
              Selecciona usuarios para invitar a este inventario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuarios</Label>
              <MultiSelect
                opciones={opciones_usuarios}
                valores={formulario_invitar.usuarios_ids}
                onChange={(valores) => setFormularioInvitar({
                  ...formulario_invitar,
                  usuarios_ids: valores
                })}
                placeholder="Selecciona usuarios"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Combobox
                opciones={opciones_roles}
                valor={formulario_invitar.rol}
                onChange={(valor) => setFormularioInvitar({ ...formulario_invitar, rol: valor })}
                placeholder="Selecciona un rol"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInvitarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarInvitarUsuarios} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_remover_usuario_abierto} onOpenChange={setDialogoRemoverUsuarioAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Remover usuario?</DialogTitle>
            <DialogDescription>
              El usuario "{usuario_a_remover?.usuario_invitado?.nombre}" perderá acceso a este inventario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoRemoverUsuarioAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRemoverUsuario}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_producto_abierto} onOpenChange={setDialogoProductoAbierto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_producto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_producto
                ? 'Modifica la información del producto'
                : 'Agrega un nuevo producto al inventario'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
              <Input
                id="nombre_producto"
                value={formulario_producto.nombre}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                placeholder="Ej: Jeringa 5ml"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Gestión *</Label>
              <Combobox
                opciones={opciones_tipos_gestion}
                valor={formulario_producto.tipo_gestion}
                onChange={(valor) => setFormularioProducto({ ...formulario_producto, tipo_gestion: valor })}
                placeholder="Selecciona el tipo"
                disabled={modo_edicion_producto}
              />
              <p className="text-xs text-muted-foreground">
                {formulario_producto.tipo_gestion === 'consumible' && 'Se gestiona por lotes con fecha de vencimiento'}
                {formulario_producto.tipo_gestion === 'activo_serializado' && 'Cada unidad tiene un número de serie único'}
                {formulario_producto.tipo_gestion === 'activo_general' && 'Se gestionan como unidades agrupadas sin serie'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  value={formulario_producto.stock_minimo}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, stock_minimo: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                <Input
                  id="unidad_medida"
                  value={formulario_producto.unidad_medida}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value })}
                  placeholder="unidad, kg, ml, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formulario_producto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Notificar stock bajo</p>
                <p className="text-sm text-muted-foreground">
                  Recibir alertas cuando el stock esté por debajo del mínimo
                </p>
              </div>
              <Switch
                checked={formulario_producto.notificar_stock_bajo}
                onCheckedChange={(checked) =>
                  setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoProductoAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarGuardarProducto} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_producto ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_lote_abierto} onOpenChange={setDialogoLoteAbierto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_lote ? 'Editar Lote' : 'Agregar Lote'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_lote
                ? 'Modifica la información del lote'
                : `Agregar nuevo lote para ${producto_seleccionado?.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nro_lote">Número de Lote *</Label>
              <Input
                id="nro_lote"
                value={formulario_lote.nro_lote}
                onChange={(e) => setFormularioLote({ ...formulario_lote, nro_lote: e.target.value })}
                placeholder="LOTE-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad_lote">Cantidad *</Label>
                <Input
                  id="cantidad_lote"
                  type="number"
                  value={formulario_lote.cantidad}
                  onChange={(e) => setFormularioLote({ ...formulario_lote, cantidad: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_total_lote">Costo Total *</Label>
                <Input
                  id="costo_total_lote"
                  type="number"
                  value={formulario_lote.costo_total}
                  onChange={(e) => setFormularioLote({ ...formulario_lote, costo_total: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_compra_lote">Fecha de Compra *</Label>
                <DatePicker
                  valor={formulario_lote.fecha_compra}
                  onChange={(fecha) => fecha && setFormularioLote({ ...formulario_lote, fecha_compra: fecha })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento *</Label>
                <DatePicker
                  valor={formulario_lote.fecha_vencimiento}
                  onChange={(fecha) => setFormularioLote({ ...formulario_lote, fecha_vencimiento: fecha })}
                />
              </div>
            </div>

            {!modo_edicion_lote && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Registrar egreso en finanzas</p>
                  <p className="text-sm text-muted-foreground">
                    Se creará un registro de egreso automáticamente
                  </p>
                </div>
                <Switch
                  checked={formulario_lote.registrar_egreso}
                  onCheckedChange={(checked) =>
                    setFormularioLote({ ...formulario_lote, registrar_egreso: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoLoteAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarGuardarLote} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_lote ? 'Guardar Cambios' : 'Agregar Lote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_activo_abierto} onOpenChange={setDialogoActivoAbierto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_activo ? 'Editar Activo' : 'Agregar Activo'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_activo
                ? 'Modifica la información del activo'
                : `Agregar nuevo activo para ${producto_seleccionado?.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {producto_seleccionado?.tipo_gestion === 'activo_serializado' && (
              <div className="space-y-2">
                <Label htmlFor="nro_serie">Número de Serie</Label>
                <Input
                  id="nro_serie"
                  value={formulario_activo.nro_serie}
                  onChange={(e) => setFormularioActivo({ ...formulario_activo, nro_serie: e.target.value })}
                  placeholder="SN-001"
                  disabled={modo_edicion_activo}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre_asignado">Nombre Asignado</Label>
              <Input
                id="nombre_asignado"
                value={formulario_activo.nombre_asignado}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, nombre_asignado: e.target.value })}
                placeholder="Computadora Sala 1"
              />
            </div>

            {!modo_edicion_activo && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costo_compra">Costo de Compra *</Label>
                  <Input
                    id="costo_compra"
                    type="number"
                    value={formulario_activo.costo_compra}
                    onChange={(e) => setFormularioActivo({ ...formulario_activo, costo_compra: e.target.value })}
                    placeholder="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_compra_activo">Fecha de Compra *</Label>
                  <DatePicker
                    valor={formulario_activo.fecha_compra}
                    onChange={(fecha) => fecha && setFormularioActivo({ ...formulario_activo, fecha_compra: fecha })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Estado</Label>
              <Combobox
                opciones={opciones_estados}
                valor={formulario_activo.estado}
                onChange={(valor) => setFormularioActivo({ ...formulario_activo, estado: valor })}
                placeholder="Selecciona el estado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formulario_activo.ubicacion}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, ubicacion: e.target.value })}
                placeholder="Consultorio 1"
              />
            </div>

            {!modo_edicion_activo && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Registrar egreso en finanzas</p>
                  <p className="text-sm text-muted-foreground">
                    Se creará un registro de egreso automáticamente
                  </p>
                </div>
                <Switch
                  checked={formulario_activo.registrar_egreso}
                  onCheckedChange={(checked) =>
                    setFormularioActivo({ ...formulario_activo, registrar_egreso: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoActivoAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarGuardarActivo} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_activo ? 'Guardar Cambios' : 'Agregar Activo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ajuste_stock_abierto} onOpenChange={setDialogoAjusteStockAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Stock</DialogTitle>
            <DialogDescription>
              Registra una entrada o salida manual para {producto_seleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <Select value={formulario_ajuste.tipo} onValueChange={(value: any) => setFormularioAjuste({ ...formulario_ajuste, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_ajuste">Cantidad *</Label>
              <Input
                id="cantidad_ajuste"
                type="number"
                value={formulario_ajuste.cantidad}
                onChange={(e) => setFormularioAjuste({ ...formulario_ajuste, cantidad: e.target.value })}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_ajuste">Observaciones *</Label>
              <Textarea
                id="observaciones_ajuste"
                value={formulario_ajuste.observaciones}
                onChange={(e) => setFormularioAjuste({ ...formulario_ajuste, observaciones: e.target.value })}
                placeholder="Motivo del ajuste..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAjusteStockAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarAjusteStock} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_producto_abierto} onOpenChange={setDialogoConfirmarEliminarProductoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
            <DialogDescription>
              El producto "{producto_a_eliminar?.nombre}" será eliminado. Los registros históricos se mantendrán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarProductoAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarProducto}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_lote_abierto} onOpenChange={setDialogoConfirmarEliminarLoteAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar lote?</DialogTitle>
            <DialogDescription>
              El lote será eliminado. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarLoteAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarLote}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_activo_abierto} onOpenChange={setDialogoConfirmarEliminarActivoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar activo?</DialogTitle>
            <DialogDescription>
              El activo será eliminado. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarActivoAbierto(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarActivo}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}