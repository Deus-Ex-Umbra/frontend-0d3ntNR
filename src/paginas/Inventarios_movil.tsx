import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral_movil';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/componentes/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
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
  ArrowLeft,
  DollarSign,
  Box,
  AlertTriangle,
  UserPlus,
  Shield,
  History,
  X,
  Search,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Settings,
  ChevronRight,
  Eye
} from 'lucide-react';
import { inventarioApi, usuariosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { DatePicker } from '@/componentes/ui/date-picker';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { format } from 'date-fns';
import { ajustarFechaParaBackend, formatearFechaSoloFecha } from '@/lib/utilidades';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';

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
  resumen?: {
    valor_total: number;
    total_productos: number;
    total_consumibles: number;
    total_activos: number;
  };
}

interface Lote {
  id: number;
  nro_lote: string;
  fecha_vencimiento?: Date | null;
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
  const { usuario: usuario_actual } = useAutenticacion();
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
  const [dialogo_vender_activo_abierto, setDialogoVenderActivoAbierto] = useState(false);
  const [sheet_producto_detalle_abierto, setSheetProductoDetalleAbierto] = useState(false);
  
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_producto, setModoEdicionProducto] = useState(false);
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
    usuario_id: '',
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
    generar_movimiento_financiero: true,
    monto: '',
  });

  const [formulario_venta_activo, setFormularioVentaActivo] = useState({
    monto_venta: '',
    registrar_pago: true,
  });

  const visibilidades = [
    { valor: 'privado', etiqueta: 'Privado', icono: Lock },
    { valor: 'publico', etiqueta: 'Público', icono: Globe },
  ];

  const roles = [
    { valor: 'lector', etiqueta: 'Lector', descripcion: 'Solo puede ver' },
    { valor: 'editor', etiqueta: 'Editor', descripcion: 'Puede editar' },
  ];

  const tipos_gestion = [
    { valor: 'consumible', etiqueta: 'Consumible', descripcion: 'Material que se gasta' },
    { valor: 'activo_serializado', etiqueta: 'Activo Serializado', descripcion: 'Con número de serie' },
    { valor: 'activo_general', etiqueta: 'Activo General', descripcion: 'Sin número de serie' },
  ];

  const tipos_movimiento: { [key: string]: { etiqueta: string; color: string } } = {
    compra: { etiqueta: 'Compra', color: 'bg-green-500' },
    ajuste: { etiqueta: 'Ajuste', color: 'bg-blue-500' },
    uso_cita: { etiqueta: 'Uso en Cita', color: 'bg-purple-500' },
    uso_tratamiento: { etiqueta: 'Uso en Tratamiento', color: 'bg-orange-500' },
    devolucion: { etiqueta: 'Devolución', color: 'bg-cyan-500' },
  };

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
        description: error.response?.data?.message || 'No se pudo guardar el inventario',
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
      
      if (inventario_seleccionado?.id === inventario_a_eliminar.id) {
        setVistaActual('lista');
        setInventarioSeleccionado(null);
      }
      
      await cargarInventarios();
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el inventario',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoInvitar = () => {
    setFormularioInvitar({
      correo_busqueda: '',
      usuario_id: '',
      rol: 'lector',
    });
    setDialogoInvitarAbierto(true);
  };

  const manejarInvitarUsuario = async () => {
    if (!formulario_invitar.usuario_id || !inventario_seleccionado) {
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
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al invitar usuario:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo invitar al usuario',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminarPermiso = async (permiso_id: number) => {
    if (!inventario_seleccionado) return;

    try {
      await inventarioApi.eliminarPermiso(inventario_seleccionado.id, permiso_id);
      toast({
        title: 'Éxito',
        description: 'Permiso eliminado correctamente',
      });
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el permiso',
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
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(monto);
  };

  const formatearFecha = (fecha: Date): string => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearFechaHora = (fecha: Date): string => {
    return new Date(fecha).toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const inventarios_filtrados = inventarios.filter(cumpleFiltroInventario);

  const opciones_visibilidad: OpcionCombobox[] = visibilidades.map(v => ({
    valor: v.valor,
    etiqueta: v.etiqueta,
  }));

  const opciones_roles: OpcionCombobox[] = roles.map(r => ({
    valor: r.valor,
    etiqueta: r.etiqueta,
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

  if (vista_actual === 'detalle' && inventario_seleccionado) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={volverALista}
                className="hover:bg-primary/20 hover:scale-110 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                    {inventario_seleccionado.nombre}
                  </h1>
                  <Badge variant={inventario_seleccionado.visibilidad === 'privado' ? 'secondary' : 'default'}>
                    {inventario_seleccionado.visibilidad === 'privado' ? (
                      <><Lock className="h-3 w-3 mr-1" /> Privado</>
                    ) : (
                      <><Globe className="h-3 w-3 mr-1" /> Público</>
                    )}
                  </Badge>
                  {inventario_seleccionado.rol_usuario && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      {inventario_seleccionado.rol_usuario === 'propietario' 
                        ? 'Propietario' 
                        : inventario_seleccionado.rol_usuario === 'editor' 
                          ? 'Editor' 
                          : 'Lector'
                      }
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">
                  Gestión de productos y materiales
                </p>
              </div>

              {inventario_seleccionado.es_propietario && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => abrirDialogoEditar(inventario_seleccionado)}
                    className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => abrirDialogoConfirmarEliminar(inventario_seleccionado)}
                    className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              )}
            </div>

            {reporte_valor && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-2 border-purple-500/30 shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:scale-105 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor Consumibles
                    </CardTitle>
                    <div className="bg-purple-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Package className="h-5 w-5 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">
                      {formatearMoneda(reporte_valor.valor_consumibles)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_lotes} lotes
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor Activos
                    </CardTitle>
                    <div className="bg-blue-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Box className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">
                      {formatearMoneda(reporte_valor.valor_activos)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor Total
                    </CardTitle>
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {formatearMoneda(reporte_valor.valor_total)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {cargando_detalle ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="productos" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-11">
                  <TabsTrigger value="productos" className="text-base">
                    <Package className="h-4 w-4 mr-2" />
                    Productos
                  </TabsTrigger>
                  {inventario_seleccionado.es_propietario && (
                    <TabsTrigger value="permisos" className="text-base">
                      <Users className="h-4 w-4 mr-2" />
                      Permisos
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="movimientos" className="text-base">
                    <History className="h-4 w-4 mr-2" />
                    Historial
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="productos" className="space-y-6 mt-6">
                  <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Productos del Inventario</CardTitle>
                            <CardDescription>
                              {productos.length} productos registrados
                            </CardDescription>
                          </div>
                        </div>
                        {(inventario_seleccionado.es_propietario || inventario_seleccionado.rol_usuario === 'editor') && (
                          <Button
                            size="lg"
                            className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Nuevo Producto
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {productos.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              No hay productos registrados
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                              Comienza agregando productos para gestionar tu inventario
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {productos.map((producto) => {
                            const stock_total = obtenerStockTotal(producto);
                            const activos_disponibles = obtenerActivosDisponibles(producto);
                            const stock_bajo = producto.tipo_gestion === 'consumible' && stock_total < producto.stock_minimo;
                            
                            return (
                              <div
                                key={producto.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="bg-primary/10 p-3 rounded-lg hover:scale-110 transition-transform duration-200">
                                    <Package className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <p className="font-semibold text-foreground text-lg">
                                        {producto.nombre}
                                      </p>
                                      <Badge className={`${obtenerColorTipoGestion(producto.tipo_gestion)} text-white`}>
                                        {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                      </Badge>
                                      {stock_bajo && (
                                        <Badge variant="destructive" className="animate-pulse">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Stock Bajo
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      {producto.tipo_gestion === 'consumible' ? (
                                        <>
                                          <span>Stock: {stock_total} {producto.unidad_medida}</span>
                                          <span>Mínimo: {producto.stock_minimo}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>Total: {stock_total} unidades</span>
                                          <span>Disponibles: {activos_disponibles}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {(inventario_seleccionado.es_propietario || inventario_seleccionado.rol_usuario === 'editor') && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                        title="Editar"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {inventario_seleccionado.es_propietario && (
                  <TabsContent value="permisos" className="space-y-6 mt-6">
                    <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">Usuarios con Acceso</CardTitle>
                              <CardDescription>
                                {inventario_seleccionado.permisos?.length || 0} usuarios invitados
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            size="lg"
                            onClick={abrirDialogoInvitar}
                            className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                          >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Invitar Usuario
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!inventario_seleccionado.permisos || inventario_seleccionado.permisos.length === 0 ? (
                          <div className="text-center py-12 space-y-4">
                            <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                No hay usuarios invitados
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Invita a otros usuarios para que puedan acceder a este inventario
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {inventario_seleccionado.permisos.map((permiso) => (
                              <div
                                key={permiso.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-200"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="bg-primary/10 p-3 rounded-full">
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
                                  <Badge variant={permiso.rol === 'editor' ? 'default' : 'secondary'}>
                                    {permiso.rol === 'editor' ? 'Editor' : 'Lector'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => manejarEliminarPermiso(permiso.id)}
                                    className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                    title="Eliminar acceso"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                <TabsContent value="movimientos" className="space-y-6 mt-6">
                  <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                          <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Historial de Movimientos</CardTitle>
                          <CardDescription>
                            Últimos {movimientos.length} movimientos registrados
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {movimientos.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
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
                            <div
                              key={movimiento.id}
                              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-all duration-200"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <Badge className={`${tipos_movimiento[movimiento.tipo]?.color || 'bg-gray-500'} text-white`}>
                                  {tipos_movimiento[movimiento.tipo]?.etiqueta || movimiento.tipo}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">
                                    {movimiento.producto.nombre}
                                  </p>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span>Cantidad: {movimiento.cantidad}</span>
                                    <span>•</span>
                                    <span>Stock: {movimiento.stock_anterior} → {movimiento.stock_nuevo}</span>
                                    {movimiento.referencia && (
                                      <>
                                        <span>•</span>
                                        <span>{movimiento.referencia}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {formatearFechaHora(movimiento.fecha)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Por: {movimiento.usuario.nombre}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
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
                    placeholder="Buscar inventario por nombre..."
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
                        ? 'Intenta con otro término de búsqueda'
                        : 'Crea tu primer inventario para comenzar a gestionar productos'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {inventarios_filtrados.map((inventario) => {
                    const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                    
                    return (
                      <Card
                        key={inventario.id}
                        className="group cursor-pointer border-2 border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300"
                        onClick={() => cargarDetalleInventario(inventario)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                <Package className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
                                  {inventario.nombre}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={inventario.visibilidad === 'privado' ? 'secondary' : 'default'} className="text-xs">
                                    <IconoVisibilidad className="h-3 w-3 mr-1" />
                                    {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                                  </Badge>
                                  {inventario.rol_usuario && (
                                    <Badge variant="outline" className="text-xs">
                                      {inventario.rol_usuario === 'propietario' 
                                        ? 'Propietario' 
                                        : inventario.rol_usuario === 'editor' 
                                          ? 'Editor' 
                                          : 'Lector'
                                      }
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {inventario.propietario && (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Propietario: {inventario.propietario.nombre}
                              </p>
                              {inventario.permisos && inventario.permisos.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {inventario.permisos.length} usuario(s) con acceso
                                </p>
                              )}
                            </div>
                          )}
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
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInventarioAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardarInventario} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
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
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground">
                Nota: Por ahora, deberás ingresar el ID del usuario manualmente
              </p>
              <Input
                type="number"
                placeholder="ID del usuario"
                value={formulario_invitar.usuario_id}
                onChange={(e) => setFormularioInvitar({ ...formulario_invitar, usuario_id: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
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
                    ? '📖 Lector: Solo puede ver el inventario y sus productos'
                    : '✏️ Editor: Puede ver y modificar productos, registrar compras'
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
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarInvitarUsuario} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invitar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este inventario?
            </DialogDescription>
          </DialogHeader>
          
          {inventario_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{inventario_a_eliminar.nombre}</p>
              <Badge variant={inventario_a_eliminar.visibilidad === 'privado' ? 'secondary' : 'default'}>
                {inventario_a_eliminar.visibilidad === 'privado' ? 'Privado' : 'Público'}
              </Badge>
            </div>
          )}

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer. Se eliminará el inventario y todos sus productos.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setInventarioAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarInventario}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}