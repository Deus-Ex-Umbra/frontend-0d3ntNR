import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Loader2, AlertCircle, Clock, ChevronLeft, ChevronRight, DollarSign, Filter, X, AlertTriangle } from 'lucide-react';
import { agendaApi, pacientesApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { ajustarFechaParaBackend } from '@/lib/utilidades';

interface Cita {
  id: number;
  fecha: Date;
  descripcion: string;
  estado_pago: string | null;
  monto_esperado: number | null;
  horas_aproximadas: number;
  minutos_aproximados: number;
  paciente?: {
    id: number;
    nombre: string;
    apellidos: string;
    color_categoria?: string;
  } | null;
  plan_tratamiento?: {
    id: number;
  } | null;
}

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
}

export default function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citas_filtradas, setCitasFiltradas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mes_actual, setMesActual] = useState(new Date().getMonth() + 1);
  const [ano_actual, setAnoActual] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_filtros_abierto, setDialogoFiltrosAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [cita_seleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltros] = useState({
    paciente_id: '',
    estado_pago: '',
    busqueda: '',
    fecha_hora_inicio: undefined as Date | undefined,
    fecha_hora_fin: undefined as Date | undefined,
  });

  const [formulario, setFormulario] = useState({
    paciente_id: '',
    fecha: undefined as Date | undefined,
    descripcion: '',
    estado_pago: 'pendiente',
    monto_esperado: '',
    horas_aproximadas: '0',
    minutos_aproximados: '30',
  });

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const estados_pago = [
    { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-yellow-500' },
    { valor: 'pagado', etiqueta: 'Pagado', color: 'bg-green-500' },
    { valor: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-500' },
  ];

  useEffect(() => {
    cargarDatos();
  }, [mes_actual, ano_actual]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, filtros]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [datos_citas, datos_pacientes] = await Promise.all([
        agendaApi.obtenerPorMes(mes_actual, ano_actual),
        pacientesApi.obtenerTodos(),
      ]);
      setCitas(datos_citas);
      setPacientes(datos_pacientes);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...citas];

    if (filtros.fecha_hora_inicio && filtros.fecha_hora_fin) {
      resultado = resultado.filter(c => {
        const fecha_cita = new Date(c.fecha);
        return fecha_cita >= filtros.fecha_hora_inicio! && fecha_cita <= filtros.fecha_hora_fin!;
      });
    }

    if (filtros.paciente_id) {
      resultado = resultado.filter(c => c.paciente?.id.toString() === filtros.paciente_id);
    }

    if (filtros.estado_pago) {
      resultado = resultado.filter(c => c.estado_pago === filtros.estado_pago);
    }

    if (filtros.busqueda) {
      const busqueda_lower = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(c => 
        c.descripcion.toLowerCase().includes(busqueda_lower) ||
        (c.paciente && 
          `${c.paciente.nombre} ${c.paciente.apellidos}`.toLowerCase().includes(busqueda_lower))
      );
    }

    setCitasFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltros({
      paciente_id: '',
      estado_pago: '',
      busqueda: '',
      fecha_hora_inicio: undefined,
      fecha_hora_fin: undefined,
    });
    setDialogoFiltrosAbierto(false);
  };

  const contarFiltrosActivos = () => {
    let contador = 0;
    if (filtros.paciente_id) contador++;
    if (filtros.estado_pago) contador++;
    if (filtros.busqueda) contador++;
    if (filtros.fecha_hora_inicio && filtros.fecha_hora_fin) contador++;
    return contador;
  };

  const cambiarMes = (direccion: number) => {
    let nuevo_mes = mes_actual + direccion;
    let nuevo_ano = ano_actual;

    if (nuevo_mes > 12) {
      nuevo_mes = 1;
      nuevo_ano += 1;
    } else if (nuevo_mes < 1) {
      nuevo_mes = 12;
      nuevo_ano -= 1;
    }

    setMesActual(nuevo_mes);
    setAnoActual(nuevo_ano);
  };

  const abrirDialogoNuevo = () => {
    setFormulario({
      paciente_id: '',
      fecha: new Date(),
      descripcion: '',
      estado_pago: 'pendiente',
      monto_esperado: '',
      horas_aproximadas: '0',
      minutos_aproximados: '30',
    });
    setModoEdicion(false);
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = (cita: Cita) => {
    setFormulario({
      paciente_id: cita.paciente?.id.toString() || '',
      fecha: new Date(cita.fecha),
      descripcion: cita.descripcion,
      estado_pago: cita.estado_pago || 'pendiente',
      monto_esperado: cita.monto_esperado?.toString() || '',
      horas_aproximadas: (cita.horas_aproximadas || 0).toString(),
      minutos_aproximados: (cita.minutos_aproximados || 30).toString(),
    });
    setCitaSeleccionada(cita);
    setModoEdicion(true);
    setDialogoAbierto(true);
  };

  const manejarGuardar = async () => {
    if (!formulario.fecha || !formulario.descripcion) {
      toast({
        title: 'Error',
        description: 'Fecha y descripción son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    const horas = parseInt(formulario.horas_aproximadas);
    const minutos = parseInt(formulario.minutos_aproximados);

    if (isNaN(horas) || horas < 0 || isNaN(minutos) || minutos < 1) {
      toast({
        title: 'Error',
        description: 'La duración debe ser válida (mínimo 1 minuto)',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = {
        fecha: ajustarFechaParaBackend(formulario.fecha),
        descripcion: formulario.descripcion,
        horas_aproximadas: horas,
        minutos_aproximados: minutos,
      };

      if (formulario.paciente_id) {
        datos.paciente_id = parseInt(formulario.paciente_id);
        datos.estado_pago = formulario.estado_pago;
        datos.monto_esperado = formulario.monto_esperado ? parseFloat(formulario.monto_esperado) : 0;
      }

      if (modo_edicion && cita_seleccionada) {
        await agendaApi.actualizar(cita_seleccionada.id, datos);
        
        const estado_cambio = cita_seleccionada.estado_pago !== formulario.estado_pago;
        const cambio_a_pagado = cita_seleccionada.estado_pago !== 'pagado' && formulario.estado_pago === 'pagado';
        const cambio_desde_pagado = cita_seleccionada.estado_pago === 'pagado' && formulario.estado_pago !== 'pagado';
        
        if (estado_cambio && cita_seleccionada.plan_tratamiento) {
          if (cambio_a_pagado) {
            toast({
              title: 'Éxito',
              description: 'Cita actualizada y pago registrado automáticamente',
            });
          } else if (cambio_desde_pagado) {
            toast({
              title: 'Éxito',
              description: 'Cita actualizada y pago revertido automáticamente',
            });
          } else {
            toast({
              title: 'Éxito',
              description: 'Cita actualizada correctamente',
            });
          }
        } else {
          toast({
            title: 'Éxito',
            description: 'Cita actualizada correctamente',
          });
        }
      } else {
        await agendaApi.crear(datos);
        toast({
          title: 'Éxito',
          description: 'Cita creada correctamente',
        });
      }
      setDialogoAbierto(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar cita:', error);
      
      const mensaje_error = error.response?.data?.message || 'No se pudo guardar la cita';
      
      toast({
        title: 'Error - Conflicto de Horarios',
        description: (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{mensaje_error}</p>
            </div>
          </div>
        ),
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;

    try {
      await agendaApi.eliminar(id);
      toast({
        title: 'Éxito',
        description: 'Cita eliminada correctamente',
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cita',
        variant: 'destructive',
      });
    }
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

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(monto);
  };

  const formatearDuracion = (horas: number, minutos: number): string => {
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const obtenerColorEstado = (estado: string | null): string => {
    if (!estado) return 'bg-gray-500';
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.color || 'bg-gray-500';
  };

  const obtenerEtiquetaEstado = (estado: string | null): string => {
    if (!estado) return 'Sin estado';
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.etiqueta || estado;
  };

  const agruparCitasPorDia = () => {
    const grupos: { [key: string]: Cita[] } = {};
    
    citas_filtradas.forEach(cita => {
      const fecha_str = formatearFecha(cita.fecha);
      if (!grupos[fecha_str]) {
        grupos[fecha_str] = [];
      }
      grupos[fecha_str].push(cita);
    });

    Object.keys(grupos).forEach(fecha => {
      grupos[fecha].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    });

    return grupos;
  };

  const citas_agrupadas = agruparCitasPorDia();

  const opciones_pacientes: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Evento general (sin paciente)' },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const opciones_pacientes_filtro: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Todos los pacientes' },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const opciones_estados: OpcionCombobox[] = estados_pago.map(e => ({
    valor: e.valor,
    etiqueta: e.etiqueta
  }));

  const opciones_estados_filtro: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    ...estados_pago.map(e => ({
      valor: e.valor,
      etiqueta: e.etiqueta
    }))
  ];

  const tiene_paciente = formulario.paciente_id !== '';
  const filtros_fecha_activos = !!(filtros.fecha_hora_inicio && filtros.fecha_hora_fin);

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando agenda...</p>
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
                Agenda
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestiona tus citas y eventos
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setDialogoFiltrosAbierto(true)}
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
              <Button size="lg" className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200" onClick={abrirDialogoNuevo}>
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </Button>
            </div>
          </div>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {filtros_fecha_activos ? 'Citas Filtradas' : `${meses[mes_actual - 1]} ${ano_actual}`}
                    </CardTitle>
                    <CardDescription>
                      {citas_filtradas.length} de {citas.length} citas
                      {contarFiltrosActivos() > 0 && ' (filtradas)'}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarMes(-1)}
                    disabled={filtros_fecha_activos}
                    className="hover:bg-primary/20 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMesActual(new Date().getMonth() + 1);
                      setAnoActual(new Date().getFullYear());
                    }}
                    disabled={filtros_fecha_activos}
                    className="hover:bg-primary/20 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarMes(1)}
                    disabled={filtros_fecha_activos}
                    className="hover:bg-primary/20 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {citas_filtradas.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {contarFiltrosActivos() > 0 ? 'No hay citas que coincidan con los filtros' : 'No hay citas programadas'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {contarFiltrosActivos() > 0 
                        ? 'Intenta ajustar los filtros o crear una nueva cita'
                        : 'Crea tu primera cita para comenzar a organizar tu agenda'
                      }
                    </p>
                    {contarFiltrosActivos() > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limpiarFiltros}
                        className="mt-4"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar Filtros
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(citas_agrupadas).map(([fecha, citas_del_dia]) => (
                    <div key={fecha} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        <Calendar className="h-5 w-5 text-primary" />
                        {fecha}
                      </h3>
                      <div className="space-y-2 pl-7">
                        {citas_del_dia.map((cita) => (
                          <div
                            key={cita.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {cita.paciente?.color_categoria && (
                                <div
                                  className="w-1 h-12 rounded-full"
                                  style={{ backgroundColor: cita.paciente.color_categoria }}
                                />
                              )}
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                                  <Clock className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {formatearHora(cita.fecha)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {cita.paciente 
                                      ? `${cita.paciente.nombre} ${cita.paciente.apellidos}`
                                      : 'Evento general'}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <p className="text-sm text-foreground">{cita.descripcion}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Duración: {formatearDuracion(cita.horas_aproximadas, cita.minutos_aproximados)}
                                  </p>
                                  {cita.paciente && cita.monto_esperado && cita.monto_esperado > 0 && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      Monto esperado: {formatearMoneda(cita.monto_esperado)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {cita.paciente && (
                                <Badge className={`${obtenerColorEstado(cita.estado_pago)} text-white hover:scale-110 transition-transform duration-200`}>
                                  {obtenerEtiquetaEstado(cita.estado_pago)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoEditar(cita)}
                                className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => manejarEliminar(cita.id)}
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
            <DialogTitle>Filtros de Agenda</DialogTitle>
            <DialogDescription>
              Filtra las citas por paciente, estado o búsqueda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar por texto</Label>
              <Input
                placeholder="Buscar en descripción o paciente..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por paciente</Label>
              <Combobox
                opciones={opciones_pacientes_filtro}
                valor={filtros.paciente_id}
                onChange={(valor) => setFiltros({ ...filtros, paciente_id: valor })}
                placeholder="Selecciona un paciente"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtrar por estado de pago</Label>
              <Combobox
                opciones={opciones_estados_filtro}
                valor={filtros.estado_pago}
                onChange={(valor) => setFiltros({ ...filtros, estado_pago: valor })}
                placeholder="Selecciona un estado"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-base font-semibold">Filtrar por Intervalo de Fecha y Hora</Label>
              <p className="text-xs text-muted-foreground">
                Cuando uses este filtro, los botones de navegación de mes se deshabilitarán
              </p>
              
              <div className="space-y-2">
                <Label>Fecha y Hora de Inicio</Label>
                <DateTimePicker
                  valor={filtros.fecha_hora_inicio}
                  onChange={(fecha) => setFiltros({ ...filtros, fecha_hora_inicio: fecha })}
                  placeholder="Selecciona inicio"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha y Hora de Fin</Label>
                <DateTimePicker
                  valor={filtros.fecha_hora_fin}
                  onChange={(fecha) => setFiltros({ ...filtros, fecha_hora_fin: fecha })}
                  placeholder="Selecciona fin"
                />
              </div>
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
              onClick={() => setDialogoFiltrosAbierto(false)}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion 
                ? 'Modifica los detalles de la cita' 
                : 'Programa una nueva cita o evento'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente (opcional)</Label>
              <Combobox
                opciones={opciones_pacientes}
                valor={formulario.paciente_id}
                onChange={(valor) => setFormulario({ ...formulario, paciente_id: valor })}
                placeholder="Selecciona un paciente"
              />
              <p className="text-xs text-muted-foreground">
                Si no seleccionas un paciente, será un evento general sin estado ni monto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha y Hora *</Label>
              <DateTimePicker
                valor={formulario.fecha}
                onChange={(fecha) => setFormulario({ ...formulario, fecha })}
                placeholder="Selecciona fecha y hora"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                placeholder="Ej: Consulta general, Limpieza dental, Reunión..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label>Duración Aproximada</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horas_aproximadas" className="text-xs text-muted-foreground">
                    Horas
                  </Label>
                  <Input
                    id="horas_aproximadas"
                    type="number"
                    min="0"
                    value={formulario.horas_aproximadas}
                    onChange={(e) => setFormulario({ ...formulario, horas_aproximadas: e.target.value })}
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutos_aproximados" className="text-xs text-muted-foreground">
                    Minutos
                  </Label>
                  <Input
                    id="minutos_aproximados"
                    type="number"
                    min="1"
                    value={formulario.minutos_aproximados}
                    onChange={(e) => setFormulario({ ...formulario, minutos_aproximados: e.target.value })}
                    placeholder="30"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo estimado de la cita (para validación de conflictos de horario)
              </p>
            </div>

            {tiene_paciente && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado_pago">Estado de Pago</Label>
                    <Combobox
                      opciones={opciones_estados}
                      valor={formulario.estado_pago}
                      onChange={(valor) => setFormulario({ ...formulario, estado_pago: valor })}
                      placeholder="Estado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monto_esperado">Monto Esperado (Bs.)</Label>
                    <Input
                      id="monto_esperado"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formulario.monto_esperado}
                      onChange={(e) => setFormulario({ ...formulario, monto_esperado: e.target.value })}
                      placeholder="0.00"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardar} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}