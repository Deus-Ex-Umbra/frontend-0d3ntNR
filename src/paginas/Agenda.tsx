import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Loader2, AlertCircle, Clock, ChevronLeft, ChevronRight, DollarSign, Filter, X, AlertTriangle, CalendarClock, CheckCircle2, Eye } from 'lucide-react';
import { agendaApi, pacientesApi, inventarioApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { Combobox, OpcionCombobox } from '@/componentes/ui/combobox';
import { Badge } from '@/componentes/ui/badge';
import { DateTimePicker } from '@/componentes/ui/date-time-picker';
import { Switch } from '@/componentes/ui/switch';
import DialogoGestionCita from '@/componentes/citas/dialogo-gestion-cita';
import DialogoConfirmacionCita from '@/componentes/citas/dialogo-confirmacion-cita';
import {
  Cita,
  HoraLibre,
  ElementoAgenda,
  Paciente,
  Inventario,
  Producto,
  MaterialCita,
  TipoProducto,
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
  const [estado_pago_confirmacion, setEstadoPagoConfirmacion] = useState<string>('pendiente');
  const [monto_confirmacion, setMontoConfirmacion] = useState<string>('');
  const [cargando_materiales, setCargandoMateriales] = useState(false);
  const [consumibles_seleccionados, setConsumiblesSeleccionados] = useState<Array<{
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    material_id: number;
    nro_lote?: string;
    cantidad: number;
    stock_disponible: number;
    unidad_medida?: string;
    permite_decimales?: boolean;
    material_cita_id?: number;
  }>>([]);
  const [consumibles_iniciales, setConsumiblesIniciales] = useState<typeof consumibles_seleccionados>([]);
  const [consumibles_confirmacion, setConsumiblesConfirmacion] = useState<typeof consumibles_seleccionados>([]);

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
        if (producto.tipo === TipoProducto.MATERIAL) {
          if (!item.lote_id) {
            advertencias.push(`${producto.nombre}: Debe seleccionar un material para todos los items`);
            break;
          }
          if (item.cantidad_planeada <= 0) {
            advertencias.push(`${producto.nombre}: La cantidad debe ser mayor a 0 en todos los materiales`);
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

  const redondearA15Minutos = (fecha: Date): Date => {
    const nueva_fecha = new Date(fecha);
    // Agregar 5 minutos de buffer
    nueva_fecha.setMinutes(nueva_fecha.getMinutes() + 5);

    // Obtener los minutos actuales
    const minutos = nueva_fecha.getMinutes();

    // Redondear hacia arriba al próximo múltiplo de 15
    const minutos_redondeados = Math.ceil(minutos / 15) * 15;

    // Si minutos_redondeados es 60, debemos agregar una hora y poner minutos en 0
    if (minutos_redondeados === 60) {
      nueva_fecha.setHours(nueva_fecha.getHours() + 1);
      nueva_fecha.setMinutes(0);
    } else {
      nueva_fecha.setMinutes(minutos_redondeados);
    }

    // Poner segundos y milisegundos en 0
    nueva_fecha.setSeconds(0);
    nueva_fecha.setMilliseconds(0);

    return nueva_fecha;
  };

  const abrirDialogoNuevo = () => {
    setFormulario({
      paciente_id: '',
      fecha: redondearA15Minutos(new Date()),
      descripcion: '',
      estado_pago: 'pendiente',
      monto_esperado: '',
      horas_aproximadas: '0',
      minutos_aproximados: '30',
    });
    setModoEdicion(false);
    setMaterialesCita([]);
    setProductosPorInventario({});
    setConsumiblesSeleccionados([]);
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
    setConsumiblesSeleccionados([]);
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
    setConsumiblesSeleccionados([]);

    if (!es_pasada && cita.id) {
      setMaterialesCita([]);
      setCargandoMateriales(true);
      try {
        const cita_completa = await agendaApi.obtenerPorIdCompleto(cita.id);

        const consumibles_transformados = (cita_completa.reservas_materiales || []).map((reserva: any) => ({
          inventario_id: reserva.material.producto.inventario.id,
          inventario_nombre: reserva.material.producto.inventario.nombre,
          producto_id: reserva.material.producto.id,
          producto_nombre: reserva.material.producto.nombre,
          material_id: reserva.material.id,
          nro_lote: reserva.material.nro_lote,
          cantidad: Number(reserva.cantidad_reservada),
          stock_disponible: Number(reserva.material.cantidad_actual),
          unidad_medida: reserva.material.producto.unidad_medida,
          permite_decimales: reserva.material.producto.permite_decimales,
        }));

        setConsumiblesSeleccionados(consumibles_transformados);
        setConsumiblesIniciales(consumibles_transformados);
      } catch (error) {
        console.error('Error al cargar materiales de la cita:', error);
      } finally {
        setCargandoMateriales(false);
      }
    }

    setDialogoAbierto(true);
  };


  const materialesCambiaron = (): boolean => {
    if (consumibles_seleccionados.length !== consumibles_iniciales.length) return true;
    for (const c of consumibles_seleccionados) {
      const inicial = consumibles_iniciales.find(i => i.material_id === c.material_id);
      if (!inicial || inicial.cantidad !== c.cantidad) return true;
    }

    return false;
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
      const consumibles = consumibles_seleccionados.map(c => ({
        material_id: c.material_id,
        cantidad: c.cantidad
      }));

      const datos: any = {
        fecha: formulario.fecha,
        descripcion: formulario.descripcion,
        horas_aproximadas: horas,
        minutos_aproximados: minutos,
        consumibles,
        modo_estricto: false
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

  const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const formatearFecha = (fecha: Date): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = MESES_CORTOS[f.getMonth()] ?? '';
    const anio = f.getFullYear();
    return `${dia} ${mes} ${anio}`.trim();
  };

  const formatearHora = (fecha: Date): string => {
    const f = new Date(fecha);
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
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
    setConsumiblesConfirmacion([]);
    try {
      await cargarInventarios();
      const respuesta = await inventarioApi.obtenerMaterialesCita(cita.id);
      const consumibles_mapeados: any[] = [];
      if (respuesta.materiales) {
        for (const reserva of respuesta.materiales) {
          const cant_planeada = parseFloat(reserva.cantidad_reservada?.toString() || '0');
          consumibles_mapeados.push({
            material_cita_id: reserva.id,
            inventario_id: reserva.material?.producto?.inventario?.id || 0,
            inventario_nombre: reserva.material?.producto?.inventario?.nombre || 'Desconocido',
            producto_id: reserva.material?.producto?.id || 0,
            producto_nombre: reserva.material?.producto?.nombre || 'Desconocido',
            material_id: reserva.material?.id || 0,
            nro_lote: reserva.material?.nro_lote,
            cantidad: cant_planeada,
            stock_disponible: Number(reserva.material?.cantidad_actual || 0),
            unidad_medida: reserva.material?.producto?.unidad_medida,
            permite_decimales: reserva.material?.producto?.permite_decimales || false
          });
        }
      }

      setConsumiblesConfirmacion(consumibles_mapeados);
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
        fecha: new Date(cita_seleccionada.fecha),
        descripcion: cita_seleccionada.descripcion,
        horas_aproximadas: cita_seleccionada.horas_aproximadas,
        minutos_aproximados: cita_seleccionada.minutos_aproximados,
        paciente_id: cita_seleccionada.paciente?.id,
      });
      const consumibles_nuevos = consumibles_confirmacion.filter(m => !m.material_cita_id);
      const consumibles_existentes = consumibles_confirmacion.filter(m => m.material_cita_id);
      const materiales_a_agregar = [];
      for (const m of consumibles_nuevos) {
        materiales_a_agregar.push({
          producto_id: m.producto_id,
          inventario_id: m.inventario_id,
          lote_id: m.material_id,
          cantidad_planeada: m.cantidad
        });
      }
      if (materiales_a_agregar.length > 0) {
        await inventarioApi.agregarMaterialesCita(cita_seleccionada.id, {
          materiales: materiales_a_agregar
        });
      }
      const materiales_a_confirmar = [];

      for (const m of consumibles_existentes) {
        if (m.material_cita_id) {
          materiales_a_confirmar.push({
            material_cita_id: m.material_cita_id,
            cantidad_usada: m.cantidad,
            lote_id: m.material_id,
            inventario_id: m.inventario_id
          });
        }
      }
      await inventarioApi.confirmarMaterialesCita(cita_seleccionada.id, {
        materiales: materiales_a_confirmar
      });

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

  const opciones_pacientes_filtro: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Todos los pacientes' },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const opciones_estados_filtro: OpcionCombobox[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    ...estados_pago.map(e => ({
      valor: e.valor,
      etiqueta: e.etiqueta
    }))
  ];

  const filtros_fecha_activos = !!(filtros.fecha_hora_inicio && filtros.fecha_hora_fin);
  const es_cita_pasada_edicion = !!(modo_edicion && cita_seleccionada && (esCitaPasada(cita_seleccionada.fecha) || cita_seleccionada.materiales_confirmados));
  const hay_cambios = !!(modo_edicion && (materialesCambiaron() ||
    (cita_seleccionada && (
      formulario.paciente_id !== (cita_seleccionada.paciente?.id?.toString() || '') ||
      formulario.descripcion !== cita_seleccionada.descripcion ||
      formulario.estado_pago !== (cita_seleccionada.estado_pago || 'pendiente') ||
      formulario.monto_esperado !== (cita_seleccionada.monto_esperado?.toString() || '') ||
      formulario.horas_aproximadas !== (cita_seleccionada.horas_aproximadas || 0).toString() ||
      formulario.minutos_aproximados !== (cita_seleccionada.minutos_aproximados || 30).toString() ||
      new Date(formulario.fecha || '').getTime() !== new Date(cita_seleccionada.fecha).getTime()
    ))
  ));

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
                                    <p className="text-sm text-foreground break-words whitespace-normal">{elemento.descripcion}</p>
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
                            const es_confirmada = cita.materiales_confirmados;
                            const es_pasada = citaHaFinalizado(cita);
                            const sin_paciente_pasada = es_pasada && !cita.paciente;
                            const debe_estar_opaca = es_confirmada || sin_paciente_pasada;

                            return (
                              <div
                                key={cita.id}
                                className={`flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:scale-[1.02] hover:shadow-md transition-all duration-200 ${debe_estar_opaca ? 'opacity-60 grayscale-[0.3]' : ''
                                  }`}
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
                                    <p className="text-sm text-foreground break-words whitespace-normal">{cita.descripcion}</p>
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
                                      {es_confirmada && (
                                        <Badge className="bg-green-500 text-white text-xs">
                                          Confirmada
                                        </Badge>
                                      )}
                                      {sin_paciente_pasada && (
                                        <Badge variant="secondary" className="text-xs">
                                          Finalizada
                                        </Badge>
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
                                  {es_confirmada || sin_paciente_pasada ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => abrirDialogoEditar(cita)}
                                      className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                      title="Ver detalles"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      {es_pasada && cita.paciente ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => abrirDialogoConfirmarMateriales(cita)}
                                          className="hover:bg-green-500/20 hover:text-green-600 hover:scale-110 transition-all duration-200 ring-2 ring-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                          title="Confirmar Cita (Estado, Monto y Materiales)"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => abrirDialogoEditar(cita)}
                                          className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                                          title="Editar"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoConfirmarEliminar(cita.id)}
                                        className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
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

      <DialogoGestionCita
        abierto={dialogo_abierto}
        onCerrar={() => setDialogoAbierto(false)}
        modoEdicion={modo_edicion}
        esCitaPasadaEdicion={es_cita_pasada_edicion}
        formulario={formulario}
        setFormulario={setFormulario}
        pacientes={pacientes}
        inventarios={inventarios}
        productosPorInventario={productos_por_inventario}
        cargarInventarios={cargarInventarios}
        cargarProductosInventario={cargarProductosInventario}
        consumiblesSeleccionados={consumibles_seleccionados}
        setConsumiblesSeleccionados={setConsumiblesSeleccionados}
        guardando={guardando}
        hayCambios={hay_cambios}
        manejarGuardar={manejarGuardar}
        opcionesEstadosPago={estados_pago}
      />

      { }
      <DialogoConfirmacionCita
        abierto={dialogo_confirmar_materiales_abierto}
        onCerrar={() => setDialogoConfirmarMaterialesAbierto(false)}
        estadoPago={estado_pago_confirmacion}
        setEstadoPago={setEstadoPagoConfirmacion}
        monto={monto_confirmacion}
        setMonto={setMontoConfirmacion}
        consumibles={consumibles_confirmacion}
        setConsumibles={setConsumiblesConfirmacion}
        inventarios={inventarios}
        productosPorInventario={productos_por_inventario}
        cargarProductosInventario={cargarProductosInventario}
        cargandoMateriales={cargando_materiales}
        guardando={guardando}
        manejarConfirmar={manejarConfirmarMateriales}
        opcionesEstadosPago={estados_pago}
      />

      <Toaster />
    </div>
  );
}
