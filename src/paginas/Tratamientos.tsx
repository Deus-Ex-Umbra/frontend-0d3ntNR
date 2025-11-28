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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/componentes/ui/accordion";
import { ScrollArea } from "@/componentes/ui/scroll-area";
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
  Package,
  Check,
} from "lucide-react";
import { tratamientosApi, planesTratamientoApi, pacientesApi, agendaApi, inventarioApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/componentes/ui/toaster";
import { Badge } from "@/componentes/ui/badge";
import { Combobox, OpcionCombobox } from "@/componentes/ui/combobox";
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { SearchInput } from "@/componentes/ui/search-input";
import { ajustarFechaParaBackend } from "@/lib/utilidades";
import { Tratamiento } from '@/tipos';
import type { Paciente, Inventario, Producto, MaterialGeneral, MaterialCita } from '@/tipos';
import SelectorMateriales from '@/componentes/materiales/selector-materiales';

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
  fecha_inicio: Date;
  estado: string;
  citas: Array<{
    id: number;
    fecha: Date;
    descripcion: string;
    estado_pago: string;
    monto_esperado: number;
    horas_aproximadas: number;
    minutos_aproximados: number;
    materiales_confirmados?: boolean;
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
  const [dialogo_editar_costo_abierto, setDialogoEditarCostoAbierto] = useState(false);
  const [dialogo_confirmar_materiales_abierto, setDialogoConfirmarMaterialesAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [modo_edicion_cita, setModoEdicionCita] = useState(false);
  const [tratamiento_seleccionado, setTratamientoSeleccionado] = useState<Tratamiento | null>(null);
  const [plan_seleccionado, setPlanSeleccionado] = useState<PlanTratamiento | null>(null);
  const [cita_seleccionada, setCitaSeleccionada] = useState<any>(null);
  const [cita_a_eliminar, setCitaAEliminar] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [paciente_filtro, setPacienteFiltro] = useState<string>("todos");
  const [busqueda_plantillas, setBusquedaPlantillas] = useState("");
  const [busqueda_planes, setBusquedaPlanes] = useState("");
  const [plan_a_eliminar, setPlanAEliminar] = useState<PlanTratamiento | null>(null);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [productos_por_inventario, setProductosPorInventario] = useState<Record<number, Producto[]>>({});
  const [materiales_generales, setMaterialesGenerales] = useState<MaterialGeneral[]>([]);
  const [materiales_por_cita, setMaterialesPorCita] = useState<MaterialCita[]>([]);
  const [materiales_cita_edicion, setMaterialesCitaEdicion] = useState<MaterialCita[]>([]);
  const [materiales_cita_edicion_iniciales, setMaterialesCitaEdicionIniciales] = useState<MaterialCita[]>([]);
  const [cargando_materiales, setCargandoMateriales] = useState(false);
  const [materiales_generales_confirmados, setMaterialesGeneralesConfirmados] = useState(false);
  const [dialogo_confirmar_materiales_tratamiento_abierto, setDialogoConfirmarMaterialesTratamientoAbierto] = useState(false);
  const [materiales_tratamiento_confirmacion, setMaterialesTratamientoConfirmacion] = useState<any[]>([]);
  const [estado_pago_tratamiento, setEstadoPagoTratamiento] = useState<string>('pendiente');
  const [monto_pago_tratamiento, setMontoPagoTratamiento] = useState<string>('');
  const [metodo_pago_tratamiento, setMetodoPagoTratamiento] = useState<string>('Efectivo');
  const [materiales_confirmacion, setMaterialesConfirmacion] = useState<any[]>([]);
  const [materiales_adicionales_confirmacion, setMaterialesAdicionalesConfirmacion] = useState<MaterialCita[]>([]);
  const [mostrar_agregar_materiales_confirmacion, setMostrarAgregarMaterialesConfirmacion] = useState(false);
  const [estado_pago_confirmacion, setEstadoPagoConfirmacion] = useState<string>('pendiente');
  const [monto_confirmacion, setMontoConfirmacion] = useState<string>('');

  const [formulario_plantilla_inicial, setFormularioPlantillaInicial] = useState({
    nombre: "",
    numero_citas: "",
    costo_total: "",
    intervalo_dias: "0",
    intervalo_semanas: "0",
    intervalo_meses: "0",
    horas_aproximadas_citas: "0",
    minutos_aproximados_citas: "30",
  });

  const [formulario_cita_inicial, setFormularioCitaInicial] = useState({
    fecha: undefined as Date | undefined,
    descripcion: "",
    estado_pago: "pendiente",
    monto_esperado: "",
    horas_aproximadas: "0",
    minutos_aproximados: "30",
  });

  const [formulario_costo_inicial, setFormularioCostoInicial] = useState({
    costo_total: "",
  });

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

  const [formulario_editar_costo, setFormularioEditarCosto] = useState({
    costo_total: "",
  });


  const estados_pago = [
    { valor: 'pendiente', etiqueta: 'Pendiente', color: 'bg-yellow-500' },
    { valor: 'pagado', etiqueta: 'Pagado', color: 'bg-green-500' },
    { valor: 'cancelado', etiqueta: 'Cancelado', color: 'bg-red-500' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const esCitaPasada = (fecha: Date): boolean => {
    return new Date(fecha) < new Date();
  };

  const citaHaFinalizado = (cita: any): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora > fecha_fin;
  };

  const tratamientoHaFinalizado = (plan: PlanTratamiento): boolean => {
    return plan.total_abonado >= plan.costo_total;
  };

  const formularioPlantillaCambio = (): boolean => {
    if (!modo_edicion) return true;
    return JSON.stringify(formulario_plantilla) !== JSON.stringify(formulario_plantilla_inicial);
  };

  const formularioCitaCambio = (): boolean => {
    if (!modo_edicion_cita) return true;
    const fecha_actual = formulario_cita.fecha?.getTime();
    const fecha_inicial = formulario_cita_inicial.fecha?.getTime();
    if (fecha_actual !== fecha_inicial) return true;
    
    return formulario_cita.descripcion !== formulario_cita_inicial.descripcion ||
           formulario_cita.estado_pago !== formulario_cita_inicial.estado_pago ||
           formulario_cita.monto_esperado !== formulario_cita_inicial.monto_esperado ||
           formulario_cita.horas_aproximadas !== formulario_cita_inicial.horas_aproximadas ||
           formulario_cita.minutos_aproximados !== formulario_cita_inicial.minutos_aproximados;
  };

  const materialesCitaCambiaron = (): boolean => {
    return JSON.stringify(materiales_cita_edicion) !== JSON.stringify(materiales_cita_edicion_iniciales);
  };

  const formularioCostoCambio = (): boolean => {
    return formulario_editar_costo.costo_total !== formulario_costo_inicial.costo_total;
  };

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

  const cargarInventarios = async () => {
    if (inventarios.length > 0) return;
    
    try {
      const datos_inventarios = await inventarioApi.obtenerInventarios();
      setInventarios(datos_inventarios);
    } catch (error) {
      console.error("Error al cargar inventarios:", error);
    }
  };

  const cargarProductosInventario = async (inventario_id: number) => {
    if (productos_por_inventario[inventario_id]) {
      return;
    }
    
    setCargandoMateriales(true);
    try {
      const productos = await inventarioApi.obtenerProductos(inventario_id);
      setProductosPorInventario(prev => ({
        ...prev,
        [inventario_id]: productos
      }));
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos del inventario",
        variant: "destructive",
      });
    } finally {
      setCargandoMateriales(false);
    }
  };

  const validarDisponibilidadMateriales = (): { valido: boolean; advertencias: string[] } => {
    const advertencias: string[] = [];
    
    for (const material of materiales_cita_edicion) {
      if (material.inventario_id === 0) {
        advertencias.push('Hay materiales sin inventario seleccionado');
        continue;
      }
      
      if (material.producto_id === 0) {
        advertencias.push('Hay materiales sin producto seleccionado');
        continue;
      }

      const productos = productos_por_inventario[material.inventario_id] || [];
      const producto = productos.find(p => p.id === material.producto_id);
      if (!producto) continue;

      for (const item of material.items) {
        if (producto.tipo_gestion === 'consumible') {
          if (!item.lote_id) {
            advertencias.push(`${producto.nombre}: Debe seleccionar un lote para todos los items`);
            break;
          }
          if (item.cantidad_planeada <= 0) {
            advertencias.push(`${producto.nombre}: La cantidad debe ser mayor a 0 en todos los lotes`);
            break;
          }
        } else if (producto.tipo_gestion === 'activo_serializado' || producto.tipo_gestion === 'activo_general') {
          if (!item.activo_id) {
            advertencias.push(`${producto.nombre}: Debe seleccionar un activo para todos los items`);
            break;
          }
        }
      }
    }

    return { valido: true, advertencias };
  };

  const cargarMaterialesCita = async (cita_id: number) => {
    setCargandoMateriales(true);
    try {
      const respuesta = await inventarioApi.obtenerMaterialesCita(cita_id);
      const materiales = respuesta.materiales || [];
      
      const materiales_agrupados: Record<string, MaterialCita> = {};
      
      for (const material of materiales) {
        const key = `${material.inventario_id}-${material.producto_id}`;
        
        if (!materiales_agrupados[key]) {
          materiales_agrupados[key] = {
            producto_id: material.producto_id,
            inventario_id: material.inventario_id,
            inventario_nombre: material.inventario_nombre,
            producto_nombre: material.producto_nombre,
            tipo_gestion: material.tipo_gestion,
            unidad_medida: material.unidad_medida,
            items: []
          };
        }
        
        if (material.items && material.items.length > 0) {
          materiales_agrupados[key].items = material.items.map((item: any) => ({
            lote_id: item.lote_id,
            activo_id: item.activo_id,
            cantidad_planeada: item.cantidad_planeada,
            nro_lote: item.nro_lote,
            nro_serie: item.nro_serie,
            nombre_asignado: item.nombre_asignado,
          }));
        } else {
          materiales_agrupados[key].items.push({
            cantidad_planeada: material.cantidad_planeada,
          });
        }
      }
      
      setMaterialesCitaEdicion(Object.values(materiales_agrupados));
      setMaterialesCitaEdicionIniciales(JSON.parse(JSON.stringify(Object.values(materiales_agrupados))));
    } catch (error) {
      console.error('Error al cargar materiales de la cita:', error);
    } finally {
      setCargandoMateriales(false);
    }
  };

  const cargarMaterialesTratamiento = async (plan_tratamiento_id: number) => {
    setCargandoMateriales(true);
    try {
      const respuesta = await inventarioApi.obtenerMaterialesTratamiento(plan_tratamiento_id);
      const materiales = respuesta.materiales || [];
      const materiales_confirmados = materiales.some((mat: any) => 
        mat.tipo === 'inicio' && mat.confirmado === true
      );
      setMaterialesGeneralesConfirmados(materiales_confirmados);
      
      const materiales_agrupados: Record<string, MaterialGeneral> = {};
      
      for (const material of materiales) {
        const key = `${material.inventario_id}-${material.producto_id}`;
        
        if (!materiales_agrupados[key]) {
          materiales_agrupados[key] = {
            producto_id: material.producto_id,
            inventario_id: material.inventario_id,
            inventario_nombre: material.inventario_nombre,
            producto_nombre: material.producto_nombre,
            tipo_gestion: material.tipo_gestion,
            unidad_medida: material.unidad_medida,
            items: []
          };
        }
        
        materiales_agrupados[key].items.push({
          cantidad_por_cita: material.cantidad_planeada || 1,
        });
      }
      
      setMaterialesGenerales(Object.values(materiales_agrupados));
    } catch (error) {
      console.error('Error al cargar materiales del tratamiento:', error);
    } finally {
      setCargandoMateriales(false);
    }
  };

  const agregarMaterialGeneral = () => {
    setMaterialesGenerales([...materiales_generales, {
      producto_id: 0,
      inventario_id: 0,
      items: [{ cantidad_por_cita: 1 }],
    }]);
  };

  const actualizarMaterialGeneral = (index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_generales];
    const valor_procesado = (campo === 'producto_id' || campo === 'inventario_id') ? parseInt(valor) : valor;
    nuevos_materiales[index] = { ...nuevos_materiales[index], [campo]: valor_procesado };
    if (campo === 'inventario_id') {
      const inventario_id = parseInt(valor);
      const inventario = inventarios.find(inv => inv.id === inventario_id);
      if (inventario) {
        nuevos_materiales[index].inventario_nombre = inventario.nombre;
        nuevos_materiales[index].producto_id = 0;
        nuevos_materiales[index].items = [{ cantidad_por_cita: 1 }];
        if (inventario_id > 0) {
          cargarProductosInventario(inventario_id);
        }
      }
    }
    
    if (campo === 'producto_id') {
      const producto_id = parseInt(valor);
      const inventario_id = nuevos_materiales[index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === producto_id);
      if (producto) {
        nuevos_materiales[index].producto_nombre = producto.nombre;
        nuevos_materiales[index].tipo_gestion = producto.tipo_gestion;
        nuevos_materiales[index].unidad_medida = producto.unidad_medida;
        nuevos_materiales[index].items = [{ cantidad_por_cita: 1 }];
      }
    }
    
    setMaterialesGenerales(nuevos_materiales);
  };

  const agregarItemMaterialGeneral = (material_index: number) => {
    const nuevos_materiales = [...materiales_generales];
    nuevos_materiales[material_index].items.push({ cantidad_por_cita: 1 });
    setMaterialesGenerales(nuevos_materiales);
  };

  const actualizarItemMaterialGeneral = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_generales];
    const valor_procesado = (campo === 'lote_id' || campo === 'activo_id') ? parseInt(valor) : valor;
    
    nuevos_materiales[material_index].items[item_index] = {
      ...nuevos_materiales[material_index].items[item_index],
      [campo]: valor_procesado
    };
    if (campo === 'lote_id' && valor) {
      const material = nuevos_materiales[material_index];
      const producto = productos_por_inventario[material.inventario_id]?.find(p => p.id === material.producto_id);
      if (producto) {
        const lote = producto.lotes?.find(l => l.id === parseInt(valor));
        if (lote) {
          nuevos_materiales[material_index].items[item_index].nro_lote = lote.nro_lote;
        }
      }
    }
    if (campo === 'activo_id' && valor) {
      const material = nuevos_materiales[material_index];
      const producto = productos_por_inventario[material.inventario_id]?.find(p => p.id === material.producto_id);
      if (producto) {
        const activo = producto.activos?.find(a => a.id === parseInt(valor));
        if (activo) {
          if (producto.tipo_gestion === 'activo_serializado') {
            nuevos_materiales[material_index].items[item_index].nro_serie = activo.nro_serie;
          } else if (producto.tipo_gestion === 'activo_general') {
            nuevos_materiales[material_index].items[item_index].nombre_asignado = activo.nombre_asignado;
          }
        }
      }
    }

    setMaterialesGenerales(nuevos_materiales);
  };

  const eliminarItemMaterialGeneral = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_generales];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) {
      nuevos_materiales.splice(material_index, 1);
    }
    setMaterialesGenerales(nuevos_materiales);
  };

  const eliminarMaterialGeneral = (index: number) => {
    const nuevos_materiales = materiales_generales.filter((_, i) => i !== index);
    setMaterialesGenerales(nuevos_materiales);
  };

  const agregarMaterialPorCita = () => {
    setMaterialesPorCita([...materiales_por_cita, {
      producto_id: 0,
      inventario_id: 0,
      items: [{ cantidad_planeada: 1 }],
    }]);
  };

  const actualizarMaterialPorCita = (index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_por_cita];
    const valor_procesado = (campo === 'producto_id' || campo === 'inventario_id') ? parseInt(valor) : valor;
    nuevos_materiales[index] = { ...nuevos_materiales[index], [campo]: valor_procesado };
    if (campo === 'inventario_id') {
      const inventario_id = parseInt(valor);
      const inventario = inventarios.find(inv => inv.id === inventario_id);
      if (inventario) {
        nuevos_materiales[index].inventario_nombre = inventario.nombre;
        nuevos_materiales[index].producto_id = 0;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
        if (inventario_id > 0) {
          cargarProductosInventario(inventario_id);
        }
      }
    }
    
    if (campo === 'producto_id') {
      const producto_id = parseInt(valor);
      const inventario_id = nuevos_materiales[index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === producto_id);
      if (producto) {
        nuevos_materiales[index].producto_nombre = producto.nombre;
        nuevos_materiales[index].tipo_gestion = producto.tipo_gestion;
        nuevos_materiales[index].unidad_medida = producto.unidad_medida;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
      }
    }
    
    setMaterialesPorCita(nuevos_materiales);
  };

  const agregarItemMaterialPorCita = (material_index: number) => {
    const nuevos_materiales = [...materiales_por_cita];
    nuevos_materiales[material_index].items.push({ cantidad_planeada: 1 });
    setMaterialesPorCita(nuevos_materiales);
  };

  const actualizarItemMaterialPorCita = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_por_cita];
    const valor_procesado = (campo === 'lote_id' || campo === 'activo_id') ? parseInt(valor) : valor;
    
    nuevos_materiales[material_index].items[item_index] = {
      ...nuevos_materiales[material_index].items[item_index],
      [campo]: valor_procesado
    };
    if (campo === 'lote_id' && valor) {
      const material = nuevos_materiales[material_index];
      const producto = productos_por_inventario[material.inventario_id]?.find(p => p.id === material.producto_id);
      if (producto) {
        const lote = producto.lotes?.find(l => l.id === parseInt(valor));
        if (lote) {
          nuevos_materiales[material_index].items[item_index].nro_lote = lote.nro_lote;
        }
      }
    }

    if (campo === 'activo_id' && valor) {
      const material = nuevos_materiales[material_index];
      const producto = productos_por_inventario[material.inventario_id]?.find(p => p.id === material.producto_id);
      if (producto) {
        const activo = producto.activos?.find(a => a.id === parseInt(valor));
        if (activo) {
          if (producto.tipo_gestion === 'activo_serializado') {
            nuevos_materiales[material_index].items[item_index].nro_serie = activo.nro_serie;
          } else if (producto.tipo_gestion === 'activo_general') {
            nuevos_materiales[material_index].items[item_index].nombre_asignado = activo.nombre_asignado;
          }
        }
      }
    }

    setMaterialesPorCita(nuevos_materiales);
  };

  const eliminarItemMaterialPorCita = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_por_cita];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) {
      nuevos_materiales.splice(material_index, 1);
    }
    setMaterialesPorCita(nuevos_materiales);
  };

  const eliminarMaterialPorCita = (index: number) => {
    const nuevos_materiales = materiales_por_cita.filter((_, i) => i !== index);
    setMaterialesPorCita(nuevos_materiales);
  };

  const agregarMaterialCitaEdicion = () => {
    setMaterialesCitaEdicion([...materiales_cita_edicion, {
      producto_id: 0,
      inventario_id: 0,
      items: [{ cantidad_planeada: 1 }],
    }]);
  };

  const actualizarMaterialCitaEdicion = (index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_cita_edicion];
    const valor_procesado = (campo === 'producto_id' || campo === 'inventario_id') ? parseInt(valor) : valor;
    nuevos_materiales[index] = { ...nuevos_materiales[index], [campo]: valor_procesado };
    
    if (campo === 'inventario_id') {
      const inventario_id = parseInt(valor);
      const inventario = inventarios.find(inv => inv.id === inventario_id);
      if (inventario) {
        nuevos_materiales[index].inventario_nombre = inventario.nombre;
        nuevos_materiales[index].producto_id = 0;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
        if (inventario_id > 0) {
          cargarProductosInventario(inventario_id);
        }
      }
    }
    
    if (campo === 'producto_id') {
      const producto_id = parseInt(valor);
      const inventario_id = nuevos_materiales[index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === producto_id);
      if (producto) {
        nuevos_materiales[index].producto_nombre = producto.nombre;
        nuevos_materiales[index].tipo_gestion = producto.tipo_gestion;
        nuevos_materiales[index].unidad_medida = producto.unidad_medida;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
      }
    }

    setMaterialesCitaEdicion(nuevos_materiales);
  };

  const agregarItemMaterialCitaEdicion = (material_index: number) => {
    const nuevos_materiales = [...materiales_cita_edicion];
    nuevos_materiales[material_index].items.push({ cantidad_planeada: 1 });
    setMaterialesCitaEdicion(nuevos_materiales);
  };

  const actualizarItemMaterialCitaEdicion = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_cita_edicion];
    nuevos_materiales[material_index] = {
      ...nuevos_materiales[material_index],
      items: [...nuevos_materiales[material_index].items]
    };
    const valor_procesado = (campo === 'lote_id' || campo === 'activo_id') ? parseInt(valor) : valor;
    
    nuevos_materiales[material_index].items[item_index] = {
      ...nuevos_materiales[material_index].items[item_index],
      [campo]: valor_procesado
    };
    setMaterialesCitaEdicion(nuevos_materiales);
  };

  const eliminarItemMaterialCitaEdicion = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_cita_edicion];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) {
      nuevos_materiales.splice(material_index, 1);
    }
    setMaterialesCitaEdicion(nuevos_materiales);
  };

  const eliminarMaterialCitaEdicion = (index: number) => {
    const nuevos_materiales = materiales_cita_edicion.filter((_, i) => i !== index);
    setMaterialesCitaEdicion(nuevos_materiales);
  };

  const agregarMaterialAdicionalConfirmacion = () => {
    setMaterialesAdicionalesConfirmacion([...materiales_adicionales_confirmacion, {
      producto_id: 0,
      inventario_id: 0,
      items: [{ cantidad_planeada: 1 }],
    }]);
  };

  const actualizarMaterialAdicionalConfirmacion = (index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[index] = { ...nuevos_materiales[index], [campo]: valor };
    if (campo === 'inventario_id') {
      const inventario_id = parseInt(valor);
      const inventario = inventarios.find(inv => inv.id === inventario_id);
      if (inventario) {
        nuevos_materiales[index].inventario_nombre = inventario.nombre;
        nuevos_materiales[index].producto_id = 0;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
        if (inventario_id > 0) cargarProductosInventario(inventario_id);
      }
    }
    if (campo === 'producto_id') {
      const producto_id = parseInt(valor);
      const inventario_id = nuevos_materiales[index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === producto_id);
      if (producto) {
        nuevos_materiales[index].producto_nombre = producto.nombre;
        nuevos_materiales[index].tipo_gestion = producto.tipo_gestion;
        nuevos_materiales[index].unidad_medida = producto.unidad_medida;
        nuevos_materiales[index].items = [{ cantidad_planeada: 1 }];
      }
    }
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const agregarItemMaterialAdicionalConfirmacion = (material_index: number) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index].items.push({ cantidad_planeada: 1 });
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const actualizarItemMaterialAdicionalConfirmacion = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index] = { ...nuevos_materiales[material_index], items: [...nuevos_materiales[material_index].items] };
    nuevos_materiales[material_index].items[item_index] = { ...nuevos_materiales[material_index].items[item_index], [campo]: valor };
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const eliminarItemMaterialAdicionalConfirmacion = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) nuevos_materiales.splice(material_index, 1);
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const eliminarMaterialAdicionalConfirmacion = (index: number) => {
    setMaterialesAdicionalesConfirmacion(materiales_adicionales_confirmacion.filter((_, i) => i !== index));
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
    setMaterialesGenerales([]);
    setMaterialesPorCita([]);
    setProductosPorInventario({});
    setModoEdicion(false);
    setDialogoPlantillaAbierto(true);
  };

  const abrirDialogoEditar = async (tratamiento: Tratamiento) => {
    const formulario_inicial = {
      nombre: tratamiento.nombre,
      numero_citas: tratamiento.numero_citas.toString(),
      costo_total: tratamiento.costo_total.toString(),
      intervalo_dias: (tratamiento.intervalo_dias || 0).toString(),
      intervalo_semanas: (tratamiento.intervalo_semanas || 0).toString(),
      intervalo_meses: (tratamiento.intervalo_meses || 0).toString(),
      horas_aproximadas_citas: (tratamiento.horas_aproximadas_citas || 0).toString(),
      minutos_aproximados_citas: (tratamiento.minutos_aproximados_citas || 30).toString(),
    };
    setFormularioPlantilla(formulario_inicial);
    setFormularioPlantillaInicial(formulario_inicial);
    setMaterialesGenerales([]);
    setMaterialesPorCita([]);
    setProductosPorInventario({});
    setTratamientoSeleccionado(tratamiento);
    setModoEdicion(true);
    setDialogoPlantillaAbierto(true);
    try {
      const materiales = await tratamientosApi.obtenerMaterialesPlantilla(tratamiento.id);   
      if (materiales && materiales.length > 0) {
        const materiales_por_inv: { [key: number]: Producto[] } = {};
        const generales: MaterialGeneral[] = [];
        const por_cita: MaterialCita[] = [];

        materiales.forEach((mat: any) => {
          const inv_id = mat.inventario_id;
          if (!materiales_por_inv[inv_id]) {
            materiales_por_inv[inv_id] = [];
          }
          
          const producto: Producto = {
            id: mat.producto_id,
            inventario_id: mat.inventario_id,
            nombre: mat.producto_nombre,
            tipo_gestion: mat.tipo_gestion,
            unidad_medida: mat.unidad_medida,
          };
          materiales_por_inv[inv_id].push(producto);

          if (mat.tipo === 'general') {
            generales.push({
              producto_id: mat.producto_id,
              inventario_id: mat.inventario_id,
              inventario_nombre: mat.inventario_nombre,
              producto_nombre: mat.producto_nombre,
              tipo_gestion: mat.tipo_gestion,
              unidad_medida: mat.unidad_medida,
              items: [{
                cantidad_por_cita: mat.cantidad,
              }],
            });
          } else if (mat.tipo === 'por_cita') {
            por_cita.push({
              producto_id: mat.producto_id,
              inventario_id: mat.inventario_id,
              inventario_nombre: mat.inventario_nombre,
              producto_nombre: mat.producto_nombre,
              tipo_gestion: mat.tipo_gestion,
              unidad_medida: mat.unidad_medida,
              items: [{
                cantidad_planeada: mat.cantidad,
              }],
            });
          }
        });

        setProductosPorInventario(materiales_por_inv);
        setMaterialesGenerales(generales);
        setMaterialesPorCita(por_cita);
      }
    } catch (error) {
      console.error('Error al cargar materiales de la plantilla:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales de la plantilla.",
        variant: "destructive",
      });
    }
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
      minutos_aproximados_citas < 0
    ) {
      toast({
        title: "Error",
        description: "Los valores numéricos deben ser válidos y no negativos",
        variant: "destructive",
      });
      return;
    }

    if (horas_aproximadas_citas + minutos_aproximados_citas <= 0) {
      toast({
        title: "Error",
        description: "La duración total de la cita debe ser de al menos 1 minuto",
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
      const materiales: Array<{ producto_id: number; tipo: string; cantidad: number }> = [];
      materiales_generales.forEach((mat) => {
        const cantidad_total = mat.items.reduce((sum, item) => {
          return sum + (item.cantidad_por_cita || 0);
        }, 0);
        if (cantidad_total > 0) {
          materiales.push({
            producto_id: mat.producto_id,
            tipo: 'general',
            cantidad: cantidad_total,
          });
        }
      });

      materiales_por_cita.forEach((mat) => {
        const cantidad_total = mat.items.reduce((sum, item) => {
          return sum + (item.cantidad_planeada || 0);
        }, 0);
        if (cantidad_total > 0) {
          materiales.push({
            producto_id: mat.producto_id,
            tipo: 'por_cita',
            cantidad: cantidad_total,
          });
        }
      });

      const datos = {
        nombre: formulario_plantilla.nombre,
        numero_citas,
        costo_total,
        intervalo_dias,
        intervalo_semanas,
        intervalo_meses,
        horas_aproximadas_citas,
        minutos_aproximados_citas,
        materiales,
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
    const anio = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };
  
  const formatearHoraParaBackend = (fecha: Date): string => {
    const horas = String(fecha.getUTCHours()).padStart(2, '0');
    const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');
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
              <pre className="text-sm whitespace-pre-wrap font-mono">{mensaje_error}</pre>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 15000,
      });
    } finally {
      setGuardando(false);
    }
  };

  const verDetallePlan = async (plan: PlanTratamiento) => {
    setPlanSeleccionado(plan);
    setDialogoDetallePlanAbierto(true);
    await cargarMaterialesTratamiento(plan.id);
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

  const abrirDialogoEditarCita = async (cita: any) => {
    const es_pasada = esCitaPasada(cita.fecha);
    
    const formulario_inicial = {
      fecha: new Date(cita.fecha),
      descripcion: cita.descripcion,
      estado_pago: cita.estado_pago || 'pendiente',
      monto_esperado: cita.monto_esperado?.toString() || "",
      horas_aproximadas: (cita.horas_aproximadas || 0).toString(),
      minutos_aproximados: (cita.minutos_aproximados || 30).toString(),
    };
    setFormularioCita(formulario_inicial);
    setFormularioCitaInicial(formulario_inicial);
    setCitaSeleccionada(cita);
    setModoEdicionCita(true);
    
    if (!es_pasada) {
      setMaterialesCitaEdicion([]);
      if (cita.id) {
        await cargarMaterialesCita(cita.id);
      }
    }
    
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

    if (isNaN(horas) || horas < 0 || isNaN(minutos) || minutos < 0) {
      toast({
        title: "Error",
        description: "Las horas y minutos deben ser números válidos y no negativos",
        variant: "destructive",
      });
      return;
    }

    if (horas + minutos <= 0) {
      toast({
        title: "Error",
        description: "La duración total (horas + minutos) debe ser de al menos 1 minuto",
        variant: "destructive",
      });
      return;
    }

    if (materiales_cita_edicion.length > 0) {
      const { valido, advertencias } = validarDisponibilidadMateriales();
      if (!valido) {
        toast({
          title: 'Error de Validación',
          description: advertencias.join('\n'),
          variant: 'destructive',
        });
        return;
      }
      if (advertencias.length > 0) {
        toast({
          title: 'Advertencias',
          description: advertencias.join('\n'),
          variant: 'default',
          duration: 5000,
        });
      }
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

      let cita_id: number;

      if (modo_edicion_cita && cita_seleccionada) {
        await agendaApi.actualizar(cita_seleccionada.id, datos);
        cita_id = cita_seleccionada.id;
        
        const estado_cambio = cita_seleccionada.estado_pago !== formulario_cita.estado_pago;
        const cambio_a_pagado = cita_seleccionada.estado_pago !== 'pagado' && formulario_cita.estado_pago === 'pagado';
        const cambio_desde_pagado = cita_seleccionada.estado_pago === 'pagado' && formulario_cita.estado_pago !== 'pagado';
        if (materiales_cita_edicion.length > 0) {
          try {
            const materiales_para_guardar = materiales_cita_edicion
              .filter(m => m.producto_id > 0)
              .flatMap(m => 
                m.items.map(item => ({
                  producto_id: m.producto_id,
                  cantidad_planeada: item.cantidad_planeada,
                }))
              );
            
            if (materiales_para_guardar.length > 0) {
              await inventarioApi.asignarMaterialesCita(cita_id, {
                materiales: materiales_para_guardar,
              });
            }
          } catch (error) {
            console.error('Error al guardar materiales:', error);
            toast({
              title: 'Advertencia',
              description: 'La cita se guardó pero hubo un error al asignar los materiales',
              variant: 'default',
            });
          }
        }
        
        if (estado_cambio && plan_seleccionado) {
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
        const cita_creada = await agendaApi.crear(datos);
        cita_id = cita_creada.id;
        if (materiales_cita_edicion.length > 0 && cita_id) {
          try {
            const materiales_para_guardar = materiales_cita_edicion
              .filter(m => m.producto_id > 0)
              .flatMap(m => 
                m.items.map(item => ({
                  producto_id: m.producto_id,
                  cantidad_planeada: item.cantidad_planeada,
                }))
              );
            
            if (materiales_para_guardar.length > 0) {
              await inventarioApi.asignarMaterialesCita(cita_id, {
                materiales: materiales_para_guardar,
              });
            }
          } catch (error) {
            console.error('Error al guardar materiales:', error);
            toast({
              title: 'Advertencia',
              description: 'La cita se guardó pero hubo un error al asignar los materiales',
              variant: 'default',
            });
          }
        }
        
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
              <pre className="text-sm whitespace-pre-wrap font-mono">{mensaje_error}</pre>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 15000,
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

  const confirmarEliminarPlan = async () => {
    if (!plan_a_eliminar) return;
    try {
      await planesTratamientoApi.eliminar(plan_a_eliminar.id);
      toast({
        title: "Éxito",
        description: "Plan de tratamiento eliminado correctamente",
      });
      setDialogoConfirmarEliminarAbierto(false);
      setPlanAEliminar(null);
      setDialogoDetallePlanAbierto(false);
      cargarPlanes();
    } catch (error: any) {
        console.error("Error al eliminar plan:", error);
        const mensaje = error.response?.data?.message || "No se pudo eliminar el plan de tratamiento.";
        toast({
            title: "Error",
            description: mensaje,
            variant: "destructive",
        });
    }
  };

  const abrirDialogoEditarCosto = async () => {
    if (!plan_seleccionado) return;
    const formulario_inicial = {
      costo_total: plan_seleccionado.costo_total.toString(),
    };
    setFormularioEditarCosto(formulario_inicial);
    setFormularioCostoInicial(formulario_inicial);
    
    setMaterialesGenerales([]);
    if (plan_seleccionado.id) {
      await cargarMaterialesTratamiento(plan_seleccionado.id);
    }
    
    setDialogoEditarCostoAbierto(true);
  };

  const manejarGuardarCosto = async () => {
    if (!plan_seleccionado || !formulario_editar_costo.costo_total) {
      toast({
        title: "Error",
        description: "El costo total es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const nuevo_costo = parseFloat(formulario_editar_costo.costo_total);
    if (isNaN(nuevo_costo) || nuevo_costo <= 0) {
      toast({
        title: "Error",
        description: "El costo debe ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      await planesTratamientoApi.actualizar(plan_seleccionado.id, {
        costo_total: nuevo_costo,
      });
      
      if (materiales_generales.length > 0) {
        try {
          const materiales_transformados = materiales_generales.flatMap(material => 
            material.items.map(item => ({
              producto_id: material.producto_id,
              tipo: 'inicio',
              cantidad_planeada: item.cantidad_por_cita || 1,
            }))
          );

          await inventarioApi.asignarMaterialesTratamiento(plan_seleccionado.id, {
            materiales: materiales_transformados,
          });
        } catch (error) {
          console.error('Error al guardar materiales:', error);
        }
      }
      
      toast({
        title: "Éxito",
        description: "Tratamiento actualizado correctamente",
      });
      
      setDialogoEditarCostoAbierto(false);
      await recargarPlanSeleccionado();
      await cargarPlanes();
    } catch (error: any) {
      console.error("Error al actualizar tratamiento:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo actualizar el tratamiento",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarMaterialesCita = async (cita: any) => {
    if (!cita.id) return;
    setCitaSeleccionada(cita);
    setCargandoMateriales(true);
    setEstadoPagoConfirmacion(cita.estado_pago || 'pendiente');
    setMontoConfirmacion(cita.monto_esperado?.toString() || '');
    setMaterialesAdicionalesConfirmacion([]);
    setMostrarAgregarMaterialesConfirmacion(false);
    
    try {
      const respuesta = await inventarioApi.obtenerMaterialesCita(cita.id);
      const materiales_raw = respuesta.materiales || [];
      const materiales_confirmacion: any[] = [];
      for (const material of materiales_raw) {
        if (material.items && material.items.length > 0) {
          for (const item of material.items) {
            const cant_planeada = Math.max(0, parseFloat(item.cantidad_planeada?.toString() || '0'));

            materiales_confirmacion.push({
              material_cita_id: material.id,
              producto_nombre: material.producto_nombre,
              inventario_nombre: material.inventario_nombre,
              tipo_gestion: material.tipo_gestion,
              cantidad_planeada: cant_planeada,
              cantidad_usada: cant_planeada,
              lote_id: item.lote_id,
              activo_id: item.activo_id,
              nro_lote: item.nro_lote,
              nro_serie: item.nro_serie,
              nombre_asignado: item.nombre_asignado,
              unidad_medida: material.unidad_medida,
              inventario_id: material.inventario_id
            });
          }
        } else {
          const cant_planeada = Math.max(0, parseFloat(material.cantidad_planeada?.toString() || '0'));

          materiales_confirmacion.push({
            material_cita_id: material.id,
            producto_nombre: material.producto_nombre,
            inventario_nombre: material.inventario_nombre,
            tipo_gestion: material.tipo_gestion,
            cantidad_planeada: cant_planeada,
            cantidad_usada: cant_planeada,
            unidad_medida: material.unidad_medida,
            inventario_id: material.inventario_id
          });
        }
      }
      
      setMaterialesConfirmacion(materiales_confirmacion);
      setDialogoConfirmarMaterialesAbierto(true);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales de la cita',
        variant: 'destructive',
      });
    } finally {
      setCargandoMateriales(false);
    }
  };

  const manejarConfirmarMaterialesCita = async () => {
    if (!cita_seleccionada?.id) return;

    setGuardando(true);
    try {
      if (materiales_adicionales_confirmacion.length > 0) {
        const materiales_para_asignar = materiales_adicionales_confirmacion.flatMap(m => {
          return m.items.map(item => ({
            producto_id: m.producto_id,
            inventario_id: m.inventario_id,
            lote_id: item.lote_id,
            activo_id: item.activo_id,
            cantidad_planeada: item.cantidad_planeada,
          }));
        });
        
        await inventarioApi.agregarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_para_asignar,
        });
      }

      await agendaApi.actualizar(cita_seleccionada.id, {
        estado_pago: estado_pago_confirmacion,
        monto_esperado: monto_confirmacion ? parseFloat(monto_confirmacion) : 0,
        fecha: ajustarFechaParaBackend(new Date(cita_seleccionada.fecha)),
        descripcion: cita_seleccionada.descripcion,
        horas_aproximadas: cita_seleccionada.horas_aproximadas,
        minutos_aproximados: cita_seleccionada.minutos_aproximados,
        paciente_id: plan_seleccionado?.paciente.id,
        plan_tratamiento_id: plan_seleccionado?.id,
      });

      if (materiales_confirmacion.length > 0) {
        await inventarioApi.confirmarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_confirmacion.map(m => ({
            material_cita_id: m.material_cita_id,
            cantidad_usada: Number(m.cantidad_usada),
            lote_id: m.lote_id,
            activo_id: m.activo_id,
            inventario_id: m.inventario_id
          })),
        });
      }

      toast({
        title: 'Éxito',
        description: 'Cita confirmada correctamente (estado, monto y materiales)',
      });

      setDialogoConfirmarMaterialesAbierto(false);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error('Error al confirmar cita:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo confirmar la cita',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoConfirmarMaterialesTratamiento = async () => {
    if (!plan_seleccionado) return;
    try {
      const respuesta = await inventarioApi.obtenerMaterialesTratamiento(plan_seleccionado.id);
      const materiales = respuesta.materiales || [];
      const materiales_inicio = materiales.filter((mat: any) => mat.tipo === 'inicio');
      const materiales_preparados = materiales_inicio.map((mat: any) => ({
        id: mat.id,
        producto_id: mat.producto_id,
        producto_nombre: mat.producto_nombre,
        inventario_nombre: mat.inventario_nombre,
        tipo_gestion: mat.tipo_gestion,
        unidad_medida: mat.unidad_medida,
        cantidad_planeada: mat.cantidad_planeada,
        cantidad_usada: mat.cantidad_planeada,
      }));
      
      setMaterialesTratamientoConfirmacion(materiales_preparados);
      setEstadoPagoTratamiento('pendiente');
      setMontoPagoTratamiento('');
      setMetodoPagoTratamiento('Efectivo');
      setDialogoConfirmarMaterialesTratamientoAbierto(true);
    } catch (error) {
      console.error('Error al cargar materiales del tratamiento:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales del tratamiento",
        variant: "destructive",
      });
    }
  };

  const manejarConfirmarMaterialesTratamiento = async () => {
    if (!plan_seleccionado) return;

    setGuardando(true);
    try {
      const datos_confirmacion: any = {
        materiales: materiales_tratamiento_confirmacion.map(mat => ({
          material_tratamiento_id: mat.id,
          cantidad_usada: mat.cantidad_usada,
        })),
      };
      if (estado_pago_tratamiento && estado_pago_tratamiento !== 'pendiente') {
        datos_confirmacion.estado_pago = estado_pago_tratamiento;
        
        if (monto_pago_tratamiento && parseFloat(monto_pago_tratamiento) > 0) {
          datos_confirmacion.monto_pago = parseFloat(monto_pago_tratamiento);
          datos_confirmacion.metodo_pago = metodo_pago_tratamiento;
        }
      }

      await inventarioApi.confirmarMaterialesGenerales(plan_seleccionado.id, datos_confirmacion);

      toast({
        title: "Éxito",
        description: "Materiales generales confirmados correctamente. El stock ha sido reducido y el pago registrado.",
      });

      setDialogoConfirmarMaterialesTratamientoAbierto(false);
      setMaterialesGeneralesConfirmados(true);
      await recargarPlanSeleccionado();
    } catch (error: any) {
      console.error('Error al confirmar materiales del tratamiento:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudieron confirmar los materiales del tratamiento",
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCantidadMaterialTratamiento = (index: number, cantidad: number) => {
    const nuevos_materiales = [...materiales_tratamiento_confirmacion];
    nuevos_materiales[index].cantidad_usada = cantidad;
    setMaterialesTratamientoConfirmacion(nuevos_materiales);
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

  const cumpleFiltroPlantilla = (tratamiento: Tratamiento): boolean => {
    if (!busqueda_plantillas) return true;
    
    const termino = busqueda_plantillas.toLowerCase();
    return tratamiento.nombre.toLowerCase().includes(termino);
  };

  const cumpleFiltroPlan = (plan: PlanTratamiento): boolean => {
    if (paciente_filtro !== 'todos' && plan.paciente?.id.toString() !== paciente_filtro) {
      return false;
    }
    
    if (!busqueda_planes) return true;
    
    const termino = busqueda_planes.toLowerCase();
    const nombre_paciente = `${plan.paciente?.nombre || ''} ${plan.paciente?.apellidos || ''}`.toLowerCase();
    const nombre_tratamiento = plan.tratamiento?.nombre.toLowerCase() || '';
    
    return nombre_paciente.includes(termino) || nombre_tratamiento.includes(termino);
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

  const tratamientos_filtrados = tratamientos.filter(cumpleFiltroPlantilla);
  const planes_filtrados = planes.filter(cumpleFiltroPlan);
  
  const hay_cambios_cita = modo_edicion_cita && (materialesCitaCambiaron() || formularioCitaCambio());

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Plantillas de Tratamiento
                        </CardTitle>
                        <CardDescription>
                          {tratamientos_filtrados.length} de {tratamientos.length} plantillas
                          {busqueda_plantillas && ' (filtradas)'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="w-80">
                      <SearchInput
                        valor={busqueda_plantillas}
                        onChange={setBusquedaPlantillas}
                        placeholder="Buscar plantilla por nombre..."
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tratamientos_filtrados.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {busqueda_plantillas 
                            ? 'No se encontraron plantillas'
                            : 'No hay plantillas registradas'
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {busqueda_plantillas
                            ? 'Intenta con otro término de búsqueda'
                            : 'Crea plantillas de tratamientos comunes para agilizar tu trabajo'
                          }
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
                        {tratamientos_filtrados.map((tratamiento) => (
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
                          {planes_filtrados.length} de {planes.length} planes
                          {(paciente_filtro !== 'todos' || busqueda_planes) && ' (filtrados)'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-64">
                        <Combobox
                          opciones={opciones_pacientes}
                          valor={paciente_filtro}
                          onChange={setPacienteFiltro}
                          placeholder="Filtrar por paciente"
                        />
                      </div>
                      <div className="w-80">
                        <SearchInput
                          valor={busqueda_planes}
                          onChange={setBusquedaPlanes}
                          placeholder="Buscar por paciente o tratamiento..."
                        />
                      </div>
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
                          {busqueda_planes || paciente_filtro !== 'todos'
                            ? 'No se encontraron planes'
                            : 'No hay planes de tratamiento asignados'
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {busqueda_planes || paciente_filtro !== 'todos'
                            ? 'Intenta con otro filtro de búsqueda'
                            : 'Asigna plantillas de tratamiento a tus pacientes desde la pestaña de Plantillas'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {planes_filtrados.map((plan) => {
                        const progreso = calcularProgreso(plan);
                        const saldo_pendiente =
                          plan.costo_total - plan.total_abonado;
                        const esta_completado = progreso === 100 && saldo_pendiente <= 0;

                        return (
                          <div
                            key={plan.id}
                            className={`p-6 rounded-lg border-2 border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer ${esta_completado ? 'opacity-60' : ''}`}
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
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
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

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
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

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Materiales del Tratamiento</Label>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <Accordion 
                  type="multiple" 
                  className="w-full space-y-2"
                  onValueChange={async (values) => {
                    if (values.includes('materiales-generales') || values.includes('materiales-por-cita')) {
                      await cargarInventarios();
                    }
                  }}
                >
                  <AccordionItem value="materiales-generales">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Materiales Generales</span>
                        <Badge variant="secondary">{materiales_generales.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Materiales que se aplicarán automáticamente en cada cita del tratamiento
                      </p>

                      <SelectorMateriales
                        inventarios={inventarios}
                        productos_por_inventario={productos_por_inventario}
                        materiales={materiales_generales}
                        cargarProductos={cargarProductosInventario}
                        onAgregarMaterial={agregarMaterialGeneral}
                        onEliminarMaterial={eliminarMaterialGeneral}
                        onActualizarMaterial={actualizarMaterialGeneral}
                        onAgregarItem={agregarItemMaterialGeneral}
                        onEliminarItem={eliminarItemMaterialGeneral}
                        onActualizarItem={actualizarItemMaterialGeneral}
                        texto_boton_agregar="Agregar Material General"
                        cargando={cargando_materiales}
                      />
                      </AccordionContent>
                    </AccordionItem>

                    {}
                    <AccordionItem value="materiales-por-cita">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Materiales Por Cita (mismo para cada cita)</span>
                          <Badge variant="secondary">{materiales_por_cita.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Materiales que se aplicarán automáticamente en cada cita (ej: pinzas, algodón)
                        </p>

                        <SelectorMateriales
                          inventarios={inventarios}
                          productos_por_inventario={productos_por_inventario}
                          materiales={materiales_por_cita}
                          cargarProductos={cargarProductosInventario}
                          onAgregarMaterial={agregarMaterialPorCita}
                          onEliminarMaterial={eliminarMaterialPorCita}
                          onActualizarMaterial={actualizarMaterialPorCita}
                          onAgregarItem={agregarItemMaterialPorCita}
                          onEliminarItem={eliminarItemMaterialPorCita}
                          onActualizarItem={actualizarItemMaterialPorCita}
                          texto_boton_agregar="Agregar Material Por Cita"
                          cargando={cargando_materiales}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </ScrollArea>
            </div>
          </div>
          </ScrollArea>

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
              disabled={guardando || (modo_edicion && !formularioPlantillaCambio())}
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
            <div className="flex justify-end mt-[-20px] gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={abrirDialogoEditarCosto}
                className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPlanAEliminar(plan_seleccionado);
                  setDialogoConfirmarEliminarAbierto(true);
                }}
                className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                title="Eliminar Plan"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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

              {!materiales_generales_confirmados && tratamientoHaFinalizado(plan_seleccionado) && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex gap-3 items-center justify-between">
                  <div className="flex gap-2 flex-1">
                    <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-600">
                      <p className="font-semibold mb-1">Materiales Generales Pendientes</p>
                      <p>Los materiales generales están esperando confirmación manual.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={abrirDialogoConfirmarMaterialesTratamiento}
                    className="bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:scale-105 transition-all duration-200"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Materiales
                  </Button>
                </div>
              )}

              {materiales_generales_confirmados && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-600">
                    <p className="font-semibold mb-1">Materiales Generales Confirmados</p>
                    <p>Los materiales generales han sido confirmados y el stock ha sido actualizado.</p>
                  </div>
                </div>
              )}

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
                              {cita.materiales_confirmados && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                  <Check className="h-3 w-3 mr-1" />
                                  Materiales confirmados
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground ml-7">
                              {cita.descripcion}
                            </p>
                            <div className="flex items-center gap-3 ml-7 mt-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Duración: {formatearDuracion(cita.horas_aproximadas, cita.minutos_aproximados)}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Monto: {formatearMoneda(cita.monto_esperado || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!cita.materiales_confirmados && citaHaFinalizado(cita) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirDialogoConfirmarMaterialesCita(cita)}
                                className="hover:bg-green-500/20 hover:text-green-600 hover:scale-110 transition-all duration-200 ring-2 ring-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                title="Confirmar Materiales"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
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
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion_cita ? 'Editar Cita' : 'Agregar Cita al Plan'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion_cita 
                ? (cita_seleccionada && esCitaPasada(cita_seleccionada.fecha)
                  ? 'Editando cita pasada: solo puedes modificar monto y estado de pago' 
                  : 'Modifica los detalles de la cita')
                : 'Programa una nueva cita para este plan de tratamiento'}
            </DialogDescription>
          </DialogHeader>

          {modo_edicion_cita && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha) && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Esta cita ya ocurrió. Solo puedes editar el monto y estado de pago.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="fecha_cita">Fecha y Hora *</Label>
              {modo_edicion_cita && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha) ? (
                <Input
                  value={formulario_cita.fecha ? formulario_cita.fecha.toLocaleString('es-BO') : ''}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <DateTimePicker
                  valor={formulario_cita.fecha}
                  onChange={(fecha) => setFormularioCita({ ...formulario_cita, fecha })}
                  placeholder="Selecciona fecha y hora"
                />
              )}
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
                disabled={modo_edicion_cita && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha)}
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
                    disabled={modo_edicion_cita && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha)}
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
                    disabled={modo_edicion_cita && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha)}
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
                  disabled={!modo_edicion_cita}
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

            {modo_edicion_cita && !(cita_seleccionada && esCitaPasada(cita_seleccionada.fecha)) && (
              <Accordion 
                type="single" 
                collapsible 
                className="w-full border rounded-lg"
                onValueChange={async (value) => {
                  if (value === 'materiales') {
                    await cargarInventarios();
                  }
                }}
              >
                <AccordionItem value="materiales" className="border-none">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Materiales de la Cita</span>
                      <Badge variant="secondary">{materiales_cita_edicion.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                    <SelectorMateriales
                      inventarios={inventarios}
                      productos_por_inventario={productos_por_inventario}
                      materiales={materiales_cita_edicion}
                      cargarProductos={cargarProductosInventario}
                      onAgregarMaterial={agregarMaterialCitaEdicion}
                      onEliminarMaterial={eliminarMaterialCitaEdicion}
                      onActualizarMaterial={actualizarMaterialCitaEdicion}
                      onAgregarItem={agregarItemMaterialCitaEdicion}
                      onEliminarItem={eliminarItemMaterialCitaEdicion}
                      onActualizarItem={actualizarItemMaterialCitaEdicion}
                      texto_boton_agregar="Agregar Material"
                      cargando={cargando_materiales}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              disabled={guardando || (modo_edicion_cita && !hay_cambios_cita)}
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
                : plan_a_eliminar
                ? `¿Estás seguro de que deseas eliminar este plan de tratamiento asignado?`
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

          {plan_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="font-semibold text-foreground">{plan_a_eliminar.tratamiento.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Paciente: {plan_a_eliminar.paciente.nombre} {plan_a_eliminar.paciente.apellidos}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan_a_eliminar.citas.length} citas - {formatearMoneda(plan_a_eliminar.costo_total)}
              </p>
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
                setPlanAEliminar(null);
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
                } else if (plan_a_eliminar) {
                  confirmarEliminarPlan();
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

      {}
      <Dialog open={dialogo_editar_costo_abierto} onOpenChange={setDialogoEditarCostoAbierto}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tratamiento</DialogTitle>
            <DialogDescription>
              Modifica el costo total y los materiales generales del plan de tratamiento
            </DialogDescription>
          </DialogHeader>

          {plan_seleccionado && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                <p className="font-semibold text-foreground">{plan_seleccionado.tratamiento.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Paciente: {plan_seleccionado.paciente.nombre} {plan_seleccionado.paciente.apellidos}
                </p>
                <p className="text-sm text-muted-foreground">
                  Costo actual: {formatearMoneda(plan_seleccionado.costo_total)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_total">Nuevo Costo Total (Bs.) *</Label>
                <Input
                  id="costo_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario_editar_costo.costo_total}
                  onChange={(e) => setFormularioEditarCosto({ costo_total: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Materiales Generales (opcionales)</Label>
                <Accordion 
                  type="single" 
                  collapsible 
                  className="w-full border rounded-lg"
                  onValueChange={async (value) => {
                    if (value === 'materiales-generales-edicion') {
                      await cargarInventarios();
                    }
                  }}
                >
                  <AccordionItem value="materiales-generales-edicion" className="border-none">
                    <AccordionTrigger className="px-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Editar Materiales Generales</span>
                        <Badge variant="secondary">{materiales_generales.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 space-y-4">
                      <SelectorMateriales
                        materiales={materiales_generales}
                        inventarios={inventarios}
                        productos_por_inventario={productos_por_inventario}
                        onAgregarMaterial={agregarMaterialGeneral}
                        onActualizarMaterial={actualizarMaterialGeneral}
                        onEliminarMaterial={eliminarMaterialGeneral}
                        onAgregarItem={agregarItemMaterialGeneral}
                        onActualizarItem={actualizarItemMaterialGeneral}
                        onEliminarItem={eliminarItemMaterialGeneral}
                        cargarProductos={cargarProductosInventario}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoEditarCostoAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarGuardarCosto}
              disabled={guardando || !formularioCostoCambio()}
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={dialogo_confirmar_materiales_abierto} onOpenChange={setDialogoConfirmarMaterialesAbierto}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirmar Cita Realizada</DialogTitle>
            <DialogDescription>
              Confirma el estado de pago, monto y materiales realmente utilizados en esta cita
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Esta acción registrará el estado final de la cita, consumo de materiales y actualizará el inventario
            </p>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 px-1">
            {}
            <div className="border rounded-lg p-4 space-y-3 bg-blue-500/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estado de Pago y Monto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Pago</Label>
                  <Combobox
                    opciones={opciones_estados}
                    valor={estado_pago_confirmacion}
                    onChange={setEstadoPagoConfirmacion}
                    placeholder="Selecciona estado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto Final (Bs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto_confirmacion}
                    onChange={(e) => setMontoConfirmacion(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {}
            {cargando_materiales ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : materiales_confirmacion.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border rounded-lg bg-secondary/5">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No hay materiales asignados a esta cita
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Materiales Utilizados
                </h3>
                {materiales_confirmacion.map((material, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3 bg-secondary/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{material.producto_nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {material.inventario_nombre && `${material.inventario_nombre} · `}
                          {material.tipo_gestion === 'consumible' ? 'Consumible' : 
                           material.tipo_gestion === 'activo_serializado' ? 'Activo Serializado' : 
                           'Activo General'}
                        </p>
                        {material.nro_lote && (
                          <p className="text-xs text-muted-foreground mt-1">📦 Lote: {material.nro_lote}</p>
                        )}
                        {material.nro_serie && (
                          <p className="text-xs text-muted-foreground mt-1">🔢 Serie: {material.nro_serie}</p>
                        )}
                        {material.nombre_asignado && (
                          <p className="text-xs text-muted-foreground mt-1">🏷️ Nombre: {material.nombre_asignado}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        Planeado: {material.cantidad_planeada}
                      </Badge>
                    </div>

                    {material.tipo_gestion === 'consumible' && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Cantidad Realmente Usada{material.unidad_medida ? ` (${material.unidad_medida})` : ''}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={material.cantidad_usada}
                          onChange={(e) => {
                            const nuevos_materiales = [...materiales_confirmacion];
                            nuevos_materiales[idx].cantidad_usada = parseFloat(e.target.value) || 0;
                            setMaterialesConfirmacion(nuevos_materiales);
                          }}
                          className="w-full"
                        />
                        {material.cantidad_usada !== material.cantidad_planeada && (
                          <p className="text-xs text-amber-600">
                            Diferencia: {(material.cantidad_usada - material.cantidad_planeada).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {}
            <div className="border-t pt-4 space-y-3">
              {!mostrar_agregar_materiales_confirmacion ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await cargarInventarios();
                    setMostrarAgregarMaterialesConfirmacion(true);
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Materiales Adicionales
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Materiales Adicionales
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarAgregarMaterialesConfirmacion(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <SelectorMateriales
                    inventarios={inventarios}
                    productos_por_inventario={productos_por_inventario}
                    cargarProductos={cargarProductosInventario}
                    materiales={materiales_adicionales_confirmacion}
                    onAgregarMaterial={agregarMaterialAdicionalConfirmacion}
                    onActualizarMaterial={actualizarMaterialAdicionalConfirmacion}
                    onEliminarMaterial={eliminarMaterialAdicionalConfirmacion}
                    onAgregarItem={agregarItemMaterialAdicionalConfirmacion}
                    onActualizarItem={actualizarItemMaterialAdicionalConfirmacion}
                    onEliminarItem={eliminarItemMaterialAdicionalConfirmacion}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarMaterialesAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarConfirmarMaterialesCita}
              disabled={guardando || (materiales_confirmacion.length === 0 && materiales_adicionales_confirmacion.length === 0)}
              className="bg-green-600 hover:bg-green-700"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cita y Materiales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_materiales_tratamiento_abierto} onOpenChange={setDialogoConfirmarMaterialesTratamientoAbierto}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Confirmar Materiales Generales del Tratamiento</DialogTitle>
            <DialogDescription>
              Confirma los materiales generales utilizados. Puedes editar las cantidades y registrar información de pago.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-4">
              {materiales_tratamiento_confirmacion.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay materiales generales asignados a este tratamiento</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Materiales a Confirmar</Label>
                    {materiales_tratamiento_confirmacion.map((material, index) => (
                      <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{material.producto_nombre}</p>
                            <p className="text-sm text-muted-foreground">{material.inventario_nombre}</p>
                          </div>
                          <Badge variant="outline">{material.tipo_gestion}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pl-4 border-l-2 border-primary/30">
                          <Label className="text-sm">Cantidad Planeada:</Label>
                          <span className="text-sm font-medium">{material.cantidad_planeada} {material.unidad_medida}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-4 border-l-2 border-green-500/50">
                          <Label className="text-sm">Cantidad Usada:</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={material.cantidad_usada}
                            onChange={(e) => actualizarCantidadMaterialTratamiento(index, parseFloat(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">{material.unidad_medida}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Información de Pago (Opcional)</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estado_pago_tratamiento">Estado de Pago</Label>
                        <Combobox
                          opciones={opciones_estados.filter(e => e.valor !== 'cancelado')}
                          valor={estado_pago_tratamiento}
                          onChange={setEstadoPagoTratamiento}
                          placeholder="Estado de pago"
                        />
                      </div>

                      {estado_pago_tratamiento !== 'pendiente' && (
                        <div className="space-y-2">
                          <Label htmlFor="monto_pago_tratamiento">Monto del Pago (Bs.)</Label>
                          <Input
                            id="monto_pago_tratamiento"
                            type="number"
                            step="0.01"
                            min="0"
                            value={monto_pago_tratamiento}
                            onChange={(e) => setMontoPagoTratamiento(e.target.value)}
                            placeholder="0.00"
                            className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                          />
                        </div>
                      )}
                    </div>

                    {estado_pago_tratamiento !== 'pendiente' && parseFloat(monto_pago_tratamiento) > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="metodo_pago_tratamiento">Método de Pago</Label>
                        <Input
                          id="metodo_pago_tratamiento"
                          value={metodo_pago_tratamiento}
                          onChange={(e) => setMetodoPagoTratamiento(e.target.value)}
                          placeholder="Ej: Efectivo, Tarjeta, Transferencia..."
                          className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                        />
                      </div>
                    )}

                    {estado_pago_tratamiento !== 'pendiente' && parseFloat(monto_pago_tratamiento) > 0 && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          Se registrará un pago de {formatearMoneda(parseFloat(monto_pago_tratamiento))} en Finanzas
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-600">
                  <p className="font-semibold mb-1">Advertencia</p>
                  <p>Al confirmar, el stock de estos materiales se reducirá automáticamente del inventario y se registrará en Finanzas.</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarMaterialesTratamientoAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              onClick={manejarConfirmarMaterialesTratamiento}
              disabled={guardando || materiales_tratamiento_confirmacion.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar y Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}

