import { useState, useEffect } from 'react';
import { MenuLateralMovil } from '@/componentes/MenuLateral_movil';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/componentes/ui/sheet';
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
import { 
  UsuarioInventario as Usuario, 
  Inventario, 
  Producto, 
  Lote, 
  Activo, 
  ReporteValor, 
  MovimientoInventario 
} from '@/tipos';

export default function InventariosMovil() {
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

  const estaVencido = (fecha_vencimiento: Date | null | undefined): boolean => {
    if (!fecha_vencimiento) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha_venc = new Date(fecha_vencimiento);
    fecha_venc.setHours(0, 0, 0, 0);
    return fecha_venc < hoy;
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarInventarios();
      await cargarUsuarios();
      const inventario_id_guardado = localStorage.getItem('inventario_seleccionado_id');
      if (inventario_id_guardado) {
        try {
          const inventario = await inventarioApi.obtenerInventarioPorId(parseInt(inventario_id_guardado));
          await verDetalleInventario(inventario);
        } catch (error) {
          console.log('No se pudo restaurar el inventario guardado:', error);
          localStorage.removeItem('inventario_seleccionado_id');
        }
      }
    };
    
    cargarInicial();
  }, []);

  const cargarInventarios = async () => {
    try {
      setCargando(true);
      const respuesta = await inventarioApi.obtenerInventarios();
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
      
      const [inventario_actualizado, productos_respuesta, reporte_respuesta, movimientos_respuesta] = await Promise.all([
        inventarioApi.obtenerInventarioPorId(inventario.id),
        inventarioApi.obtenerProductos(inventario.id),
        inventarioApi.obtenerReporteValor(inventario.id),
        inventarioApi.obtenerHistorialMovimientos(inventario.id),
      ]);

      setInventarioSeleccionado(inventario_actualizado);
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
        if (formulario_inventario.visibilidad === 'privado' && inventario_seleccionado.visibilidad === 'publico') {
          if (inventario_seleccionado.permisos && inventario_seleccionado.permisos.length > 0) {
            await Promise.all(
              inventario_seleccionado.permisos.map(permiso =>
                inventarioApi.eliminarPermiso(inventario_seleccionado.id, permiso.id)
              )
            );
          }
        }
        
        await inventarioApi.actualizarInventario(inventario_seleccionado.id, formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario actualizado correctamente',
        });
        
        await cargarInventarios();
        
        if (vista_actual === 'detalle') {
          const inventario_actualizado = await inventarioApi.obtenerInventarioPorId(inventario_seleccionado.id);
          setInventarioSeleccionado(inventario_actualizado);
        }
      } else {
        await inventarioApi.crearInventario(formulario_inventario);
        toast({
          title: 'Éxito',
          description: 'Inventario creado correctamente',
        });
        await cargarInventarios();
      }
      
      setDialogoInventarioAbierto(false);
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

  const verDetalleInventario = async (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setVistaActual('detalle');
    localStorage.setItem('inventario_seleccionado_id', inventario.id.toString());
    await cargarDetalleInventario(inventario);
  };

  const abrirDialogoInvitar = () => {
    setFormularioInvitar({
      usuario_id: '',
      rol: 'lector',
    });
    setDialogoInvitarAbierto(true);
  };

  const manejarInvitarUsuario = async () => {
    if (!inventario_seleccionado) return;

    if (!formulario_invitar.usuario_id) {
      toast({
        title: 'Error',
        description: 'Selecciona un usuario',
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
      const inventario_actualizado = await inventarioApi.obtenerInventarioPorId(inventario_seleccionado.id);
      setInventarioSeleccionado(inventario_actualizado);
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
      
      await cargarInventarios();
      const inventario_actualizado = await inventarioApi.obtenerInventarioPorId(inventario_seleccionado.id);
      setInventarioSeleccionado(inventario_actualizado);
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
      stock_minimo: (producto.stock_minimo ?? 0).toString(),
      unidad_medida: producto.unidad_medida ?? '',
      descripcion: producto.descripcion || '',
      notificar_stock_bajo: producto.notificar_stock_bajo ?? false,
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
        stock_minimo: formulario_producto.tipo_gestion === 'consumible' 
          ? parseInt(formulario_producto.stock_minimo) 
          : 0,
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
    setDialogoLoteAbierto(true);
  };

  const manejarGuardarLote = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_lote.nro_lote || !formulario_lote.cantidad || !formulario_lote.costo_total) {
      toast({
        title: 'Error',
        description: 'Los campos Nro de Lote, Cantidad y Costo Total son obligatorios',
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
        fecha_compra: formatearFechaSoloFecha(ajustarFechaParaBackend(formulario_lote.fecha_compra)),
        nro_lote: formulario_lote.nro_lote,
        fecha_vencimiento: formulario_lote.fecha_vencimiento 
          ? format(formulario_lote.fecha_vencimiento, 'yyyy-MM-dd')
          : undefined,
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
    const costo_estimado = Number(lote.costo_unitario_compra || 0);
    setFormularioAjusteLote({
      tipo: 'entrada',
      cantidad: '1',
      generar_movimiento_financiero: true,
      monto: costo_estimado.toFixed(2),
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
      const monto = parseFloat(formulario_ajuste_lote.monto || '0');
      
      await inventarioApi.ajustarStock(inventario_seleccionado.id, {
        producto_id: producto_seleccionado.id,
        tipo: formulario_ajuste_lote.tipo,
        cantidad: cantidad,
        observaciones: `Ajuste ${formulario_ajuste_lote.tipo} manual`,
        generar_movimiento_financiero: formulario_ajuste_lote.generar_movimiento_financiero,
        monto: monto,
      });

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
      costo_compra: (activo.costo_compra ?? 0).toString(),
      fecha_compra: activo.fecha_compra ? new Date(activo.fecha_compra) : new Date(),
      estado: activo.estado,
      ubicacion: activo.ubicacion || '',
      registrar_egreso: false,
    });
    setModoEdicionActivo(true);
    setDialogoActivoAbierto(true);
  };

  const manejarGuardarActivo = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_activo.costo_compra) {
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
            nro_serie: formulario_activo.nro_serie || undefined,
            nombre_asignado: formulario_activo.nombre_asignado || undefined,
            estado: formulario_activo.estado,
            ubicacion: formulario_activo.ubicacion || undefined,
          }
        );
        toast({
          title: 'Éxito',
          description: 'Activo actualizado correctamente',
        });
      } else {
        const datos_compra = {
          producto_id: producto_seleccionado.id,
          cantidad: 1,
          costo_total: parseFloat(formulario_activo.costo_compra),
          fecha_compra: formatearFechaSoloFecha(ajustarFechaParaBackend(formulario_activo.fecha_compra)),
          nro_serie: formulario_activo.nro_serie || undefined,
          nombre_asignado: formulario_activo.nombre_asignado || undefined,
          generar_egreso: formulario_activo.registrar_egreso,
        };

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

  const manejarCambioEstadoActivo = async (_producto: Producto, activo: Activo, nuevo_estado: string) => {
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

  const abrirDialogoVenderActivo = (activo: Activo) => {
    setActivoSeleccionado(activo);
    const precio_sugerido = (Number(activo.costo_compra) * 0.7).toFixed(2);
    setFormularioVentaActivo({
      monto_venta: precio_sugerido,
      registrar_pago: true,
    });
    setDialogoVenderActivoAbierto(true);
  };

  const manejarVenderActivo = async () => {
    if (!inventario_seleccionado || !activo_seleccionado) return;

    if (!formulario_venta_activo.monto_venta) {
      toast({
        title: 'Error',
        description: 'El monto de venta es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    const monto = parseFloat(formulario_venta_activo.monto_venta);
    if (monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await inventarioApi.venderActivo(inventario_seleccionado.id, activo_seleccionado.id, {
        monto_venta: monto,
        registrar_pago: formulario_venta_activo.registrar_pago,
      });

      toast({
        title: 'Éxito',
        description: 'Activo vendido correctamente',
      });

      setDialogoVenderActivoAbierto(false);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al vender activo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al vender el activo',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const verDetalleProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setSheetProductoDetalleAbierto(true);
  };

  const volverALista = () => {
    setVistaActual('lista');
    setInventarioSeleccionado(null);
    setProductos([]);
    setReporteValor(null);
    setMovimientos([]);
    setTabActivo('productos');
    localStorage.removeItem('inventario_seleccionado_id');
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

  const usuarios_disponibles_para_invitar = usuarios.filter(u => {
    if (usuario_actual && u.id === usuario_actual.id) return false;
    
    if (inventario_seleccionado?.permisos) {
      const ya_invitado = inventario_seleccionado.permisos.some(
        permiso => permiso.usuario_invitado.id === u.id
      );
      if (ya_invitado) return false;
    }
    
    return true;
  });

  const opciones_usuarios: OpcionCombobox[] = usuarios_disponibles_para_invitar.map(u => ({
    valor: u.id.toString(),
    etiqueta: `${u.nombre} (${u.correo})`
  }));

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm md:text-base text-muted-foreground">Cargando inventarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MenuLateralMovil />
      <Toaster />
      
      {vista_actual === 'lista' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-foreground">Inventarios</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Gestiona tus inventarios</p>
                </div>
              </div>
              <Button
                onClick={abrirDialogoNuevoInventario}
                size="sm"
                className="hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Nuevo</span>
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar inventarios..."
                value={busqueda_inventarios}
                onChange={(e) => setBusquedaInventarios(e.target.value)}
                className="pl-8 md:pl-10 text-sm md:text-base"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 md:p-6">
            {inventarios_filtrados.length === 0 ? (
              <div className="text-center py-8 md:py-12 space-y-4">
                <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base md:text-lg font-semibold text-foreground">
                    {busqueda_inventarios ? 'No se encontraron inventarios' : 'No hay inventarios'}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
                    {busqueda_inventarios 
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza creando tu primer inventario'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {inventarios_filtrados.map((inventario) => {
                  const IconoVisibilidad = obtenerIconoVisibilidad(inventario.visibilidad);
                  
                  return (
                    <Card 
                      key={inventario.id} 
                      className="hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer"
                      onClick={() => verDetalleInventario(inventario)}
                    >
                      <CardHeader className="p-3 md:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-3 flex-1">
                            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                              <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm md:text-lg flex items-center gap-2 flex-wrap">
                                <span className="truncate">{inventario.nombre}</span>
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                  <IconoVisibilidad className="h-2 w-2 md:h-3 md:w-3" />
                                  {inventario.visibilidad === 'privado' ? 'Privado' : 'Público'}
                                </Badge>
                              </CardTitle>
                              {inventario.propietario && (
                                <CardDescription className="flex items-center gap-1 mt-1 text-xs md:text-sm">
                                  <Users className="h-2 w-2 md:h-3 md:w-3" />
                                  <span className="truncate">Propietario: {inventario.propietario.nombre}</span>
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {inventario.es_propietario && (
                            <div className="flex gap-1 md:gap-2 ml-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirDialogoEditarInventario(inventario);
                                }}
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirDialogoConfirmarEliminar(inventario);
                                }}
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:p-6 pt-0">
                        <div className="space-y-3">
                          {inventario.resumen && (
                            <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                              <div className="group p-1.5 md:p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <DollarSign className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Valor</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-foreground">
                                  ${inventario.resumen.valor_total.toFixed(2)}
                                </span>
                              </div>

                              <div className="group p-1.5 md:p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Package className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Prods</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_productos}
                                </span>
                              </div>

                              <div className="group p-1.5 md:p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Box className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Cons</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_consumibles}
                                </span>
                              </div>

                              <div className="group p-1.5 md:p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Settings className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Act</span>
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_activos}
                                </span>
                              </div>
                            </div>
                          )}
                          {inventario.permisos && inventario.permisos.length > 0 && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pt-2 border-t">
                              <Users className="h-3 w-3 md:h-4 md:w-4" />
                              <span>{inventario.permisos.length} usuario{inventario.permisos.length !== 1 ? 's' : ''} con acceso</span>
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
          <div className="p-4 md:p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  onClick={volverALista}
                  variant="outline"
                  size="sm"
                  className="mr-1 md:mr-2 h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                >
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden md:inline">Volver</span>
                </Button>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground">{inventario_seleccionado?.nombre}</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {inventario_seleccionado?.propietario && `Propietario: ${inventario_seleccionado.propietario.nombre}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 md:gap-2">
                {inventario_seleccionado?.es_propietario && (
                  <>
                    {(inventario_seleccionado?.visibilidad === 'publico' || 
                     (inventario_seleccionado?.visibilidad === 'privado' && (inventario_seleccionado?.permisos?.length || 0) > 0)) && (
                      <Button
                        onClick={abrirDialogoInvitar}
                        variant="outline"
                        size="sm"
                        className="h-8 md:h-9"
                      >
                        <UserPlus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                        <span className="hidden md:inline">Invitar</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => abrirDialogoEditarInventario(inventario_seleccionado)}
                      variant="outline"
                      size="sm"
                      className="h-8 md:h-9"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {reporte_valor && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-3 md:mt-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-1 md:pb-2 p-2 md:p-6">
                    <CardDescription className="text-xs md:text-sm">Valor Total</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6 pt-0">
                    <div className="text-lg md:text-2xl font-bold text-primary">
                      ${reporte_valor.valor_total.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-1 md:pb-2 p-2 md:p-6">
                    <CardDescription className="text-xs md:text-sm">Consumibles</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6 pt-0">
                    <div className="text-lg md:text-2xl font-bold text-purple-500">
                      ${reporte_valor.valor_consumibles.toFixed(2)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_lotes} lotes
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-1 md:pb-2 p-2 md:p-6">
                    <CardDescription className="text-xs md:text-sm">Activos</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6 pt-0">
                    <div className="text-lg md:text-2xl font-bold text-blue-500">
                      ${reporte_valor.valor_activos.toFixed(2)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-1 md:pb-2 p-2 md:p-6">
                    <CardDescription className="text-xs md:text-sm">Productos</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6 pt-0">
                    <div className="text-lg md:text-2xl font-bold">
                      {productos.length}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {productos.filter(p => obtenerStockTotal(p) < (p.stock_minimo ?? 0)).length} con stock bajo
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <Tabs value={tab_activo} onValueChange={(value) => setTabActivo(value as any)} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 md:px-6 pt-3 md:pt-4 border-b">
              <TabsList className="grid w-full grid-cols-3 h-9 md:h-11">
                <TabsTrigger value="productos" className="text-xs md:text-base">
                  <Box className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="historial" className="text-xs md:text-base">
                  <History className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Historial
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="text-xs md:text-base">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Usuarios
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="productos" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="p-3 md:p-6 md:pb-4 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar productos..."
                        value={busqueda_productos}
                        onChange={(e) => setBusquedaProductos(e.target.value)}
                        className="pl-8 md:pl-10 text-sm md:text-base"
                      />
                    </div>
                    <Select value={filtro_tipo_producto} onValueChange={setFiltroTipoProducto}>
                      <SelectTrigger className="w-[100px] md:w-[140px] text-xs md:text-sm">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="consumible">Cons.</SelectItem>
                        <SelectItem value="activo_serializado">Ser.</SelectItem>
                        <SelectItem value="activo_general">Gen.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={abrirDialogoNuevoProducto} size="sm" className="h-8 md:h-9">
                    <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Nuevo</span>
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-3 md:p-6">
                {cargando_detalle ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                  </div>
                ) : productos_filtrados.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <Box className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">No hay productos</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {busqueda_productos ? 'No se encontraron productos' : 'Comienza agregando productos'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {productos_filtrados.map((producto) => {
                      const stock_total = obtenerStockTotal(producto);
                      const valor_total = obtenerValorTotal(producto);
                      const stock_bajo = stock_total < (producto.stock_minimo ?? 0);

                      return (
                        <Card 
                          key={producto.id} 
                          className={`${stock_bajo ? 'border-yellow-500' : ''} cursor-pointer hover:shadow-md transition-all`}
                          onClick={() => verDetalleProducto(producto)}
                        >
                          <CardHeader className="p-3 md:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <CardTitle className="text-sm md:text-lg truncate">{producto.nombre}</CardTitle>
                                <Badge className={`${obtenerColorTipoGestion(producto.tipo_gestion)} text-white text-[10px] md:text-xs`}>
                                  {obtenerEtiquetaTipoGestion(producto.tipo_gestion)}
                                </Badge>
                                {stock_bajo && (
                                  <Badge variant="destructive" className="flex items-center gap-1 text-[10px] md:text-xs">
                                    <AlertTriangle className="h-2 w-2 md:h-3 md:w-3" />
                                    Bajo
                                  </Badge>
                                )}
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verDetalleProducto(producto);
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 md:h-8 md:w-8 p-0"
                              >
                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                            {producto.descripcion && (
                              <CardDescription className="text-xs md:text-sm">{producto.descripcion}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="p-3 md:p-6 pt-0">
                            <div className="grid grid-cols-3 gap-2 md:gap-4">
                              <div className="flex items-center gap-1 md:gap-2">
                                <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] md:text-sm text-muted-foreground">Stock</p>
                                  <p className="text-sm md:text-lg font-semibold">
                                    {stock_total} {producto.unidad_medida}
                                  </p>
                                </div>
                              </div>
                              {producto.tipo_gestion === 'consumible' && (
                                <div className="flex items-center gap-1 md:gap-2">
                                  <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] md:text-sm text-muted-foreground">Mínimo</p>
                                    <p className="text-sm md:text-lg font-semibold">
                                      {producto.stock_minimo}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-1 md:gap-2">
                                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] md:text-sm text-muted-foreground">Valor</p>
                                  <p className="text-sm md:text-lg font-semibold">${valor_total.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="historial" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 p-3 md:p-6">
                {cargando_detalle ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                  </div>
                ) : movimientos.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <History className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">No hay movimientos</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Los movimientos aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movimientos.map((movimiento) => (
                      <Card key={movimiento.id}>
                        <CardContent className="p-3 md:p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={movimiento.tipo === 'entrada' ? 'default' : 'destructive'}
                                className="flex items-center gap-1 text-xs"
                              >
                                {movimiento.tipo === 'entrada' ? (
                                  <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                                ) : (
                                  <TrendingDown className="h-2 w-2 md:h-3 md:w-3" />
                                )}
                                {movimiento.tipo}
                              </Badge>
                              <span className="text-xs md:text-sm text-muted-foreground">
                                {format(new Date(movimiento.fecha), 'dd/MM/yy HH:mm')}
                              </span>
                            </div>
                            <p className="font-medium text-sm md:text-base">{movimiento.producto.nombre}</p>
                            <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                              <p>Cantidad: {movimiento.cantidad}</p>
                              <p>Stock: {movimiento.stock_anterior} → {movimiento.stock_nuevo}</p>
                              <p>Usuario: {movimiento.usuario.nombre}</p>
                              {movimiento.observaciones && <p>{movimiento.observaciones}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="usuarios" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 p-3 md:p-6">
                {cargando_detalle ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {inventario_seleccionado?.propietario && (
                      <Card>
                        <CardHeader className="p-3 md:p-6">
                          <CardTitle className="text-sm md:text-base flex items-center gap-2">
                            <Shield className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                            Propietario
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 md:p-6 pt-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm md:text-base">{inventario_seleccionado.propietario.nombre}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">{inventario_seleccionado.propietario.correo}</p>
                            </div>
                            <Badge className="text-xs">Propietario</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {inventario_seleccionado?.permisos && inventario_seleccionado.permisos.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-xs md:text-sm text-muted-foreground uppercase">Usuarios con Acceso</h3>
                        {inventario_seleccionado.permisos.map((permiso) => (
                          <Card key={permiso.id}>
                            <CardContent className="py-3 md:py-4 px-3 md:px-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm md:text-base">{permiso.usuario_invitado.nombre}</p>
                                  <p className="text-xs md:text-sm text-muted-foreground">{permiso.usuario_invitado.correo}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs">{permiso.rol.charAt(0).toUpperCase() + permiso.rol.slice(1)}</Badge>
                                  {inventario_seleccionado.es_propietario && (
                                    <Button
                                      onClick={() => abrirDialogoRemoverUsuario(permiso)}
                                      variant="destructive"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {(!inventario_seleccionado?.permisos || inventario_seleccionado.permisos.length === 0) && (
                      <div className="text-center py-8 md:py-12">
                        <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">No hay usuarios invitados</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-4">
                          Invita usuarios para compartir el inventario
                        </p>
                        {inventario_seleccionado?.es_propietario && 
                         inventario_seleccionado?.visibilidad === 'publico' && (
                          <Button onClick={abrirDialogoInvitar} size="sm">
                            <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                            Invitar Usuario
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {}
      <Dialog open={dialogo_inventario_abierto} onOpenChange={setDialogoInventarioAbierto}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {modo_edicion ? 'Editar Inventario' : 'Nuevo Inventario'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {modo_edicion
                ? 'Modifica la información del inventario'
                : 'Crea un nuevo inventario para gestionar productos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm md:text-base">Nombre *</Label>
              <Input
                id="nombre"
                value={formulario_inventario.nombre}
                onChange={(e) => setFormularioInventario({ ...formulario_inventario, nombre: e.target.value })}
                placeholder="Inventario Principal"
                className="text-sm md:text-base"
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="visibilidad" className="text-sm md:text-base">Inventario Público</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Permite invitar usuarios para colaborar
                </p>
              </div>
              <Switch
                id="visibilidad"
                checked={formulario_inventario.visibilidad === 'publico'}
                onCheckedChange={(checked) => setFormularioInventario({ 
                  ...formulario_inventario, 
                  visibilidad: checked ? 'publico' : 'privado' 
                })}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoInventarioAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarGuardarInventario} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
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
            <DialogTitle className="text-base md:text-lg">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas eliminar el inventario "{inventario_a_eliminar?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarInventario} className="w-full sm:w-auto text-sm md:text-base">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_invitar_abierto} onOpenChange={setDialogoInvitarAbierto}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Invitar Usuario</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Selecciona un usuario y asigna un rol para este inventario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm md:text-base">Usuario *</Label>
              <Combobox
                opciones={opciones_usuarios}
                valor={formulario_invitar.usuario_id}
                onChange={(valor) => setFormularioInvitar({ ...formulario_invitar, usuario_id: valor })}
                placeholder="Selecciona un usuario"
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="rol" className="text-sm md:text-base">Permitir edición</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  El usuario podrá {formulario_invitar.rol === 'editor' ? 'editar productos' : 'solo ver'}
                </p>
              </div>
              <Switch
                id="rol"
                checked={formulario_invitar.rol === 'editor'}
                onCheckedChange={(checked) => setFormularioInvitar({ 
                  ...formulario_invitar, 
                  rol: checked ? 'editor' : 'lector' 
                })}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoInvitarAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarInvitarUsuario} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
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
            <DialogTitle className="text-base md:text-lg">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas remover a {usuario_a_remover?.usuario_invitado?.nombre} de este inventario?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoRemoverUsuarioAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRemoverUsuario} className="w-full sm:w-auto text-sm md:text-base">
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_producto_abierto} onOpenChange={setDialogoProductoAbierto}>
        <DialogContent className="sm:max-w-[500px] md:sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {modo_edicion_producto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {modo_edicion_producto
                ? 'Modifica la información del producto'
                : 'Crea un nuevo producto en el inventario'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_producto" className="text-sm md:text-base">Nombre *</Label>
              <Input
                id="nombre_producto"
                value={formulario_producto.nombre}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                placeholder="Alcohol 70%"
                className="text-sm md:text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_gestion" className="text-sm md:text-base">Tipo de Gestión *</Label>
                <Select
                  value={formulario_producto.tipo_gestion}
                  onValueChange={(value) => setFormularioProducto({ ...formulario_producto, tipo_gestion: value })}
                  disabled={modo_edicion_producto}
                >
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos_gestion.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor} className="text-sm md:text-base">
                        {tipo.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidad_medida" className="text-sm md:text-base">Unidad de Medida *</Label>
                <Input
                  id="unidad_medida"
                  value={formulario_producto.unidad_medida}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value })}
                  placeholder="unidades, ml, gramos..."
                  className="text-sm md:text-base"
                />
              </div>
            </div>

            {formulario_producto.tipo_gestion === 'consumible' && (
              <div className="space-y-2">
                <Label htmlFor="stock_minimo" className="text-sm md:text-base">Stock Mínimo *</Label>
                <Input
                  id="stock_minimo"
                  type="number"
                  value={formulario_producto.stock_minimo}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, stock_minimo: e.target.value })}
                  className="text-sm md:text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-sm md:text-base">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formulario_producto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                placeholder="Descripción del producto (opcional)"
                rows={3}
                className="text-sm md:text-base"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notificar_stock_bajo"
                checked={formulario_producto.notificar_stock_bajo}
                onCheckedChange={(checked) => setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })}
              />
              <Label htmlFor="notificar_stock_bajo" className="cursor-pointer text-sm md:text-base">
                Notificar cuando el stock esté por debajo del mínimo
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoProductoAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarGuardarProducto} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
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
            <DialogTitle className="text-base md:text-lg">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas eliminar el producto "{producto_a_eliminar?.nombre}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarProductoAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarProducto} className="w-full sm:w-auto text-sm md:text-base">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_lote_abierto} onOpenChange={setDialogoLoteAbierto}>
        <DialogContent className="sm:max-w-[500px] md:sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Registrar Nuevo Lote</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Registra un nuevo lote de {producto_seleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="nro_lote" className="text-sm md:text-base">Número de Lote *</Label>
                <Input
                  id="nro_lote"
                  value={formulario_lote.nro_lote}
                  onChange={(e) => setFormularioLote({ ...formulario_lote, nro_lote: e.target.value })}
                  placeholder="L001-2024"
                  className="text-sm md:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad" className="text-sm md:text-base">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  step="0.01"
                  value={formulario_lote.cantidad}
                  onChange={(e) => setFormularioLote({ ...formulario_lote, cantidad: e.target.value })}
                  className="text-sm md:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo_total" className="text-sm md:text-base">Costo Total *</Label>
              <Input
                id="costo_total"
                type="number"
                step="0.01"
                value={formulario_lote.costo_total}
                onChange={(e) => setFormularioLote({ ...formulario_lote, costo_total: e.target.value })}
                className="text-sm md:text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_compra" className="text-sm md:text-base">Fecha de Compra *</Label>
                <DateTimePicker
                  valor={formulario_lote.fecha_compra}
                  onChange={(fecha) => setFormularioLote({ ...formulario_lote, fecha_compra: fecha || new Date() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_vencimiento" className="text-sm md:text-base">Fecha de Vencimiento (Opcional)</Label>
                <DatePicker
                  valor={formulario_lote.fecha_vencimiento}
                  onChange={(fecha) => setFormularioLote({ ...formulario_lote, fecha_vencimiento: fecha })}
                  fromYear={2025}
                  toYear={2125}
                  deshabilitarAnteriores
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_egreso_lote"
                checked={formulario_lote.registrar_egreso}
                onCheckedChange={(checked) => setFormularioLote({ ...formulario_lote, registrar_egreso: checked })}
              />
              <Label htmlFor="registrar_egreso_lote" className="cursor-pointer text-sm md:text-base">
                Registrar egreso en finanzas
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoLoteAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarGuardarLote} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Lote'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_lote_abierto} onOpenChange={setDialogoConfirmarEliminarLoteAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas eliminar el lote "{lote_a_eliminar?.nro_lote}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarLoteAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarLote} className="w-full sm:w-auto text-sm md:text-base">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ajuste_stock_lote_abierto} onOpenChange={setDialogoAjusteStockLoteAbierto}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Ajustar Stock</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Ajusta el stock del lote {lote_seleccionado?.nro_lote}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ajuste" className="text-sm md:text-base">Tipo de Ajuste *</Label>
              <div className="flex items-center space-x-4">
                <Switch
                  id="tipo_ajuste"
                  checked={formulario_ajuste_lote.tipo === 'salida'}
                  onCheckedChange={(checked) => setFormularioAjusteLote({ ...formulario_ajuste_lote, tipo: checked ? 'salida' : 'entrada' })}
                />
                <Label htmlFor="tipo_ajuste" className="cursor-pointer text-sm md:text-base">
                  {formulario_ajuste_lote.tipo === 'entrada' ? (
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      Entrada (Incrementar)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                      Salida (Decrementar)
                    </span>
                  )}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_ajuste" className="text-sm md:text-base">Cantidad *</Label>
              <Input
                id="cantidad_ajuste"
                type="number"
                step="0.01"
                value={formulario_ajuste_lote.cantidad}
                onChange={(e) => {
                  const nueva_cantidad = e.target.value;
                  const cantidad_num = parseFloat(nueva_cantidad || '0');
                  const costo_unitario = lote_seleccionado ? Number(lote_seleccionado.costo_unitario_compra || 0) : 0;
                  const nuevo_monto = (cantidad_num * costo_unitario).toFixed(2);
                  setFormularioAjusteLote({ 
                    ...formulario_ajuste_lote, 
                    cantidad: nueva_cantidad,
                    monto: nuevo_monto
                  });
                }}
                className="text-sm md:text-base"
              />
              {lote_seleccionado && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  Stock actual: {lote_seleccionado.cantidad_actual} {producto_seleccionado?.unidad_medida}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_ajuste" className="text-sm md:text-base">
                Monto {formulario_ajuste_lote.tipo === 'entrada' ? '(Costo)' : '(Venta)'} *
              </Label>
              <Input
                id="monto_ajuste"
                type="number"
                step="0.01"
                value={formulario_ajuste_lote.monto}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioAjusteLote({ ...formulario_ajuste_lote, monto: valor });
                }}
                className="text-sm md:text-base"
              />
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {formulario_ajuste_lote.tipo === 'entrada' 
                  ? 'Se registrará como egreso en finanzas' 
                  : 'Se registrará como ingreso en finanzas'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="generar_movimiento_ajuste"
                checked={formulario_ajuste_lote.generar_movimiento_financiero}
                onCheckedChange={(checked) => setFormularioAjusteLote({ ...formulario_ajuste_lote, generar_movimiento_financiero: checked })}
              />
              <Label htmlFor="generar_movimiento_ajuste" className="cursor-pointer text-sm md:text-base">
                Registrar movimiento en finanzas
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoAjusteStockLoteAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarAjusteStockLote} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Ajustar Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_activo_abierto} onOpenChange={setDialogoActivoAbierto}>
        <DialogContent className="sm:max-w-[500px] md:sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {modo_edicion_activo ? 'Editar Activo' : 'Registrar Nuevo Activo'}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {modo_edicion_activo
                ? `Modifica la información del activo`
                : `Registra un nuevo activo de ${producto_seleccionado?.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            {producto_seleccionado?.tipo_gestion === 'activo_serializado' && (
              <div className="space-y-2">
                <Label htmlFor="nro_serie" className="text-sm md:text-base">Número de Serie</Label>
                <Input
                  id="nro_serie"
                  value={formulario_activo.nro_serie}
                  onChange={(e) => setFormularioActivo({ ...formulario_activo, nro_serie: e.target.value })}
                  placeholder="SN-123456"
                  disabled={modo_edicion_activo}
                  className="text-sm md:text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre_asignado" className="text-sm md:text-base">Nombre Asignado</Label>
              <Input
                id="nombre_asignado"
                value={formulario_activo.nombre_asignado}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, nombre_asignado: e.target.value })}
                placeholder="Equipo Sala 1"
                className="text-sm md:text-base"
              />
            </div>

            {!modo_edicion_activo && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="costo_compra" className="text-sm md:text-base">Costo de Compra *</Label>
                  <Input
                    id="costo_compra"
                    type="number"
                    step="0.01"
                    value={formulario_activo.costo_compra}
                    onChange={(e) => setFormularioActivo({ ...formulario_activo, costo_compra: e.target.value })}
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_compra" className="text-sm md:text-base">Fecha de Compra *</Label>
                  <DateTimePicker
                    valor={formulario_activo.fecha_compra}
                    onChange={(fecha) => setFormularioActivo({ ...formulario_activo, fecha_compra: fecha || new Date() })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm md:text-base">Estado *</Label>
              <Select
                value={formulario_activo.estado}
                onValueChange={(value) => setFormularioActivo({ ...formulario_activo, estado: value })}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estados_activo.map((estado) => (
                    <SelectItem key={estado.valor} value={estado.valor} className="text-sm md:text-base">
                      {estado.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="text-sm md:text-base">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formulario_activo.ubicacion}
                onChange={(e) => setFormularioActivo({ ...formulario_activo, ubicacion: e.target.value })}
                placeholder="Consultorio 1, Almacén..."
                className="text-sm md:text-base"
              />
            </div>

            {!modo_edicion_activo && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="registrar_egreso_activo"
                  checked={formulario_activo.registrar_egreso}
                  onCheckedChange={(checked) => setFormularioActivo({ ...formulario_activo, registrar_egreso: checked })}
                />
                <Label htmlFor="registrar_egreso_activo" className="cursor-pointer text-sm md:text-base">
                  Registrar egreso en finanzas
                </Label>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoActivoAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarGuardarActivo} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                modo_edicion_activo ? 'Guardar Cambios' : 'Registrar Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_activo_abierto} onOpenChange={setDialogoConfirmarEliminarActivoAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas eliminar este activo?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarActivoAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarActivo} className="w-full sm:w-auto text-sm md:text-base">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_vender_activo_abierto} onOpenChange={setDialogoVenderActivoAbierto}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Vender Activo</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Registra la venta de {activo_seleccionado?.nombre_asignado || activo_seleccionado?.nro_serie || 'este activo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-2">
              <Label htmlFor="monto_venta" className="text-sm md:text-base">Monto de Venta *</Label>
              <Input
                id="monto_venta"
                type="number"
                step="0.01"
                value={formulario_venta_activo.monto_venta}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioVentaActivo({ ...formulario_venta_activo, monto_venta: valor });
                }}
                onBlur={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioVentaActivo({ ...formulario_venta_activo, monto_venta: valor });
                }}
                className="text-sm md:text-base"
              />
              {activo_seleccionado && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  Costo de compra: ${Number(activo_seleccionado.costo_compra).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_pago_venta"
                checked={formulario_venta_activo.registrar_pago}
                onCheckedChange={(checked) => setFormularioVentaActivo({ ...formulario_venta_activo, registrar_pago: checked })}
              />
              <Label htmlFor="registrar_pago_venta" className="cursor-pointer text-sm md:text-base">
                Registrar ingreso en finanzas
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogoVenderActivoAbierto(false)} className="w-full sm:w-auto text-sm md:text-base">
              Cancelar
            </Button>
            <Button onClick={manejarVenderActivo} disabled={guardando} className="w-full sm:w-auto text-sm md:text-base">
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  Vendiendo...
                </>
              ) : (
                'Vender Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sheet_producto_detalle_abierto} onOpenChange={setSheetProductoDetalleAbierto}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg md:text-xl">
              {producto_seleccionado?.nombre}
            </SheetTitle>
            <SheetDescription className="text-xs md:text-sm">
              Detalles del producto y gestión de inventario
            </SheetDescription>
          </SheetHeader>
          
          {producto_seleccionado && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${obtenerColorTipoGestion(producto_seleccionado.tipo_gestion)} text-white text-xs md:text-sm`}>
                  {obtenerEtiquetaTipoGestion(producto_seleccionado.tipo_gestion)}
                </Badge>
                {obtenerStockTotal(producto_seleccionado) < (producto_seleccionado.stock_minimo ?? 0) && (
                  <Badge variant="destructive" className="text-xs md:text-sm">
                    Stock Bajo
                  </Badge>
                )}
              </div>

              {producto_seleccionado.descripcion && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {producto_seleccionado.descripcion}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Stock Total</p>
                  <p className="text-base md:text-lg font-semibold">
                    {obtenerStockTotal(producto_seleccionado)} {producto_seleccionado.unidad_medida}
                  </p>
                </div>
                {producto_seleccionado.tipo_gestion === 'consumible' && (
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Stock Mínimo</p>
                    <p className="text-base md:text-lg font-semibold">
                      {producto_seleccionado.stock_minimo} {producto_seleccionado.unidad_medida}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-base md:text-lg font-semibold">
                    ${obtenerValorTotal(producto_seleccionado).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {producto_seleccionado.tipo_gestion === 'consumible' && (
                  <Button
                    onClick={() => {
                      setSheetProductoDetalleAbierto(false);
                      abrirDialogoNuevoLote(producto_seleccionado);
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Nuevo Lote</span>
                  </Button>
                )}
                {producto_seleccionado.tipo_gestion !== 'consumible' && (
                  <Button
                    onClick={() => {
                      setSheetProductoDetalleAbierto(false);
                      abrirDialogoNuevoActivo(producto_seleccionado);
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Registrar Activo</span>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSheetProductoDetalleAbierto(false);
                    abrirDialogoEditarProducto(producto_seleccionado);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="text-xs md:text-sm">Editar</span>
                </Button>
                <Button
                  onClick={() => {
                    setSheetProductoDetalleAbierto(false);
                    abrirDialogoConfirmarEliminarProducto(producto_seleccionado);
                  }}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="text-xs md:text-sm">Eliminar</span>
                </Button>
              </div>

              {producto_seleccionado.tipo_gestion === 'consumible' && producto_seleccionado.lotes && producto_seleccionado.lotes.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">Lotes Disponibles</h4>
                  <div className="space-y-2">
                    {producto_seleccionado.lotes.map((lote) => {
                      const vencido = estaVencido(lote.fecha_vencimiento);
                      return (
                        <Card key={lote.id} className={vencido ? 'border-destructive' : ''}>
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium text-sm md:text-base ${vencido ? 'text-destructive' : ''}`}>
                                  {lote.nro_lote}
                                </p>
                                {vencido && (
                                  <Badge variant="destructive" className="text-xs">VENCIDO</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground">
                                <p>Stock: {lote.cantidad_actual} {producto_seleccionado.unidad_medida}</p>
                                <p>Costo: ${Number(lote.costo_unitario_compra).toFixed(2)}</p>
                                {lote.fecha_vencimiento && (
                                  <p className="col-span-2">
                                    Vence: {format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy')}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 pt-2">
                                <Button
                                  onClick={() => {
                                    setSheetProductoDetalleAbierto(false);
                                    abrirDialogoAjusteStockLote(producto_seleccionado, lote);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Ajustar</span>
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSheetProductoDetalleAbierto(false);
                                    abrirDialogoConfirmarEliminarLote(lote);
                                  }}
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 h-8"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Eliminar</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {producto_seleccionado.tipo_gestion !== 'consumible' && producto_seleccionado.activos && producto_seleccionado.activos.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">Activos Registrados</h4>
                  <div className="space-y-2">
                    {producto_seleccionado.activos.map((activo) => (
                      <Card key={activo.id}>
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm md:text-base">
                                {activo.nombre_asignado || activo.nro_serie || '-'}
                              </p>
                              <Badge className="text-xs">{activo.estado}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground">
                              {activo.ubicacion && <p>Ubicación: {activo.ubicacion}</p>}
                              <p>Costo: ${Number(activo.costo_compra).toFixed(2)}</p>
                            </div>
                            <div className="flex gap-1 pt-2">
                              <Select
                                value={activo.estado}
                                onValueChange={(value) => manejarCambioEstadoActivo(producto_seleccionado, activo, value)}
                              >
                                <SelectTrigger className="h-8 text-xs flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {estados_activo.map((estado) => (
                                    <SelectItem key={estado.valor} value={estado.valor} className="text-xs">
                                      {estado.etiqueta}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => {
                                  setSheetProductoDetalleAbierto(false);
                                  abrirDialogoVenderActivo(activo);
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                title="Vender"
                              >
                                <DollarSign className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setSheetProductoDetalleAbierto(false);
                                  abrirDialogoEditarActivo(producto_seleccionado, activo);
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setSheetProductoDetalleAbierto(false);
                                  abrirDialogoConfirmarEliminarActivo(activo);
                                }}
                                size="sm"
                                variant="destructive"
                                className="h-8 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
