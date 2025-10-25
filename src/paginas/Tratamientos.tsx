import { useState, useEffect } from "react";
import { MenuLateral } from "@/componentes/MenuLateral";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/componentes/ui/card";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/componentes/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/componentes/ui/tabs";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { tratamientosApi, planesTratamientoApi, pacientesApi, agendaApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/componentes/ui/toaster";
import { Badge } from "@/componentes/ui/badge";
import { Combobox, OpcionCombobox } from "@/componentes/ui/combobox";
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { ajustarFechaParaBackend } from "@/lib/utilidades";

interface Tratamiento {
  id: number;
  nombre: string;
  numero_citas: number;
  costo_total: number;
  intervalo_dias: number;
  intervalo_semanas: number;
  intervalo_meses: number;
  horas_aproximadas_citas: number;
  minutos_aproximados_citas: number;
}

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
}

interface PlanTratamiento {
  id: number;
  costo_total: number;
  total_abonado: number;
  paciente: {
    id: number;
    nombre: string;
    apellidos: string;
  };
  tratamiento: {
    id: number;
    nombre: string;
    numero_citas: number;
  };
  citas: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    estado_pago: string;
    monto_esperado: number;
    horas_aproximadas: number;
    minutos_aproximados: number;
  }>;
  pagos: Array<{
    id: number;
    fecha: Date;
    monto: number;
  }>;
}

export default function Tratamientos() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [planes, setPlanes] = useState<PlanTratamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_planes, setCargandoPlanes] = useState(false);
  const [dialogo_plantilla_abierto, setDialogoPlantillaAbierto] = useState(false);
  const [dialogo_asignar_abierto, setDialogoAsignarAbierto] = useState(false);
  const [dialogo_detalle_plan_abierto, setDialogoDetallePlanAbierto] = useState(false);
  const [dialogo_cita_abierto, setDialogoCitaAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_cita, setModoEdicionCita] = useState(false);
  const [tratamiento_seleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);
  const [plan_seleccionado, setPlanSeleccionado] = useState<PlanTratamiento | null>(null);
  const [cita_seleccionada, setCitaSeleccionada] = useState<any>(null);
  const [cita_a_eliminar, setCitaAEliminar] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [paciente_filtro, setPacienteFiltro] = useState<string>("todos");

  const [formulario_plantilla, setFormularioPlantilla] = useState({
    nombre: "",
    numero_citas: "",
    costo_total: "",
    intervalo_dias: "0",
    intervalo_semanas: "0",
    intervalo_meses: "0",
    horas_aproximadas_citas: "0",
    minutos_aproximados_citas: "30",
  });

  const [formulario_asignar, setFormularioAsignar] = useState({
    paciente_id: "",
    tratamiento_id: "",
    fecha_inicio: undefined as Date | undefined,
  });

  const [formulario_cita, setFormularioCita] = useState({
    fecha: undefined as Date | undefined,
    descripcion: "",
    estado_pago: "pendiente",
    monto_esperado: "",
    horas_aproximadas: "0",
    minutos_aproximados: "30",
  });

  const estados_pago = [
    { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-yellow-500' },
    { valor: 'pagado', etiqueta: 'Pagado', color: 'bg-green-500' },
    { valor: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-500' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [datos_tratamientos, datos_pacientes] = await Promise.all([
        tratamientosApi.obtenerTodos(),
        pacientesApi.obtenerTodos(),
      ]);
      setTratamientos(datos_tratamientos);
      setPacientes(datos_pacientes);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarPlanes = async () => {
    setCargandoPlanes(true);
    try {
      const planes_totales = await planesTratamientoApi.obtenerTodos();
      setPlanes(planes_totales.filter((p: PlanTratamiento) => p.paciente && p.tratamiento));
    } catch (error) {
      console.error("Error al cargar planes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de tratamiento",
        variant: "destructive",
      });
    } finally {
      setCargandoPlanes(false);
    }
  };

  const recargarPlanSeleccionado = async () => {
    if (!plan_seleccionado) return;
    
    try {
      const planes_actualizados = await planesTratamientoApi.obtenerTodos();
      const plan_actualizado = planes_actualizados.find((p: PlanTratamiento) => p.id === plan_seleccionado.id);
      
      if (plan_actualizado) {
        setPlanSeleccionado(plan_actualizado);
        setPlanes(planes_actualizados.filter((p: PlanTratamiento) => p.paciente && p.tratamiento));
      }
    } catch (error) {
      console.error("Error al recargar plan:", error);
    }
  };

  const abrirDialogoNuevo = () => {
    setFormularioPlantilla({
      nombre: "",
      numero_citas: "",
      costo_total: "",
      intervalo_dias: "0",
      intervalo_semanas: "0",
      intervalo_meses: "0",
      horas_aproximadas_citas: "0",
      minutos_aproximados_citas: "30",
    });
    setModoEdicion(false);
    setDialogoPlantillaAbierto(true);
  };

  const abrirDialogoEditar = (tratamiento: Tratamiento) => {
    setFormularioPlantilla({
      nombre: tratamiento.nombre,
      numero_citas: tratamiento.numero_citas.toString(),
      costo_total: tratamiento.costo_total.toString(),
      intervalo_dias: (tratamiento.intervalo_dias || 0).toString(),
      intervalo_semanas: (tratamiento.intervalo_semanas || 0).toString(),
      intervalo_meses: (tratamiento.intervalo_meses || 0).toString(),
      horas_aproximadas_citas: (tratamiento.horas_aproximadas_citas || 0).toString(),
      minutos_aproximados_citas: (tratamiento.minutos_aproximados_citas || 30).toString(),
    });
    setTratamientoSeleccionado(tratamiento);
    setModoEdicion(true);
    setDialogoPlantillaAbierto(true);
  };

  const manejarGuardarPlantilla = async () => {
    if (
      !formulario_plantilla.nombre ||
      !formulario_plantilla.numero_citas ||
      !formulario_plantilla.costo_total
    ) {
      toast({
        title: "Error",
        description: "Nombre, número de citas y costo son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const numero_citas = parseInt(formulario_plantilla.numero_citas);
    const costo_total = parseFloat(formulario_plantilla.costo_total);
    const intervalo_dias = parseInt(formulario_plantilla.intervalo_dias);
    const intervalo_semanas = parseInt(formulario_plantilla.intervalo_semanas);
    const intervalo_meses = parseInt(formulario_plantilla.intervalo_meses);
    const horas_aproximadas_citas = parseInt(formulario_plantilla.horas_aproximadas_citas);
    const minutos_aproximados_citas = parseInt(formulario_plantilla.minutos_aproximados_citas);

    if (
      isNaN(numero_citas) ||
      numero_citas <= 0 ||
      isNaN(costo_total) ||
      costo_total <= 0 ||
      isNaN(intervalo_dias) ||
      intervalo_dias < 0 ||
      isNaN(intervalo_semanas) ||
      intervalo_semanas < 0 ||
      isNaN(intervalo_meses) ||
      intervalo_meses < 0 ||
      isNaN(horas_aproximadas_citas) ||
      horas_aproximadas_citas < 0 ||
      isNaN(minutos_aproximados_citas) ||
      minutos_aproximados_citas < 1
    ) {
      toast({
        title: "Error",
        description: "Los valores numéricos deben ser válidos",
        variant: "destructive",
      });
      return;
    }

    if (intervalo_dias === 0 && intervalo_semanas === 0 && intervalo_meses === 0) {
      toast({
        title: "Advertencia",
        description: "Al menos un intervalo debe ser mayor a 0, o todas las citas se programarán el mismo día",
        variant: "destructive",
      });
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: formulario_plantilla.nombre,
        numero_citas,
        costo_total,
        intervalo_dias,
        intervalo_semanas,
        intervalo_meses,
        horas_aproximadas_citas,
        minutos_aproximados_citas,
      };

      if (modo_edicion && tratamiento_seleccionado) {
        await tratamientosApi.actualizar(tratamiento_seleccionado.id, datos);
        toast({
          title: "Éxito",
          description: "Tratamiento actualizado correctamente",
        });
      } else {
        await tratamientosApi.crear(datos);
        toast({
          title: "Éxito",
          description: "Tratamiento creado correctamente",
        });
      }
      setDialogoPlantillaAbierto(false);
      cargarDatos();
    } catch (error: any) {
      console.error("Error al guardar tratamiento:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "No se pudo guardar el tratamiento",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarPlantilla = (tratamiento: Tratamiento) => {
    setTratamientoSeleccionado(tratamiento);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarPlantilla = async () => {
    if (!tratamiento_seleccionado) return;

    try {
      await tratamientosApi.eliminar(tratamiento_seleccionado.id);
      toast({
        title: "Éxito",
        description: "Tratamiento eliminado correctamente",
      });
      setDialogoConfirmarEliminarAbierto(false);
      setTratamientoSeleccionado(null);
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar tratamiento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el tratamiento",
        variant: "destructive",
      });
    }
  };

  const abrirDialogoAsignar = (tratamiento: Tratamiento) => {
    const ahora = new Date();
    ahora.setHours(9, 0, 0, 0);
    
    setFormularioAsignar({
      paciente_id: "",
      tratamiento_id: tratamiento.id.toString(),
      fecha_inicio: ahora,
    });
    setTratamientoSeleccionado(tratamiento);
    setDialogoAsignarAbierto(true);
  };

  const formatearFechaParaBackend = (fecha: Date): string => {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const formatearHoraParaBackend = (fecha: Date): string => {
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const manejarAsignarTratamiento = async () => {
    if (
      !formulario_asignar.paciente_id ||
      !formulario_asignar.tratamiento_id ||
      !formulario_asignar.fecha_inicio
    ) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      await planesTratamientoApi.asignar({
        paciente_id: parseInt(formulario_asignar.paciente_id),
        tratamiento_id: parseInt(formulario_asignar.tratamiento_id),
        fecha_inicio: formatearFechaParaBackend(formulario_asignar.fecha_inicio),
        hora_inicio: formatearHoraParaBackend(formulario_asignar.fecha_inicio),
      });
      toast({
        title: "Éxito",
        description: "Plan de tratamiento asignado correctamente",
      });
      setDialogoAsignarAbierto(false);
      cargarPlanes();
    } catch (error: any) {
      console.error("Error al asignar tratamiento:", error);
      
      const mensaje_error = error.response?.data?.message || "No se pudo asignar el tratamiento";
      
      toast({
        title: "Error - Conflicto de Horarios",
        description: (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{mensaje_error}</p>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const verDetallePlan = (plan: PlanTratamiento) => {
    setPlanSeleccionado(plan);
    setDialogoDetallePlanAbierto(true);
  };

  const abrirDialogoNuevaCita = () => {
    setFormularioCita({
      fecha: new Date(),
      descripcion: "",
      estado_pago: "pendiente",
      monto_esperado: "",
      horas_aproximadas: "0",
      minutos_aproximados: "30",
    });
    setModoEdicionCita(false);
    setDialogoCitaAbierto(true);
  };

  const abrirDialogoEditarCita = (cita: any) => {
    setFormularioCita({
      fecha: new Date(cita.fecha),
      descripcion: cita.descripcion,
      estado_pago: cita.estado_pago || 'pendiente',
      monto_esperado: cita.monto_esperado?.toString() || "",
      horas_aproximadas: (cita.horas_aproximadas || 0).toString(),
      minutos_aproximados: (cita.minutos_aproximados || 30).toString(),
    });
    setCitaSeleccionada(cita);
    setModoEdicionCita(true);
    setDialogoCitaAbierto(true);
  };

  const manejarGuardarCita = async () => {
    if (!plan_seleccionado || !formulario_cita.fecha || !formulario_cita.descripcion) {
      toast({
        title: "Error",
        description: "Fecha y descripción son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const horas = parseInt(formulario_cita.horas_aproximadas);
    const minutos = parseInt(formulario_cita.minutos_aproximados);

    if (isNaN(horas) || horas < 0 || isNaN(minutos) || minutos < 1) {
      toast({
        title: "Error",
        description: "La duración debe ser válida (mínimo 1 minuto)",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = {
        paciente_id: plan_seleccionado.paciente.id,
        plan_tratamiento_id: plan_seleccionado.id,
        fecha: ajustarFechaParaBackend(formulario_cita.fecha),
        descripcion: formulario_cita.descripcion,
        estado_pago: formulario_cita.estado_pago,
        monto_esperado: formulario_cita.monto_esperado ? parseFloat(formulario_cita.monto_esperado) : 0,
        horas_aproximadas: horas,
        minutos_aproximados: minutos,
      };

      if (modo_edicion_cita && cita_seleccionada) {
        await agendaApi.actualizar(cita_seleccionada.id, datos);
        toast({
          title: "Éxito",
          description: "Cita actualizada correctamente",
        });
      } else {
        await agendaApi.crear(datos);
        toast({
          title: "Éxito",
          description: "Cita agregada al plan correctamente",
        });
      }
      
      setDialogoCitaAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error("Error al guardar cita:", error);
      
      const mensaje_error = error.response?.data?.message || "No se pudo guardar la cita";
      
      toast({
        title: "Error - Conflicto de Horarios",
        description: (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{mensaje_error}</p>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarEliminarCita = (cita: any) => {
    setCitaAEliminar(cita);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const confirmarEliminarCita = async () => {
    if (!cita_a_eliminar) return;

    try {
      await agendaApi.eliminar(cita_a_eliminar.id);
      toast({
        title: "Éxito",
        description: "Cita eliminada correctamente",
      });
      
      setDialogoConfirmarEliminarAbierto(false);
      setCitaAEliminar(null);
      await recargarPlanSeleccionado();
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive",
      });
    }
  };

  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(monto);
  };

  const formatearFecha = (fecha: Date): string => {
    return new Date(fecha).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatearFechaHora = (fecha: Date): string => {
    return new Date(fecha).toLocaleString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const calcularProgreso = (plan: PlanTratamiento): number => {
    if (plan.costo_total === 0) return 0;
    return (plan.total_abonado / plan.costo_total) * 100;
  };

  const obtenerColorEstado = (estado: string): string => {
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.color || 'bg-gray-500';
  };

  const obtenerEtiquetaEstado = (estado: string): string => {
    const estado_encontrado = estados_pago.find(e => e.valor === estado);
    return estado_encontrado?.etiqueta || estado;
  };

  const obtenerTextoIntervalo = (tratamiento: Tratamiento): string => {
    const dias = tratamiento.intervalo_dias || 0;
    const semanas = tratamiento.intervalo_semanas || 0;
    const meses = tratamiento.intervalo_meses || 0;
    
    const partes: string[] = [];
    
    if (meses > 0) {
      partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
    }
    if (semanas > 0) {
      partes.push(`${semanas} semana${semanas !== 1 ? 's' : ''}`);
    }
    if (dias > 0) {
      partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
    }
    
    if (partes.length === 0) {
      return 'Sin intervalo (mismo día)';
    }
    
    return `Cada ${partes.join(', ')}`;
  };

  const opciones_pacientes: OpcionCombobox[] = [
    { valor: "todos", etiqueta: "Todos los pacientes" },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const opciones_pacientes_asignar: OpcionCombobox[] = pacientes.map(p => ({
    valor: p.id.toString(),
    etiqueta: `${p.nombre} ${p.apellidos}`
  }));

  const opciones_estados: OpcionCombobox[] = estados_pago.map(e => ({
    valor: e.valor,
    etiqueta: e.etiqueta
  }));

  const planes_filtrados = paciente_filtro === 'todos' 
    ? planes 
    : planes.filter(p => p.paciente?.id.toString() === paciente_filtro);

  if (cargando) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando tratamientos...</p>
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
                Tratamientos
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestiona plantillas y planes de tratamiento
              </p>
            </div>

            <Button
              size="lg"
              className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
              onClick={abrirDialogoNuevo}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          <Tabs
            defaultValue="plantillas"
            className="w-full"
            onValueChange={(value) => {
              if (value === "planes") {
                cargarPlanes();
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="plantillas" className="text-base">
                Plantillas de Tratamiento
              </TabsTrigger>
              <TabsTrigger value="planes" className="text-base">
                Planes Asignados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plantillas" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Plantillas de Tratamiento
                      </CardTitle>
                      <CardDescription>{tratamientos.length} plantillas registradas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tratamientos.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No hay plantillas registradas
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Crea plantillas de tratamientos comunes para agilizar
                          tu trabajo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre del Tratamiento</TableHead>
                          <TableHead>Número de Citas</TableHead>
                          <TableHead>Intervalo</TableHead>
                          <TableHead>Duración por Cita</TableHead>
                          <TableHead>Costo Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tratamientos.map((tratamiento) => (
                          <TableRow
                            key={tratamiento.id}
                            className="hover:bg-secondary/50 transition-colors duration-200"
                          >
                            <TableCell className="font-medium">
                              {tratamiento.nombre}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {tratamiento.numero_citas} citas
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {obtenerTextoIntervalo(tratamiento)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatearDuracion(tratamiento.horas_aproximadas_citas, tratamiento.minutos_aproximados_citas)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-green-500 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                {formatearMoneda(tratamiento.costo_total)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoAsignar(tratamiento)}
                                className="hover:bg-green-500/20 hover:text-green-500 hover:scale-110 transition-all duration-200"
                                title="Asignar a paciente"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoEditar(tratamiento)}
                                className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoConfirmarEliminarPlantilla(tratamiento)}
                                className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="planes" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Planes de Tratamiento Asignados
                        </CardTitle>
                        <CardDescription>
                          {planes_filtrados.length} planes activos
                        </CardDescription>
                      </div>
                    </div>
                    <div className="w-64">
                      <Combobox
                        opciones={opciones_pacientes}
                        valor={paciente_filtro}
                        onChange={setPacienteFiltro}
                        placeholder="Filtrar por paciente"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cargando_planes ? (
                    <div className="text-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="text-muted-foreground">
                        Cargando planes...
                      </p>
                    </div>
                  ) : planes_filtrados.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No hay planes de tratamiento asignados
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Asigna plantillas de tratamiento a tus pacientes desde
                          la pestaña de Plantillas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {planes_filtrados.map((plan) => {
                        const progreso = calcularProgreso(plan);
                        const saldo_pendiente =
                          plan.costo_total - plan.total_abonado;

                        return (
                          <div
                            key={plan.id}
                            className="p-6 rounded-lg border-2 border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => verDetallePlan(plan)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <User className="h-5 w-5 text-primary" />
                                  <h3 className="text-lg font-bold text-foreground">
                                    {plan.paciente.nombre}{" "}
                                    {plan.paciente.apellidos}
                                  </h3>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {plan.tratamiento.nombre}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  progreso === 100 ? "default" : "secondary"
                                }
                                className="text-sm hover:scale-110 transition-transform duration-200"
                              >
                                {progreso === 100 ? (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                ) : null}
                                {progreso.toFixed(0)}% pagado
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                  style={{ width: `${progreso}%` }}
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">
                                    Costo Total
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {formatearMoneda(plan.costo_total)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">
                                    Abonado
                                  </p>
                                  <p className="font-semibold text-green-500">
                                    {formatearMoneda(plan.total_abonado)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Pendiente</p>
                                  <p
                                    className={`font-semibold ${saldo_pendiente > 0 ? "text-red-500" : "text-green-500"}`}
                                  >
                                    {formatearMoneda(saldo_pendiente)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {plan.citas?.length || 0} citas programadas
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {plan.pagos?.length || 0} pagos registrados
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog
        open={dialogo_plantilla_abierto}
        onOpenChange={setDialogoPlantillaAbierto}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion
                ? "Editar Plantilla de Tratamiento"
                : "Nueva Plantilla de Tratamiento"}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion
                ? "Modifica la información de la plantilla"
                : "Crea una plantilla para tratamientos comunes"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Tratamiento *</Label>
              <Input
                id="nombre"
                value={formulario_plantilla.nombre}
                onChange={(e) =>
                  setFormularioPlantilla({
                    ...formulario_plantilla,
                    nombre: e.target.value,
                  })
                }
                placeholder="Ej: Endodoncia, Ortodoncia, Blanqueamiento"
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_citas">Número de Citas *</Label>
                <Input
                  id="numero_citas"
                  type="number"
                  min="1"
                  value={formulario_plantilla.numero_citas}
                  onChange={(e) =>
                    setFormularioPlantilla({
                      ...formulario_plantilla,
                      numero_citas: e.target.value,
                    })
                  }
                  placeholder="Ej: 25"
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_total">Costo Total (Bs.) *</Label>
                <Input
                  id="costo_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario_plantilla.costo_total}
                  onChange={(e) =>
                    setFormularioPlantilla({
                      ...formulario_plantilla,
                      costo_total: e.target.value,
                    })
                  }
                  placeholder="Ej: 5000.00"
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Intervalo entre Citas</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="intervalo_meses" className="text-xs text-muted-foreground">
                    Meses
                  </Label>
                  <Input
                    id="intervalo_meses"
                    type="number"
                    min="0"
                    value={formulario_plantilla.intervalo_meses}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        intervalo_meses: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intervalo_semanas" className="text-xs text-muted-foreground">
                    Semanas
                  </Label>
                  <Input
                    id="intervalo_semanas"
                    type="number"
                    min="0"
                    value={formulario_plantilla.intervalo_semanas}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        intervalo_semanas: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intervalo_dias" className="text-xs text-muted-foreground">
                    Días
                  </Label>
                  <Input
                    id="intervalo_dias"
                    type="number"
                    min="0"
                    value={formulario_plantilla.intervalo_dias}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        intervalo_dias: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Las citas se programarán automáticamente con este intervalo. Ej: 1 mes, 2 semanas, 3 días
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duración Aproximada de Cada Cita</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horas_aproximadas_citas" className="text-xs text-muted-foreground">
                    Horas
                  </Label>
                  <Input
                    id="horas_aproximadas_citas"
                    type="number"
                    min="0"
                    value={formulario_plantilla.horas_aproximadas_citas}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        horas_aproximadas_citas: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minutos_aproximados_citas" className="text-xs text-muted-foreground">
                    Minutos
                  </Label>
                  <Input
                    id="minutos_aproximados_citas"
                    type="number"
                    min="1"
                    value={formulario_plantilla.minutos_aproximados_citas}
                    onChange={(e) =>
                      setFormularioPlantilla({
                        ...formulario_plantilla,
                        minutos_aproximados_citas: e.target.value,
                      })
                    }
                    placeholder="30"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Todas las citas del plan tendrán esta duración estimada
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoPlantillaAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarGuardarPlantilla}
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_asignar_abierto}
        onOpenChange={setDialogoAsignarAbierto}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Asignar Plan de Tratamiento</DialogTitle>
            <DialogDescription>
              {tratamiento_seleccionado &&
                `Asignar "${tratamiento_seleccionado.nombre}" a un paciente`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente *</Label>
              <Combobox
                opciones={opciones_pacientes_asignar}
                valor={formulario_asignar.paciente_id}
                onChange={(valor) =>
                  setFormularioAsignar({
                    ...formulario_asignar,
                    paciente_id: valor,
                  })
                }
                placeholder="Selecciona un paciente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha y Hora de Inicio de las Citas *</Label>
              <DateTimePicker
                valor={formulario_asignar.fecha_inicio}
                onChange={(fecha) => fecha && setFormularioAsignar({
                  ...formulario_asignar,
                  fecha_inicio: fecha,
                })}
                placeholder="Selecciona fecha y hora"
              />
              <p className="text-xs text-muted-foreground">
                Todas las citas comenzarán a esta hora
              </p>
            </div>

            {tratamiento_seleccionado && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Detalles del Tratamiento:
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {tratamiento_seleccionado.numero_citas} citas programadas
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {obtenerTextoIntervalo(tratamiento_seleccionado)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duración por cita: {formatearDuracion(tratamiento_seleccionado.horas_aproximadas_citas, tratamiento_seleccionado.minutos_aproximados_citas)}
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Costo total:{" "}
                    {formatearMoneda(tratamiento_seleccionado.costo_total)}
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                El sistema validará automáticamente que no haya conflictos de horario considerando la duración de cada cita.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAsignarAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarAsignarTratamiento}
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Tratamiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_detalle_plan_abierto}
        onOpenChange={setDialogoDetallePlanAbierto}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestión del Plan de Tratamiento</DialogTitle>
            <DialogDescription>
              Administra las citas y pagos del plan
            </DialogDescription>
          </DialogHeader>

          {plan_seleccionado && (
            <div className="space-y-6">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan_seleccionado.paciente.nombre}{" "}
                  {plan_seleccionado.paciente.apellidos}
                </h3>
                <p className="text-muted-foreground">
                  {plan_seleccionado.tratamiento.nombre}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Costo Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatearMoneda(plan_seleccionado.costo_total)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Abonado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-500">
                      {formatearMoneda(plan_seleccionado.total_abonado)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Pendiente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-500">
                      {formatearMoneda(
                        plan_seleccionado.costo_total -
                          plan_seleccionado.total_abonado
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="citas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="citas">
                    Citas ({plan_seleccionado.citas.length})
                  </TabsTrigger>
                  <TabsTrigger value="pagos">
                    Pagos ({plan_seleccionado.pagos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="citas" className="space-y-3 mt-4">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={abrirDialogoNuevaCita}
                      className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Cita
                    </Button>
                  </div>

                  {plan_seleccionado.citas.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay citas programadas
                    </p>
                  ) : (
                    plan_seleccionado.citas.map((cita) => (
                      <div
                        key={cita.id}
                        className="p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="font-medium text-foreground">
                                {formatearFechaHora(cita.fecha)}
                              </p>
                              <Badge className={`${obtenerColorEstado(cita.estado_pago)} text-white`}>
                                {obtenerEtiquetaEstado(cita.estado_pago)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground ml-7">
                              {cita.descripcion}
                            </p>
                            <div className="flex items-center gap-3 ml-7 mt-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Duración: {formatearDuracion(cita.horas_aproximadas, cita.minutos_aproximados)}
                              </p>
                              {cita.monto_esperado > 0 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  Monto: {formatearMoneda(cita.monto_esperado)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDialogoEditarCita(cita)}
                              className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDialogoConfirmarEliminarCita(cita)}
                              className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="pagos" className="space-y-3 mt-4">
                  {plan_seleccionado.pagos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay pagos registrados
                    </p>
                  ) : (
                    plan_seleccionado.pagos.map((pago) => (
                      <div
                        key={pago.id}
                        className="p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-green-500">
                              {formatearMoneda(pago.monto)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatearFecha(pago.fecha)}
                            </p>
                          </div>
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_cita_abierto} onOpenChange={setDialogoCitaAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_cita ? 'Editar Cita' : 'Agregar Cita al Plan'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_cita 
                ? 'Modifica los detalles de la cita' 
                : 'Programa una nueva cita para este plan de tratamiento'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_cita">Fecha y Hora *</Label>
              <DateTimePicker
                valor={formulario_cita.fecha}
                onChange={(fecha) => setFormularioCita({ ...formulario_cita, fecha })}
                placeholder="Selecciona fecha y hora"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion_cita">Descripción *</Label>
              <Textarea
                id="descripcion_cita"
                value={formulario_cita.descripcion}
                onChange={(e) => setFormularioCita({ ...formulario_cita, descripcion: e.target.value })}
                placeholder="Ej: Consulta de seguimiento, Aplicación de tratamiento..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label>Duración Aproximada</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horas_aproximadas_cita" className="text-xs text-muted-foreground">
                    Horas
                  </Label>
                  <Input
                    id="horas_aproximadas_cita"
                    type="number"
                    min="0"
                    value={formulario_cita.horas_aproximadas}
                    onChange={(e) => setFormularioCita({ ...formulario_cita, horas_aproximadas: e.target.value })}
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutos_aproximados_cita" className="text-xs text-muted-foreground">
                    Minutos
                  </Label>
                  <Input
                    id="minutos_aproximados_cita"
                    type="number"
                    min="1"
                    value={formulario_cita.minutos_aproximados}
                    onChange={(e) => setFormularioCita({ ...formulario_cita, minutos_aproximados: e.target.value })}
                    placeholder="30"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo estimado de la cita (para validación de conflictos de horario)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado_pago_cita">Estado de Pago</Label>
                <Combobox
                  opciones={opciones_estados}
                  valor={formulario_cita.estado_pago}
                  onChange={(valor) => setFormularioCita({ ...formulario_cita, estado_pago: valor })}
                  placeholder="Estado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto_cita">Monto (Bs.)</Label>
                <Input
                  id="monto_cita"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario_cita.monto_esperado}
                  onChange={(e) => setFormularioCita({ ...formulario_cita, monto_esperado: e.target.value })}
                  placeholder="0.00"
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            {formulario_cita.estado_pago === 'pagado' && parseFloat(formulario_cita.monto_esperado) > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  El backend registrará automáticamente el ingreso de {formatearMoneda(parseFloat(formulario_cita.monto_esperado))} vinculado a este plan
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                El sistema validará automáticamente que no haya conflictos de horario considerando la duración especificada.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoCitaAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardarCita} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion_cita ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              {cita_a_eliminar 
                ? `¿Estás seguro de que deseas eliminar esta cita del plan?`
                : tratamiento_seleccionado 
                ? `¿Estás seguro de que deseas eliminar esta plantilla de tratamiento?`
                : `¿Estás seguro de que deseas eliminar este elemento?`
              }
            </DialogDescription>
          </DialogHeader>
          
          {cita_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{cita_a_eliminar.descripcion}</p>
              <p className="text-sm text-muted-foreground">
                {formatearFechaHora(cita_a_eliminar.fecha)}
              </p>
              <Badge className={`${obtenerColorEstado(cita_a_eliminar.estado_pago)} text-white`}>
                {obtenerEtiquetaEstado(cita_a_eliminar.estado_pago)}
              </Badge>
            </div>
          )}

          {tratamiento_seleccionado && !cita_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{tratamiento_seleccionado.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {tratamiento_seleccionado.numero_citas} citas - {formatearMoneda(tratamiento_seleccionado.costo_total)}
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
                setCitaAEliminar(null);
                setTratamientoSeleccionado(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cita_a_eliminar) {
                  confirmarEliminarCita();
                } else if (tratamiento_seleccionado) {
                  confirmarEliminarPlantilla();
                }
              }}
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