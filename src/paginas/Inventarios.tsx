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
import { inventarioApi, usuariosApi } from '@/lib/api';
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
  const [dialogo_confirmar_eliminar_producto_abierto, setDialogoConfirmarEliminarProductoAbierto] = useState(false);
  const [dialogo_remover_usuario_abierto, setDialogoRemoverUsuarioAbierto] = useState(false);
  
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

  const [formulario_inventario, setFormularioInventario] = useState({
    nombre: '',
    visibilidad: 'privado',
    descripcion: '',
    permitir_stock_negativo: false,
  });

  const [formulario_invitar, setFormularioInvitar] = useState({
    usuarios_ids: [] as number[],
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

  const [formulario_compra, setFormularioCompra] = useState({
    producto_id: '',
    cantidad: '',
    costo_total: '',
    proveedor: '',
    fecha_compra: new Date(),
    nro_factura: '',
    observaciones: '',
    registrar_egreso_finanzas: true,
    nro_lote: '',
    fecha_vencimiento: '',
    nro_serie: '',
    nombre_asignado: '',
  });

  const visibilidades = [
    { valor: 'privado', etiqueta: 'Privado' },
    { valor: 'publico', etiqueta: 'Público' },
  ];

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
      const promesas = formulario_invitar.usuarios_ids.map(usuario_id =>
        inventarioApi.invitarUsuario(inventario_seleccionado.id, {
          usuario_id,
          rol: formulario_invitar.rol
        })
      );

      await Promise.all(promesas);

      toast({
        title: 'Éxito',
        description: `${formulario_invitar.usuarios_ids.length} usuario(s) invitado(s) correctamente`,
      });
      
      setDialogoInvitarAbierto(false);
      setFormularioInvitar({ usuarios_ids: [], rol: 'lector' });
      await cargarDetalleInventario(inventario_seleccionado);
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
        unidad_medida: formulario_producto.unidad_medida || undefined,
        descripcion: formulario_producto.descripcion || undefined,
        notificar_stock_bajo: formulario_producto.notificar_stock_bajo,
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
      const datos_compra = {
        producto_id: parseInt(formulario_compra.producto_id),
        cantidad: parseFloat(formulario_compra.cantidad),
        costo_total: parseFloat(formulario_compra.costo_total),
        fecha_compra: format(formulario_compra.fecha_compra, 'yyyy-MM-dd'),
        generar_egreso: formulario_compra.registrar_egreso_finanzas,
        nro_lote: formulario_compra.nro_lote || undefined,
        fecha_vencimiento: formulario_compra.fecha_vencimiento || undefined,
        nro_serie: formulario_compra.nro_serie || undefined,
        nombre_asignado: formulario_compra.nombre_asignado || undefined,
      };

      await inventarioApi.registrarCompra(inventario_seleccionado.id, datos_compra);

      toast({
        title: 'Éxito',
        description: formulario_compra.registrar_egreso_finanzas
          ? 'Compra registrada y egreso creado en finanzas'
          : 'Compra registrada correctamente',
      });
      
      setFormularioCompra({
        producto_id: '',
        cantidad: '',
        costo_total: '',
        proveedor: '',
        fecha_compra: new Date(),
        nro_factura: '',
        observaciones: '',
        registrar_egreso_finanzas: true,
        nro_lote: '',
        fecha_vencimiento: '',
        nro_serie: '',
        nombre_asignado: '',
      });
      
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
                <p className="text-muted-foreground mt-1">
                  Propietario: {inventario_seleccionado.propietario?.nombre || 'Desconocido'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inventario_seleccionado.es_propietario && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirDialogoEditar(inventario_seleccionado)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={abrirDialogoInvitar}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invitar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {reporte_valor && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Reporte de Valor</CardTitle>
                      <CardDescription>Resumen financiero del inventario</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Consumibles</span>
                          <Layers className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          ${reporte_valor.valor_consumibles.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reporte_valor.cantidad_lotes} lotes
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 rounded-lg border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Activos</span>
                          <Box className="h-4 w-4 text-cyan-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          ${reporte_valor.valor_activos.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reporte_valor.cantidad_activos} activos
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Valor Total</span>
                          <DollarSign className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          ${reporte_valor.valor_total.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Inventario completo
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Desglose de Activos por Estado</h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-secondary/30 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-medium">Disponible</span>
                          </div>
                          <p className="text-xl font-bold">{reporte_valor.desglose_activos_por_estado.disponible}</p>
                        </div>

                        <div className="bg-secondary/30 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-medium">En Uso</span>
                          </div>
                          <p className="text-xl font-bold">{reporte_valor.desglose_activos_por_estado.en_uso}</p>
                        </div>

                        <div className="bg-secondary/30 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="text-xs font-medium">Mantenimiento</span>
                          </div>
                          <p className="text-xl font-bold">{reporte_valor.desglose_activos_por_estado.en_mantenimiento}</p>
                        </div>

                        <div className="bg-secondary/30 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs font-medium">Roto</span>
                          </div>
                          <p className="text-xl font-bold">{reporte_valor.desglose_activos_por_estado.roto}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                      <Button
                        size="sm"
                        onClick={abrirDialogoNuevoProducto}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <SearchInput
                          valor={busqueda_productos}
                          onChange={setBusquedaProductos}
                          placeholder="Buscar productos..."
                        />
                      </div>
                      <Select value={filtro_tipo_producto} onValueChange={setFiltroTipoProducto}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los tipos</SelectItem>
                          <SelectItem value="consumible">Consumibles</SelectItem>
                          <SelectItem value="activo_serializado">Activos Serializados</SelectItem>
                          <SelectItem value="activo_general">Activos Generales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="compra" className="border rounded-lg">
                        <AccordionTrigger className="px-4 hover:no-underline hover:bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">Registrar Compra</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="producto_compra">Producto *</Label>
                              <Combobox
                                opciones={opciones_productos}
                                valor={formulario_compra.producto_id}
                                onChange={(valor) => setFormularioCompra({ ...formulario_compra, producto_id: valor })}
                                placeholder="Selecciona un producto"
                              />
                            </div>

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

                            <div className="space-y-2">
                              <Label htmlFor="fecha_compra">Fecha de Compra</Label>
                              <DatePicker
                                valor={formulario_compra.fecha_compra}
                                onChange={(fecha) => setFormularioCompra({ ...formulario_compra, fecha_compra: fecha || new Date() })}
                              />
                            </div>

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
                                placeholder="Opcional"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="observaciones_compra">Observaciones</Label>
                            <Textarea
                              id="observaciones_compra"
                              value={formulario_compra.observaciones}
                              onChange={(e) => setFormularioCompra({ ...formulario_compra, observaciones: e.target.value })}
                              placeholder="Notas adicionales..."
                              rows={2}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="registrar_egreso"
                              checked={formulario_compra.registrar_egreso_finanzas}
                              onCheckedChange={(checked) =>
                                setFormularioCompra({ ...formulario_compra, registrar_egreso_finanzas: checked })
                              }
                            />
                            <Label htmlFor="registrar_egreso" className="cursor-pointer">
                              Registrar egreso en finanzas
                            </Label>
                          </div>

                          <Button
                            onClick={manejarRegistrarCompra}
                            disabled={guardando}
                            className="w-full"
                          >
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Compra
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {productos_filtrados.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay productos registrados</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {productos_filtrados.map((producto) => {
                            const stock_total = obtenerStockTotal(producto);
                            const stock_bajo = producto.notificar_stock_bajo && stock_total <= producto.stock_minimo;

                            return (
                              <Card key={producto.id} className={`border hover:shadow-md transition-all duration-200 ${stock_bajo ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-lg">{producto.nombre}</h3>
                                        <Badge className={obtenerColorTipoGestion(producto.tipo_gestion)}>
                                          {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                        </Badge>
                                        {stock_bajo && (
                                          <Badge variant="destructive" className="flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Stock Bajo
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Stock Actual</p>
                                          <p className="font-semibold">{stock_total}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Stock Mínimo</p>
                                          <p className="font-semibold">{producto.stock_minimo}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Valor Total</p>
                                          <p className="font-semibold">${obtenerValorTotal(producto).toFixed(2)}</p>
                                        </div>
                                        {producto.tipo_gestion !== 'consumible' && (
                                          <div>
                                            <p className="text-muted-foreground">Disponibles</p>
                                            <p className="font-semibold">{obtenerActivosDisponibles(producto)}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoEditarProducto(producto)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
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
                        <CardDescription>{movimientos.length} movimientos registrados</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {movimientos.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movimientos.map((movimiento) => (
                              <TableRow key={movimiento.id}>
                                <TableCell>
                                  {format(new Date(movimiento.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                                </TableCell>
                                <TableCell className="font-medium">{movimiento.producto.nombre}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{movimiento.tipo}</Badge>
                                </TableCell>
                                <TableCell>{movimiento.cantidad}</TableCell>
                                <TableCell>{movimiento.usuario.nombre}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {movimiento.observaciones || '-'}
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
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Usuarios con Acceso</CardTitle>
                        <CardDescription>
                          {inventario_seleccionado.permisos?.length || 0} usuarios invitados
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!inventario_seleccionado.permisos || inventario_seleccionado.permisos.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay usuarios invitados</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
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
                            {inventario_seleccionado.permisos.map((permiso) => (
                              <TableRow key={permiso.id}>
                                <TableCell className="font-medium">
                                  {permiso.usuario_invitado.nombre}
                                </TableCell>
                                <TableCell>{permiso.usuario_invitado.correo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{permiso.rol}</Badge>
                                </TableCell>
                                <TableCell>
                                  {inventario_seleccionado.es_propietario && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDialogoRemoverUsuario(permiso)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
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
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    Inventarios
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Gestiona tus inventarios, productos y materiales
                  </p>
                </div>
                <Button onClick={abrirDialogoNuevo}>
                  <Plus className="h-5 w-5 mr-2" />
                  Nuevo Inventario
                </Button>
              </div>

              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Mis Inventarios</CardTitle>
                        <CardDescription>
                          {inventarios_filtrados.length} de {inventarios.length} inventarios
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SearchInput
                    valor={busqueda_inventarios}
                    onChange={setBusquedaInventarios}
                    placeholder="Buscar inventarios..."
                  />

                  {inventarios_filtrados.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">
                        No hay inventarios disponibles
                      </p>
                      <p className="text-muted-foreground mb-6">
                        Crea tu primer inventario para comenzar
                      </p>
                      <Button onClick={abrirDialogoNuevo}>
                        <Plus className="h-5 w-5 mr-2" />
                        Crear Inventario
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inventarios_filtrados.map((inventario) => {
                        const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                        
                        return (
                          <Card
                            key={inventario.id}
                            className="border hover:shadow-lg transition-all duration-200 cursor-pointer group"
                            onClick={() => cargarDetalleInventario(inventario)}
                          >
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                      {inventario.nombre}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {inventario.propietario?.nombre || 'Sin propietario'}
                                    </p>
                                  </div>
                                  <IconoVisibilidad className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={inventario.visibilidad === 'privado' ? 'secondary' : 'default'}>
                                      {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                                    </Badge>
                                    {inventario.es_propietario && (
                                      <Badge variant="outline">Propietario</Badge>
                                    )}
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
              <Label htmlFor="visibilidad">Visibilidad *</Label>
              <Combobox
                opciones={opciones_visibilidad}
                valor={formulario_inventario.visibilidad}
                onChange={(valor) => setFormularioInventario({ ...formulario_inventario, visibilidad: valor })}
                placeholder="Selecciona la visibilidad"
              />
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
              {modo_edicion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el inventario "{inventario_a_eliminar?.nombre}"? Esta acción no se puede deshacer.
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
              Agrega usuarios al inventario "{inventario_seleccionado?.nombre}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuarios Invitados</Label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-md">
                {formulario_invitar.usuarios_ids.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No hay usuarios seleccionados</span>
                ) : (
                  formulario_invitar.usuarios_ids.map((usuario_id) => {
                    const usuario = usuarios.find(u => u.id === usuario_id);
                    return usuario ? (
                      <Badge
                        key={usuario_id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 hover:text-destructive transition-all duration-200"
                        onClick={() => {
                          setFormularioInvitar({
                            ...formulario_invitar,
                            usuarios_ids: formulario_invitar.usuarios_ids.filter(id => id !== usuario_id)
                          });
                        }}
                      >
                        {usuario.correo} ×
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
              <Combobox
                opciones={usuarios
                  .filter(u => !formulario_invitar.usuarios_ids.includes(u.id))
                  .map(u => ({
                    valor: u.id.toString(),
                    etiqueta: u.correo
                  }))}
                valor=""
                onChange={(valor) => {
                  if (valor) {
                    setFormularioInvitar({
                      ...formulario_invitar,
                      usuarios_ids: [...formulario_invitar.usuarios_ids, parseInt(valor)]
                    });
                  }
                }}
                placeholder="Seleccionar usuario por correo"
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
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInvitarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarInvitarUsuarios}
              disabled={guardando || formulario_invitar.usuarios_ids.length === 0}
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_remover_usuario_abierto} onOpenChange={setDialogoRemoverUsuarioAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas remover a {usuario_a_remover?.usuario_invitado?.nombre} del inventario?
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
              <Label htmlFor="nombre_producto">Nombre *</Label>
              <Input
                id="nombre_producto"
                value={formulario_producto.nombre}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                placeholder="Ej: Guantes de látex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_gestion">Tipo de Gestión *</Label>
              <Combobox
                opciones={opciones_tipos_gestion}
                valor={formulario_producto.tipo_gestion}
                onChange={(valor) => setFormularioProducto({ ...formulario_producto, tipo_gestion: valor })}
                placeholder="Selecciona el tipo"
              />
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
                  placeholder="Ej: unidades, cajas, kg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion_producto">Descripción</Label>
              <Textarea
                id="descripcion_producto"
                value={formulario_producto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                placeholder="Descripción opcional del producto"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notificar_stock"
                checked={formulario_producto.notificar_stock_bajo}
                onCheckedChange={(checked) =>
                  setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })
                }
              />
              <Label htmlFor="notificar_stock" className="cursor-pointer">
                Notificar cuando el stock esté bajo
              </Label>
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
              {modo_edicion_producto ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_producto_abierto} onOpenChange={setDialogoConfirmarEliminarProductoAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{producto_a_eliminar?.nombre}"? Esta acción no se puede deshacer.
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

      <Toaster />
    </div>
  );
}