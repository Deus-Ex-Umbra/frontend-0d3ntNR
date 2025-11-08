import { useState, useEffect } from 'react';
import { MenuLateralMovil } from '@/componentes/MenuLateral_movil';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Loader2, AlertCircle, Clock, ChevronLeft, ChevronRight, DollarSign, Filter, X, AlertTriangle, CalendarClock } from 'lucide-react';
import { agendaApi, pacientesApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { Switch } from '@/componentes/ui/switch';
import { ajustarFechaParaBackend } from '@/lib/utilidades';
import { Cita, HoraLibre, ElementoAgenda, Paciente } from '@/tipos';

export default function AgendaMobile() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [horas_libres, setHorasLibres] = useState<HoraLibre[]>([]);
  const [mostrar_horas_libres, setMostrarHorasLibres] = useState(false);
  const [elementos_filtrados, setElementosFiltrados] = useState<ElementoAgenda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mes_actual, setMesActual] = useState(new Date().getMonth() + 1);
  const [ano_actual, setAnoActual] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_filtros_abierto, setDialogoFiltrosAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [cita_seleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [cita_a_eliminar, setCitaAEliminar] = useState<number | null>(null);

  const abrirDialogoConfirmarEliminar = (id: number) => {
    setCitaAEliminar(id);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const [filtros, setFiltros] = useState({
    paciente_id: '',
    estado_pago: '',
    busqueda: '',
    fecha_hora_inicio: undefined as Date | undefined,
    fecha_hora_fin: undefined as Date | undefined,
  });

  const [filtros_temporales, setFiltrosTemporales] = useState({
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
  }, [mes_actual, ano_actual, filtros.fecha_hora_inicio, filtros.fecha_hora_fin]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, horas_libres, filtros.paciente_id, filtros.estado_pago, filtros.busqueda, mostrar_horas_libres]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const tiene_filtro_fecha = !!(filtros.fecha_hora_inicio && filtros.fecha_hora_fin);

      let datos_citas;
      let datos_horas_libres;

      if (tiene_filtro_fecha) {
        [datos_citas, datos_horas_libres] = await Promise.all([
          agendaApi.filtrarCitas(filtros.fecha_hora_inicio!, filtros.fecha_hora_fin!),
          agendaApi.filtrarEspaciosLibres(filtros.fecha_hora_inicio!, filtros.fecha_hora_fin!),
        ]);
      } else {
        [datos_citas, datos_horas_libres] = await Promise.all([
          agendaApi.obtenerPorMes(mes_actual, ano_actual),
          agendaApi.obtenerEspaciosLibres(mes_actual, ano_actual),
        ]);
      }

      const datos_pacientes = await pacientesApi.obtenerTodos();

      setCitas(datos_citas);
      setPacientes(datos_pacientes);
      setHorasLibres(datos_horas_libres);
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
    let elementos: ElementoAgenda[] = [];

    if (mostrar_horas_libres) {
      elementos = horas_libres.map(hora => ({ ...hora, es_hora_libre: true }));
    } else {
      elementos = [...citas];
    }

    if (!mostrar_horas_libres) {
      if (filtros.paciente_id) {
        elementos = elementos.filter(e => {
          const cita = e as Cita;
          return cita.paciente?.id.toString() === filtros.paciente_id;
        });
      }

      if (filtros.estado_pago) {
        elementos = elementos.filter(e => {
          const cita = e as Cita;
          return cita.estado_pago === filtros.estado_pago;
        });
      }

      if (filtros.busqueda) {
        const busqueda_lower = filtros.busqueda.toLowerCase();
        elementos = elementos.filter(e => {
          const cita = e as Cita;
          return cita.descripcion.toLowerCase().includes(busqueda_lower) ||
            (cita.paciente && 
              `${cita.paciente.nombre} ${cita.paciente.apellidos}`.toLowerCase().includes(busqueda_lower));
        });
      }
    } else {
      if (filtros.busqueda) {
        const busqueda_lower = filtros.busqueda.toLowerCase();
        elementos = elementos.filter(e => 
          e.descripcion.toLowerCase().includes(busqueda_lower)
        );
      }
    }

    setElementosFiltrados(elementos);
  };

  const abrirDialogoFiltros = () => {
    setFiltrosTemporales({
      paciente_id: filtros.paciente_id,
      estado_pago: filtros.estado_pago,
      busqueda: filtros.busqueda,
      fecha_hora_inicio: filtros.fecha_hora_inicio,
      fecha_hora_fin: filtros.fecha_hora_fin,
    });
    setDialogoFiltrosAbierto(true);
  };

  const aplicarFiltrosDialogo = () => {
    setFiltros({
      paciente_id: filtros_temporales.paciente_id,
      estado_pago: filtros_temporales.estado_pago,
      busqueda: filtros_temporales.busqueda,
      fecha_hora_inicio: filtros_temporales.fecha_hora_inicio,
      fecha_hora_fin: filtros_temporales.fecha_hora_fin,
    });
    setDialogoFiltrosAbierto(false);
  };

  const limpiarFiltros = () => {
    setFiltros({
      paciente_id: '',
      estado_pago: '',
      busqueda: '',
      fecha_hora_inicio: undefined,
      fecha_hora_fin: undefined,
    });
    setFiltrosTemporales({
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
    if (isNaN(horas) || horas < 0 || isNaN(minutos) || minutos < 0) { 
      toast({
        title: 'Error',
        description: 'Las horas y minutos deben ser números válidos y no negativos',
        variant: 'destructive',
      });
      return;
    }
    if (horas + minutos <= 0) { 
      toast({
        title: 'Error',
        description: 'La duración total (horas + minutos) debe ser de al menos 1 minuto',
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
              <pre className="text-sm whitespace-pre-wrap font-mono">{mensaje_error}</pre>
            </div>
          </div>
        ),
        variant: 'destructive',
        duration: 15000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async () => {
    if (!cita_a_eliminar) return;
    try {
      await agendaApi.eliminar(cita_a_eliminar);
      toast({
        title: 'Éxito',
        description: 'Cita eliminada correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setCitaAEliminar(null);
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

  const agruparElementosPorDia = () => {
    const grupos: { [key: string]: ElementoAgenda[] } = {};
    
    elementos_filtrados.forEach(elemento => {
      const fecha_str = formatearFecha(elemento.fecha);
      if (!grupos[fecha_str]) {
        grupos[fecha_str] = [];
      }
      grupos[fecha_str].push(elemento);
    });

    Object.keys(grupos).forEach(fecha => {
      grupos[fecha].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    });

    return grupos;
  };

  const elementos_agrupados = agruparElementosPorDia();

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

  const esHoraLibre = (elemento: ElementoAgenda): elemento is HoraLibre & { es_hora_libre: true } => {
    return 'es_hora_libre' in elemento && elemento.es_hora_libre === true;
  };

  if (cargando) {
    return (
      <div className="flex flex-row h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateralMovil />
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
    <div className="flex flex-row h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateralMovil />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                Agenda
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Gestiona tus citas y eventos
              </p>
            </div>

            <div className="flex gap-2 self-end md:self-auto">
              <Button
                size="default"
                variant="outline"
                onClick={abrirDialogoFiltros}
                className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200 relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {contarFiltrosActivos() > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {contarFiltrosActivos()}
                  </Badge>
                )}
              </Button>
              <Button size="default" className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200" onClick={abrirDialogoNuevo}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva
              </Button>
            </div>
          </div>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl">
                        {filtros_fecha_activos 
                          ? (mostrar_horas_libres ? 'Horas Libres Filtradas' : 'Citas Filtradas')
                          : `${meses[mes_actual - 1]} ${ano_actual}`
                        }
                      </CardTitle>
                      <CardDescription>
                        {elementos_filtrados.length} de {mostrar_horas_libres ? horas_libres.length : citas.length} {mostrar_horas_libres ? 'horas libres' : 'citas'}
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

                <div className="flex items-center justify-center md:justify-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                  <Label htmlFor="mostrar-horas-libres-mobile" className="text-sm font-medium cursor-pointer">
                    {mostrar_horas_libres ? 'Ver Citas' : 'Ver Horas Libres'}
                  </Label>
                  <Switch
                    id="mostrar-horas-libres-mobile"
                    checked={mostrar_horas_libres}
                    onCheckedChange={setMostrarHorasLibres}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {elementos_filtrados.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {contarFiltrosActivos() > 0 
                        ? (mostrar_horas_libres ? 'No hay horas libres que coincidan con los filtros' : 'No hay citas que coincidan con los filtros')
                        : (mostrar_horas_libres ? 'No hay horas libres en este período' : 'No hay citas programadas')
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {contarFiltrosActivos() > 0 
                        ? 'Intenta ajustar los filtros o crear una nueva cita'
                        : (mostrar_horas_libres 
                          ? 'Todas las horas están ocupadas con citas programadas'
                          : 'Crea tu primera cita para comenzar a organizar tu agenda'
                        )
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
                  {Object.entries(elementos_agrupados).map(([fecha, elementos_del_dia]) => (
                    <div key={fecha} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        <Calendar className="h-5 w-5 text-primary" />
                        {fecha}
                      </h3>
                      <div className="space-y-2 pl-4 md:pl-7">
                        {elementos_del_dia.map((elemento, idx) => {
                          if (esHoraLibre(elemento)) {
                            return (
                              <div
                                key={`libre-${idx}`}
                                className="flex flex-col p-3 md:p-4 rounded-lg border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 gap-4"
                              >
                                <div className="flex items-start md:items-center gap-4 flex-1 flex-col md:flex-row">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                                      <CalendarClock className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {formatearHora(elemento.fecha)}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Hora libre
                                      </p>
                                    </div>
                                  </div>
                                  <div className="ml-0 md:ml-4 flex-1">
                                    <p className="text-sm text-foreground">{elemento.descripcion}</p>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-3 mt-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Duración disponible: {formatearDuracion(elemento.horas_aproximadas, elemento.minutos_aproximados)}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-500 text-white hover:scale-110 transition-transform duration-200 self-start md:self-auto">
                                    Disponible
                                  </Badge>
                                </div>
                              </div>
                            );
                          } else {
                            const cita = elemento as Cita;
                            return (
                              <div
                                key={cita.id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200 gap-4 md:gap-0"
                              >
                                <div className="flex items-start md:items-center gap-4 flex-1 flex-col md:flex-row">
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
                                  <div className="ml-0 md:ml-4 flex-1 mt-2 md:mt-0">
                                    <p className="text-sm text-foreground">{cita.descripcion}</p>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-3 mt-1">
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
                                    <Badge className={`${obtenerColorEstado(cita.estado_pago)} text-white hover:scale-110 transition-transform duration-200 mt-2 md:mt-0`}>
                                      {obtenerEtiquetaEstado(cita.estado_pago)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-0 md:ml-4 mt-2 md:mt-0">
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
                                    onClick={() => abrirDialogoConfirmarEliminar(cita.id)}
                                    className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta cita?
            </DialogDescription>
          </DialogHeader>
                  
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>
                  
          <DialogFooter className="flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setCitaAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminar}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_filtros_abierto} onOpenChange={setDialogoFiltrosAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filtros de Agenda</DialogTitle>
            <DialogDescription>
              Filtra las {mostrar_horas_libres ? 'horas libres' : 'citas'} por {mostrar_horas_libres ? 'búsqueda' : 'paciente, estado o búsqueda'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar por texto</Label>
              <Input
                placeholder="Buscar en descripción..."
                value={filtros_temporales.busqueda}
                onChange={(e) => setFiltrosTemporales({ ...filtros_temporales, busqueda: e.target.value })}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {!mostrar_horas_libres && (
              <>
                <div className="space-y-2">
                  <Label>Filtrar por paciente</Label>
                  <Combobox
                    opciones={opciones_pacientes_filtro}
                    valor={filtros_temporales.paciente_id}
                    onChange={(valor) => setFiltrosTemporales({ ...filtros_temporales, paciente_id: valor })}
                    placeholder="Selecciona un paciente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Filtrar por estado de pago</Label>
                  <Combobox
                    opciones={opciones_estados_filtro}
                    valor={filtros_temporales.estado_pago}
                    onChange={(valor) => setFiltrosTemporales({ ...filtros_temporales, estado_pago: valor })}
                    placeholder="Selecciona un estado"
                  />
                </div>
              </>
            )}

            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-base font-semibold">Filtrar por Intervalo de Fecha y Hora</Label>
              <p className="text-xs text-muted-foreground">
                Cuando uses este filtro, los botones de navegación de mes se deshabilitarán
              </p>
              
              <div className="space-y-2">
                <Label>Fecha y Hora de Inicio</Label>
                <DateTimePicker
                  valor={filtros_temporales.fecha_hora_inicio}
                  onChange={(fecha) => setFiltrosTemporales({ ...filtros_temporales, fecha_hora_inicio: fecha })}
                  placeholder="Selecciona inicio"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha y Hora de Fin</Label>
                <DateTimePicker
                  valor={filtros_temporales.fecha_hora_fin}
                  onChange={(fecha) => setFiltrosTemporales({ ...filtros_temporales, fecha_hora_fin: fecha })}
                  placeholder="Selecciona fin"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={limpiarFiltros}
              className="hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button
              onClick={aplicarFiltrosDialogo}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200 w-full sm:w-auto"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <DialogFooter className="flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardar} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200 w-full sm:w-auto"
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
