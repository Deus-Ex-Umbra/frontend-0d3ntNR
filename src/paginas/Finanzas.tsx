import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, FileText, Loader2, AlertCircle, Edit, Trash2, X, BarChart3, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { finanzasApi, agendaApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@/componentes/ui/date-picker';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { SearchInput } from '@/componentes/ui/search-input';
import { formatearFechaISO } from '@/lib/utilidades';

interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: Date;
  monto: number;
  concepto: string;
  cita_id?: number;
  plan_tratamiento_id?: number;
}

interface ReporteFinanzas {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  movimientos: Movimiento[];
}

interface Cita {
  id: number;
  fecha: Date;
  descripcion: string;
  monto_esperado: number;
  estado_pago: string;
  paciente?: {
    nombre: string;
    apellidos: string;
  };
  plan_tratamiento?: {
    id: number;
  };
}

interface DatosGrafico {
  periodo: string;
  ingresos: number;
  egresos: number;
}

export default function Finanzas() {
  const [reporte, setReporte] = useState<ReporteFinanzas | null>(null);
  const [reporte_general, setReporteGeneral] = useState<ReporteFinanzas | null>(null);
  const [datos_grafico, setDatosGrafico] = useState<DatosGrafico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_grafico, setCargandoGrafico] = useState(false);
  
  const [dialogo_ingreso_abierto, setDialogoIngresoAbierto] = useState(false);
  const [dialogo_egreso_abierto, setDialogoEgresoAbierto] = useState(false);
  const [dialogo_filtros_abierto, setDialogoFiltrosAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [guardando_ingreso, setGuardandoIngreso] = useState(false);
  const [guardando_egreso, setGuardandoEgreso] = useState(false);
  const [modo_edicion_ingreso, setModoEdicionIngreso] = useState(false);
  const [modo_edicion_egreso, setModoEdicionEgreso] = useState(false);
  const [movimiento_seleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [movimiento_a_eliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);
  
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando_datos, setCargandoDatos] = useState(false);

  const [tipo_grafico, setTipoGrafico] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [fecha_grafico, setFechaGrafico] = useState(new Date());

  const [filtros, setFiltros] = useState({
    fecha_inicio: undefined as Date | undefined,
    fecha_fin: undefined as Date | undefined,
    busqueda: '',
  });

  const [filtros_aplicados, setFiltrosAplicados] = useState(false);

  const [formulario_ingreso, setFormularioIngreso] = useState({
    cita_id: '',
    concepto: '',
    fecha: new Date(),
    monto: '',
  });

  const [formulario_egreso, setFormularioEgreso] = useState({
    concepto: '',
    fecha: new Date(),
    monto: '',
  });

  useEffect(() => {
    cargarReporteGeneral();
    cargarDatosGrafico();
  }, []);

  useEffect(() => {
    cargarDatosGrafico();
  }, [tipo_grafico, fecha_grafico]);

  const cargarReporteGeneral = async () => {
    setCargando(true);
    try {
      const datos = await finanzasApi.obtenerReporte();
      setReporte(datos);
      setReporteGeneral(datos);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reporte financiero',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosGrafico = async () => {
    setCargandoGrafico(true);
    try {
      const fecha_local = new Date(fecha_grafico);
      const anio = fecha_local.getFullYear();
      const mes = String(fecha_local.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha_local.getDate()).padStart(2, '0');
      const fecha_str = `${anio}-${mes}-${dia}T12:00:00`;
      
      const datos = await finanzasApi.obtenerDatosGrafico(tipo_grafico, fecha_str);
      setDatosGrafico(datos);
    } catch (error) {
      console.error('Error al cargar datos del gráfico:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del gráfico',
        variant: 'destructive',
      });
    } finally {
      setCargandoGrafico(false);
    }
  };

  const cargarCitasSinPago = async () => {
    setCargandoDatos(true);
    try {
      const datos_citas = await agendaApi.obtenerCitasSinPago();
      setCitas(datos_citas);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const abrirDialogoFiltros = () => {
    if (!filtros.fecha_inicio && !filtros.fecha_fin) {
      const ahora = new Date();
      const inicio = new Date(ahora);
      inicio.setHours(0, 0, 0, 0);
      
      const fin = new Date(ahora);
      fin.setHours(23, 59, 59, 999);
      
      setFiltros({
        ...filtros,
        fecha_inicio: inicio,
        fecha_fin: fin,
      });
    }
    setDialogoFiltrosAbierto(true);
  };

  const manejarFiltrarPorFechas = async () => {
    if (!filtros.fecha_inicio || !filtros.fecha_fin) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar ambas fechas',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inicio_str = formatearFechaISO(filtros.fecha_inicio);
      const fin_str = formatearFechaISO(filtros.fecha_fin);
      
      const datos = await finanzasApi.obtenerReporte(inicio_str, fin_str);
      setReporte(datos);
      setFiltrosAplicados(true);
      setDialogoFiltrosAbierto(false);
      
      toast({
        title: 'Filtros aplicados',
        description: `Mostrando movimientos desde ${formatearFechaHora(filtros.fecha_inicio)} hasta ${formatearFechaHora(filtros.fecha_fin)}`,
      });
    } catch (error) {
      console.error('Error al filtrar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aplicar el filtro',
        variant: 'destructive',
      });
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: undefined,
      fecha_fin: undefined,
      busqueda: '',
    });
    setReporte(reporte_general);
    setFiltrosAplicados(false);
    setDialogoFiltrosAbierto(false);
    
    toast({
      title: 'Filtros limpiados',
      description: 'Mostrando todos los movimientos',
    });
  };

  const contarFiltrosActivos = () => {
    let contador = 0;
    if (filtros.fecha_inicio && filtros.fecha_fin) contador++;
    if (filtros.busqueda) contador++;
    return contador;
  };

  const abrirDialogoIngreso = () => {
    setFormularioIngreso({
      cita_id: '',
      concepto: '',
      fecha: new Date(),
      monto: '',
    });
    setModoEdicionIngreso(false);
    setMovimientoSeleccionado(null);
    cargarCitasSinPago();
    setDialogoIngresoAbierto(true);
  };

  const abrirDialogoEgreso = () => {
    setFormularioEgreso({
      concepto: '',
      fecha: new Date(),
      monto: '',
    });
    setModoEdicionEgreso(false);
    setMovimientoSeleccionado(null);
    setDialogoEgresoAbierto(true);
  };

  const abrirEditarIngreso = (movimiento: Movimiento) => {
    setFormularioIngreso({
      cita_id: movimiento.cita_id?.toString() || '',
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
    });
    setModoEdicionIngreso(true);
    setMovimientoSeleccionado(movimiento);
    setDialogoIngresoAbierto(true);
  };

  const abrirEditarEgreso = (movimiento: Movimiento) => {
    setFormularioEgreso({
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
    });
    setModoEdicionEgreso(true);
    setMovimientoSeleccionado(movimiento);
    setDialogoEgresoAbierto(true);
  };

  const manejarRegistrarIngreso = async () => {
    if (!formulario_ingreso.concepto || !formulario_ingreso.fecha || !formulario_ingreso.monto) {
      toast({
        title: 'Error',
        description: 'Concepto, fecha y monto son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const monto = parseFloat(formulario_ingreso.monto);
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoIngreso(true);
    try {
      if (modo_edicion_ingreso && movimiento_seleccionado) {
        const datos: any = {
          fecha: formulario_ingreso.fecha,
          monto,
          concepto: formulario_ingreso.concepto,
        };

        await finanzasApi.actualizarPago(movimiento_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Ingreso actualizado correctamente',
        });
      } else {
        const datos: any = {
          fecha: formulario_ingreso.fecha,
          monto,
          concepto: formulario_ingreso.concepto,
        };

        if (formulario_ingreso.cita_id) {
          datos.cita_id = parseInt(formulario_ingreso.cita_id);
        }

        await finanzasApi.registrarPago(datos);
        toast({
          title: 'Éxito',
          description: formulario_ingreso.cita_id 
            ? 'Ingreso registrado correctamente. La cita se marcó como pagada.'
            : 'Ingreso registrado correctamente.',
        });
      }

      setDialogoIngresoAbierto(false);
      await cargarReporteGeneral();
      if (filtros_aplicados && filtros.fecha_inicio && filtros.fecha_fin) {
        await manejarFiltrarPorFechas();
      }
      cargarDatosGrafico();
    } catch (error: any) {
      console.error('Error al registrar ingreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el ingreso',
        variant: 'destructive',
      });
    } finally {
      setGuardandoIngreso(false);
    }
  };

  const manejarRegistrarEgreso = async () => {
    if (!formulario_egreso.concepto || !formulario_egreso.fecha || !formulario_egreso.monto) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const monto = parseFloat(formulario_egreso.monto);
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser un número positivo',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoEgreso(true);
    try {
      if (modo_edicion_egreso && movimiento_seleccionado) {
        const datos: any = {
          concepto: formulario_egreso.concepto,
          fecha: formulario_egreso.fecha,
          monto,
        };

        await finanzasApi.actualizarEgreso(movimiento_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Egreso actualizado correctamente',
        });
      } else {
        const datos: any = {
          concepto: formulario_egreso.concepto,
          fecha: formulario_egreso.fecha,
          monto,
        };

        await finanzasApi.registrarEgreso(datos);
        toast({
          title: 'Éxito',
          description: 'Egreso registrado correctamente',
        });
      }

      setDialogoEgresoAbierto(false);
      await cargarReporteGeneral();
      if (filtros_aplicados && filtros.fecha_inicio && filtros.fecha_fin) {
        await manejarFiltrarPorFechas();
      }
      cargarDatosGrafico();
    } catch (error: any) {
      console.error('Error al registrar egreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo registrar el egreso',
        variant: 'destructive',
      });
    } finally {
      setGuardandoEgreso(false);
    }
  };

  const abrirDialogoConfirmarEliminar = (movimiento: Movimiento) => {
    setMovimientoAEliminar(movimiento);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarMovimiento = async () => {
    if (!movimiento_a_eliminar) return;

    try {
      if (movimiento_a_eliminar.tipo === 'ingreso') {
        await finanzasApi.eliminarPago(movimiento_a_eliminar.id);
      } else {
        await finanzasApi.eliminarEgreso(movimiento_a_eliminar.id);
      }

      toast({
        title: 'Éxito',
        description: `${movimiento_a_eliminar.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} eliminado correctamente`,
      });

      setDialogoConfirmarEliminarAbierto(false);
      setMovimientoAEliminar(null);
      await cargarReporteGeneral();
      if (filtros_aplicados && filtros.fecha_inicio && filtros.fecha_fin) {
        await manejarFiltrarPorFechas();
      }
      cargarDatosGrafico();
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
    }
  };

  const cambiarFechaGrafico = (direccion: number) => {
    const nueva_fecha = new Date(fecha_grafico);
    
    if (tipo_grafico === 'dia') {
      nueva_fecha.setDate(nueva_fecha.getDate() + direccion);
    } else if (tipo_grafico === 'mes') {
      nueva_fecha.setMonth(nueva_fecha.getMonth() + direccion);
    } else {
      nueva_fecha.setFullYear(nueva_fecha.getFullYear() + direccion);
    }
    
    setFechaGrafico(nueva_fecha);
  };

  const obtenerTituloGrafico = (): string => {
    if (tipo_grafico === 'dia') {
      return fecha_grafico.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
    } else if (tipo_grafico === 'mes') {
      return fecha_grafico.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    } else {
      return fecha_grafico.getFullYear().toString();
    }
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

  const formatearHora = (fecha: Date): string => {
    return new Date(fecha).toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
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

  const formatearFechaCita = (fecha: Date): string => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const manejarCambioFechaInicio = (fecha: Date | undefined) => {
    if (fecha && !filtros.fecha_inicio) {
      const nueva_fecha = new Date(fecha);
      nueva_fecha.setHours(0, 0, 0, 0);
      setFiltros({ ...filtros, fecha_inicio: nueva_fecha });
    } else {
      setFiltros({ ...filtros, fecha_inicio: fecha });
    }
  };

  const manejarCambioFechaFin = (fecha: Date | undefined) => {
    if (fecha && !filtros.fecha_fin) {
      const nueva_fecha = new Date(fecha);
      nueva_fecha.setHours(23, 59, 59, 999);
      setFiltros({ ...filtros, fecha_fin: nueva_fecha });
    } else {
      setFiltros({ ...filtros, fecha_fin: fecha });
    }
  };

  const opciones_citas: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Ingreso sin cita asociada' },
    ...citas.map(c => ({
      valor: c.id.toString(),
      etiqueta: `${formatearFechaCita(c.fecha)} - ${c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidos}` : c.descripcion} - ${formatearMoneda(c.monto_esperado || 0)}`
    }))
  ];

  const construirTextoCompletoBusqueda = (movimiento: Movimiento): string => {
    const texto_completo_partes: string[] = [];
    
    texto_completo_partes.push(formatearFechaHora(movimiento.fecha));
    texto_completo_partes.push(movimiento.concepto);
    texto_completo_partes.push(formatearMoneda(movimiento.monto));
    
    return texto_completo_partes.join(' ').toLowerCase();
  };

  const calcularPuntuacionBusqueda = (movimiento: Movimiento, termino: string): number => {
    const texto_completo = construirTextoCompletoBusqueda(movimiento);
    
    if (!texto_completo.includes(termino)) {
      return 0;
    }
    
    let puntuacion = 1;
    
    const concepto_lower = movimiento.concepto.toLowerCase();
    if (concepto_lower.includes(termino)) {
      puntuacion += 10;
      
      if (concepto_lower.startsWith(termino)) {
        puntuacion += 5;
      }
    }
    
    const fecha_formateada = formatearFechaHora(movimiento.fecha).toLowerCase();
    if (fecha_formateada.includes(termino)) {
      puntuacion += 5;
    }
    
    const monto_formateado = formatearMoneda(movimiento.monto).toLowerCase();
    if (monto_formateado.includes(termino)) {
      puntuacion += 3;
    }
    
    return puntuacion;
  };

  const cumpleFiltro = (movimiento: Movimiento): boolean => {
    if (!filtros.busqueda) return true;
    
    const termino_busqueda = filtros.busqueda.toLowerCase().trim();
    const puntuacion = calcularPuntuacionBusqueda(movimiento, termino_busqueda);
    
    return puntuacion > 0;
  };

  const agruparMovimientosPorDia = () => {
    const grupos: { [key: string]: Movimiento[] } = {};
    
    let movimientos_filtrados = reporte?.movimientos.filter(cumpleFiltro) || [];

    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase().trim();
      movimientos_filtrados = movimientos_filtrados.sort((a, b) => {
        const puntuacion_a = calcularPuntuacionBusqueda(a, termino);
        const puntuacion_b = calcularPuntuacionBusqueda(b, termino);
        return puntuacion_b - puntuacion_a;
      });
    }

    movimientos_filtrados.forEach(mov => {
      const fecha_str = formatearFecha(mov.fecha);
      if (!grupos[fecha_str]) {
        grupos[fecha_str] = [];
      }
      grupos[fecha_str].push(mov);
    });

    if (!filtros.busqueda) {
      Object.keys(grupos).forEach(fecha => {
        grupos[fecha].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      });
    }

    return grupos;
  };

  const movimientos_agrupados = agruparMovimientosPorDia();

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando reporte financiero...</p>
          </div>
        </div>
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
                Finanzas
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestión financiera de tu consultorio
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog open={dialogo_ingreso_abierto} onOpenChange={setDialogoIngresoAbierto}>
                <DialogTrigger asChild>
                  <Button size="lg" onClick={abrirDialogoIngreso} className="shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200 bg-green-600 hover:bg-green-700">
                    <Plus className="h-5 w-5 mr-2" />
                    Registrar Ingreso
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog open={dialogo_egreso_abierto} onOpenChange={setDialogoEgresoAbierto}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="destructive" onClick={abrirDialogoEgreso} className="shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200">
                    <Plus className="h-5 w-5 mr-2" />
                    Registrar Egreso
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Ingresos {filtros_aplicados && '(General)'}
                </CardTitle>
                <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {formatearMoneda(reporte_general?.total_ingresos || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Egresos {filtros_aplicados && '(General)'}
                </CardTitle>
                <div className="bg-red-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {formatearMoneda(reporte_general?.total_egresos || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Balance Total {filtros_aplicados && '(General)'}
                </CardTitle>
                <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  (reporte_general?.balance || 0) >= 0 ? 'text-primary' : 'text-destructive'
                }`}>
                  {formatearMoneda(reporte_general?.balance || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {filtros_aplicados && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 border-green-500/30 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ingresos (Filtro)
                  </CardTitle>
                  <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <Filter className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {formatearMoneda(reporte?.total_ingresos || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-500/30 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Egresos (Filtro)
                  </CardTitle>
                  <div className="bg-red-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <Filter className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {formatearMoneda(reporte?.total_egresos || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/50 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Balance (Filtro)
                  </CardTitle>
                  <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <Filter className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    (reporte?.balance || 0) >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {formatearMoneda(reporte?.balance || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Gráfico de Ingresos y Egresos</CardTitle>
                    <CardDescription>
                      Visualización de movimientos financieros - {obtenerTituloGrafico()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarFechaGrafico(-1)}
                    className="hover:bg-primary/20 hover:scale-110 transition-all duration-200"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFechaGrafico(new Date())}
                    className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarFechaGrafico(1)}
                    className="hover:bg-primary/20 hover:scale-110 transition-all duration-200"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={tipo_grafico} onValueChange={(value) => setTipoGrafico(value as 'dia' | 'mes' | 'ano')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="dia">Por Día</TabsTrigger>
                  <TabsTrigger value="mes">Por Mes</TabsTrigger>
                  <TabsTrigger value="ano">Por Año</TabsTrigger>
                </TabsList>

                <TabsContent value="dia" className="mt-0">
                  {cargando_grafico ? (
                    <div className="flex items-center justify-center h-80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatearMoneda(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                        <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>

                <TabsContent value="mes" className="mt-0">
                  {cargando_grafico ? (
                    <div className="flex items-center justify-center h-80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatearMoneda(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} name="Ingresos" />
                        <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} name="Egresos" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>

                <TabsContent value="ano" className="mt-0">
                  {cargando_grafico ? (
                    <div className="flex items-center justify-center h-80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatearMoneda(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                        <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Historial de Movimientos</CardTitle>
                    <CardDescription>
                      {Object.values(movimientos_agrupados).flat().length} de {reporte?.movimientos.length || 0} movimientos
                      {filtros.busqueda && ' (filtrados por búsqueda)'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={abrirDialogoFiltros}
                    className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200 relative"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filtros
                    {contarFiltrosActivos() > 0 && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">
                        {contarFiltrosActivos()}
                      </Badge>
                    )}
                  </Button>
                  {contarFiltrosActivos() > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={limpiarFiltros}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchInput
                valor={filtros.busqueda}
                onChange={(valor) => setFiltros({ ...filtros, busqueda: valor })}
                placeholder="Buscar por fecha, nombre de paciente, concepto o monto..."
                label="Buscar movimiento"
              />

              {Object.keys(movimientos_agrupados).length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      No hay movimientos registrados
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Los ingresos y egresos que registres aparecerán aquí
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(movimientos_agrupados).map(([fecha, movimientos_del_dia]) => (
                    <div key={fecha} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        <Calendar className="h-5 w-5 text-primary" />
                        {fecha}
                      </h3>
                      <div className="space-y-2 pl-7">
                        {movimientos_del_dia.map((movimiento) => (
                          <div
                            key={`${movimiento.tipo}-${movimiento.id}`}
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2 rounded-lg hover:scale-110 transition-transform duration-200 ${
                                movimiento.tipo === 'ingreso' 
                                  ? 'bg-green-500/10' 
                                  : 'bg-red-500/10'
                              }`}>
                                {movimiento.tipo === 'ingreso' ? (
                                  <TrendingUp className="h-5 w-5 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">
                                    {movimiento.concepto}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    • {formatearHora(movimiento.fecha)}
                                  </p>
                                </div>
                                {(movimiento.cita_id || movimiento.plan_tratamiento_id) && (
                                  <div className="flex gap-2 mt-1">
                                    {movimiento.cita_id && (
                                      <Badge variant="outline" className="text-xs">
                                        Cita #{movimiento.cita_id}
                                      </Badge>
                                    )}
                                    {movimiento.plan_tratamiento_id && (
                                      <Badge variant="outline" className="text-xs">
                                        Plan #{movimiento.plan_tratamiento_id}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className={`text-lg font-bold ${
                                movimiento.tipo === 'ingreso' 
                                  ? 'text-green-500' 
                                  : 'text-red-500'
                              }`}>
                                {movimiento.tipo === 'ingreso' ? '+' : '-'}
                                {formatearMoneda(movimiento.monto)}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => movimiento.tipo === 'ingreso' 
                                  ? abrirEditarIngreso(movimiento) 
                                  : abrirEditarEgreso(movimiento)
                                }
                                className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoConfirmarEliminar(movimiento)}
                                className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogo_filtros_abierto} onOpenChange={setDialogoFiltrosAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filtros de Finanzas</DialogTitle>
            <DialogDescription>
              Filtra los movimientos por rango de fechas con hora exacta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio</Label>
              <DateTimePicker
                valor={filtros.fecha_inicio}
                onChange={manejarCambioFechaInicio}
                placeholder="Selecciona fecha y hora de inicio"
              />
              <p className="text-xs text-muted-foreground">
                Por defecto: 00:00:00 del día seleccionado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Fecha y Hora de Fin</Label>
              <DateTimePicker
                valor={filtros.fecha_fin}
                onChange={manejarCambioFechaFin}
                placeholder="Selecciona fecha y hora de fin"
              />
              <p className="text-xs text-muted-foreground">
                Por defecto: 23:59:59 del día seleccionado
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Puedes ajustar manualmente las horas para rangos específicos. Los filtros incluyen todos los movimientos en el rango seleccionado, considerando la hora exacta.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={limpiarFiltros}
              className="hover:scale-105 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button
              onClick={manejarFiltrarPorFechas}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ingreso_abierto} onOpenChange={setDialogoIngresoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_ingreso ? 'Editar Ingreso' : 'Registrar Ingreso'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_ingreso 
                ? 'Modifica los datos del ingreso'
                : 'Registra un ingreso con o sin cita asociada'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concepto_ingreso">Concepto *</Label>
              <Input
                id="concepto_ingreso"
                placeholder="Ej: Pago de consulta, Dinero encontrado, Ingreso extra"
                value={formulario_ingreso.concepto}
                onChange={(e) => setFormularioIngreso({ ...formulario_ingreso, concepto: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {!modo_edicion_ingreso && (
              <div className="space-y-2">
                <Label htmlFor="cita">Cita (opcional)</Label>
                {cargando_datos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Combobox
                    opciones={opciones_citas}
                    valor={formulario_ingreso.cita_id}
                    onChange={(valor) => setFormularioIngreso({ ...formulario_ingreso, cita_id: valor })}
                    placeholder="Selecciona una cita"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Puedes asociar este ingreso a una cita existente o dejarlo sin cita
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_ingreso">Fecha *</Label>
                <DatePicker
                  valor={formulario_ingreso.fecha}
                  onChange={(fecha) => fecha && setFormularioIngreso({ ...formulario_ingreso, fecha })}
                  placeholder="Selecciona fecha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto_ingreso">Monto (Bs.) *</Label>
                <Input
                  id="monto_ingreso"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario_ingreso.monto}
                  onChange={(e) => setFormularioIngreso({ ...formulario_ingreso, monto: e.target.value })}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            {modo_edicion_ingreso && movimiento_seleccionado && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ No se puede cambiar la cita asociada de un ingreso existente
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoIngresoAbierto(false)}
              disabled={guardando_ingreso}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarRegistrarIngreso} 
              disabled={guardando_ingreso}
              className="bg-green-600 hover:bg-green-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_ingreso && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_ingreso ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_egreso_abierto} onOpenChange={setDialogoEgresoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_egreso ? 'Editar Egreso' : 'Registrar Egreso'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_egreso 
                ? 'Modifica los datos del egreso'
                : 'Registra un gasto o egreso de tu consultorio'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concepto_egreso">Concepto *</Label>
              <Textarea
                id="concepto_egreso"
                placeholder="Ej: Compra de materiales dentales"
                value={formulario_egreso.concepto}
                onChange={(e) => setFormularioEgreso({ ...formulario_egreso, concepto: e.target.value })}
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_egreso">Fecha *</Label>
                <DatePicker
                  valor={formulario_egreso.fecha}
                  onChange={(fecha) => fecha && setFormularioEgreso({ ...formulario_egreso, fecha })}
                  placeholder="Selecciona fecha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto_egreso">Monto (Bs.) *</Label>
                <Input
                  id="monto_egreso"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario_egreso.monto}
                  onChange={(e) => setFormularioEgreso({ ...formulario_egreso, monto: e.target.value })}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoEgresoAbierto(false)}
              disabled={guardando_egreso}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarRegistrarEgreso} 
              disabled={guardando_egreso}
              variant="destructive"
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_egreso && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_egreso ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este {movimiento_a_eliminar?.tipo === 'ingreso' ? 'ingreso' : 'egreso'}?
            </DialogDescription>
          </DialogHeader>
          
          {movimiento_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{movimiento_a_eliminar.concepto}</p>
              <p className="text-sm text-muted-foreground">
                {formatearFechaHora(movimiento_a_eliminar.fecha)}
              </p>
              <p className={`text-lg font-bold ${
                movimiento_a_eliminar.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatearMoneda(movimiento_a_eliminar.monto)}
              </p>
            </div>
          )}

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
                setMovimientoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminarMovimiento}
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