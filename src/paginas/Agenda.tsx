import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Loader2, AlertCircle, Clock, ChevronLeft, ChevronRight, DollarSign, Filter, X, AlertTriangle, CalendarClock, Package, CheckCircle2 } from 'lucide-react';
import { agendaApi, pacientesApi, inventarioApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { Switch } from '@/componentes/ui/switch';
import { ajustarFechaParaBackend } from '@/lib/utilidades';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import SelectorMateriales from '@/componentes/materiales/selector-materiales';
import { 
  Cita, 
  HoraLibre, 
  ElementoAgenda, 
  Paciente, 
  Inventario, 
  Producto, 
  MaterialCita, 
  MaterialCitaConfirmacion 
} from '@/tipos';

export default function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [horas_libres, setHorasLibres] = useState<HoraLibre[]>([]);
  const [mostrar_horas_libres, setMostrarHorasLibres] = useState(false);
  const [elementos_filtrados, setElementosFiltrados] = useState<ElementoAgenda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [mes_actual, setMesActual] = useState(new Date().getMonth() + 1);
  const [ano_actual, setAnoActual] = useState(new Date().getFullYear());
  const [cargando_inicial, setCargandoInicial] = useState(true);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_filtros_abierto, setDialogoFiltrosAbierto] = useState(false);
  const [dialogo_confirmar_materiales_abierto, setDialogoConfirmarMaterialesAbierto] = useState(false);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [cita_seleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [cita_a_eliminar, setCitaAEliminar] = useState<number | null>(null);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [productos_por_inventario, setProductosPorInventario] = useState<Record<number, Producto[]>>({});
  const [materiales_cita, setMaterialesCita] = useState<MaterialCita[]>([]);
  const [materiales_cita_iniciales, setMaterialesCitaIniciales] = useState<MaterialCita[]>([]);
  const [materiales_confirmacion, setMaterialesConfirmacion] = useState<MaterialCitaConfirmacion[]>([]);
  const [materiales_adicionales_confirmacion, setMaterialesAdicionalesConfirmacion] = useState<MaterialCita[]>([]);
  const [mostrar_agregar_materiales_confirmacion, setMostrarAgregarMaterialesConfirmacion] = useState(false);
  const [estado_pago_confirmacion, setEstadoPagoConfirmacion] = useState<string>('pendiente');
  const [monto_confirmacion, setMontoConfirmacion] = useState<string>('');
  const [cargando_materiales, setCargandoMateriales] = useState(false);

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
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    filtrarPorMes();
  }, [mes_actual, ano_actual, filtros.fecha_hora_inicio, filtros.fecha_hora_fin]);

  useEffect(() => {
    if (mostrar_horas_libres && horas_libres.length === 0) {
      cargarHorasLibres();
    } else if (!mostrar_horas_libres) {
      setHorasLibres([]);
    }
  }, [mostrar_horas_libres]);

  useEffect(() => {
    aplicarFiltros();
  }, [citas, horas_libres, filtros.paciente_id, filtros.estado_pago, filtros.busqueda, mostrar_horas_libres]);

  const cargarDatosIniciales = async () => {
    setCargandoInicial(true);
    try {
      const datos_pacientes = await pacientesApi.obtenerTodos();
      setPacientes(datos_pacientes);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setCargandoInicial(false);
    }
  };

  const filtrarPorMes = async () => {
    try {
      const tiene_filtro_fecha = !!(filtros.fecha_hora_inicio && filtros.fecha_hora_fin);
      let datos_citas;
      if (tiene_filtro_fecha) {
        datos_citas = await agendaApi.filtrarCitas(filtros.fecha_hora_inicio!, filtros.fecha_hora_fin!);
      } else {
        datos_citas = await agendaApi.obtenerPorMes(mes_actual, ano_actual, true);
      }

      setCitas(datos_citas);
      if (mostrar_horas_libres) {
        await cargarHorasLibres();
      } else {
        setHorasLibres([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    }
  };

  const cargarHorasLibres = async () => {
    try {
      const tiene_filtro_fecha = !!(filtros.fecha_hora_inicio && filtros.fecha_hora_fin);
      
      let datos_horas_libres;
      if (tiene_filtro_fecha) {
        datos_horas_libres = await agendaApi.filtrarEspaciosLibres(filtros.fecha_hora_inicio!, filtros.fecha_hora_fin!);
      } else {
        datos_horas_libres = await agendaApi.obtenerEspaciosLibres(mes_actual, ano_actual);
      }

      setHorasLibres(datos_horas_libres);
    } catch (error) {
      console.error('Error al cargar horas libres:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las horas libres',
        variant: 'destructive',
      });
    }
  };

  const cargarDatos = async () => {
    await filtrarPorMes();
  };

  const cargarInventarios = async () => {
    if (inventarios.length > 0) return;
    
    try {
      const datos = await inventarioApi.obtenerInventarios();
      setInventarios(datos);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
    }
  };

  const cargarProductosInventario = async (inventario_id: number) => {
    if (productos_por_inventario[inventario_id]) {
      return;
    }

    setCargandoMateriales(true);
    try {
      const datos = await inventarioApi.obtenerProductos(inventario_id);
      setProductosPorInventario(prev => ({
        ...prev,
        [inventario_id]: datos
      }));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos del inventario',
        variant: 'destructive',
      });
    } finally {
      setCargandoMateriales(false);
    }
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
      
      const materiales_array = Object.values(materiales_agrupados);
      setMaterialesCita(materiales_array);
      setMaterialesCitaIniciales(JSON.parse(JSON.stringify(materiales_array)));
    } catch (error) {
      console.error('Error al cargar materiales de la cita:', error);
    } finally {
      setCargandoMateriales(false);
    }
  };

  const agregarMaterialCita = () => {
    setMaterialesCita([...materiales_cita, {
      producto_id: 0,
      inventario_id: 0,
      items: [{ cantidad_planeada: 1 }],
    }]);
  };

  const actualizarMaterialCita = (index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_cita];
    nuevos_materiales[index] = { ...nuevos_materiales[index], [campo]: valor };
    
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

    setMaterialesCita(nuevos_materiales);
  };

  const agregarItemMaterial = (material_index: number) => {
    const nuevos_materiales = [...materiales_cita];
    nuevos_materiales[material_index].items.push({ cantidad_planeada: 1 });
    setMaterialesCita(nuevos_materiales);
  };

  const actualizarItemMaterial = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_cita];
    nuevos_materiales[material_index] = {
      ...nuevos_materiales[material_index],
      items: [...nuevos_materiales[material_index].items]
    };
    nuevos_materiales[material_index].items[item_index] = {
      ...nuevos_materiales[material_index].items[item_index],
      [campo]: valor
    };
    if (campo === 'lote_id' && valor) {
      const inventario_id = nuevos_materiales[material_index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === nuevos_materiales[material_index].producto_id);
      if (producto) {
        const lote = producto.lotes?.find(l => l.id === parseInt(valor));
        if (lote) {
          nuevos_materiales[material_index].items[item_index].nro_lote = lote.nro_lote;
        }
      }
    }
    if (campo === 'activo_id' && valor) {
      const inventario_id = nuevos_materiales[material_index].inventario_id;
      const productos = productos_por_inventario[inventario_id] || [];
      const producto = productos.find(p => p.id === nuevos_materiales[material_index].producto_id);
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

    setMaterialesCita(nuevos_materiales);
  };

  const eliminarItemMaterial = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_cita];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) {
      nuevos_materiales.splice(material_index, 1);
    }
    setMaterialesCita(nuevos_materiales);
  };

  const eliminarMaterialCita = (index: number) => {
    const nuevos_materiales = materiales_cita.filter((_, i) => i !== index);
    setMaterialesCita(nuevos_materiales);
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

    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const agregarItemMaterialAdicionalConfirmacion = (material_index: number) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index].items.push({ cantidad_planeada: 1 });
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const actualizarItemMaterialAdicionalConfirmacion = (material_index: number, item_index: number, campo: string, valor: any) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index] = {
      ...nuevos_materiales[material_index],
      items: [...nuevos_materiales[material_index].items]
    };
    nuevos_materiales[material_index].items[item_index] = {
      ...nuevos_materiales[material_index].items[item_index],
      [campo]: valor
    };
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const eliminarItemMaterialAdicionalConfirmacion = (material_index: number, item_index: number) => {
    const nuevos_materiales = [...materiales_adicionales_confirmacion];
    nuevos_materiales[material_index].items = nuevos_materiales[material_index].items.filter((_, i) => i !== item_index);
    if (nuevos_materiales[material_index].items.length === 0) {
      nuevos_materiales.splice(material_index, 1);
    }
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const eliminarMaterialAdicionalConfirmacion = (index: number) => {
    const nuevos_materiales = materiales_adicionales_confirmacion.filter((_, i) => i !== index);
    setMaterialesAdicionalesConfirmacion(nuevos_materiales);
  };

  const validarDisponibilidadMateriales = (): { valido: boolean; advertencias: string[] } => {
    const advertencias: string[] = [];
    
    for (const material of materiales_cita) {
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
    setMaterialesCita([]);
    setProductosPorInventario({});
    setDialogoAbierto(true);
  };

  const abrirDialogoDesdeHoraLibre = (hora_libre: HoraLibre) => {
    setFormulario({
      paciente_id: '',
      fecha: new Date(hora_libre.fecha),
      descripcion: '',
      estado_pago: 'pendiente',
      monto_esperado: '',
      horas_aproximadas: hora_libre.horas_aproximadas.toString(),
      minutos_aproximados: hora_libre.minutos_aproximados.toString(),
    });
    setModoEdicion(false);
    setMaterialesCita([]);
    setProductosPorInventario({});
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = async (cita: Cita) => {
    const es_pasada = esCitaPasada(cita.fecha);
    
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
    
    if (!es_pasada) {
      setMaterialesCita([]);
      if (cita.id) {
        await cargarMaterialesCita(cita.id);
      }
    }
    
    setDialogoAbierto(true);
  };

  const materialesCambiaron = (): boolean => {
    if (materiales_cita.length !== materiales_cita_iniciales.length) return true;
    
    return JSON.stringify(materiales_cita) !== JSON.stringify(materiales_cita_iniciales);
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
    if (materiales_cita.length > 0) {
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

      let cita_id: number;

      if (modo_edicion && cita_seleccionada) {
        await agendaApi.actualizar(cita_seleccionada.id, datos);
        cita_id = cita_seleccionada.id;
        
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
        const cita_creada = await agendaApi.crear(datos);
        cita_id = cita_creada.id;
        toast({
          title: 'Éxito',
          description: 'Cita creada correctamente',
        });
      }
      if (materiales_cita.length > 0 && cita_id) {
        try {
          const materiales_para_guardar = materiales_cita
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

  const esCitaPasada = (fecha: Date): boolean => {
    const ahora = new Date();
    const fecha_cita = new Date(fecha);
    return fecha_cita < ahora;
  };

  const citaHaFinalizado = (cita: Cita): boolean => {
    const ahora = new Date();
    const fecha_inicio = new Date(cita.fecha);
    const fecha_fin = new Date(fecha_inicio);
    fecha_fin.setHours(fecha_fin.getHours() + (cita.horas_aproximadas || 0));
    fecha_fin.setMinutes(fecha_fin.getMinutes() + (cita.minutos_aproximados || 30));
    return ahora > fecha_fin;
  };

  const abrirDialogoConfirmarMateriales = async (cita: Cita) => {
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

  const manejarConfirmarMateriales = async () => {
    if (!cita_seleccionada?.id) return;

    setGuardando(true);
    try {
      await agendaApi.actualizar(cita_seleccionada.id, {
        estado_pago: estado_pago_confirmacion,
        monto_esperado: monto_confirmacion ? parseFloat(monto_confirmacion) : 0,
        fecha: ajustarFechaParaBackend(new Date(cita_seleccionada.fecha)),
        descripcion: cita_seleccionada.descripcion,
        horas_aproximadas: cita_seleccionada.horas_aproximadas,
        minutos_aproximados: cita_seleccionada.minutos_aproximados,
        paciente_id: cita_seleccionada.paciente?.id,
      });

      if (materiales_adicionales_confirmacion.length > 0) {
        const materiales_a_agregar = [];
        for (const material of materiales_adicionales_confirmacion) {
          if (material.producto_id === 0 || material.inventario_id === 0) continue;
          
          for (const item of material.items) {
            materiales_a_agregar.push({
              producto_id: material.producto_id,
              inventario_id: material.inventario_id,
              lote_id: item.lote_id,
              activo_id: item.activo_id,
              cantidad_planeada: item.cantidad_planeada,
            });
          }
        }
        
        if (materiales_a_agregar.length > 0) {
          await inventarioApi.agregarMaterialesCita(cita_seleccionada.id, {
            materiales: materiales_a_agregar
          });
        }
      }

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
      cargarDatos();
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
  const es_cita_pasada_edicion = !!(modo_edicion && cita_seleccionada && esCitaPasada(cita_seleccionada.fecha));
  const hay_cambios = modo_edicion && (materialesCambiaron() || 
    (cita_seleccionada && (
      formulario.paciente_id !== (cita_seleccionada.paciente?.id?.toString() || '') ||
      formulario.descripcion !== cita_seleccionada.descripcion ||
      formulario.estado_pago !== (cita_seleccionada.estado_pago || 'pendiente') ||
      formulario.monto_esperado !== (cita_seleccionada.monto_esperado?.toString() || '') ||
      formulario.horas_aproximadas !== (cita_seleccionada.horas_aproximadas || 0).toString() ||
      formulario.minutos_aproximados !== (cita_seleccionada.minutos_aproximados || 30).toString() ||
      new Date(formulario.fecha || '').getTime() !== new Date(cita_seleccionada.fecha).getTime()
    ))
  );

  const esHoraLibre = (elemento: ElementoAgenda): elemento is HoraLibre & { es_hora_libre: true } => {
    return 'es_hora_libre' in elemento && elemento.es_hora_libre === true;
  };

  if (cargando_inicial) {
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

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mostrar-horas-libres" className="text-sm font-medium cursor-pointer">
                      {mostrar_horas_libres ? 'Ver Citas' : 'Ver Horas Libres'}
                    </Label>
                    <Switch
                      id="mostrar-horas-libres"
                      checked={mostrar_horas_libres}
                      onCheckedChange={setMostrarHorasLibres}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => cambiarMes(-1)}
                      disabled={
                        filtros_fecha_activos || 
                        (mostrar_horas_libres && (
                          mes_actual === new Date().getMonth() + 1 && 
                          ano_actual === new Date().getFullYear()
                        ))
                      }
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
                      <div className="space-y-2 pl-7">
                        {elementos_del_dia.map((elemento, idx) => {
                          if (esHoraLibre(elemento)) {
                            return (
                              <div
                                key={`libre-${idx}`}
                                onClick={() => abrirDialogoDesdeHoraLibre(elemento)}
                                className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-green-500/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                                      <CalendarClock className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-foreground">
                                        {formatearHora(elemento.fecha)}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Hora libre - Clic para agendar
                                      </p>
                                    </div>
                                  </div>
                                  <div className="ml-4 flex-1">
                                    <p className="text-sm text-foreground">{elemento.descripcion}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Duración disponible: {formatearDuracion(elemento.horas_aproximadas, elemento.minutos_aproximados)}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-500 text-white hover:scale-110 transition-transform duration-200">
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
                                      {cita.paciente && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          Monto esperado: {formatearMoneda(cita.monto_esperado || 0)}
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
                                  {citaHaFinalizado(cita) && cita.paciente && !cita.materiales_confirmados && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDialogoConfirmarMateriales(cita)}
                                      className="hover:bg-green-500/20 hover:text-green-600 hover:scale-110 transition-all duration-200 ring-2 ring-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                      title="Confirmar Cita (Estado, Monto y Materiales)"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
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
                  
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setCitaAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminar}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
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
              onClick={aplicarFiltrosDialogo}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion 
                ? (es_cita_pasada_edicion 
                  ? 'Editando cita pasada: solo puedes modificar monto y estado de pago' 
                  : 'Modifica los detalles de la cita')
                : 'Programa una nueva cita o evento'}
            </DialogDescription>
          </DialogHeader>

          {es_cita_pasada_edicion && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Esta cita ya ocurrió. Solo puedes editar el monto y estado de pago.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente (opcional)</Label>
              <Combobox
                opciones={opciones_pacientes}
                valor={formulario.paciente_id}
                onChange={(valor) => setFormulario({ ...formulario, paciente_id: valor })}
                placeholder="Selecciona un paciente"
                disabled={es_cita_pasada_edicion}
              />
              <p className="text-xs text-muted-foreground">
                Si no seleccionas un paciente, será un evento general sin estado ni monto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha y Hora *</Label>
              {es_cita_pasada_edicion ? (
                <Input
                  value={formulario.fecha ? formulario.fecha.toLocaleString('es-BO') : ''}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <DateTimePicker
                  valor={formulario.fecha}
                  onChange={(fecha) => setFormulario({ ...formulario, fecha })}
                  placeholder="Selecciona fecha y hora"
                />
              )}
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
                disabled={es_cita_pasada_edicion}
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
                    disabled={es_cita_pasada_edicion}
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
                    disabled={es_cita_pasada_edicion}
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
                      disabled={!modo_edicion}
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

            {}
            {!es_cita_pasada_edicion && formulario.paciente_id && (
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
                      <span>Materiales e Insumos (Opcional)</span>
                      {materiales_cita.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {materiales_cita.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 space-y-4">
                    <SelectorMateriales
                      inventarios={inventarios}
                      productos_por_inventario={productos_por_inventario}
                      materiales={materiales_cita}
                      cargarProductos={cargarProductosInventario}
                      onAgregarMaterial={agregarMaterialCita}
                      onEliminarMaterial={eliminarMaterialCita}
                      onActualizarMaterial={actualizarMaterialCita}
                      onAgregarItem={agregarItemMaterial}
                      onEliminarItem={eliminarItemMaterial}
                      onActualizarItem={actualizarItemMaterial}
                      texto_boton_agregar="Agregar Material"
                      cargando={cargando_materiales}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              disabled={guardando || (modo_edicion && !hay_cambios)}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
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
            <div className="border-t pt-4 space-y-3">
              {!mostrar_agregar_materiales_confirmacion ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await cargarInventarios();
                    setMostrarAgregarMaterialesConfirmacion(true);
                  }}
                  className="w-full hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Materiales Adicionales
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Materiales Adicionales
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrarAgregarMaterialesConfirmacion(false);
                        setMaterialesAdicionalesConfirmacion([]);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <SelectorMateriales
                    inventarios={inventarios}
                    productos_por_inventario={productos_por_inventario}
                    materiales={materiales_adicionales_confirmacion}
                    cargarProductos={cargarProductosInventario}
                    onAgregarMaterial={agregarMaterialAdicionalConfirmacion}
                    onEliminarMaterial={eliminarMaterialAdicionalConfirmacion}
                    onActualizarMaterial={actualizarMaterialAdicionalConfirmacion}
                    onAgregarItem={agregarItemMaterialAdicionalConfirmacion}
                    onEliminarItem={eliminarItemMaterialAdicionalConfirmacion}
                    onActualizarItem={actualizarItemMaterialAdicionalConfirmacion}
                    texto_boton_agregar="Agregar Material"
                    cargando={cargando_materiales}
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
              onClick={manejarConfirmarMateriales}
              disabled={guardando || (materiales_confirmacion.length === 0 && materiales_adicionales_confirmacion.length === 0)}
              className="bg-green-600 hover:bg-green-700"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cita y Materiales
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
