import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Plus, FileText, Loader2, AlertCircle, Edit, Trash2, BarChart3, ChevronLeft, ChevronRight, LineChart as LineChartIcon, Search } from 'lucide-react';
import { finanzasApi, agendaApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { formatearFechaLocal } from '@/lib/utilidades';
import { Movimiento, ReporteFinanzas, DatosGrafico } from '@/tipos';

interface CitaFinanzas {
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

export function FinanzasMovimientos() {
  const [reporte, setReporte] = useState<ReporteFinanzas | null>(null);
  const [todos_movimientos, setTodosMovimientos] = useState<Movimiento[]>([]);
  const [datos_grafico, setDatosGrafico] = useState<DatosGrafico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_grafico, setCargandoGrafico] = useState(false);

  const [dialogo_ingreso_abierto, setDialogoIngresoAbierto] = useState(false);
  const [dialogo_egreso_abierto, setDialogoEgresoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [guardando_ingreso, setGuardandoIngreso] = useState(false);
  const [guardando_egreso, setGuardandoEgreso] = useState(false);
  const [modo_edicion_ingreso, setModoEdicionIngreso] = useState(false);
  const [modo_edicion_egreso, setModoEdicionEgreso] = useState(false);
  const [movimiento_seleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [movimiento_a_eliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);

  const [citas, setCitas] = useState<CitaFinanzas[]>([]);
  const [cargando_datos, setCargandoDatos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [tipo_grafico, setTipoGrafico] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [fecha_grafico, setFechaGrafico] = useState(new Date());
  const [modo_grafico, setModoGrafico] = useState<'ingresos-egresos' | 'balance'>('ingresos-egresos');
  const [tipo_visualizacion, setTipoVisualizacion] = useState<'barras' | 'lineas'>('barras');
  const [tipo_balance, setTipoBalance] = useState<'simple' | 'area'>('simple');

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
    cargarMovimientos();
  }, []);

  useEffect(() => {
    filtrarMovimientosLocalmente();
  }, [busqueda, todos_movimientos]);

  useEffect(() => {
    cargarDatosGrafico();
  }, []);

  useEffect(() => {
    cargarDatosGrafico();
  }, [tipo_grafico, fecha_grafico]);

  const filtrarMovimientosLocalmente = () => {
    if (!busqueda.trim()) {
      setReporte(prev => prev ? { ...prev, movimientos: todos_movimientos } : null);
      return;
    }

    const termino = busqueda.toLowerCase();
    const filtrados = todos_movimientos.filter(mov =>
      mov.concepto?.toLowerCase().includes(termino)
    );

    setReporte(prev => prev ? { ...prev, movimientos: filtrados } : null);
  };

  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const hoy = new Date();
      const inicio_ano = new Date(hoy.getFullYear(), 0, 1);
      inicio_ano.setHours(0, 0, 0, 0);
      const fin_ano = new Date(hoy.getFullYear(), 11, 31);
      fin_ano.setHours(23, 59, 59, 999);
      const inicio_ano_str = formatearFechaLocal(inicio_ano);
      const fin_ano_str = formatearFechaLocal(fin_ano);
      const inicio_hoy = new Date(hoy);
      inicio_hoy.setHours(0, 0, 0, 0);
      const fin_hoy = new Date(hoy);
      fin_hoy.setHours(23, 59, 59, 999);
      const inicio_hoy_str = formatearFechaLocal(inicio_hoy);
      const fin_hoy_str = formatearFechaLocal(fin_hoy);
      const datos_ano = await finanzasApi.obtenerReporte(inicio_ano_str, fin_ano_str);
      const datos_hoy = await finanzasApi.obtenerReporte(inicio_hoy_str, fin_hoy_str);
      setReporte({
        total_ingresos: datos_ano.total_ingresos,
        total_egresos: datos_ano.total_egresos,
        balance: datos_ano.balance,
        movimientos: datos_hoy.movimientos || [],
      });
      setTodosMovimientos(datos_hoy.movimientos || []);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los movimientos',
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

      const datos: DatosGrafico[] = await finanzasApi.obtenerDatosGrafico(tipo_grafico, fecha_str);
      setDatosGrafico(datos);
    } catch (error) {
      console.error('Error al cargar datos del grÃ¡fico:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del grÃ¡fico',
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
        description: 'El monto debe ser un nÃºmero positivo',
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
      await cargarMovimientos();
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
      await cargarMovimientos();
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
      await cargarMovimientos();
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

  const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const obtenerTituloGrafico = (): string => {
    const f = fecha_grafico;
    const dia = String(f.getDate()).padStart(2, '0');
    const mesLargo = MESES_LARGOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();

    if (tipo_grafico === 'dia') {
      return `${dia} ${mesLargo} ${anio}`.trim();
    } else if (tipo_grafico === 'mes') {
      return `${mesLargo} ${anio}`.trim();
    } else {
      return anio.toString();
    }
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(monto);
  };

  const formatearHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const formatearFechaHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };

  const formatearFechaCita = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };

  const opciones_citas: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Ingreso sin cita asociada' },
    ...citas.map(c => ({
      valor: c.id.toString(),
      etiqueta: `${formatearFechaCita(c.fecha)} - ${c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidos}` : c.descripcion} - ${formatearMoneda(c.monto_esperado || 0)}`
    }))
  ];

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {busqueda ? 'Resultados de Búsqueda' : 'Movimientos'}
          </h2>
          <p className="text-muted-foreground">
            {busqueda ? `Mostrando resultados para "${busqueda}"` : 'Resumen financiero'}
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
              Total Ingresos (Este Año)
            </CardTitle>
            <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {formatearMoneda(reporte?.total_ingresos || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Egresos (Este Año)
            </CardTitle>
            <div className="bg-red-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {formatearMoneda(reporte?.total_egresos || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance Total (Este Año)
            </CardTitle>
            <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${(reporte?.balance || 0) >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
              {formatearMoneda(reporte?.balance || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">GrÃ¡fico de Ingresos y Egresos</CardTitle>
                <CardDescription>
                  VisualizaciÃ³n de movimientos financieros - {obtenerTituloGrafico()}
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
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-2 bg-secondary/20 rounded-lg">
              <Button
                variant={modo_grafico === 'ingresos-egresos' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setModoGrafico('ingresos-egresos')}
                className="flex-1 hover:scale-105 transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ingresos/Egresos
              </Button>
              <Button
                variant={modo_grafico === 'balance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setModoGrafico('balance')}
                className="flex-1 hover:scale-105 transition-all duration-200"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Balance
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Tabs value={tipo_grafico} onValueChange={(value) => setTipoGrafico(value as 'dia' | 'mes' | 'ano')} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dia">Por Día</TabsTrigger>
                  <TabsTrigger value="mes">Por Mes</TabsTrigger>
                  <TabsTrigger value="ano">Por Año</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 shrink-0">
                {modo_grafico === 'ingresos-egresos' ? (
                  <>
                    <Button
                      variant={tipo_visualizacion === 'barras' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoVisualizacion('barras')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={tipo_visualizacion === 'lineas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoVisualizacion('lineas')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={tipo_balance === 'simple' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoBalance('simple')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={tipo_balance === 'area' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoBalance('area')}
                      className="hover:scale-105 transition-all duration-200"
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {cargando_grafico ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div style={{ width: '100%', height: '450px', minHeight: '450px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {modo_grafico === 'ingresos-egresos' ? (
                    tipo_visualizacion === 'barras' ? (
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
                    ) : (
                      <LineChart data={datos_grafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="periodo"
                          interval={tipo_grafico === 'dia' ? 0 : 'preserveStartEnd'}
                          angle={tipo_grafico === 'dia' ? -45 : 0}
                          textAnchor={tipo_grafico === 'dia' ? 'end' : 'middle'}
                          height={tipo_grafico === 'dia' ? 80 : 60}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => formatearMoneda(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} name="Ingresos" />
                        <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} name="Egresos" />
                      </LineChart>
                    )
                  ) : (
                    tipo_balance === 'area' ? (
                      <AreaChart data={datos_grafico.map(d => {
                        const balance = d.ingresos - d.egresos;
                        return {
                          periodo: d.periodo,
                          balance: balance,
                          balance_pos: balance >= 0 ? balance : 0,
                          balance_neg: balance < 0 ? balance : 0
                        };
                      })}>
                        <defs>
                          <linearGradient id="colorBalancePositivo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorBalanceNegativo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="periodo"
                          interval={tipo_grafico === 'dia' ? 0 : 'preserveStartEnd'}
                          angle={tipo_grafico === 'dia' ? -45 : 0}
                          textAnchor={tipo_grafico === 'dia' ? 'end' : 'middle'}
                          height={tipo_grafico === 'dia' ? 80 : 60}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (value === 0) return null;
                            return [formatearMoneda(value), name];
                          }}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                        <Area
                          type="monotone"
                          dataKey="balance_pos"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBalancePositivo)"
                          name="Balance +"
                          isAnimationActive={true}
                        />
                        <Area
                          type="monotone"
                          dataKey="balance_neg"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBalanceNegativo)"
                          name="Balance -"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={datos_grafico.map(d => {
                        const balance = d.ingresos - d.egresos;
                        return {
                          periodo: d.periodo,
                          balance_positivo: balance >= 0 ? balance : 0,
                          balance_negativo: balance < 0 ? balance : 0
                        };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => value === 0 ? null : formatearMoneda(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                        <Bar
                          dataKey="balance_positivo"
                          fill="#22c55e"
                          name="Balance +"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="balance_negativo"
                          fill="#ef4444"
                          name="Balance -"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Historial de Movimientos (Hoy)</CardTitle>
                <CardDescription>
                  {reporte?.movimientos.length || 0} movimientos registrados hoy
                </CardDescription>
              </div>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en movimientos de hoy..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!reporte?.movimientos || reporte.movimientos.length === 0) ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  No hay movimientos hoy
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Los ingresos y egresos que registres hoy aparecerÃ¡n aquÃ­
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                {reporte.movimientos.map((movimiento) => (
                  <div
                    key={`${movimiento.tipo}-${movimiento.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg hover:scale-110 transition-transform duration-200 ${movimiento.tipo === 'ingreso'
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
                            â€¢ {formatearHora(movimiento.fecha)}
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
                      <div className={`text-lg font-bold ${movimiento.tipo === 'ingreso'
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
          )}
        </CardContent>
      </Card >

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

            <div className="space-y-2">
              <Label htmlFor="fecha_ingreso">Fecha y Hora *</Label>
              <DateTimePicker
                valor={formulario_ingreso.fecha}
                onChange={(fecha) => fecha && setFormularioIngreso({ ...formulario_ingreso, fecha })}
                placeholder="Selecciona fecha y hora"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_ingreso">Monto (Bs.) *</Label>
              <Input
                id="monto_ingreso"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formulario_ingreso.monto}
                onChange={(e) => setFormularioIngreso({ ...formulario_ingreso, monto: e.target.value })}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {modo_edicion_ingreso && movimiento_seleccionado && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  âš ï¸ No se puede cambiar la cita asociada de un ingreso existente
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

            <div className="space-y-2">
              <Label htmlFor="fecha_egreso">Fecha y Hora *</Label>
              <DateTimePicker
                valor={formulario_egreso.fecha}
                onChange={(fecha) => fecha && setFormularioEgreso({ ...formulario_egreso, fecha })}
                placeholder="Selecciona fecha y hora"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_egreso">Monto (Bs.) *</Label>
              <Input
                id="monto_egreso"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formulario_egreso.monto}
                onChange={(e) => setFormularioEgreso({ ...formulario_egreso, monto: e.target.value })}
                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
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
            <DialogTitle>Confirmar EliminaciÃ³n</DialogTitle>
            <DialogDescription>
              Â¿EstÃ¡s seguro de que deseas eliminar este {movimiento_a_eliminar?.tipo === 'ingreso' ? 'ingreso' : 'egreso'}?
            </DialogDescription>
          </DialogHeader>

          {movimiento_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{movimiento_a_eliminar.concepto}</p>
              <p className="text-sm text-muted-foreground">
                {formatearFechaHora(movimiento_a_eliminar.fecha)}
              </p>
              <p className={`text-lg font-bold ${movimiento_a_eliminar.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
                }`}>
                {formatearMoneda(movimiento_a_eliminar.monto)}
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acciÃ³n no se puede deshacer.
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
    </div >
  );
}
