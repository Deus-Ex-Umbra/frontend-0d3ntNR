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
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import { Switch } from '@/componentes/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Box,
  AlertTriangle,
  Shield,
  History,
  X,
  Search,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Filter,
  RefreshCw,
  Check,
  Lock,
} from 'lucide-react';
import { inventarioApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Badge } from '@/componentes/ui/badge';
import { DatePicker } from '@/componentes/ui/date-picker';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { format } from 'date-fns';
import { formatearFechaSoloFecha } from '@/lib/utilidades';
import {
  Inventario,
  Producto,
  Material,
  Activo,
  ReporteValor,
  MovimientoKardex,
  EventoBitacora,
  RegistroAuditoria
} from '@/tipos';

export default function Inventarios() {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [inventario_seleccionado, setInventarioSeleccionado] = useState<Inventario | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [reporte_valor, setReporteValor] = useState<ReporteValor | null>(null);

  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [bitacora, setBitacora] = useState<EventoBitacora[]>([]);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargando_detalle, setCargandoDetalle] = useState(false);
  const [cargando_kardex, setCargandoKardex] = useState(false);
  const [cargando_bitacora, setCargandoBitacora] = useState(false);
  const [cargando_auditoria, setCargandoAuditoria] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [productos_cargando, setProductosCargando] = useState<Set<number>>(new Set());

  const [dialogo_inventario_abierto, setDialogoInventarioAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [dialogo_producto_abierto, setDialogoProductoAbierto] = useState(false);
  const [dialogo_material_abierto, setDialogoMaterialAbierto] = useState(false);
  const [dialogo_activo_abierto, setDialogoActivoAbierto] = useState(false);
  const [dialogo_ajuste_stock_abierto, setDialogoAjusteStockAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_producto_abierto, setDialogoConfirmarEliminarProductoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_material_abierto, setDialogoConfirmarEliminarMaterialAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_activo_abierto, setDialogoConfirmarEliminarActivoAbierto] = useState(false);
  const [dialogo_vender_activo_abierto, setDialogoVenderActivoAbierto] = useState(false);
  const [dialogo_filtros_historial_abierto, setDialogoFiltrosHistorialAbierto] = useState(false);
  const [dialogo_detalles_auditoria_abierto, setDialogoDetallesAuditoriaAbierto] = useState(false);
  const [detalles_auditoria_seleccionada, setDetallesAuditoriaSeleccionada] = useState<RegistroAuditoria | null>(null);
  const [dialogo_confirmar_cambio_desechado_abierto, setDialogoConfirmarCambioDesechadoAbierto] = useState(false);
  const [activo_a_desechar, setActivoADesechar] = useState<{ producto: Producto, activo: Activo } | null>(null);

  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_producto, setModoEdicionProducto] = useState(false);
  const [modo_edicion_activo, setModoEdicionActivo] = useState(false);

  const [inventario_a_eliminar, setInventarioAEliminar] = useState<Inventario | null>(null);
  const [producto_seleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [producto_a_eliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [material_seleccionado, setMaterialSeleccionado] = useState<Material | null>(null);
  const [material_a_eliminar, setMaterialAEliminar] = useState<Material | null>(null);
  const [activo_seleccionado, setActivoSeleccionado] = useState<Activo | null>(null);
  const [activo_a_eliminar, setActivoAEliminar] = useState<Activo | null>(null);
  const [busqueda_inventarios, setBusquedaInventarios] = useState('');
  const [busqueda_productos, setBusquedaProductos] = useState('');
  const [vista_actual, setVistaActual] = useState<'lista' | 'detalle'>('lista');
  const [tab_activo, setTabActivo] = useState<'productos' | 'kardex' | 'bitacora' | 'auditoria'>('productos');
  const [filtro_tipo_producto, setFiltroTipoProducto] = useState<string>('todos');
  const [filtros_historial, setFiltrosHistorial] = useState({
    tipo_operacion: [] as string[],
    tipo_entidad: [] as string[],
    fecha_inicio: undefined as Date | undefined,
    fecha_fin: undefined as Date | undefined,
    limit: 100,
  });

  const [formulario_inventario, setFormularioInventario] = useState({
    nombre: '',
    modo_estricto: false,
  });

  const [formulario_producto, setFormularioProducto] = useState({
    nombre: '',
    tipo: 'material' as 'material' | 'activo_fijo',
    subtipo_material: 'con_lote_vencimiento' as 'con_lote_vencimiento' | 'con_serie' | 'sin_lote',
    subtipo_activo_fijo: 'instrumental' as 'instrumental' | 'mobiliario_equipo',
    stock_minimo: '10',
    unidad_medida: '',
    descripcion: '',
    notificar_stock_bajo: true,
    permite_decimales: false,
  });

  const [formulario_material, setFormularioMaterial] = useState({
    nro_lote: '',
    nro_serie: '',
    cantidad: '',
    costo_total: '',
    fecha_vencimiento: undefined as Date | undefined,
    fecha_compra: new Date(),
    registrar_egreso: true,
  });

  const [formulario_activo, setFormularioActivo] = useState({
    nro_serie: '',
    nombre_asignado: '',
    costo_compra: '',
    fecha_compra: new Date(),
    estado: 'disponible',
    ubicacion: '',
    registrar_egreso: true,
  });

  const [formulario_ajuste_stock, setFormularioAjusteStock] = useState({
    tipo_ajuste: 'incremento' as 'incremento' | 'decremento',
    cantidad: '',
    monto: '',
    motivo: '',
    generar_movimiento_financiero: true,
    fecha_ajuste: new Date(),
  });

  const [formulario_venta_activo, setFormularioVentaActivo] = useState({
    monto_venta: '',
    registrar_pago: true,
    fecha_venta: new Date(),
  });

  const subtipos_material = [
    { valor: 'con_lote_vencimiento', etiqueta: 'Con Lote y Vencimiento', descripcion: 'Fármacos, medicamentos' },
    { valor: 'con_serie', etiqueta: 'Con Serie', descripcion: 'Implantes' },
    { valor: 'sin_lote', etiqueta: 'Sin Lote', descripcion: 'Papel toalla, guantes, etc.' },
  ];

  const subtipos_activo_fijo = [
    { valor: 'instrumental', etiqueta: 'Instrumental', descripcion: 'Ciclo de vida rápido' },
    { valor: 'mobiliario_equipo', etiqueta: 'Mobiliario/Equipo', descripcion: 'Ciclo de vida lento' },
  ];

  const getEstadosParaSubtipo = (_subtipo: string | undefined) => {
    return [
      { valor: 'disponible', etiqueta: 'Disponible' },
      { valor: 'en_mantenimiento', etiqueta: 'En Mantenimiento' },
      { valor: 'desechado', etiqueta: 'Desechado' },
      { valor: 'vendido', etiqueta: 'Vendido' },
    ];
  };



  const estaVencido = (fecha_vencimiento: Date | null | undefined): boolean => {
    if (!fecha_vencimiento) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha_venc = new Date(fecha_vencimiento);
    fecha_venc.setHours(0, 0, 0, 0);
    return fecha_venc < hoy;
  };

  useEffect(() => {
    if (['kardex', 'bitacora', 'auditoria'].includes(tab_activo)) {
      cargarHistorial();
    }
  }, [tab_activo, inventario_seleccionado]);

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarInventarios();
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

  const cargarDetalleInventario = async (inventario: Inventario) => {
    try {
      setCargandoDetalle(true);

      const [inventario_actualizado, productos_respuesta, reporte_respuesta] = await Promise.all([
        inventarioApi.obtenerInventarioPorId(inventario.id),
        inventarioApi.obtenerProductos(inventario.id),
        inventarioApi.obtenerReporteValor(inventario.id),
      ]);
      setInventarioSeleccionado(inventario_actualizado);
      setProductos(Array.isArray(productos_respuesta) ? productos_respuesta : []);
      setReporteValor(reporte_respuesta);
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

  const cargarHistorial = async () => {
    if (!inventario_seleccionado) return;
    if (tab_activo === 'kardex') setCargandoKardex(true);
    else if (tab_activo === 'bitacora') setCargandoBitacora(true);
    else if (tab_activo === 'auditoria') setCargandoAuditoria(true);

    try {
      setCargandoDetalle(true);

      if (tab_activo === 'kardex') {
        const resultado = await inventarioApi.obtenerKardex(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setKardex(resultado.registros || []);
      } else if (tab_activo === 'bitacora') {
        const resultado = await inventarioApi.obtenerBitacora(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setBitacora(resultado.registros || []);
      } else if (tab_activo === 'auditoria') {
        const resultado = await inventarioApi.buscarAuditoria(inventario_seleccionado.id, {
          fecha_inicio: filtros_historial.fecha_inicio ? format(filtros_historial.fecha_inicio, 'yyyy-MM-dd') : undefined,
          fecha_fin: filtros_historial.fecha_fin ? format(filtros_historial.fecha_fin, 'yyyy-MM-dd') : undefined,
          limit: filtros_historial.limit,
        });
        setAuditoria(resultado.registros || []);
      }
    } catch (error: any) {
      console.error('Error al cargar historial:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial',
        variant: 'destructive',
      });
    } finally {
      setCargandoKardex(false);
      setCargandoBitacora(false);
      setCargandoAuditoria(false);
      setCargandoDetalle(false);
    }
  };

  const limpiarFiltrosHistorial = async () => {
    setFiltrosHistorial({
      tipo_operacion: [],
      tipo_entidad: [],
      fecha_inicio: undefined,
      fecha_fin: undefined,
      limit: 100,
    });
    if (!inventario_seleccionado) return;
    if (tab_activo === 'kardex') setCargandoKardex(true);
    else if (tab_activo === 'bitacora') setCargandoBitacora(true);
    else if (tab_activo === 'auditoria') setCargandoAuditoria(true);

    try {
      setCargandoDetalle(true);

      if (tab_activo === 'kardex') {
        const resultado = await inventarioApi.obtenerKardex(inventario_seleccionado.id, { limit: 100 });
        setKardex(resultado.registros || []);
      } else if (tab_activo === 'bitacora') {
        const resultado = await inventarioApi.obtenerBitacora(inventario_seleccionado.id, { limit: 100 });
        setBitacora(resultado.registros || []);
      } else if (tab_activo === 'auditoria') {
        const resultado = await inventarioApi.buscarAuditoria(inventario_seleccionado.id, { limit: 100 });
        setAuditoria(resultado.registros || []);
      }

      toast({
        title: 'Filtros limpiados',
        description: 'Mostrando registros recientes',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al cargar el historial',
        variant: 'destructive',
      });
    } finally {
      setCargandoKardex(false);
      setCargandoBitacora(false);
      setCargandoAuditoria(false);
      setCargandoDetalle(false);
    }
  };

  const contarFiltrosHistorialActivos = () => {
    let count = 0;
    if (filtros_historial.fecha_inicio) count++;
    if (filtros_historial.fecha_fin) count++;
    if (filtros_historial.tipo_operacion.length > 0) count++;
    if (filtros_historial.tipo_entidad.length > 0) count++;
    return count;
  };

  const aplicarFiltrosHistorial = () => {
    setDialogoFiltrosHistorialAbierto(false);
    cargarHistorial();
  };
  const abrirDialogoNuevoInventario = () => {
    setFormularioInventario({
      nombre: '',
      modo_estricto: false,
    });
    setModoEdicion(false);
    setDialogoInventarioAbierto(true);
  };

  const abrirDialogoEditarInventario = (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setFormularioInventario({
      nombre: inventario.nombre,
      modo_estricto: inventario.modo_estricto || false,
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

  const abrirDialogoNuevoProducto = () => {
    setFormularioProducto({
      nombre: '',
      tipo: 'material',
      subtipo_material: 'con_lote_vencimiento',
      subtipo_activo_fijo: 'instrumental',
      stock_minimo: '10',
      unidad_medida: '',
      descripcion: '',
      notificar_stock_bajo: true,
      permite_decimales: false,
    });
    setModoEdicionProducto(false);
    setDialogoProductoAbierto(true);
  };

  const abrirDialogoEditarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormularioProducto({
      nombre: producto.nombre,
      tipo: producto.tipo || 'material',
      subtipo_material: producto.subtipo_material || 'sin_lote',
      subtipo_activo_fijo: producto.subtipo_activo_fijo || 'instrumental',
      stock_minimo: (producto.stock_minimo ?? 0).toString(),
      unidad_medida: producto.unidad_medida ?? '',
      descripcion: producto.descripcion || '',
      notificar_stock_bajo: producto.notificar_stock_bajo ?? false,
      permite_decimales: producto.permite_decimales ?? false,
    });
    setModoEdicionProducto(true);
    setDialogoProductoAbierto(true);
  };

  const manejarGuardarProducto = async () => {
    if (!inventario_seleccionado) return;

    if (!formulario_producto.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_producto.tipo === 'material' && !formulario_producto.unidad_medida.trim()) {
      toast({
        title: 'Error',
        description: 'La unidad de medida es obligatoria para materiales',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario_producto.nombre,
        tipo: formulario_producto.tipo,
        subtipo_material: formulario_producto.tipo === 'material' ? formulario_producto.subtipo_material : undefined,
        subtipo_activo_fijo: formulario_producto.tipo === 'activo_fijo' ? formulario_producto.subtipo_activo_fijo : undefined,
        stock_minimo: formulario_producto.tipo === 'material'
          ? parseFloat(formulario_producto.stock_minimo) || 0
          : 0,
        unidad_medida: formulario_producto.tipo === 'material' ? formulario_producto.unidad_medida : undefined,
        descripcion: formulario_producto.descripcion,
        notificar_stock_bajo: formulario_producto.notificar_stock_bajo,
        permite_decimales: formulario_producto.tipo === 'material' ? formulario_producto.permite_decimales : undefined,
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
        setDialogoProductoAbierto(false);
        await cargarProductoIndividual(producto_seleccionado.id);
      } else {
        await inventarioApi.crearProducto(datos);
        toast({
          title: 'Éxito',
          description: 'Producto creado correctamente',
        });
        setDialogoProductoAbierto(false);
        await cargarDetalleInventario(inventario_seleccionado);
      }
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

  const abrirDialogoNuevoMaterial = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setFormularioMaterial({
      nro_lote: '',
      nro_serie: '',
      cantidad: '',
      costo_total: '',
      fecha_vencimiento: undefined,
      fecha_compra: new Date(),
      registrar_egreso: true,
    });
    setDialogoMaterialAbierto(true);
  };

  const manejarGuardarMaterial = async () => {
    if (!inventario_seleccionado || !producto_seleccionado) return;

    if (!formulario_material.cantidad || !formulario_material.costo_total) {
      toast({
        title: 'Error',
        description: 'Los campos Cantidad y Costo Total son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const cantidad = parseFloat(formulario_material.cantidad);
      const costo_total = parseFloat(formulario_material.costo_total);
      const costo_unitario = cantidad > 0 ? costo_total / cantidad : 0;

      const datos_entrada = {
        producto_id: producto_seleccionado.id,
        cantidad: cantidad,
        costo_unitario: costo_unitario,
        tipo_entrada: 'compra' as const,
        nro_lote: formulario_material.nro_lote || undefined,
        nro_serie: formulario_material.nro_serie || undefined,
        fecha_vencimiento: formulario_material.fecha_vencimiento
          ? format(formulario_material.fecha_vencimiento, 'yyyy-MM-dd')
          : undefined,
        fecha_ingreso: formatearFechaSoloFecha(formulario_material.fecha_compra),
        generar_egreso: formulario_material.registrar_egreso,
      };

      await inventarioApi.registrarEntradaMaterial(inventario_seleccionado.id, datos_entrada);

      toast({
        title: 'Éxito',
        description: formulario_material.registrar_egreso
          ? 'Material registrado y egreso creado en finanzas'
          : 'Material registrado correctamente',
      });

      setDialogoMaterialAbierto(false);
      await cargarProductoIndividual(producto_seleccionado.id);
    } catch (error: any) {
      console.error('Error al guardar material:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al guardar el material',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoAjusteStock = (producto: Producto, material: Material) => {
    setProductoSeleccionado(producto);
    setMaterialSeleccionado(material);
    const costo_estimado = Number(material.costo_unitario || 0);
    setFormularioAjusteStock({
      tipo_ajuste: 'incremento',
      cantidad: '1',
      monto: costo_estimado.toFixed(2),
      motivo: '',
      generar_movimiento_financiero: true,
      fecha_ajuste: new Date(),
    });
    setDialogoAjusteStockAbierto(true);
  };

  const manejarAjusteStock = async () => {
    if (!inventario_seleccionado || !producto_seleccionado || !material_seleccionado) return;

    if (!formulario_ajuste_stock.cantidad) {
      toast({
        title: 'Error',
        description: 'La cantidad es obligatoria',
        variant: 'destructive',
      });
      return;
    }

    const cantidad = parseFloat(formulario_ajuste_stock.cantidad);
    if (cantidad <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_ajuste_stock.tipo_ajuste === 'decremento' && cantidad > material_seleccionado.cantidad_actual) {
      toast({
        title: 'Error',
        description: 'No hay suficiente stock en este material',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {

      await inventarioApi.ajustarStock(inventario_seleccionado.id, {
        producto_id: producto_seleccionado.id,
        material_id: material_seleccionado.id,
        tipo_ajuste: formulario_ajuste_stock.tipo_ajuste,
        cantidad: cantidad,
        motivo: formulario_ajuste_stock.motivo || `Ajuste ${formulario_ajuste_stock.tipo_ajuste} manual`,
        fecha: formatearFechaSoloFecha(formulario_ajuste_stock.fecha_ajuste),
      });

      toast({
        title: 'Éxito',
        description: 'Stock ajustado correctamente',
      });

      setDialogoAjusteStockAbierto(false);
      await cargarProductoIndividual(producto_seleccionado.id);
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

  const abrirDialogoConfirmarEliminarMaterial = (material: Material) => {
    setMaterialAEliminar(material);
    setDialogoConfirmarEliminarMaterialAbierto(true);
  };

  const confirmarEliminarMaterial = async () => {
    if (!inventario_seleccionado || !material_a_eliminar) return;

    try {
      await inventarioApi.eliminarProducto(inventario_seleccionado.id, material_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Material eliminado correctamente',
      });
      setDialogoConfirmarEliminarMaterialAbierto(false);
      setMaterialAEliminar(null);
      await cargarDetalleInventario(inventario_seleccionado);
    } catch (error: any) {
      console.error('Error al eliminar material:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al eliminar el material',
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
      registrar_egreso: true,
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
        setDialogoActivoAbierto(false);
        await cargarProductoIndividual(producto_seleccionado.id);
      } else {
        const datos_entrada = {
          producto_id: producto_seleccionado.id,
          costo_compra: parseFloat(formulario_activo.costo_compra),
          tipo_entrada: 'compra' as const,
          nro_serie: formulario_activo.nro_serie || undefined,
          nombre_asignado: formulario_activo.nombre_asignado || undefined,
          ubicacion: formulario_activo.ubicacion || undefined,
          fecha_compra: formatearFechaSoloFecha(formulario_activo.fecha_compra),
          generar_egreso: formulario_activo.registrar_egreso,
        };

        await inventarioApi.registrarEntradaActivo(inventario_seleccionado.id, datos_entrada);

        toast({
          title: 'Éxito',
          description: formulario_activo.registrar_egreso
            ? 'Activo registrado y egreso creado en finanzas'
            : 'Activo registrado correctamente',
        });
        setDialogoActivoAbierto(false);
        await cargarProductoIndividual(producto_seleccionado.id);
      }
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

  const cargarProductoIndividual = async (producto_id: number) => {
    if (!inventario_seleccionado) return;

    setProductosCargando(prev => new Set(prev).add(producto_id));

    try {
      const producto_actualizado = await inventarioApi.obtenerProductoPorId(
        inventario_seleccionado.id,
        producto_id
      );

      setProductos(prev =>
        prev.map(p => (p.id === producto_id ? producto_actualizado : p))
      );
    } catch (error: any) {
      console.error('Error al cargar producto:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cargar el producto',
        variant: 'destructive',
      });
    } finally {
      setProductosCargando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(producto_id);
        return nuevo;
      });
    }
  };

  const manejarCambioEstadoActivo = async (_producto: Producto, activo: Activo, nuevo_estado: string) => {
    if (!inventario_seleccionado) return;

    // Si el nuevo estado es "desechado", abrir diálogo de confirmación
    if (nuevo_estado === 'desechado' && activo.estado !== 'desechado') {
      setActivoADesechar({ producto: _producto, activo });
      setDialogoConfirmarCambioDesechadoAbierto(true);
      return;
    }

    setProductosCargando(prev => new Set(prev).add(_producto.id));

    try {
      await inventarioApi.cambiarEstadoActivo(
        inventario_seleccionado.id,
        activo.id,
        { estado: nuevo_estado }
      );

      toast({
        title: 'Éxito',
        description: 'Estado actualizado correctamente',
      });

      await cargarProductoIndividual(_producto.id);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cambiar el estado',
        variant: 'destructive',
      });
    } finally {
      setProductosCargando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(_producto.id);
        return nuevo;
      });
    }
  };

  const confirmarCambioDesechado = async () => {
    if (!inventario_seleccionado || !activo_a_desechar) return;

    setProductosCargando(prev => new Set(prev).add(activo_a_desechar.producto.id));

    try {
      await inventarioApi.cambiarEstadoActivo(
        inventario_seleccionado.id,
        activo_a_desechar.activo.id,
        { estado: 'desechado' }
      );

      toast({
        title: 'Éxito',
        description: 'Activo marcado como desechado y eliminado correctamente',
      });

      setDialogoConfirmarCambioDesechadoAbierto(false);
      setActivoADesechar(null);
      await cargarProductoIndividual(activo_a_desechar.producto.id);
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.mensaje || 'Error al cambiar el estado',
        variant: 'destructive',
      });
    } finally {
      if (activo_a_desechar) {
        setProductosCargando(prev => {
          const nuevo = new Set(prev);
          nuevo.delete(activo_a_desechar.producto.id);
          return nuevo;
        });
      }
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
      fecha_venta: new Date(),
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
        tipo_salida: 'venta',
        fecha_venta: formatearFechaSoloFecha(formulario_venta_activo.fecha_venta),
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

  const volverALista = () => {
    setVistaActual('lista');
    setInventarioSeleccionado(null);
    setProductos([]);
    setReporteValor(null);
    setTabActivo('productos');
    localStorage.removeItem('inventario_seleccionado_id');
  };

  const obtenerColorTipoGestion = (tipo?: string): string => {
    const colores: { [key: string]: string } = {
      material: 'bg-purple-500',
      activo_fijo: 'bg-blue-500',
    };
    return colores[tipo || ''] || 'bg-gray-500';
  };

  const obtenerEtiquetaTipoGestion = (tipo?: string): string => {
    const tipos: { [key: string]: string } = {
      material: 'Material',
      activo_fijo: 'Activo Fijo',
    };
    return tipos[tipo || ''] || tipo || 'Desconocido';
  };

  const obtenerStockTotal = (producto: Producto): number => {
    if (producto.tipo === 'material') {
      const materiales = producto.materiales || [];
      return materiales.reduce((total, m) => total + Number(m.cantidad_actual), 0);
    }
    return producto.activos?.length || 0;
  };

  const obtenerValorTotal = (producto: Producto): number => {
    if (producto.tipo === 'material') {
      const materiales = producto.materiales || [];
      return materiales.reduce((total, m) => total + (Number(m.cantidad_actual) * Number(m.costo_unitario || 0)), 0);
    }
    if (producto.activos) {
      return producto.activos.reduce((total, activo) => total + Number(activo.costo_compra), 0);
    }
    return 0;
  };

  const compararCambios = (anterior: any, nuevo: any) => {
    if (typeof anterior === 'string') {
      try { anterior = JSON.parse(anterior); } catch (e) { console.error('Error parsing anterior:', e); }
    }
    if (typeof nuevo === 'string') {
      try { nuevo = JSON.parse(nuevo); } catch (e) { console.error('Error parsing nuevo:', e); }
    }

    if (!anterior && !nuevo) return { campos: [], valoresAnteriores: {}, valoresNuevos: {}, camposModificados: new Set<string>() };
    if (!anterior) anterior = {};
    if (!nuevo) nuevo = {};
    const camposRelevantes: { [key: string]: string[] } = {
      inventario: ['nombre', 'visibilidad', 'modo_estricto', 'descripcion'],
      producto: ['nombre', 'tipo', 'subtipo_material', 'subtipo_activo_fijo', 'stock_minimo', 'unidad_medida', 'descripcion', 'notificar_stock_bajo', 'permite_decimales'],
      material: ['nro_lote', 'nro_serie', 'fecha_vencimiento', 'cantidad_actual', 'cantidad_reservada', 'costo_unitario', 'fecha_ingreso'],
      activo: ['codigo_interno', 'nro_serie', 'nombre_asignado', 'estado', 'fecha_adquisicion', 'fecha_compra', 'costo_adquisicion', 'costo_compra', 'ubicacion', 'notas'],
    };
    let camposAMostrar: string[] = [];
    if (anterior.visibilidad !== undefined || nuevo.visibilidad !== undefined) {
      camposAMostrar = camposRelevantes.inventario;
    } else if (anterior.tipo !== undefined || nuevo.tipo !== undefined || anterior.subtipo_material !== undefined) {
      camposAMostrar = camposRelevantes.producto;
    } else if (anterior.nro_lote !== undefined || anterior.fecha_vencimiento !== undefined || nuevo.cantidad_actual !== undefined) {
      camposAMostrar = camposRelevantes.material;
    } else if (anterior.estado !== undefined || anterior.nombre_asignado !== undefined) {
      camposAMostrar = camposRelevantes.activo;
    } else {
      const todosCampos = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
      camposAMostrar = Array.from(todosCampos).filter(campo =>
        !campo.startsWith('_') && !['id', 'created_at', 'updated_at', 'deleted_at', 'activo'].includes(campo)
      );
    }

    const campos: string[] = [];
    const valoresAnteriores: { [key: string]: string } = {};
    const valoresNuevos: { [key: string]: string } = {};
    const camposModificados = new Set<string>();
    const nombresAmigables: { [key: string]: string } = {
      nombre: 'Nombre',
      visibilidad: 'Visibilidad',
      modo_estricto: 'Modo Estricto',
      descripcion: 'Descripción',
      tipo: 'Tipo',
      subtipo_material: 'Subtipo Material',
      subtipo_activo_fijo: 'Subtipo Activo',
      stock_minimo: 'Stock Mínimo',
      unidad_medida: 'Unidad de Medida',
      notificar_stock_bajo: 'Notificar Stock Bajo',
      permite_decimales: 'Permite Decimales',
      nro_lote: 'Nro. Lote',
      nro_serie: 'Nro. Serie',
      fecha_vencimiento: 'Fecha Vencimiento',
      cantidad_actual: 'Cantidad Actual',
      cantidad_reservada: 'Cantidad Reservada',
      costo_unitario: 'Costo Unitario',
      fecha_ingreso: 'Fecha Ingreso',
      codigo_interno: 'Código Interno',
      nombre_asignado: 'Nombre Asignado',
      estado: 'Estado',
      fecha_adquisicion: 'Fecha Adquisición',
      fecha_compra: 'Fecha Compra',
      costo_adquisicion: 'Costo Adquisición',
      costo_compra: 'Costo Compra',
      ubicacion: 'Ubicación',
      notas: 'Notas'
    };

    camposAMostrar.forEach(campo => {
      const valorAnterior = anterior[campo];
      const valorNuevo = nuevo[campo];
      if (valorAnterior === undefined && valorNuevo === undefined) return;

      const sonDiferentes = JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo);
      const nombreCampo = nombresAmigables[campo] || campo.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      campos.push(nombreCampo);
      valoresAnteriores[nombreCampo] = formatearValor(valorAnterior);
      valoresNuevos[nombreCampo] = formatearValor(valorNuevo);

      if (sonDiferentes) {
        camposModificados.add(nombreCampo);
      }
    });

    return { campos, valoresAnteriores, valoresNuevos, camposModificados };
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return 'SIN DATOS';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (typeof valor === 'object') {
      if (Array.isArray(valor)) return valor.length > 0 ? JSON.stringify(valor) : '-';
      return JSON.stringify(valor);
    }
    return String(valor);
  };

  const inventarios_filtrados = inventarios.filter(inv =>
    inv.nombre.toLowerCase().includes(busqueda_inventarios.toLowerCase())
  );

  const productos_filtrados = productos.filter(p => {
    const coincide_busqueda = p.nombre.toLowerCase().includes(busqueda_productos.toLowerCase());
    const coincide_tipo = filtro_tipo_producto === 'todos' || filtro_tipo_producto === p.tipo;
    return coincide_busqueda && coincide_tipo && p.activo;
  });


  if (cargando) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <MenuLateral />
        <Toaster />
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
                      : 'Comienza creando tu primer inventario para gestionar productos y materiales'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {inventarios_filtrados.map((inventario) => {
                  return (
                    <Card
                      key={inventario.id}
                      className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer"
                      onClick={() => verDetalleInventario(inventario)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {inventario.nombre}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialogoEditarInventario(inventario);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialogoConfirmarEliminar(inventario);
                              }}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {inventario.resumen && (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="group p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Valor</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  ${(inventario.resumen.valor_total || 0).toFixed(2)}
                                </span>
                              </div>

                              <div className="group p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Productos</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_productos}
                                </span>
                              </div>

                              <div className="group p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Box className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Consumibles</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_consumibles}
                                </span>
                              </div>

                              <div className="group p-2 bg-muted/50 rounded-md border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Activos</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {inventario.resumen.total_activos}
                                </span>
                              </div>
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
                  onClick={volverALista}
                  variant="outline"
                  size="sm"
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{inventario_seleccionado?.nombre}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => abrirDialogoEditarInventario(inventario_seleccionado!)}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>

            {reporte_valor && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Valor Total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      ${(reporte_valor.valor_total || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Consumibles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">
                      ${((reporte_valor as any).valor_materiales || reporte_valor.valor_consumibles || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_materiales} materiales
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Activos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">
                      ${(reporte_valor.valor_activos || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reporte_valor.cantidad_activos} activos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Productos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productos.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {productos.filter(p => obtenerStockTotal(p) < (p.stock_minimo ?? 0)).length} con stock bajo
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <Tabs value={tab_activo} onValueChange={(value) => setTabActivo(value as any)} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="productos">
                  <Box className="h-4 w-4 mr-2" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="kardex">
                  <History className="h-4 w-4 mr-2" />
                  Kardex
                </TabsTrigger>
                <TabsTrigger value="auditoria">
                  <Shield className="h-4 w-4 mr-2" />
                  Actividad
                </TabsTrigger>
                <TabsTrigger value="bitacora">
                  <History className="h-4 w-4 mr-2" />
                  Bitácora
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="productos" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="p-6 pb-4 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2 flex-1">
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
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="material">Materiales</SelectItem>
                        <SelectItem value="activo_fijo">Activos Fijos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => inventario_seleccionado && cargarDetalleInventario(inventario_seleccionado)}
                      title="Recargar"
                      disabled={!inventario_seleccionado || cargando_detalle}
                    >
                      <RefreshCw className={`h-4 w-4 ${cargando_detalle ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={abrirDialogoNuevoProducto}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                {cargando_detalle ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : productos_filtrados.length === 0 ? (
                  <div className="text-center py-12">
                    <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
                    <p className="text-sm text-muted-foreground">
                      {busqueda_productos ? 'No se encontraron productos con ese nombre' : 'Comienza agregando productos al inventario'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productos_filtrados.map((producto) => {
                      const stock_total = obtenerStockTotal(producto);
                      const valor_total = obtenerValorTotal(producto);
                      const stock_bajo = stock_total < (producto.stock_minimo ?? 0);
                      const esta_cargando = productos_cargando.has(producto.id);

                      return (
                        <Card key={producto.id} className={`${stock_bajo ? 'border-yellow-500' : ''} relative`}>
                          {esta_cargando && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                                <Badge className={`${obtenerColorTipoGestion(producto.tipo)} text-white`}>
                                  {obtenerEtiquetaTipoGestion(producto.tipo)}
                                </Badge>
                                {stock_bajo && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Stock Bajo
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {producto.tipo === 'material' && (
                                  <Button
                                    onClick={() => abrirDialogoNuevoMaterial(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    Registrar Entrada
                                  </Button>
                                )}
                                {producto.tipo === 'activo_fijo' && (
                                  <Button
                                    onClick={() => abrirDialogoNuevoActivo(producto)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Registrar Activo
                                  </Button>
                                )}
                                <Button
                                  onClick={() => abrirDialogoEditarProducto(producto)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => abrirDialogoConfirmarEliminarProducto(producto)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {producto.descripcion && (
                              <CardDescription>{producto.descripcion}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Stock Total</p>
                                  <p className="text-lg font-semibold">
                                    {stock_total} {producto.unidad_medida}
                                  </p>
                                </div>
                              </div>
                              {producto.tipo === 'material' && (
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                                    <p className="text-lg font-semibold">
                                      {producto.stock_minimo} {producto.unidad_medida}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Valor Total</p>
                                  <p className="text-lg font-semibold">${valor_total.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>

                            {producto.tipo === 'material' && producto.materiales && producto.materiales.length > 0 && (
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2 text-sm">Materiales Disponibles</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Identificación</TableHead>
                                      <TableHead>Stock</TableHead>
                                      <TableHead>Costo Unit.</TableHead>
                                      <TableHead>Vencimiento</TableHead>
                                      <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {producto.materiales.map((material) => {
                                      const vencido = estaVencido(material.fecha_vencimiento);
                                      return (
                                        <TableRow
                                          key={material.id}
                                          className={vencido ? 'bg-destructive/10 hover:bg-destructive/20' : ''}
                                        >
                                          <TableCell className={`font-medium ${vencido ? 'text-destructive' : ''}`}>
                                            {material.nro_lote || material.nro_serie || '-'}
                                          </TableCell>
                                          <TableCell className={vencido ? 'text-destructive' : ''}>
                                            {material.cantidad_actual} {producto.unidad_medida}
                                          </TableCell>
                                          <TableCell className={vencido ? 'text-destructive' : ''}>
                                            ${Number(material.costo_unitario || 0).toFixed(2)}
                                          </TableCell>
                                          <TableCell className={vencido ? 'text-destructive font-semibold' : ''}>
                                            {material.fecha_vencimiento
                                              ? format(new Date(material.fecha_vencimiento), 'dd/MM/yyyy')
                                              : 'Sin vencimiento'
                                            }
                                            {vencido && ' (VENCIDO)'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end">
                                              <Button
                                                onClick={() => abrirDialogoAjusteStock(producto, material)}
                                                size="sm"
                                                variant="outline"
                                              >
                                                <Settings className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                onClick={() => abrirDialogoConfirmarEliminarMaterial(material)}
                                                size="sm"
                                                variant="destructive"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}

                            {producto.tipo === 'activo_fijo' && producto.activos && producto.activos.length > 0 && (
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2 text-sm">Activos Registrados</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Identificación</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Ubicación</TableHead>
                                      <TableHead>Costo</TableHead>
                                      <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {producto.activos
                                      .filter((activo) => activo.estado !== 'vendido' && activo.estado !== 'desechado')
                                      .map((activo) => (
                                        <TableRow key={activo.id}>
                                          <TableCell className="font-medium">
                                            {activo.nombre_asignado || activo.nro_serie || '-'}
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={activo.estado}
                                              onValueChange={(value) => manejarCambioEstadoActivo(producto, activo, value)}
                                            >
                                              <SelectTrigger className="h-8 w-[140px]">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {getEstadosParaSubtipo(producto.subtipo_activo_fijo).map((estado) => (
                                                  <SelectItem key={estado.valor} value={estado.valor}>
                                                    {estado.etiqueta}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>{activo.ubicacion || '-'}</TableCell>
                                          <TableCell>${Number(activo.costo_compra || 0).toFixed(2)}</TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end">
                                              <Button
                                                onClick={() => abrirDialogoVenderActivo(activo)}
                                                size="sm"
                                                variant="outline"
                                                title="Vender"
                                              >
                                                <DollarSign className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                onClick={() => abrirDialogoEditarActivo(producto, activo)}
                                                size="sm"
                                                variant="outline"
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                onClick={() => abrirDialogoConfirmarEliminarActivo(activo)}
                                                size="sm"
                                                variant="destructive"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="kardex" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Kardex (Movimientos de Inventario)
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_kardex}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_kardex}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={cargarHistorial} title="Recargar" disabled={cargando_kardex}>
                        <RefreshCw className={`h-4 w-4 ${cargando_kardex ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {cargando_kardex ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Operación</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Usuario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kardex.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell>{format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>{mov.tipo}</TableCell>
                            <TableCell>
                              <Badge variant={mov.operacion === 'entrada' ? 'default' : 'destructive'}>
                                {mov.operacion}
                              </Badge>
                            </TableCell>
                            <TableCell>{mov.producto?.nombre || '-'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {(mov as any).material?.nro_lote || (mov as any).material?.nro_serie || '-'}
                            </TableCell>
                            <TableCell>
                              {mov.producto?.permite_decimales !== false
                                ? Number(mov.cantidad).toFixed(2)
                                : Math.round(Number(mov.cantidad))}
                            </TableCell>
                            <TableCell>
                              {mov.producto?.permite_decimales !== false
                                ? `${Number(mov.stock_anterior).toFixed(2)} → ${Number(mov.stock_nuevo).toFixed(2)}`
                                : `${Math.round(Number(mov.stock_anterior))} → ${Math.round(Number(mov.stock_nuevo))}`}
                            </TableCell>
                            <TableCell>{mov.usuario?.nombre || 'Desconocido'}</TableCell>
                          </TableRow>
                        ))}
                        {kardex.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No hay movimientos registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bitacora" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Bitácora (Historial de Activos)
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_bitacora}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_bitacora}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={cargarHistorial} title="Recargar" disabled={cargando_bitacora}>
                        <RefreshCw className={`h-4 w-4 ${cargando_bitacora ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {cargando_bitacora ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Activo</TableHead>
                          <TableHead>Identificación</TableHead>
                          <TableHead>Cambio de Estado</TableHead>
                          <TableHead>Usuario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bitacora.map((evento) => (
                          <TableRow key={evento.id}>
                            <TableCell>{format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>{evento.activo?.nombre_asignado || evento.activo?.codigo_interno || '-'}</TableCell>
                            <TableCell>{evento.activo?.nro_serie || evento.activo?.codigo_interno || '-'}</TableCell>
                            <TableCell>
                              {evento.estado_anterior && evento.estado_nuevo ? (
                                <span className="flex items-center gap-2">
                                  <Badge variant="secondary">{evento.estado_anterior}</Badge>
                                  <span>→</span>
                                  <Badge variant="default">{evento.estado_nuevo}</Badge>
                                </span>
                              ) : (
                                <Badge>{evento.estado_nuevo || '-'}</Badge>
                              )}
                            </TableCell>
                            <TableCell>{evento.usuario?.nombre || 'Desconocido'}</TableCell>
                          </TableRow>
                        ))}
                        {bitacora.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No hay eventos registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="auditoria" className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Actividad
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogoFiltrosHistorialAbierto(true)}
                        className="relative"
                        disabled={cargando_auditoria}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {contarFiltrosHistorialActivos() > 0 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground">
                            {contarFiltrosHistorialActivos()}
                          </Badge>
                        )}
                      </Button>
                      {contarFiltrosHistorialActivos() > 0 && (
                        <Button variant="outline" onClick={limpiarFiltrosHistorial} disabled={cargando_auditoria}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={cargarHistorial} title="Recargar" disabled={cargando_auditoria}>
                        <RefreshCw className={`h-4 w-4 ${cargando_auditoria ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {cargando_auditoria ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Identificación</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Detalles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditoria.map((reg) => (
                          <TableRow key={reg.id}>
                            <TableCell>{format(new Date(reg.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {reg.accion?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="secondary" className="w-fit text-xs">
                                  {reg.categoria?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-'}
                                </Badge>
                                <span className="text-sm">
                                  {reg.producto?.nombre ||
                                    (reg.material as any)?.producto?.nombre ||
                                    reg.activo?.nombre_asignado ||
                                    reg.activo?.nro_serie ||
                                    '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reg.material?.nro_lote || reg.material?.nro_serie || reg.activo?.nro_serie || reg.activo?.codigo_interno || '-'}
                            </TableCell>
                            <TableCell>{reg.usuario?.nombre || 'Desconocido'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDetallesAuditoriaSeleccionada(reg);
                                  setDialogoDetallesAuditoriaAbierto(true);
                                }}
                              >
                                Ver cambios
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {auditoria.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No hay registros de actividad
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
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

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="modo-estricto">Modo Estricto</Label>
                <p className="text-sm text-muted-foreground">
                  Validar disponibilidad de stock antes de permitir crear citas con materiales
                </p>
              </div>
              <Switch
                id="modo-estricto"
                checked={formulario_inventario.modo_estricto}
                onCheckedChange={(checked) => setFormularioInventario({
                  ...formulario_inventario,
                  modo_estricto: checked
                })}
              />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el inventario "{inventario_a_eliminar?.nombre}"?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
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

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_producto">Nombre *</Label>
                <Input
                  id="nombre_producto"
                  value={formulario_producto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, nombre: e.target.value })}
                  placeholder="Nombre del producto..."
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="tipo_producto" className="text-base font-medium">
                    {formulario_producto.tipo === 'material' ? 'Material (Consumible)' : 'Activo Fijo'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formulario_producto.tipo === 'material'
                      ? 'Recursos que se consumen y agotan (fármacos, guantes, etc.)'
                      : 'Equipos o instrumentos con ciclo de vida (sillas, autoclaves, etc.)'}
                  </p>
                </div>
                <Switch
                  id="tipo_producto"
                  checked={formulario_producto.tipo === 'activo_fijo'}
                  onCheckedChange={(checked) => setFormularioProducto({
                    ...formulario_producto,
                    tipo: checked ? 'activo_fijo' : 'material'
                  })}
                  disabled={modo_edicion_producto}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formulario_producto.tipo === 'material' ? (
                  <div className="space-y-2">
                    <Label htmlFor="subtipo_material">Subtipo de Material *</Label>
                    <Select
                      value={formulario_producto.subtipo_material}
                      onValueChange={(value: 'con_lote_vencimiento' | 'con_serie' | 'sin_lote') =>
                        setFormularioProducto({ ...formulario_producto, subtipo_material: value })
                      }
                      disabled={modo_edicion_producto}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subtipos_material.map((subtipo) => (
                          <SelectItem key={subtipo.valor} value={subtipo.valor}>
                            <div className="flex flex-col">
                              <span>{subtipo.etiqueta}</span>
                              <span className="text-xs text-muted-foreground">{subtipo.descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="subtipo_activo">Subtipo de Activo *</Label>
                    <Select
                      value={formulario_producto.subtipo_activo_fijo}
                      onValueChange={(value: 'instrumental' | 'mobiliario_equipo') =>
                        setFormularioProducto({ ...formulario_producto, subtipo_activo_fijo: value })
                      }
                      disabled={modo_edicion_producto}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subtipos_activo_fijo.map((subtipo) => (
                          <SelectItem key={subtipo.valor} value={subtipo.valor}>
                            <div className="flex flex-col">
                              <span>{subtipo.etiqueta}</span>
                              <span className="text-xs text-muted-foreground">{subtipo.descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formulario_producto.tipo === 'material' && (
                  <div className="space-y-2">
                    <Label htmlFor="unidad_medida">Unidad de Medida *</Label>
                    <Input
                      id="unidad_medida"
                      value={formulario_producto.unidad_medida}
                      onChange={(e) => setFormularioProducto({ ...formulario_producto, unidad_medida: e.target.value })}
                      placeholder="Ej: cajas, frascos, ml, gramos..."
                    />
                  </div>
                )}
              </div>

              {formulario_producto.tipo === 'material' && (
                <div className="space-y-2 pt-1">
                  <Label className="text-sm font-medium">Formato de Cantidad</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`border rounded-md p-3 transition-all relative ${formulario_producto.permite_decimales === false
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : modo_edicion_producto
                          ? 'opacity-50 cursor-not-allowed border-muted'
                          : 'hover:bg-muted/50 border-muted cursor-pointer'
                        }`}
                      onClick={() => {
                        if (modo_edicion_producto) return;
                        let nuevo_stock_minimo = formulario_producto.stock_minimo;
                        if (nuevo_stock_minimo.includes('.')) {
                          nuevo_stock_minimo = nuevo_stock_minimo.split('.')[0];
                        }
                        setFormularioProducto({
                          ...formulario_producto,
                          permite_decimales: false,
                          stock_minimo: nuevo_stock_minimo
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">Solo Enteros</span>
                        {formulario_producto.permite_decimales === false && (
                          <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ej: 10 {formulario_producto.unidad_medida || 'unidades'}
                      </div>
                    </div>

                    <div
                      className={`border rounded-md p-3 transition-all relative ${formulario_producto.permite_decimales !== false
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : modo_edicion_producto
                          ? 'opacity-50 cursor-not-allowed border-muted'
                          : 'hover:bg-muted/50 border-muted cursor-pointer'
                        }`}
                      onClick={() => {
                        if (modo_edicion_producto) return;
                        let nuevo_stock_minimo = formulario_producto.stock_minimo;
                        if (nuevo_stock_minimo && !nuevo_stock_minimo.includes('.')) {
                          nuevo_stock_minimo = nuevo_stock_minimo + '.00';
                        }
                        setFormularioProducto({
                          ...formulario_producto,
                          permite_decimales: true,
                          stock_minimo: nuevo_stock_minimo
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">Con Decimales</span>
                        {formulario_producto.permite_decimales !== false && (
                          <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ej: 1.5 {formulario_producto.unidad_medida || 'unidades'}
                      </div>
                    </div>
                  </div>
                  {modo_edicion_producto && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      El formato de cantidad no se puede cambiar una vez creado el producto.
                    </p>
                  )}
                </div>
              )}
              {formulario_producto.tipo === 'material' && (
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      step={formulario_producto.permite_decimales !== false ? '0.01' : '1'}
                      min="0"
                      placeholder={formulario_producto.permite_decimales !== false ? '0.00' : '0'}
                      value={formulario_producto.stock_minimo}
                      onKeyDown={(e) => {
                        // Prevenir decimales si permite_decimales es false
                        if (formulario_producto.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                          e.preventDefault();
                        }
                        // Prevenir letras y caracteres especiales (excepto números, punto, teclas de control)
                        const isNumber = /^[0-9]$/.test(e.key);
                        const isDecimalPoint = e.key === '.' || e.key === ',';
                        const isControlKey = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key);
                        const isCopyPaste = (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase());

                        if (!isNumber && !isDecimalPoint && !isControlKey && !isCopyPaste) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        let valor = e.target.value;
                        // Si no permite decimales, remover cualquier decimal
                        if (formulario_producto.permite_decimales === false && valor.includes('.')) {
                          valor = valor.split('.')[0];
                        }
                        // Si permite decimales, limitar a 2 decimales
                        if (formulario_producto.permite_decimales !== false && valor.includes('.')) {
                          const partes = valor.split('.');
                          if (partes[1] && partes[1].length > 2) {
                            valor = partes[0] + '.' + partes[1].substring(0, 2);
                          }
                        }
                        setFormularioProducto({ ...formulario_producto, stock_minimo: valor });
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pb-2.5">
                    <Switch
                      id="notificar_stock_bajo"
                      checked={formulario_producto.notificar_stock_bajo}
                      onCheckedChange={(checked) => setFormularioProducto({ ...formulario_producto, notificar_stock_bajo: checked })}
                    />
                    <Label htmlFor="notificar_stock_bajo" className="cursor-pointer text-sm">
                      Notificar bajo stock
                    </Label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formulario_producto.descripcion}
                  onChange={(e) => setFormularioProducto({ ...formulario_producto, descripcion: e.target.value })}
                  placeholder="Descripción del producto (opcional)"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{producto_a_eliminar?.nombre}"?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarProductoAbierto(false);
                setProductoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarProducto}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_material_abierto} onOpenChange={setDialogoMaterialAbierto}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Registrar Nuevo Material
            </DialogTitle>
            <DialogDescription>
              Registra una entrada de material para {producto_seleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {producto_seleccionado?.subtipo_material === 'con_lote_vencimiento' && (
                <div className="space-y-2">
                  <Label htmlFor="nro_lote">Número de Lote</Label>
                  <Input
                    id="nro_lote"
                    value={formulario_material.nro_lote}
                    onChange={(e) => setFormularioMaterial({ ...formulario_material, nro_lote: e.target.value })}
                    placeholder="L001-2024"
                  />
                </div>
              )}
              {producto_seleccionado?.subtipo_material === 'con_serie' && (
                <div className="space-y-2">
                  <Label htmlFor="nro_serie">Número de Serie</Label>
                  <Input
                    id="nro_serie"
                    value={formulario_material.nro_serie}
                    onChange={(e) => setFormularioMaterial({ ...formulario_material, nro_serie: e.target.value })}
                    placeholder="SN-001"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  step={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                  min={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                  placeholder={producto_seleccionado?.permite_decimales !== false ? '0.00' : '0'}
                  value={formulario_material.cantidad}
                  onKeyDown={(e) => {
                    if (producto_seleccionado?.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    let valor = e.target.value;
                    if (producto_seleccionado?.permite_decimales === false && valor.includes('.')) {
                      valor = valor.split('.')[0];
                    }
                    setFormularioMaterial({ ...formulario_material, cantidad: valor });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo_total">Costo Total *</Label>
              <Input
                id="costo_total"
                type="number"
                step="0.01"
                min="0"
                value={formulario_material.costo_total}
                onChange={(e) => setFormularioMaterial({ ...formulario_material, costo_total: e.target.value })}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
                <DateTimePicker
                  valor={formulario_material.fecha_compra}
                  onChange={(fecha) => setFormularioMaterial({ ...formulario_material, fecha_compra: fecha || new Date() })}
                />
              </div>

              {producto_seleccionado?.subtipo_material === 'con_lote_vencimiento' && (
                <div className="space-y-2">
                  <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                  <DatePicker
                    valor={formulario_material.fecha_vencimiento}
                    onChange={(fecha) => setFormularioMaterial({ ...formulario_material, fecha_vencimiento: fecha })}
                    fromYear={2025}
                    toYear={2125}
                    deshabilitarAnteriores
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_egreso_material"
                checked={formulario_material.registrar_egreso}
                onCheckedChange={(checked) => setFormularioMaterial({ ...formulario_material, registrar_egreso: checked })}
              />
              <Label htmlFor="registrar_egreso_material" className="cursor-pointer flex items-center gap-2">
                {formulario_material.registrar_egreso ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Se registrará un GASTO en finanzas
                  </>
                ) : (
                  'No afectar finanzas'
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoMaterialAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarGuardarMaterial} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Material'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_material_abierto} onOpenChange={setDialogoConfirmarEliminarMaterialAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este material?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarMaterialAbierto(false);
                setMaterialAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarMaterial}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ajuste_stock_abierto} onOpenChange={setDialogoAjusteStockAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Ajusta el stock del material {material_seleccionado?.nro_lote || material_seleccionado?.nro_serie || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ajuste">Tipo de Ajuste *</Label>
              <div className="flex items-center space-x-4">
                <Switch
                  id="tipo_ajuste"
                  checked={formulario_ajuste_stock.tipo_ajuste === 'decremento'}
                  onCheckedChange={(checked) => setFormularioAjusteStock({ ...formulario_ajuste_stock, tipo_ajuste: checked ? 'decremento' : 'incremento' })}
                />
                <Label htmlFor="tipo_ajuste" className="cursor-pointer">
                  {formulario_ajuste_stock.tipo_ajuste === 'incremento' ? (
                    <span className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      Entrada (Incrementar Stock)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Minus className="h-5 w-5 text-red-600" />
                      Salida (Reducir Stock)
                    </span>
                  )}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_ajuste">Cantidad *</Label>
              <Input
                id="cantidad_ajuste"
                type="number"
                step={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                min={producto_seleccionado?.permite_decimales !== false ? '0.01' : '1'}
                placeholder={producto_seleccionado?.permite_decimales !== false ? '0.00' : '0'}
                value={formulario_ajuste_stock.cantidad}
                onKeyDown={(e) => {
                  if (producto_seleccionado?.permite_decimales === false && (e.key === '.' || e.key === ',')) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  let nueva_cantidad = e.target.value;
                  if (producto_seleccionado?.permite_decimales === false && nueva_cantidad.includes('.')) {
                    nueva_cantidad = nueva_cantidad.split('.')[0];
                  }
                  const cantidad_num = parseFloat(nueva_cantidad || '0');
                  const costo_unitario = material_seleccionado ? Number(material_seleccionado.costo_unitario || 0) : 0;
                  const nuevo_monto = (cantidad_num * costo_unitario).toFixed(2);
                  setFormularioAjusteStock({
                    ...formulario_ajuste_stock,
                    cantidad: nueva_cantidad,
                    monto: nuevo_monto
                  });
                }}
              />
              {material_seleccionado && (
                <p className="text-sm text-muted-foreground">
                  Stock actual: {material_seleccionado.cantidad_actual} {producto_seleccionado?.unidad_medida}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_ajuste">
                Monto {formulario_ajuste_stock.tipo_ajuste === 'incremento' ? '(Costo de Compra)' : '(Precio de Venta)'} *
              </Label>
              <Input
                id="monto_ajuste"
                type="number"
                step="0.01"
                min="0"
                value={formulario_ajuste_stock.monto}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioAjusteStock({ ...formulario_ajuste_stock, monto: valor });
                }}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_ajuste">Motivo del ajuste</Label>
              <Input
                id="motivo_ajuste"
                type="text"
                placeholder="Ej: Corrección de inventario, Compra, Venta..."
                value={formulario_ajuste_stock.motivo}
                onChange={(e) => setFormularioAjusteStock({ ...formulario_ajuste_stock, motivo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_ajuste">Fecha y Hora del Ajuste *</Label>
              <DateTimePicker
                valor={formulario_ajuste_stock.fecha_ajuste}
                onChange={(fecha) => setFormularioAjusteStock({ ...formulario_ajuste_stock, fecha_ajuste: fecha || new Date() })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="generar_movimiento_ajuste"
                checked={formulario_ajuste_stock.generar_movimiento_financiero}
                onCheckedChange={(checked) => setFormularioAjusteStock({ ...formulario_ajuste_stock, generar_movimiento_financiero: checked })}
              />
              <Label htmlFor="generar_movimiento_ajuste" className="cursor-pointer flex items-center gap-2">
                {formulario_ajuste_stock.generar_movimiento_financiero ? (
                  formulario_ajuste_stock.tipo_ajuste === 'decremento' ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Se registrará un INGRESO en finanzas
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Se registrará un GASTO en finanzas
                    </>
                  )
                ) : (
                  'No afectar finanzas'
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAjusteStockAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarAjusteStock} disabled={guardando}>
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

      <Dialog open={dialogo_activo_abierto} onOpenChange={setDialogoActivoAbierto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_activo ? 'Editar Activo' : 'Registrar Nuevo Activo'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_activo
                ? `Modifica la información del activo`
                : `Registra un nuevo activo de ${producto_seleccionado?.nombre}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {producto_seleccionado?.subtipo_activo_fijo === 'instrumental' && (
              <div className="space-y-2">
                <Label htmlFor="nro_serie">Número de Serie</Label>
                <Input
                  id="nro_serie"
                  value={formulario_activo.nro_serie}
                  onChange={(e) => setFormularioActivo({ ...formulario_activo, nro_serie: e.target.value })}
                  placeholder="SN-123456"
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
                placeholder="Equipo Sala 1"
              />
            </div>

            {!modo_edicion_activo && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="costo_compra">Costo de Compra *</Label>
                  <Input
                    id="costo_compra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formulario_activo.costo_compra}
                    onChange={(e) => setFormularioActivo({ ...formulario_activo, costo_compra: e.target.value })}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
                  <DateTimePicker
                    valor={formulario_activo.fecha_compra}
                    onChange={(fecha) => setFormularioActivo({ ...formulario_activo, fecha_compra: fecha || new Date() })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formulario_activo.estado}
                onValueChange={(value) => setFormularioActivo({ ...formulario_activo, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getEstadosParaSubtipo(producto_seleccionado?.subtipo_activo_fijo).map((estado) => (
                    <SelectItem key={estado.valor} value={estado.valor}>
                      {estado.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <Label htmlFor="registrar_egreso_activo" className="cursor-pointer">
                  Registrar egreso en finanzas
                </Label>
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
                modo_edicion_activo ? 'Guardar Cambios' : 'Registrar Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_activo_abierto} onOpenChange={setDialogoConfirmarEliminarActivoAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este activo?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarActivoAbierto(false);
                setActivoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarActivo}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_cambio_desechado_abierto} onOpenChange={setDialogoConfirmarCambioDesechadoAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas marcar este activo como desechado?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-semibold mb-1">
              ⚠️ Esta acción eliminará permanentemente el activo
            </p>
            <p className="text-sm text-destructive">
              Cambiar el estado a "desechado" eliminará este activo del inventario. Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarCambioDesechadoAbierto(false);
                setActivoADesechar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarCambioDesechado}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Marcar como Desechado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_vender_activo_abierto} onOpenChange={setDialogoVenderActivoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="h-5 w-5 flex items-center justify-center text-red-600 font-bold text-xl">−</span>
              Vender Activo
            </DialogTitle>
            <DialogDescription>
              Registra la venta de {activo_seleccionado?.nombre_asignado || activo_seleccionado?.nro_serie || 'este activo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monto_venta">Monto de Venta *</Label>
              <Input
                id="monto_venta"
                type="number"
                step="0.01"
                min="0"
                value={formulario_venta_activo.monto_venta}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioVentaActivo({ ...formulario_venta_activo, monto_venta: valor });
                }}
                onBlur={(e) => {
                  const valor = parseFloat(e.target.value || '0').toFixed(2);
                  setFormularioVentaActivo({ ...formulario_venta_activo, monto_venta: valor });
                }}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
              />
              {activo_seleccionado && (
                <p className="text-sm text-muted-foreground">
                  Costo de compra: ${Number(activo_seleccionado.costo_compra).toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_venta">Fecha y Hora de la Venta *</Label>
              <DateTimePicker
                valor={formulario_venta_activo.fecha_venta}
                onChange={(fecha) => setFormularioVentaActivo({ ...formulario_venta_activo, fecha_venta: fecha || new Date() })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="registrar_pago_venta"
                checked={formulario_venta_activo.registrar_pago}
                onCheckedChange={(checked) => setFormularioVentaActivo({ ...formulario_venta_activo, registrar_pago: checked })}
              />
              <Label htmlFor="registrar_pago_venta" className="cursor-pointer flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Registrar ingreso en finanzas
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoVenderActivoAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={manejarVenderActivo} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vendiendo...
                </>
              ) : (
                'Vender Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_filtros_historial_abierto} onOpenChange={setDialogoFiltrosHistorialAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filtros de Historial</DialogTitle>
            <DialogDescription>
              Filtra los registros de {tab_activo === 'kardex' ? 'Kardex' : tab_activo === 'bitacora' ? 'Bitácora' : 'Auditoría'} por fecha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <DatePicker
                valor={filtros_historial.fecha_inicio}
                onChange={(date) => setFiltrosHistorial({ ...filtros_historial, fecha_inicio: date })}
                placeholder="Seleccionar fecha de inicio"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <DatePicker
                valor={filtros_historial.fecha_fin}
                onChange={(date) => setFiltrosHistorial({ ...filtros_historial, fecha_fin: date })}
                placeholder="Seleccionar fecha de fin"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoFiltrosHistorialAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={aplicarFiltrosHistorial}>
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_detalles_auditoria_abierto} onOpenChange={setDialogoDetallesAuditoriaAbierto}>
        <DialogContent className="sm:max-w-[900px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalles del Cambio</DialogTitle>
            <DialogDescription>
              Comparación de valores antes y después de la modificación
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden py-4">
            {detalles_auditoria_seleccionada && (() => {
              const resultado = compararCambios(detalles_auditoria_seleccionada.datos_anteriores, detalles_auditoria_seleccionada.datos_nuevos);

              if (resultado.campos.length === 0) {
                return <p className="text-center text-muted-foreground">No hay cambios detectados o registrados.</p>;
              }

              return (
                <ScrollArea className="h-full w-full border rounded-md">
                  <div className="min-w-max pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Estado</TableHead>
                          {resultado.campos.map((campo, idx) => (
                            <TableHead key={idx} className="whitespace-nowrap px-4">{campo}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Antes</TableCell>
                          {resultado.campos.map((campo, idx) => (
                            <TableCell key={idx} className="whitespace-nowrap px-4">
                              {resultado.valoresAnteriores[campo]}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Ahora</TableCell>
                          {resultado.campos.map((campo, idx) => (
                            <TableCell
                              key={idx}
                              className={`whitespace-nowrap px-4 ${resultado.camposModificados.has(campo) ? 'text-red-600 font-medium bg-red-50 dark:bg-red-900/20' : ''}`}
                            >
                              {resultado.valoresNuevos[campo]}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogoDetallesAuditoriaAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}