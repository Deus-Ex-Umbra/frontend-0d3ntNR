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
  TrendingUp,
  Eye,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Calendar,
  Box,
  AlertTriangle,
  UserPlus,
  Shield,
  History,
  FileText,
  BarChart3,
  Filter,
  X,
  Search,
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  TrendingDown,
  Layers,
  CircleDot
} from 'lucide-react';
import { inventarioApi, usuariosApi, finanzasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { SearchInput } from '@/componentes/ui/search-input';
import { DatePicker } from '@/componentes/ui/date-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';

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

interface Producto {
  id: number;
  nombre: string;
  tipo_gestion: 'consumible' | 'activo_serializado' | 'activo_general';
  stock_minimo: number;
  unidad_medida: string;
  activo: boolean;
  descripcion?: string;
  notificar_stock_bajo: boolean;
  lotes?: Array<{
    id: number;
    nro_lote: string;
    fecha_vencimiento: Date;
    cantidad_actual: number;
    costo_unitario_compra: number;
    fecha_compra: Date;
  }>;
  activos?: Array<{
    id: number;
    nro_serie?: string;
    nombre_asignado?: string;
    costo_compra: number;
    fecha_compra: Date;
    estado: string;
    ubicacion?: string;
  }>;
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

export default function Inventarios() {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
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
  const [dialogo_movimiento_abierto, setDialogoMovimientoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_producto_abierto, setDialogoConfirmarEliminarProductoAbierto] = useState(false);
  const [dialogo_remover_usuario_abierto, setDialogoRemoverUsuarioAbierto] = useState(false);
  const [dialogo_compra_abierto, setDialogoCompraAbierto] = useState(false);
  
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_producto, setModoEdicionProducto] = useState(false);
  const [inventario_a_eliminar, setInventarioAEliminar] = useState<Inventario | null>(null);
  const [producto_seleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [producto_a_eliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [usuario_a_remover, setUsuarioARemover] = useState<any>(null);
  
  const [busqueda_inventarios, setBusquedaInventarios] = useState('');
  const [busqueda_productos, setBusquedaProductos] = useState('');
  const [vista_actual, setVistaActual] = useState<'lista' | 'detalle'>('lista');
  const [tab_activo, setTabActivo] = useState<'productos' | 'historial' | 'usuarios'>('productos');
  const [filtro_tipo_producto, setFiltroTipoProducto] = useState<string>('todos');
  const [vista_inventario, setVistaInventario] = useState<'fisico' | 'valorado'>('fisico');

  const [formulario_inventario, setFormularioInventario] = useState({
    nombre: '',
    visibilidad: 'privado',
    descripcion: '',
    permitir_stock_negativo: false,
  });

  const [formulario_invitar, setFormularioInvitar] = useState({
    correo_busqueda: '',
    usuario_id: '',
    rol: 'lector',
  });

  const [formulario_producto, setFormularioProducto] = useState({
    nombre: '',
    tipo_gestion: 'consumible',
    stock_minimo: '0',
    unidad_medida: 'unidad',
    descripcion: '',
    notificar_stock_bajo: true,
  });

  const [formulario_lote, setFormularioLote] = useState({
    nro_lote: '',
    fecha_vencimiento: undefined as Date | undefined,
    cantidad_actual: '',
    costo_unitario_compra: '',
    fecha_compra: new Date(),
  });

  const [formulario_activo, setFormularioActivo] = useState({
    nro_serie: '',
    nombre_asignado: '',
    costo_compra: '',
    fecha_compra: new Date(),
    estado: 'disponible',
    ubicacion: '',
  });

  const [formulario_movimiento, setFormularioMovimiento] = useState({
    tipo: 'ajuste',
    cantidad: '',
    producto_id: '',
    referencia: '',
    observaciones: '',
  });

  const [formulario_compra, setFormularioCompra] = useState({
    producto_id: '',
    cantidad: '',
    costo_total: '',
    proveedor: '',
    fecha_compra: new Date(),
    nro_factura: '',
    observaciones: '',
    registrar_egreso_finanzas: true,
  });

  const visibilidades = [
    { valor: 'privado', etiqueta: 'Privado', icono: Lock },
    { valor: 'publico', etiqueta: 'Público', icono: Globe },
  ];

  const roles = [
    { valor: 'lector', etiqueta: 'Lector', descripcion: 'Solo puede ver' },
    { valor: 'editor', etiqueta: 'Editor', descripcion: 'Puede editar productos' },
    { valor: 'administrador', etiqueta: 'Administrador', descripcion: 'Control total' },
  ];

  const tipos_gestion = [
    { valor: 'consumible', etiqueta: 'Consumible', descripcion: 'Material que se gasta' },
    { valor: 'activo_serializado', etiqueta: 'Activo Serializado', descripcion: 'Con número de serie' },
    { valor: 'activo_general', etiqueta: 'Activo General', descripcion: 'Sin número de serie' },
  ];

  const estados_activo = [
    { valor: 'disponible', etiqueta: 'Disponible' },
    { valor: 'en_uso', etiqueta: 'En Uso' },
    { valor: 'en_mantenimiento', etiqueta: 'En Mantenimiento' },
    { valor: 'roto', etiqueta: 'Roto' },
  ];

  const tipos_movimiento = [
    { valor: 'compra', etiqueta: 'Compra' },
    { valor: 'ajuste', etiqueta: 'Ajuste' },
    { valor: 'uso_cita', etiqueta: 'Uso en Cita' },
    { valor: 'uso_tratamiento', etiqueta: 'Uso en Tratamiento' },
    { valor: 'devolucion', etiqueta: 'Devolución' },
  ];

  useEffect(() => {
    cargarInventarios();
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
      descripcion: '',
      permitir_stock_negativo: false,
    });
    setModoEdicion(false);
    setDialogoInventarioAbierto(true);
  };

  const abrirDialogoEditar = (inventario: Inventario) => {
    setFormularioInventario({
      nombre: inventario.nombre,
      visibilidad: inventario.visibilidad,
      descripcion: '',
      permitir_stock_negativo: false,
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
      if (modo_edicion && inventario_seleccionado) {
        await inventarioApi.actualizarInventario(inventario_seleccionado.id, formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario actualizado correctamente',
        });
      } else {
        await inventarioApi.crearInventario(formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario creado correctamente',
        });
      }
      setDialogoInventarioAbierto(false);
      await cargarInventarios();
      if (inventario_seleccionado) {
        await cargarDetalleInventario(inventario_seleccionado);
      }
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

  const confirmarEliminarInventario = (inventario: Inventario) => {
    setInventarioAEliminar(inventario);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const manejarEliminarInventario = async () => {
    if (!inventario_a_eliminar) return;

    try {
      await inventarioApi.eliminarInventario(inventario_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Inventario eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      await cargarInventarios();
      if (inventario_seleccionado?.id === inventario_a_eliminar.id) {
        volverALista();
      }
    } catch (error: any) {
      console.error('Error al eliminar inventario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el inventario',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoInvitar = (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setFormularioInvitar({
      correo_busqueda: '',
      usuario_id: '',
      rol: 'lector',
    });
    setDialogoInvitarAbierto(true);
  };

  const manejarInvitarUsuario = async () => {
    if (!inventario_seleccionado || !formulario_invitar.usuario_id) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un usuario',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.invitarUsuario(inventario_seleccionado.id, {
        usuario_id: parseInt(formulario_invitar.usuario_id),
        rol: formulario_invitar.rol,
      });
      toast({
        title: 'Éxito',
        description: 'Usuario invitado correctamente',
      });
      setDialogoInvitarAbierto(false);
      await cargarInventarios();
      if (vista_actual === 'detalle') {
        await cargarDetalleInventario(inventario_seleccionado);
      }
    } catch (error: any) {
      console.error('Error al invitar usuario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al invitar usuario',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarRemoverUsuario = (usuario: any) => {
    setUsuarioARemover(usuario);
    setDialogoRemoverUsuarioAbierto(true);
  };

  const manejarRemoverUsuario = async () => {
    if (!inventario_seleccionado || !usuario_a_remover) return;

    try {
      await inventarioApi.eliminarPermiso(inventario_seleccionado.id, usuario_a_remover.id);
      toast({
        title: 'Éxito',
        description: 'Usuario removido correctamente',
      });
      setDialogoRemoverUsuarioAbierto(false);
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
      stock_minimo: '0',
      unidad_medida: 'unidad',
      descripcion: '',
      notificar_stock_bajo: true,
    });
    setModoEdicionProducto(false);
    setProductoSeleccionado(null);
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
      if (modo_edicion_producto && producto_seleccionado) {
        await inventarioApi.actualizarProducto(inventario_seleccionado.id, producto_seleccionado.id, formulario_producto);
        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        });
      } else {
        await inventarioApi.crearProducto(inventario_seleccionado.id, formulario_producto);
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

  const confirmarEliminarProducto = (producto: Producto) => {
    setProductoAEliminar(producto);
    setDialogoConfirmarEliminarProductoAbierto(true);
  };

  const manejarEliminarProducto = async () => {
    if (!inventario_seleccionado || !producto_a_eliminar) return;

    try {
      await inventarioApi.eliminarProducto(inventario_seleccionado.id, producto_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      });
      setDialogoConfirmarEliminarProductoAbierto(false);
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

  const abrirDialogoCompra = () => {
    setFormularioCompra({
      producto_id: '',
      cantidad: '',
      costo_total: '',
      proveedor: '',
      fecha_compra: new Date(),
      nro_factura: '',
      observaciones: '',
      registrar_egreso_finanzas: true,
    });
    setDialogoCompraAbierto(true);
  };

  const manejarRegistrarCompra = async () => {
    if (!inventario_seleccionado || !formulario_compra.producto_id || !formulario_compra.cantidad || !formulario_compra.costo_total) {
      toast({
        title: 'Error',
        description: 'Debes completar todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.registrarCompra(inventario_seleccionado.id, formulario_compra);
      
      if (formulario_compra.registrar_egreso_finanzas) {
        const producto = productos.find(p => p.id === parseInt(formulario_compra.producto_id));
        await finanzasApi.registrarEgreso({
          concepto: `Compra de ${producto?.nombre || 'producto'} - ${formulario_compra.proveedor}`,
          monto: parseFloat(formulario_compra.costo_total),
          fecha: formulario_compra.fecha_compra,
          referencia: formulario_compra.nro_factura,
        });
      }

      toast({
        title: 'Éxito',
        description: 'Compra registrada correctamente',
      });
      setDialogoCompraAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al registrar compra:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al registrar la compra',
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

  const obtenerActivosDisponibles = (producto: Producto): number => {
    if (producto.tipo_gestion !== 'consumible' && producto.activos) {
      return producto.activos.filter(a => a.estado === 'disponible').length;
    }
    return 0;
  };

  const cumpleFiltroInventario = (inventario: Inventario): boolean => {
    if (!busqueda_inventarios) return true;
    
    const termino = busqueda_inventarios.toLowerCase();
    const nombre_lower = inventario.nombre.toLowerCase();
    const propietario_lower = inventario.propietario?.nombre.toLowerCase() || '';
    
    return nombre_lower.includes(termino) || propietario_lower.includes(termino);
  };

  const cumpleFiltroProducto = (producto: Producto): boolean => {
    if (filtro_tipo_producto !== 'todos' && producto.tipo_gestion !== filtro_tipo_producto) {
      return false;
    }
    
    if (!busqueda_productos) return true;
    
    const termino = busqueda_productos.toLowerCase();
    return producto.nombre.toLowerCase().includes(termino);
  };

  const inventarios_filtrados = inventarios.filter(cumpleFiltroInventario);
  const productos_filtrados = productos.filter(cumpleFiltroProducto);

  const opciones_visibilidad: OpcionCombobox[] = visibilidades.map(v => ({
    valor: v.valor,
    etiqueta: v.etiqueta,
  }));

  const opciones_roles: OpcionCombobox[] = roles.map(r => ({
    valor: r.valor,
    etiqueta: r.etiqueta,
  }));

  const opciones_tipos_gestion: OpcionCombobox[] = tipos_gestion.map(t => ({
    valor: t.valor,
    etiqueta: t.etiqueta,
  }));

  const opciones_estados_activo: OpcionCombobox[] = estados_activo.map(e => ({
    valor: e.valor,
    etiqueta: e.etiqueta,
  }));

  const opciones_productos: OpcionCombobox[] = productos.map(p => ({
    valor: p.id.toString(),
    etiqueta: p.nombre,
  }));

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando inventarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      {vista_actual === 'detalle' && inventario_seleccionado ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={volverALista}
                className="hover:bg-primary/10 hover:scale-110 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {inventario_seleccionado.nombre}
                  </h1>
                  <Badge variant={inventario_seleccionado.visibilidad === 'privado' ? 'secondary' : 'default'}>
                    {inventario_seleccionado.visibilidad === 'privado' ? 'Privado' : 'Público'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Propietario: {inventario_seleccionado.propietario?.nombre}
                </p>
              </div>
            </div>

            {reporte_valor && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <Card className="border-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      ${reporte_valor.valor_total.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Consumibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      ${reporte_valor.valor_consumibles.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_lotes} lotes
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      Activos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${reporte_valor.valor_activos.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-green-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {reporte_valor.desglose_activos_por_estado.disponible}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CircleDot className="h-4 w-4 text-blue-600" />
                      En Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {reporte_valor.desglose_activos_por_estado.en_uso}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Mantenimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {reporte_valor.desglose_activos_por_estado.en_mantenimiento}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-red-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Rotos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {reporte_valor.desglose_activos_por_estado.roto}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs value={tab_activo} onValueChange={(v) => setTabActivo(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
              </TabsList>

              <TabsContent value="productos" className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Productos del Inventario</CardTitle>
                          <CardDescription>
                            {productos_filtrados.length} de {productos.length} productos
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={abrirDialogoCompra}
                          className="hover:bg-green-500/10 hover:border-green-500"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Registrar Compra
                        </Button>
                        <Button
                          size="sm"
                          onClick={abrirDialogoNuevoProducto}
                          className="hover:shadow-lg"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Producto
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <SearchInput
                          valor={busqueda_productos}
                          onChange={setBusquedaProductos}
                          placeholder="Buscar producto..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm whitespace-nowrap">Tipo:</Label>
                        <Select value={filtro_tipo_producto} onValueChange={setFiltroTipoProducto}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtrar por tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="consumible">Consumibles</SelectItem>
                            <SelectItem value="activo_serializado">Activos Serializados</SelectItem>
                            <SelectItem value="activo_general">Activos Generales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={vista_inventario === 'fisico' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVistaInventario('fisico')}
                        >
                          <Box className="h-4 w-4 mr-1" />
                          Físico
                        </Button>
                        <Button
                          variant={vista_inventario === 'valorado' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVistaInventario('valorado')}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Valorado
                        </Button>
                      </div>
                    </div>

                    {productos_filtrados.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            {busqueda_productos ? 'No se encontraron productos' : 'No hay productos registrados'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {busqueda_productos
                              ? 'Intenta con otros términos de búsqueda'
                              : 'Comienza agregando productos a tu inventario'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {productos_filtrados.map((producto) => {
                          const stock_total = obtenerStockTotal(producto);
                          const valor_total = obtenerValorTotal(producto);
                          const stock_bajo = stock_total < producto.stock_minimo;

                          return (
                            <AccordionItem
                              key={producto.id}
                              value={`producto-${producto.id}`}
                              className="border-2 rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                    <Badge className={obtenerColorTipoGestion(producto.tipo_gestion)}>
                                      {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                    </Badge>
                                    <div className="text-left">
                                      <div className="font-semibold">{producto.nombre}</div>
                                      {producto.descripcion && (
                                        <div className="text-xs text-muted-foreground">
                                          {producto.descripcion}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    {vista_inventario === 'fisico' ? (
                                      <div className="text-right">
                                        <div className="text-sm font-medium">
                                          Stock: {stock_total} {producto.unidad_medida}
                                        </div>
                                        {stock_bajo && (
                                          <Badge variant="destructive" className="text-xs">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Stock Bajo
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-right">
                                        <div className="text-sm font-medium">
                                          Valor: ${valor_total.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {stock_total} unidades
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          abrirDialogoEditarProducto(producto);
                                        }}
                                        className="h-8 w-8"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmarEliminarProducto(producto);
                                        }}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4">
                                {producto.tipo_gestion === 'consumible' ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold">Lotes</h4>
                                      <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Lote
                                      </Button>
                                    </div>
                                    {producto.lotes && producto.lotes.length > 0 ? (
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Nro. Lote</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Costo Unit.</TableHead>
                                            <TableHead>Valor Total</TableHead>
                                            <TableHead>Vencimiento</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {producto.lotes.map((lote) => (
                                            <TableRow key={lote.id}>
                                              <TableCell className="font-medium">{lote.nro_lote}</TableCell>
                                              <TableCell>{lote.cantidad_actual}</TableCell>
                                              <TableCell>${lote.costo_unitario_compra.toFixed(2)}</TableCell>
                                              <TableCell>
                                                ${(lote.cantidad_actual * lote.costo_unitario_compra).toFixed(2)}
                                              </TableCell>
                                              <TableCell>
                                                {format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay lotes registrados
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold">Activos</h4>
                                      <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar Activo
                                      </Button>
                                    </div>
                                    {producto.activos && producto.activos.length > 0 ? (
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            {producto.tipo_gestion === 'activo_serializado' && (
                                              <TableHead>Nro. Serie</TableHead>
                                            )}
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead>Costo</TableHead>
                                            <TableHead>Fecha Compra</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {producto.activos.map((activo) => (
                                            <TableRow key={activo.id}>
                                              {producto.tipo_gestion === 'activo_serializado' && (
                                                <TableCell className="font-mono text-xs">{activo.nro_serie}</TableCell>
                                              )}
                                              <TableCell>{activo.nombre_asignado}</TableCell>
                                              <TableCell>
                                                <Badge
                                                  variant={activo.estado === 'disponible' ? 'default' : 'secondary'}
                                                >
                                                  {activo.estado}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>{activo.ubicacion || '-'}</TableCell>
                                              <TableCell>${activo.costo_compra.toFixed(2)}</TableCell>
                                              <TableCell>
                                                {format(new Date(activo.fecha_compra), 'dd/MM/yyyy', { locale: es })}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay activos registrados
                                      </p>
                                    )}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historial" className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Historial de Movimientos</CardTitle>
                        <CardDescription>
                          Registro de todas las operaciones del inventario
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {movimientos.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                          <History className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Sin movimientos</h3>
                          <p className="text-sm text-muted-foreground">
                            Los movimientos del inventario aparecerán aquí
                          </p>
                        </div>
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
                              <TableHead>Stock Anterior</TableHead>
                              <TableHead>Stock Nuevo</TableHead>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Referencia</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movimientos.map((mov) => (
                              <TableRow key={mov.id}>
                                <TableCell className="text-xs">
                                  {format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{mov.tipo}</Badge>
                                </TableCell>
                                <TableCell>{mov.producto.nombre}</TableCell>
                                <TableCell className={mov.cantidad > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                                </TableCell>
                                <TableCell>{mov.stock_anterior}</TableCell>
                                <TableCell>{mov.stock_nuevo}</TableCell>
                                <TableCell>{mov.usuario.nombre}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {mov.referencia || '-'}
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

              <TabsContent value="usuarios" className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Usuarios con Acceso</CardTitle>
                          <CardDescription>
                            Gestiona los permisos de acceso al inventario
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => abrirDialogoInvitar(inventario_seleccionado)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invitar Usuario
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            {inventario_seleccionado.propietario?.nombre}
                          </TableCell>
                          <TableCell>{inventario_seleccionado.propietario?.correo}</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500">
                              <Shield className="h-3 w-3 mr-1" />
                              Propietario
                            </Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        {inventario_seleccionado.permisos?.map((permiso) => (
                          <TableRow key={permiso.id}>
                            <TableCell className="font-medium">
                              {permiso.usuario_invitado.nombre}
                            </TableCell>
                            <TableCell>{permiso.usuario_invitado.correo}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{permiso.rol}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => confirmarRemoverUsuario(permiso)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                Inventarios
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestiona tus inventarios y productos
              </p>
            </div>

            <Button
              size="lg"
              className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
              onClick={abrirDialogoNuevo}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Inventario
            </Button>
          </div>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mis Inventarios</CardTitle>
                    <CardDescription>
                      {inventarios_filtrados.length} de {inventarios.length} inventarios
                      {busqueda_inventarios && ' (filtrados)'}
                    </CardDescription>
                  </div>
                </div>
                <div className="w-80">
                  <SearchInput
                    valor={busqueda_inventarios}
                    onChange={setBusquedaInventarios}
                    placeholder="Buscar inventario..."
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inventarios_filtrados.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {busqueda_inventarios 
                        ? 'No se encontraron inventarios'
                        : 'No tienes inventarios registrados'
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {busqueda_inventarios
                        ? 'Intenta con otros términos de búsqueda'
                        : 'Comienza creando tu primer inventario para gestionar productos'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {inventarios_filtrados.map((inventario) => {
                    const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                    
                    return (
                      <div
                        key={inventario.id}
                        className="border-2 border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 flex items-center gap-4 cursor-pointer"
                            onClick={() => {
                              setInventarioSeleccionado(inventario);
                              cargarDetalleInventario(inventario);
                            }}
                          >
                            <div className="bg-primary/10 p-3 rounded-lg group-hover:scale-110 transition-transform duration-200">
                              <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {inventario.nombre}
                                </h3>
                                <Badge variant={inventario.visibilidad === 'privado' ? 'secondary' : 'default'}>
                                  <IconoVisibilidad className="h-3 w-3 mr-1" />
                                  {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                                </Badge>
                                {inventario.es_propietario && (
                                  <Badge className="bg-amber-500">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Propietario
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Propietario: {inventario.propietario?.nombre}
                              </p>
                              {inventario.permisos && inventario.permisos.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {inventario.permisos.length} usuario{inventario.permisos.length > 1 ? 's' : ''} con acceso
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {inventario.es_propietario && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirDialogoInvitar(inventario)}
                                  className="hover:bg-blue-500/10 hover:scale-110 transition-all"
                                  title="Invitar usuarios"
                                >
                                  <UserPlus className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => abrirDialogoEditar(inventario)}
                                  className="hover:bg-primary/10 hover:scale-110 transition-all"
                                  title="Editar inventario"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => confirmarEliminarInventario(inventario)}
                                  className="hover:bg-destructive/10 hover:scale-110 transition-all text-destructive"
                                  title="Eliminar inventario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogos compartidos entre ambas vistas */}
      <Dialog open={dialogo_inventario_abierto} onOpenChange={setDialogoInventarioAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Inventario' : 'Nuevo Inventario'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion 
                ? 'Modifica la información del inventario'
                : 'Crea un nuevo inventario para gestionar productos'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Inventario *</Label>
              <Input
                id="nombre"
                value={formulario_inventario.nombre}
                onChange={(e) => setFormularioInventario({ ...formulario_inventario, nombre: e.target.value })}
                placeholder="Ej: Inventario Principal, Materiales Dentales"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                value={formulario_inventario.descripcion}
                onChange={(e) => setFormularioInventario({ ...formulario_inventario, descripcion: e.target.value })}
                placeholder="Describe el propósito del inventario..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibilidad">Visibilidad</Label>
              <Combobox
                opciones={opciones_visibilidad}
                valor={formulario_inventario.visibilidad}
                onChange={(valor) => setFormularioInventario({ ...formulario_inventario, visibilidad: valor })}
                placeholder="Selecciona visibilidad"
              />
              <p className="text-xs text-muted-foreground">
                {formulario_inventario.visibilidad === 'privado' 
                  ? 'Solo tú y los usuarios invitados pueden ver este inventario'
                  : 'Este inventario será visible para todos los usuarios'
                }
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="permitir_stock_negativo">Permitir Stock Negativo</Label>
                <p className="text-xs text-muted-foreground">
                  Permite registrar ventas o usos aunque no haya stock suficiente
                </p>
              </div>
              <Switch
                id="permitir_stock_negativo"
                checked={formulario_inventario.permitir_stock_negativo}
                onCheckedChange={(checked) => 
                  setFormularioInventario({ ...formulario_inventario, permitir_stock_negativo: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInventarioAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardarInventario} 
              disabled={guardando}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el inventario <strong>{inventario_a_eliminar?.nombre}</strong>?
              Esta acción no se puede deshacer y eliminará todos los productos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminarInventario}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_invitar_abierto} onOpenChange={setDialogoInvitarAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitar Usuario al Inventario</DialogTitle>
            <DialogDescription>
              Comparte el acceso a tu inventario con otros usuarios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario *</Label>
              <Input
                id="usuario"
                placeholder="Buscar por correo o nombre..."
                value={formulario_invitar.correo_busqueda}
                onChange={(e) => setFormularioInvitar({ ...formulario_invitar, correo_busqueda: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Por ahora, deberás ingresar el ID del usuario manualmente
              </p>
              <Input
                type="number"
                placeholder="ID del usuario"
                value={formulario_invitar.usuario_id}
                onChange={(e) => setFormularioInvitar({ ...formulario_invitar, usuario_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Combobox
                opciones={opciones_roles}
                valor={formulario_invitar.rol}
                onChange={(valor) => setFormularioInvitar({ ...formulario_invitar, rol: valor })}
                placeholder="Selecciona un rol"
              />
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {formulario_invitar.rol === 'lector' 
                    ? 'Solo puede visualizar el inventario'
                    : formulario_invitar.rol === 'editor'
                    ? 'Puede agregar, editar y eliminar productos'
                    : 'Tiene control total sobre el inventario'
                  }
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInvitarAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarInvitarUsuario} 
              disabled={guardando}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invitar
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
                : 'Agrega un nuevo producto al inventario'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
              <Input
                id="nombre_producto"
                value={formulario_producto.nombre}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                placeholder="Ej: Resina Compuesta, Guantes de Látex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion_producto">Descripción (opcional)</Label>
              <Textarea
                id="descripcion_producto"
                value={formulario_producto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                placeholder="Detalles adicionales del producto..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_gestion">Tipo de Gestión *</Label>
                <Combobox
                  opciones={opciones_tipos_gestion}
                  valor={formulario_producto.tipo_gestion}
                  onChange={(valor) => setFormularioProducto({ ...formulario_producto, tipo_gestion: valor })}
                  placeholder="Selecciona tipo"
                />
                <p className="text-xs text-muted-foreground">
                  {formulario_producto.tipo_gestion === 'consumible'
                    ? 'Material que se consume con el uso'
                    : formulario_producto.tipo_gestion === 'activo_serializado'
                    ? 'Activo con número de serie único'
                    : 'Activo sin número de serie'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                <Input
                  id="unidad_medida"
                  value={formulario_producto.unidad_medida}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value })}
                  placeholder="Ej: unidad, ml, kg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={formulario_producto.stock_minimo}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, stock_minimo: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Se te notificará cuando el stock esté por debajo de este valor
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="notificar_stock_bajo">Notificar Stock Bajo</Label>
                <p className="text-xs text-muted-foreground">
                  Recibe alertas cuando el stock sea menor al mínimo
                </p>
              </div>
              <Switch
                id="notificar_stock_bajo"
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
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardarProducto} 
              disabled={guardando}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_producto ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_producto_abierto} onOpenChange={setDialogoConfirmarEliminarProductoAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto <strong>{producto_a_eliminar?.nombre}</strong>?
              Esta acción eliminará todos los lotes/activos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarEliminarProductoAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminarProducto}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_remover_usuario_abierto} onOpenChange={setDialogoRemoverUsuarioAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remover Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas remover a <strong>{usuario_a_remover?.usuario_invitado?.nombre}</strong> del inventario?
              Perderá el acceso inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoRemoverUsuarioAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarRemoverUsuario}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_compra_abierto} onOpenChange={setDialogoCompraAbierto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Compra</DialogTitle>
            <DialogDescription>
              Registra una compra de productos para el inventario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="producto_compra">Producto *</Label>
              <Combobox
                opciones={opciones_productos}
                valor={formulario_compra.producto_id}
                onChange={(valor) => setFormularioCompra({ ...formulario_compra, producto_id: valor })}
                placeholder="Selecciona un producto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad_compra">Cantidad *</Label>
                <Input
                  id="cantidad_compra"
                  type="number"
                  value={formulario_compra.cantidad}
                  onChange={(e) => setFormularioCompra({ ...formulario_compra, cantidad: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_total">Costo Total *</Label>
                <Input
                  id="costo_total"
                  type="number"
                  step="0.01"
                  value={formulario_compra.costo_total}
                  onChange={(e) => setFormularioCompra({ ...formulario_compra, costo_total: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  value={formulario_compra.proveedor}
                  onChange={(e) => setFormularioCompra({ ...formulario_compra, proveedor: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nro_factura">Nro. Factura</Label>
                <Input
                  id="nro_factura"
                  value={formulario_compra.nro_factura}
                  onChange={(e) => setFormularioCompra({ ...formulario_compra, nro_factura: e.target.value })}
                  placeholder="F001-00001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_compra">Fecha de Compra</Label>
              <DatePicker
                fecha={formulario_compra.fecha_compra}
                onChange={(fecha) => setFormularioCompra({ ...formulario_compra, fecha_compra: fecha || new Date() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones_compra">Observaciones</Label>
              <Textarea
                id="observaciones_compra"
                value={formulario_compra.observaciones}
                onChange={(e) => setFormularioCompra({ ...formulario_compra, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre la compra..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-500/5">
              <div className="space-y-0.5">
                <Label htmlFor="registrar_egreso">Registrar en Finanzas</Label>
                <p className="text-xs text-muted-foreground">
                  Crea automáticamente un registro de egreso en el módulo de finanzas
                </p>
              </div>
              <Switch
                id="registrar_egreso"
                checked={formulario_compra.registrar_egreso_finanzas}
                onCheckedChange={(checked) => 
                  setFormularioCompra({ ...formulario_compra, registrar_egreso_finanzas: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoCompraAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarRegistrarCompra} 
              disabled={guardando}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}