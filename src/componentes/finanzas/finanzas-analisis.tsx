import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Checkbox } from '@/componentes/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Loader2, Filter, Search, AlertTriangle, TrendingUp, TrendingDown, DollarSign, BarChart3, LineChart as LineChartIcon, Calendar, Edit, Trash2 } from 'lucide-react';
import { finanzasApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/componentes/ui/badge';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { formatearFechaLocal } from '@/lib/utilidades';
import { Movimiento, DatosGrafico } from '@/tipos';

interface AnalisisData {
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  movimientos: Movimiento[];
  datos_grafico: DatosGrafico[];
  granularidad: string;
}

export function FinanzasAnalisis() {
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(new Date().setHours(0, 0, 0, 0)),
    fecha_fin: new Date(new Date().setHours(23, 59, 59, 999)),
    glosa: '',
    sensible_mayusculas: false,
    nivel_precision: 'equilibrio' as 'alta' | 'equilibrio' | 'global',
  });

  const [data, setData] = useState<AnalisisData | null>(null);
  const [todos_movimientos, setTodosMovimientos] = useState<Movimiento[]>([]);
  const [busqueda_local, setBusquedaLocal] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pagina_actual, setPaginaActual] = useState(1);
  const [items_por_pagina, setItemsPorPagina] = useState(12);
  const [tipo_visualizacion, setTipoVisualizacion] = useState<'barras' | 'lineas' | 'area'>('barras');
  const [modo_grafico, setModoGrafico] = useState<'ingresos-egresos' | 'balance'>('ingresos-egresos');
  const [tipo_balance, setTipoBalance] = useState<'simple' | 'area'>('simple');

  const [dialogo_ingreso_abierto, setDialogoIngresoAbierto] = useState(false);
  const [dialogo_egreso_abierto, setDialogoEgresoAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [guardando_ingreso, setGuardandoIngreso] = useState(false);
  const [guardando_egreso, setGuardandoEgreso] = useState(false);
  const [movimiento_seleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [movimiento_a_eliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);

  const [formulario_ingreso, setFormularioIngreso] = useState({
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
    cargarAnalisis();
  }, [filtros.nivel_precision]);

  useEffect(() => {
    filtrarMovimientosLocalmente();
  }, [busqueda_local, filtros.sensible_mayusculas, todos_movimientos]);

  const filtrarMovimientosLocalmente = () => {
    if (!busqueda_local.trim()) {
      setData(prev => prev ? { ...prev, movimientos: todos_movimientos } : null);
      return;
    }

    const termino = filtros.sensible_mayusculas
      ? busqueda_local
      : busqueda_local.toLowerCase();

    const filtrados = todos_movimientos.filter(mov => {
      const concepto = filtros.sensible_mayusculas
        ? mov.concepto
        : mov.concepto?.toLowerCase();
      return concepto?.includes(termino);
    });

    setData(prev => prev ? { ...prev, movimientos: filtrados } : null);
    setPaginaActual(1);
  };

  const cargarAnalisis = async () => {
    if (!filtros.fecha_inicio || !filtros.fecha_fin) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un rango de fechas',
        variant: 'destructive',
      });
      return;
    }

    setCargando(true);
    try {
      const filtros_api = {
        fecha_inicio: formatearFechaLocal(filtros.fecha_inicio),
        fecha_fin: formatearFechaLocal(filtros.fecha_fin),
        glosa: filtros.glosa,
        sensible_mayusculas: filtros.sensible_mayusculas,
        nivel_precision: filtros.nivel_precision,
      };

      const resultado = await finanzasApi.obtenerAnalisis(filtros_api);
      setData(resultado);
      setTodosMovimientos(resultado.movimientos || []);
      setPaginaActual(1);
    } catch (error) {
      console.error('Error al cargar análisis:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el análisis financiero',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const abrirEditarIngreso = (movimiento: Movimiento) => {
    setFormularioIngreso({
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
    });
    setMovimientoSeleccionado(movimiento);
    setDialogoIngresoAbierto(true);
  };

  const abrirEditarEgreso = (movimiento: Movimiento) => {
    setFormularioEgreso({
      concepto: movimiento.concepto || '',
      fecha: new Date(movimiento.fecha),
      monto: movimiento.monto.toString(),
    });
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
      const datos: any = {
        fecha: formulario_ingreso.fecha,
        monto,
        concepto: formulario_ingreso.concepto,
      };

      await finanzasApi.actualizarPago(movimiento_seleccionado!.id, datos);
      toast({
        title: 'Éxito',
        description: 'Ingreso actualizado correctamente',
      });

      setDialogoIngresoAbierto(false);
      await cargarAnalisis();
    } catch (error: any) {
      console.error('Error al actualizar ingreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el ingreso',
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
      const datos: any = {
        concepto: formulario_egreso.concepto,
        fecha: formulario_egreso.fecha,
        monto,
      };

      await finanzasApi.actualizarEgreso(movimiento_seleccionado!.id, datos);
      toast({
        title: 'Éxito',
        description: 'Egreso actualizado correctamente',
      });

      setDialogoEgresoAbierto(false);
      await cargarAnalisis();
    } catch (error: any) {
      console.error('Error al actualizar egreso:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el egreso',
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
      await cargarAnalisis();
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el movimiento',
        variant: 'destructive',
      });
    }
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(monto);
  };

  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const formatearFechaHora = (fecha: Date | string): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${dia} ${mes} ${anio} ${horas}:${minutos}`.trim();
  };
  const movimientos_paginados = data?.movimientos.slice(
    (pagina_actual - 1) * items_por_pagina,
    pagina_actual * items_por_pagina
  ) || [];

  const total_paginas = data ? Math.ceil(data.movimientos.length / items_por_pagina) : 0;

  const getOpcionesGranularidad = () => {
    if (!filtros.fecha_inicio || !filtros.fecha_fin) return { alta: 'Alta', equilibrio: 'Media', global: 'Baja' };

    const diffTime = Math.abs(filtros.fecha_fin.getTime() - filtros.fecha_inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return { alta: 'Cada 30 min', equilibrio: 'Cada 1 Hora', global: 'Cada 4 Horas' };
    if (diffDays <= 3) return { alta: 'Cada 1 Hora', equilibrio: 'Cada 2 Horas', global: 'Cada 6 Horas' };
    if (diffDays <= 7) return { alta: 'Cada 4 Horas', equilibrio: 'Cada 8 Horas', global: 'Cada 12 Horas' };
    if (diffDays <= 21) return { alta: 'Cada 12 Horas', equilibrio: 'Diario', global: 'Cada 2 Días' };
    if (diffDays <= 90) return { alta: 'Diario', equilibrio: 'Cada 3 Días', global: 'Semanal' };
    if (diffDays <= 365) return { alta: 'Semanal', equilibrio: 'Quincenal', global: 'Mensual' };
    if (diffDays <= 1825) return { alta: 'Mensual', equilibrio: 'Trimestral', global: 'Semestral' };
    return { alta: 'Semestral', equilibrio: 'Anual', global: null };
  };

  const opciones_granularidad = getOpcionesGranularidad();
  const es_largo_plazo = opciones_granularidad.global === null;

  if (cargando && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Análisis Financiero
        </h2>
        <p className="text-muted-foreground">
          Explora y analiza los movimientos financieros con detalle
        </p>
      </div>

      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <DateTimePicker
                valor={filtros.fecha_inicio}
                onChange={(fecha) => fecha && setFiltros({ ...filtros, fecha_inicio: fecha })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <DateTimePicker
                valor={filtros.fecha_fin}
                onChange={(fecha) => fecha && setFiltros({ ...filtros, fecha_fin: fecha })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Filtrar por Concepto</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar movimientos por concepto..."
                  value={filtros.glosa}
                  onChange={(e) => setFiltros({ ...filtros, glosa: e.target.value })}
                  className={`pl-8 ${filtros.glosa ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500' : ''}`}
                />
              </div>
              {filtros.glosa && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Se buscarán todos los movimientos que contengan: "{filtros.glosa}"
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="opacity-0">Espacio</Label>
              <div className="flex items-center gap-3 h-10">
                <Checkbox
                  id="sensible"
                  checked={filtros.sensible_mayusculas}
                  onCheckedChange={(checked: boolean | "indeterminate") => setFiltros({ ...filtros, sensible_mayusculas: checked === true })}
                  className="h-5 w-5"
                />
                <Label htmlFor="sensible" className="text-sm cursor-pointer">
                  Distinguir mayúsculas y minúsculas en la búsqueda
                </Label>
              </div>
            </div>
          </div>

          <Button onClick={cargarAnalisis} disabled={cargando} className="w-full md:w-auto">
            {cargando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
            Analizar Periodo
          </Button>
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatearMoneda(data.total_ingresos)}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatearMoneda(data.total_egresos)}</div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 shadow-sm ${data.balance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatearMoneda(data.balance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-lg">
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle>Evolución Financiera</CardTitle>
                  <CardDescription>
                    Visualización temporal con granularidad: <Badge variant="outline">{data.granularidad}</Badge>
                  </CardDescription>
                </div>

                <div className="flex gap-2 bg-secondary/30 p-1 rounded-lg">
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
                  <Tabs value={filtros.nivel_precision} onValueChange={(v) => setFiltros({ ...filtros, nivel_precision: v as any })} className="flex-1">
                    <TabsList className={`grid w-full ${es_largo_plazo ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      <TabsTrigger value="alta">{opciones_granularidad.alta}</TabsTrigger>
                      <TabsTrigger value="equilibrio">{opciones_granularidad.equilibrio}</TabsTrigger>
                      {!es_largo_plazo && <TabsTrigger value="global">{opciones_granularidad.global}</TabsTrigger>}
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
              </div>
            </CardHeader>
            <CardContent>
              {cargando ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {modo_grafico === 'ingresos-egresos' ? (
                      tipo_visualizacion === 'barras' ? (
                        <BarChart data={data.datos_grafico}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                          <Legend />
                          <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                          <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                        </BarChart>
                      ) : (
                        <LineChart data={data.datos_grafico}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                          <Legend />
                          <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} name="Ingresos" />
                          <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={2} name="Egresos" />
                        </LineChart>
                      )
                    ) : (
                      tipo_balance === 'area' ? (
                        <AreaChart data={data.datos_grafico.map(d => {
                          const balance = d.ingresos - d.egresos;
                          return {
                            ...d,
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
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                          <Legend />
                          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                          <Area type="monotone" dataKey="balance_pos" stroke="#22c55e" fillOpacity={1} fill="url(#colorBalancePositivo)" name="Balance +" />
                          <Area type="monotone" dataKey="balance_neg" stroke="#ef4444" fillOpacity={1} fill="url(#colorBalanceNegativo)" name="Balance -" />
                        </AreaChart>
                      ) : (
                        <BarChart data={data.datos_grafico.map(d => {
                          const balance = d.ingresos - d.egresos;
                          return {
                            ...d,
                            balance_positivo: balance >= 0 ? balance : 0,
                            balance_negativo: balance < 0 ? balance : 0
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                          <Legend />
                          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
                          <Bar dataKey="balance_positivo" fill="#22c55e" name="Balance +" />
                          <Bar dataKey="balance_negativo" fill="#ef4444" name="Balance -" />
                        </BarChart>
                      )
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-lg">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Detalle de Movimientos</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Mostrar:</Label>
                    <Select
                      value={items_por_pagina.toString()}
                      onValueChange={(v) => {
                        setItemsPorPagina(Number(v));
                        setPaginaActual(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value={data.movimientos.length.toString()}>Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en movimientos cargados..."
                    value={busqueda_local}
                    onChange={(e) => setBusquedaLocal(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <CardDescription>
                {data.movimientos.length} movimientos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movimientos_paginados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron movimientos con los filtros actuales.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {movimientos_paginados.map((mov) => (
                      <div
                        key={`${mov.tipo}-${mov.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-full ${mov.tipo === 'ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {mov.tipo === 'ingreso' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{mov.concepto}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatearFechaHora(mov.fecha)}
                              {mov.cita_id && <Badge variant="outline" className="ml-2 text-[10px]">Cita #{mov.cita_id}</Badge>}
                            </div>
                          </div>
                          <div className={`font-bold ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(mov.monto)}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => mov.tipo === 'ingreso'
                              ? abrirEditarIngreso(mov)
                              : abrirEditarEgreso(mov)
                            }
                            className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoConfirmarEliminar(mov)}
                            className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {total_paginas > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={pagina_actual === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {pagina_actual} de {total_paginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual(p => Math.min(total_paginas, p + 1))}
                      disabled={pagina_actual === total_paginas}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )
      }

      <Dialog open={dialogo_ingreso_abierto} onOpenChange={setDialogoIngresoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Ingreso</DialogTitle>
            <DialogDescription>
              Modifica los datos del ingreso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concepto_ingreso">Concepto *</Label>
              <Input
                id="concepto_ingreso"
                placeholder="Ej: Pago de consulta"
                value={formulario_ingreso.concepto}
                onChange={(e) => setFormularioIngreso({ ...formulario_ingreso, concepto: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

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
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_egreso_abierto} onOpenChange={setDialogoEgresoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Egreso</DialogTitle>
            <DialogDescription>
              Modifica los datos del egreso
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
              Actualizar
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
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
