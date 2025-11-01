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
  Settings,
  Minus,
  PlusIcon
} from 'lucide-react';
import { inventarioApi, usuariosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { DatePicker } from '@/componentes/ui/date-picker';
import { format, parse } from 'date-fns';
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
  const [dialogo_ajuste_stock_lote_abierto, setDialogoAjusteStockLoteAbierto] = useState(false);
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

  const [formulario_ajuste_lote, setFormularioAjusteLote] = useState({
    tipo: 'entrada' as 'entrada' | 'salida',
    cantidad: '',
    registrar_egreso: false,
  });

  const roles = [
    { valor: 'lector', etiqueta: 'Lector' },
    { valor: 'editor', etiqueta: 'Editor' },
    { valor: 'administrador', etiqueta: 'Administrador' },
  ];

  const tipos_gestion = [
    { valor: 'consumible', etiqueta: 'Activo por Lotes' },
    { valor: 'activo_serializado', etiqueta: 'Activo Serializado' },
    { valor: 'activo_general', etiqueta: 'Activo General' },
  ];

  const estados_activo = [
    { valor: 'disponible', etiqueta: 'Disponible' },
    { valor: 'en_uso', etiqueta: 'En Uso' },
    { valor: 'en_mantenimiento', etiqueta: 'En Mantenimiento' },
    { valor: 'roto', etiqueta: 'Roto' },
    { valor: 'desechado', etiqueta: 'Desechado' },
  ];

  useEffect(() => {
    cargarInventarios();
    cargarUsuarios();
  }, []);

  const cargarInventarios = async () => {
    try {
      setCargando(true);
      const respuesta = await inventarioApi.obtenerTodos();
      setInventarios(respuesta);
    } catch (error: any) {
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
      const respuesta = await usuariosApi.obtenerTodos();
      setUsuarios(respuesta);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const cargarDetalleInventario = async (inventario: Inventario) => {
    try {
      setCargandoDetalle(true);
      
      const [productos_respuesta, reporte_respuesta, movimientos_respuesta] = await Promise.all([
        inventarioApi.obtenerProductos(inventario.id),
        inventarioApi.obtenerReporteValor(inventario.id),
        inventarioApi.obtenerHistorialMovimientos(inventario.id),
      ]);

      setProductos(productos_respuesta);
      setReporteValor(reporte_respuesta);
      setMovimientos(movimientos_respuesta);
    } catch (error: any) {
      console.error('Error al cargar detalle del inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle del inventario',
        variant: 'destructive',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirDialogoNuevoInventario = () => {
    setFormularioInventario({
      nombre: '',
      visibilidad: 'privado',
    });
    setModoEdicion(false);
    setDialogoInventarioAbierto(true);
  };

  const abrirDialogoEditarInventario = (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setFormularioInventario({
      nombre: inventario.nombre,
      visibilidad: inventario.visibilidad,
    });
    setModoEdicion(true);
    setDialogoInventarioAbierto(true);
  };

  const manejarGuardarInventario = async () => {
    if (!formulario_inventario.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      if (modo_edicion && inventario_seleccionado) {
        await inventarioApi.actualizar(inventario_seleccionado.id, formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario actualizado correctamente',
        });
      } else {
        await inventarioApi.crear(formulario_inventario);
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
      await inventarioApi.eliminar(inventario_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Inventario eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setInventarioAEliminar(null);
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

  const verDetalleInventario = async (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setVistaActual('detalle');
    await cargarDetalleInventario(inventario);
  };

  const abrirDialogoInvitar = () => {
    setFormularioInvitar({
      usuarios_ids: [],
      rol: 'lector',
    });
    setDialogoInvitarAbierto(true);
  };

  const manejarInvitarUsuarios = async () => {
    if (!inventario_seleccionado) return;

    if (formulario_invitar.usuarios_ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona al menos un usuario',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.invitarUsuarios(inventario_seleccionado.id, {
        usuarios_ids: formulario_invitar.usuarios_ids.map(id => parseInt(id)),
        rol: formulario_invitar.rol,
      });

      toast({
        title: 'Éxito',
        description: 'Usuarios invitados correctamente',
      });

      setDialogoInvitarAbierto(false);
      await cargarInventarios();
      
      if (inventario_seleccionado) {
        const inventario_actualizado = inventarios.find(i => i.id === inventario_seleccionado.id);
        if (inventario_actualizado) {
          setInventarioSeleccionado(inventario_actualizado);
        }
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

  const abrirDialogoRemoverUsuario = (permiso: any) => {
    setUsuarioARemover(permiso);
    setDialogoRemoverUsuarioAbierto(true);
  };

  const confirmarRemoverUsuario = async () => {
    if (!inventario_seleccionado || !usuario_a_remover) return;

    try {
      await inventarioApi.removerUsuario(inventario_seleccionado.id, usuario_a_remover.id);
      toast({
        title: 'Éxito',
        description: 'Usuario removido correctamente',
      });
      setDialogoRemoverUsuarioAbierto(false);
      setUsuarioARemover(null);
      await cargarInventarios();
      
      if (inventario_seleccionado) {
        const inventario_actualizado = inventarios.find(i => i.id === inventario_seleccionado.id);
        if (inventario_actualizado) {
          setInventarioSeleccionado(inventario_actualizado);
        }
      }
    } catch (error: any) {
      console.error('Error al remover usuario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al remover el usuario',
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
    setProductoSeleccionado(producto);
    setFormularioProducto({
      nombre: producto.nombre,
      tipo_gestion: producto.tipo_gestion,
      stock_minimo: producto.stock_minimo.toString(),
      unidad_medida: producto.unidad_medida,
      descripcion: producto.descripcion || '',
      notificar_stock_bajo: producto.notificar_stock_bajo,
    });
    setModoEdicionProducto(true);
    setDialogoProductoAbierto(true);
  };

  const manejarGuardarProducto = async () => {
    if (!inventario_seleccionado) return;

    if (!formulario_producto.nombre.trim() || !formulario_producto.unidad_medida.trim()) {
      toast({
        title: 'Error',
        description: 'Nombre y unidad de medida son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        ...formulario_producto,
        stock_minimo: parseInt(formulario_producto.stock_minimo),
        inventario_id: inventario_seleccionado.id,
      };

      if (modo_edicion_producto && producto_seleccionado) {
        await inventarioApi.actualizarProducto(
          inventario_seleccionado.id,
          producto_seleccionado.id,
          datos
        );
        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        });
      } else {
        await inventarioApi.crearProducto(datos);
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

  const abrirDialogoAjusteStockLote = (producto: Producto, lote: Lote) => {
    setProductoSeleccionado(producto);
    setLoteSeleccionado(lote);
    setFormularioAjusteLote({
      tipo: 'entrada',
      cantidad: '1',
      registrar_egreso: false,
    });
    setDialogoAjusteStockLoteAbierto(true);
  };

  const manejarAjusteStockLote = async () => {
    if (!inventario_seleccionado || !producto_seleccionado || !lote_seleccionado) return;

    if (!formulario_ajuste_lote.cantidad) {
      toast({
        title: 'Error',
        description: 'La cantidad es obligatoria',
        variant: 'destructive',
      });
      return;
    }

    const cantidad = parseFloat(formulario_ajuste_lote.cantidad);
    if (cantidad <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_ajuste_lote.tipo === 'salida' && cantidad > lote_seleccionado.cantidad_actual) {
      toast({
        title: 'Error',
        description: 'No hay suficiente stock en este lote',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.ajustarStock(inventario_seleccionado.id, {
        producto_id: producto_seleccionado.id,
        tipo: formulario_ajuste_lote.tipo,
        cantidad: cantidad,
        observaciones: `Ajuste de stock en lote ${lote_seleccionado.nro_lote}`,
      });

      if (formulario_ajuste_lote.tipo === 'entrada' && formulario_ajuste_lote.registrar_egreso) {
        await inventarioApi.ajustarStock(inventario_seleccionado.id, {
          producto_id: producto_seleccionado.id,
          tipo: 'entrada',
          cantidad: cantidad,
          observaciones: `Compra adicional para lote ${lote_seleccionado.nro_lote}`,
        });
      }

      toast({
        title: 'Éxito',
        description: 'Stock ajustado correctamente',
      });

      setDialogoAjusteStockLoteAbierto(false);
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

  const incrementarCantidadLote = () => {
    const cantidad_actual = parseFloat(formulario_ajuste_lote.cantidad) || 0;
    setFormularioAjusteLote({
      ...formulario_ajuste_lote,
      cantidad: (cantidad_actual + 1).toString(),
    });
  };

  const decrementarCantidadLote = () => {
    const cantidad_actual = parseFloat(formulario_ajuste_lote.cantidad) || 0;
    if (cantidad_actual > 1) {
      setFormularioAjusteLote({
        ...formulario_ajuste_lote,
        cantidad: (cantidad_actual - 1).toString(),
      });
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

  const manejarCambioEstadoActivo = async (producto: Producto, activo: Activo, nuevo_estado: string) => {
    if (!inventario_seleccionado) return;

    try {
      await inventarioApi.actualizarActivo(
        inventario_seleccionado.id,
        activo.id,
        {
          estado: nuevo_estado,
          ubicacion: activo.ubicacion,
          nombre_asignado: activo.nombre_asignado,
        }
      );
      
      toast({
        title: 'Éxito',
        description: 'Estado actualizado correctamente',
      });

      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cambiar el estado',
        variant: 'destructive',
      });
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
      activo_serializado: 'Serializado',
      activo_general: 'General',
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
    return coincide_busqueda && coincide_tipo && p.activo;
  });

  const opciones_usuarios: OpcionCombobox[] = usuarios.map(u => ({
    valor: u.id.toString(),
    etiqueta: `${u.nombre} (${u.correo})`
  }));

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando inventarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MenuLateral />
      <Toaster />
      
      {vista_actual === 'lista' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Inventarios</h1>
                  <p className="text-sm text-muted-foreground">Gestiona tus inventarios de productos y materiales</p>
                </div>
              </div>
              <Button
                onClick={abrirDialogoNuevoInventario}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
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

          <ScrollArea className="flex-1 p-6">
            {inventarios_filtrados.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {busqueda_inventarios ? 'No se encontraron inventarios' : 'No hay inventarios'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {busqueda_inventarios 
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Crea tu primer inventario para comenzar a gestionar productos'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventarios_filtrados.map((inventario) => {
                  const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                  
                  return (
                    <Card
                      key={inventario.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2"
                      onClick={() => verDetalleInventario(inventario)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{inventario.nombre}</CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <IconoVisibilidad className="h-3 w-3" />
                                {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                              </Badge>
                              {inventario.rol_usuario && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  {inventario.rol_usuario}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {inventario.propietario?.nombre || 'Propietario'}
                            </span>
                          </div>
                          
                          {inventario.es_propietario && (
                            <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirDialogoEditarInventario(inventario);
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirDialogoConfirmarEliminar(inventario);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={volverALista}
                  className="hover:scale-110 transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{inventario_seleccionado?.nombre}</h1>
                  <p className="text-sm text-muted-foreground">
                    {inventario_seleccionado?.propietario?.nombre}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {inventario_seleccionado?.rol_usuario === 'administrador' && (
                  <Button
                    variant="outline"
                    onClick={abrirDialogoInvitar}
                    className="hover:scale-105 transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invitar Usuarios
                  </Button>
                )}
                <Button
                  onClick={abrirDialogoNuevoProducto}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </div>

            {reporte_valor && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Valor Consumibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ${reporte_valor.valor_consumibles.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reporte_valor.cantidad_lotes} lotes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Valor Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      ${reporte_valor.valor_activos.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      ${reporte_valor.valor_total.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Activos por Estado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Disponible: {reporte_valor.desglose_activos_por_estado.disponible}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      En uso: {reporte_valor.desglose_activos_por_estado.en_uso}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <Tabs value={tab_activo} onValueChange={setTabActivo as any} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b border-border">
              <TabsList>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                {inventario_seleccionado?.rol_usuario === 'administrador' && (
                  <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="productos" className="flex-1 overflow-hidden p-6 space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
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
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="consumible">Consumibles</SelectItem>
                    <SelectItem value="activo_serializado">Activos Serializados</SelectItem>
                    <SelectItem value="activo_general">Activos Generales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[calc(100vh-400px)]">
                {productos_filtrados.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        No hay productos
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Crea tu primer producto para este inventario
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {productos_filtrados.map((producto) => (
                      <Card key={producto.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-xl">{producto.nombre}</CardTitle>
                                <Badge className={obtenerColorTipoGestion(producto.tipo_gestion)}>
                                  {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                </Badge>
                              </div>
                              {producto.descripcion && (
                                <CardDescription>{producto.descripcion}</CardDescription>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirDialogoEditarProducto(producto)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Stock Total</p>
                                <p className="text-lg font-semibold text-foreground">
                                  {obtenerStockTotal(producto)} {producto.unidad_medida}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Stock Mínimo</p>
                                <p className="text-lg font-semibold text-foreground">
                                  {producto.stock_minimo} {producto.unidad_medida}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Valor Total</p>
                                <p className="text-lg font-semibold text-primary">
                                  ${obtenerValorTotal(producto).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {producto.tipo_gestion === 'consumible' && producto.lotes && producto.lotes.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-foreground">Lotes</h4>
                                  <Button
                                    size="sm"
                                    onClick={() => abrirDialogoNuevoLote(producto)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Nuevo Lote
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {producto.lotes.map((lote) => (
                                    <div
                                      key={lote.id}
                                      className="p-4 rounded-lg border border-border bg-secondary/30"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="grid grid-cols-4 gap-4 flex-1">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Lote</p>
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
                                            variant="outline"
                                            onClick={() => abrirDialogoAjusteStockLote(producto, lote)}
                                            title="Ajustar Stock"
                                          >
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() => abrirDialogoConfirmarEliminarLote(lote)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {producto.tipo_gestion === 'consumible' && (!producto.lotes || producto.lotes.length === 0) && (
                              <Button
                                onClick={() => abrirDialogoNuevoLote(producto)}
                                variant="outline"
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Primer Lote
                              </Button>
                            )}

                            {(producto.tipo_gestion === 'activo_serializado' || producto.tipo_gestion === 'activo_general') && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-foreground">Activos</h4>
                                  <Button
                                    size="sm"
                                    onClick={() => abrirDialogoNuevoActivo(producto)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Nuevo Activo
                                  </Button>
                                </div>
                                {producto.activos && producto.activos.length > 0 ? (
                                  <div className="space-y-2">
                                    {producto.activos.map((activo) => (
                                      <div
                                        key={activo.id}
                                        className="p-4 rounded-lg border border-border bg-secondary/30"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="grid grid-cols-5 gap-4 flex-1">
                                            {producto.tipo_gestion === 'activo_serializado' && (
                                              <div>
                                                <p className="text-xs text-muted-foreground">N° Serie</p>
                                                <p className="font-medium">{activo.nro_serie || 'N/A'}</p>
                                              </div>
                                            )}
                                            {activo.nombre_asignado && (
                                              <div>
                                                <p className="text-xs text-muted-foreground">Nombre</p>
                                                <p className="font-medium">{activo.nombre_asignado}</p>
                                              </div>
                                            )}
                                            <div>
                                              <p className="text-xs text-muted-foreground">Estado</p>
                                              <Select
                                                value={activo.estado}
                                                onValueChange={(valor) => manejarCambioEstadoActivo(producto, activo, valor)}
                                              >
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {estados_activo.map((estado) => (
                                                    <SelectItem key={estado.valor} value={estado.valor}>
                                                      {estado.etiqueta}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Costo</p>
                                              <p className="font-medium">${activo.costo_compra}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Ubicación</p>
                                              <p className="font-medium">{activo.ubicacion || 'N/A'}</p>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              onClick={() => abrirDialogoEditarActivo(producto, activo)}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="destructive"
                                              onClick={() => abrirDialogoConfirmarEliminarActivo(activo)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No hay activos registrados
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="historial" className="flex-1 overflow-hidden p-6">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {movimientos.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                      <History className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        No hay movimientos registrados
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Los movimientos de inventario aparecerán aquí
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movimientos.map((movimiento) => (
                      <Card key={movimiento.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${
                                movimiento.tipo === 'entrada' ? 'bg-green-500/10' : 'bg-red-500/10'
                              }`}>
                                {movimiento.tipo === 'entrada' ? (
                                  <TrendingUp className="h-5 w-5 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {movimiento.producto.nombre}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} de {movimiento.cantidad} unidades
                                </p>
                                {movimiento.observaciones && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {movimiento.observaciones}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">
                                {format(new Date(movimiento.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {movimiento.usuario.nombre}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {inventario_seleccionado?.rol_usuario === 'administrador' && (
              <TabsContent value="usuarios" className="flex-1 overflow-hidden p-6">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {inventario_seleccionado?.permisos && inventario_seleccionado.permisos.length > 0 ? (
                    <div className="space-y-3">
                      {inventario_seleccionado.permisos.map((permiso) => (
                        <Card key={permiso.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {permiso.usuario_invitado.nombre}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {permiso.usuario_invitado.correo}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">
                                  {permiso.rol}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => abrirDialogoRemoverUsuario(permiso)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No hay usuarios invitados
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Invita a usuarios para colaborar en este inventario
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
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
                : 'Crea un nuevo inventario para gestionar productos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formulario_inventario.nombre}
                onChange={(e) => setFormularioInventario({ ...formulario_inventario, nombre: e.target.value })}
                placeholder="Inventario Principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibilidad">Visibilidad</Label>
              <Select
                value={formulario_inventario.visibilidad}
                onValueChange={(value) => setFormularioInventario({ ...formulario_inventario, visibilidad: value as 'privado' | 'publico' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privado">Privado</SelectItem>
                  <SelectItem value="publico">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoInventarioAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardarInventario} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion ? 'Guardar Cambios' : 'Crear Inventario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el inventario "{inventario_a_eliminar?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarAbierto(false)}>
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
              Selecciona usuarios y asigna un rol para este inventario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="usuarios">Usuarios *</Label>
              <MultiSelect
                opciones={opciones_usuarios}
                valores={formulario_invitar.usuarios_ids}
                onChange={(valores) => setFormularioInvitar({ ...formulario_invitar, usuarios_ids: valores })}
                placeholder="Selecciona usuarios"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select
                value={formulario_invitar.rol}
                onValueChange={(value) => setFormularioInvitar({ ...formulario_invitar, rol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.valor} value={rol.valor}>
                      {rol.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoInvitarAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarInvitarUsuarios} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invitando...
                </>
              ) : (
                'Invitar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_remover_usuario_abierto} onOpenChange={setDialogoRemoverUsuarioAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas remover a {usuario_a_remover?.usuario_invitado?.nombre} de este inventario?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoRemoverUsuarioAbierto(false)}>
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
                : 'Crea un nuevo producto en el inventario'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_producto">Nombre *</Label>
              <Input
                id="nombre_producto"
                value={formulario_producto.nombre}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                placeholder="Alcohol 70%"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_gestion">Tipo de Gestión *</Label>
                <Select
                  value={formulario_producto.tipo_gestion}
                  onValueChange={(value) => setFormularioProducto({ ...formulario_producto, tipo_gestion: value })}
                  disabled={modo_edicion_producto}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos_gestion.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                <Input
                  id="unidad_medida"
                  value={formulario_producto.unidad_medida}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value })}
                  placeholder="Unidades, ml, kg..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={formulario_producto.stock_minimo}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, stock_minimo: e.target.value })}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formulario_producto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                placeholder="Descripción opcional del producto"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notificar"
                checked={formulario_producto.notificar_stock_bajo}
                onCheckedChange={(checked) => setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })}
              />
              <Label htmlFor="notificar">Notificar cuando el stock esté bajo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoProductoAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardarProducto} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_producto ? 'Guardar Cambios' : 'Crear Producto'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_producto_abierto} onOpenChange={setDialogoConfirmarEliminarProductoAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{producto_a_eliminar?.nombre}"?
              Esto eliminará todos sus lotes y activos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarProductoAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarProducto}>
              Eliminar
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="registrar_egreso_lote"
                  checked={formulario_lote.registrar_egreso}
                  onCheckedChange={(checked) => setFormularioLote({ ...formulario_lote, registrar_egreso: checked })}
                />
                <Label htmlFor="registrar_egreso_lote">Registrar egreso en finanzas</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoLoteAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardarLote} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_lote ? 'Guardar Cambios' : 'Agregar Lote'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ajuste_stock_lote_abierto} onOpenChange={setDialogoAjusteStockLoteAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock del Lote</DialogTitle>
            <DialogDescription>
              Lote: {lote_seleccionado?.nro_lote} - Stock actual: {lote_seleccionado?.cantidad_actual} {producto_seleccionado?.unidad_medida}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ajuste">Tipo de Ajuste</Label>
              <Select
                value={formulario_ajuste_lote.tipo}
                onValueChange={(value) => setFormularioAjusteLote({ ...formulario_ajuste_lote, tipo: value as 'entrada' | 'salida' })}
              >
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
              <Label htmlFor="cantidad_ajuste">Cantidad</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={decrementarCantidadLote}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="cantidad_ajuste"
                  type="number"
                  value={formulario_ajuste_lote.cantidad}
                  onChange={(e) => setFormularioAjusteLote({ ...formulario_ajuste_lote, cantidad: e.target.value })}
                  className="text-center"
                  min="1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={incrementarCantidadLote}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {formulario_ajuste_lote.tipo === 'entrada' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="registrar_egreso_ajuste"
                  checked={formulario_ajuste_lote.registrar_egreso}
                  onCheckedChange={(checked) => setFormularioAjusteLote({ ...formulario_ajuste_lote, registrar_egreso: checked })}
                />
                <Label htmlFor="registrar_egreso_ajuste">Registrar como egreso en finanzas</Label>
              </div>
            )}

            {lote_seleccionado && (
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Vista Previa:</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Stock actual:</span> {lote_seleccionado.cantidad_actual} {producto_seleccionado?.unidad_medida}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Nuevo stock:</span>{' '}
                    {formulario_ajuste_lote.tipo === 'entrada'
                      ? lote_seleccionado.cantidad_actual + (parseFloat(formulario_ajuste_lote.cantidad) || 0)
                      : lote_seleccionado.cantidad_actual - (parseFloat(formulario_ajuste_lote.cantidad) || 0)
                    } {producto_seleccionado?.unidad_medida}
                  </p>
                  {formulario_ajuste_lote.tipo === 'entrada' && formulario_ajuste_lote.registrar_egreso && lote_seleccionado && (
                    <p className="text-sm text-orange-600">
                      <span className="font-medium">Costo estimado:</span> $
                      {(lote_seleccionado.costo_unitario_compra * (parseFloat(formulario_ajuste_lote.cantidad) || 0)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAjusteStockLoteAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarAjusteStockLote} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Ajustar Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_lote_abierto} onOpenChange={setDialogoConfirmarEliminarLoteAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el lote "{lote_a_eliminar?.nro_lote}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarLoteAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarLote}>
              Eliminar
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
            {producto_seleccionado?.tipo_gestion === 'activo_serializado' && !modo_edicion_activo && (
              <div className="space-y-2">
                <Label htmlFor="nro_serie">Número de Serie *</Label>
                <Input
                  id="nro_serie"
                  value={formulario_activo.nro_serie}
                  onChange={(e) => setFormularioActivo({ ...formulario_activo, nro_serie: e.target.value })}
                  placeholder="SN-001"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre_asignado">Nombre Asignado</Label>
              <Input
                id="nombre_asignado"
                value={formulario_activo.nombre_asignado}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, nombre_asignado: e.target.value })}
                placeholder="Equipo Consultorio 1"
              />
            </div>

            {!modo_edicion_activo && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costo_compra">Costo de Compra *</Label>
                    <Input
                      id="costo_compra"
                      type="number"
                      value={formulario_activo.costo_compra}
                      onChange={(e) => setFormularioActivo({ ...formulario_activo, costo_compra: e.target.value })}
                      placeholder="1500"
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formulario_activo.ubicacion}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, ubicacion: e.target.value })}
                placeholder="Consultorio 1, Almacén..."
              />
            </div>

            {!modo_edicion_activo && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="registrar_egreso_activo"
                  checked={formulario_activo.registrar_egreso}
                  onCheckedChange={(checked) => setFormularioActivo({ ...formulario_activo, registrar_egreso: checked })}
                />
                <Label htmlFor="registrar_egreso_activo">Registrar egreso en finanzas</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoActivoAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardarActivo} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_activo ? 'Guardar Cambios' : 'Agregar Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_activo_abierto} onOpenChange={setDialogoConfirmarEliminarActivoAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este activo?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarActivoAbierto(false)}>
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