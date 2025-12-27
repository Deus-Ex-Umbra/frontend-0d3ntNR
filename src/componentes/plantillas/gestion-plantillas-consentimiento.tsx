import { useState, useEffect, useRef } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { Label } from '@/componentes/ui/label';
import { plantillasConsentimientoApi, catalogoApi } from '@/lib/api';
import { PlantillaConsentimiento } from '@/tipos';
import { FileText, Edit, Trash2, Plus, Loader2, X, ChevronsUpDown, Eye, Tag, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditorConEtiquetasPersonalizado } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command';
import { SelectConAgregar, OpcionSelectConAgregar } from '@/componentes/ui/select-with-add';
import { cn } from '@/lib/utilidades';

interface EtiquetaPersonalizada {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}

export function GestionPlantillasConsentimiento() {
  const [plantillas, setPlantillas] = useState<PlantillaConsentimiento[]>([]);
  const [plantilla_seleccionada, setPlantillaSeleccionada] = useState<PlantillaConsentimiento | null>(null);
  const [cargando, setCargando] = useState(false);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_edicion, setDialogoEdicion] = useState(false);
  const [nombre_plantilla, setNombrePlantilla] = useState('');
  const [contenido_plantilla, setContenidoPlantilla] = useState('');
  const [tamano_papel, setTamanoPapel] = useState<'carta' | 'legal' | 'a4'>('carta');
  const [tamanos_hoja, setTamanosHoja] = useState<Array<{ id: number; nombre: string; ancho: number; alto: number; descripcion?: string; protegido: boolean }>>([]);
  const [tamano_hoja_id, setTamanoHojaId] = useState<number | null>(null);
  const [margenes_plantilla, setMargenesPlantilla] = useState({
    superior: 20,
    inferior: 20,
    izquierdo: 20,
    derecho: 20,
  });

  const clamp = (v: number, min: number, max: number) => {
    if (Number.isNaN(v)) return min;
    return Math.min(Math.max(v, min), max);
  };
  const aplicarLimiteMargenes = (m: { superior: number; inferior: number; izquierdo: number; derecho: number }, widthMm: number, heightMm: number) => {
    const limiteVertical = Math.max(0, Math.floor(heightMm * 0.25));
    const limiteHorizontal = Math.max(0, Math.floor(widthMm * 0.30));
    const toNonNegative = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0);
    const clampPair = (primero: number, segundo: number, limite: number): [number, number] => {
      const limpioPrimero = toNonNegative(primero);
      const limpioSegundo = toNonNegative(segundo);
      const cappedPrimero = Math.min(limpioPrimero, Math.max(0, limite - limpioSegundo));
      const cappedSegundo = Math.min(limpioSegundo, Math.max(0, limite - cappedPrimero));
      return [cappedPrimero, cappedSegundo];
    };
    const [superior, inferior] = clampPair(m.superior, m.inferior, limiteVertical);
    const [izquierdo, derecho] = clampPair(m.izquierdo, m.derecho, limiteHorizontal);
    return { superior, inferior, izquierdo, derecho, limiteVertical, limiteHorizontal };
  };
  const [etiquetas_personalizadas, setEtiquetasPersonalizadas] = useState<EtiquetaPersonalizada[]>([]);
  const [botones_etiquetas, setBotonesEtiquetas] = useState<{ codigo: string; nombre: string; descripcion: string }[]>([]);
  const [dialogo_nueva_etiqueta, setDialogoNuevaEtiqueta] = useState(false);
  const [nueva_etiqueta, setNuevaEtiqueta] = useState({ nombre: '', codigo: '', descripcion: '' });
  const [guardando_etiqueta, setGuardandoEtiqueta] = useState(false);
  const [combobox_etiquetas_abierto, setComboboxEtiquetasAbierto] = useState(false);
  const [combobox_etiquetas_edicion_abierto, setComboboxEtiquetasEdicionAbierto] = useState(false);
  const [dialogo_visualizacion, setDialogoVisualizacion] = useState(false);
  const [plantilla_visualizando, setPlantillaVisualizando] = useState<PlantillaConsentimiento | null>(null);
  const [etiquetas_expandidas, setEtiquetasExpandidas] = useState<Set<number>>(new Set());
  const [dialogo_confirmar_eliminar, setDialogoConfirmarEliminar] = useState(false);
  const [plantilla_a_eliminar, setPlantillaAEliminar] = useState<number | null>(null);
  const [filtro_nombre, setFiltroNombre] = useState('');
  const [filtro_etiquetas, setFiltroEtiquetas] = useState<string[]>([]);
  const [opciones_etiquetas, setOpcionesEtiquetas] = useState<Array<{ valor: string; etiqueta: string }>>([]);
  const editorRef = useRef<any>(null);

  const { toast } = useToast();
  const todas_las_etiquetas = etiquetas_personalizadas.map(e => ({
    codigo: e.codigo,
    nombre: e.nombre,
    descripcion: e.descripcion || '',
  }));
  const etiquetas_disponibles_para_agregar = todas_las_etiquetas.filter(
    etiqueta => !botones_etiquetas.some(boton => boton.codigo === etiqueta.codigo),
  );

  useEffect(() => {
    cargarPlantillas();
    cargarEtiquetasPersonalizadas();
    cargarTamanosHoja();
  }, []);

  useEffect(() => {
    if (!tamano_hoja_id && tamanos_hoja.length > 0) {
      const carta = buscarCartaPorDefecto(tamanos_hoja);
      if (carta) {
        setTamanoHojaId(carta.id);
        setTamanoPapel('carta');
        setMargenesPlantilla((prev) => {
          const maxL = Math.max(0, Math.round(carta.ancho) - prev.derecho);
          const maxR = Math.max(0, Math.round(carta.ancho) - prev.izquierdo);
          const maxT = Math.max(0, Math.round(carta.alto) - prev.inferior);
          const maxB = Math.max(0, Math.round(carta.alto) - prev.superior);
          return {
            superior: clamp(prev.superior, 0, maxT),
            inferior: clamp(prev.inferior, 0, maxB),
            izquierdo: clamp(prev.izquierdo, 0, maxL),
            derecho: clamp(prev.derecho, 0, maxR),
          };
        });
      }
    }
  }, [tamano_hoja_id, tamanos_hoja]);

  const cargarTamanosHoja = async () => {
    try {
      const lista = await (catalogoApi as any).obtenerTamanosHoja?.();
      if (Array.isArray(lista)) setTamanosHoja(lista);
    } catch (e) {
      console.error('Error cargando tamaños de hoja', e);
    }
  };

  const obtenerTamanoPlantilla = (
    id?: number | null,
    ancho?: number | null,
    alto?: number | null,
  ): { widthMm: number; heightMm: number } | undefined => {
    const encontrado = id ? tamanos_hoja.find(t => t.id === id) : undefined;
    if (encontrado) {
      return { widthMm: Math.round(encontrado.ancho), heightMm: Math.round(encontrado.alto) };
    }
    if (ancho && alto) {
      return { widthMm: Math.round(ancho), heightMm: Math.round(alto) };
    }
    return undefined;
  };

  const buscarCartaPorDefecto = (lista: Array<{ id: number; nombre: string; ancho: number; alto: number }>) => {
    const porNombre = lista.find(t => t.nombre?.toLowerCase().includes('carta'));
    if (porNombre) return porNombre;
    return lista.find(t => Math.round(t.ancho) === 216 && Math.round(t.alto) === 279);
  };

  const opciones_tamanos: OpcionSelectConAgregar[] = tamanos_hoja.map(t => {
    const etiquetaMedidas = `${Math.round(t.ancho)} × ${Math.round(t.alto)} mm`;
    return ({ valor: String(t.id), etiqueta: `${t.nombre} (${t.descripcion || etiquetaMedidas})` });
  });
  const tamanoSeleccionado = tamano_hoja_id ? tamanos_hoja.find(t => t.id === tamano_hoja_id) : undefined;
  const tamanoActual = obtenerTamanoPlantilla(tamano_hoja_id, plantilla_seleccionada?.ancho_mm ?? null, plantilla_seleccionada?.alto_mm ?? null);
  const pageBase = tamanoActual
    ? { width: tamanoActual.widthMm, height: tamanoActual.heightMm }
    : tamano_papel === 'carta'
      ? { width: 216, height: 279 }
      : tamano_papel === 'legal'
        ? { width: 216, height: 356 }
        : { width: 210, height: 297 };
  const pageMm = pageBase;
  const margenesAjustados = aplicarLimiteMargenes(margenes_plantilla, pageMm.width, pageMm.height);
  const maxLeft = Math.max(0, margenesAjustados.limiteHorizontal - margenesAjustados.derecho);
  const maxRight = Math.max(0, margenesAjustados.limiteHorizontal - margenesAjustados.izquierdo);
  const maxTop = Math.max(0, margenesAjustados.limiteVertical - margenesAjustados.inferior);
  const maxBottom = Math.max(0, margenesAjustados.limiteVertical - margenesAjustados.superior);
  const horizontalZero = margenesAjustados.izquierdo + margenesAjustados.derecho >= margenesAjustados.limiteHorizontal;
  const verticalZero = margenesAjustados.superior + margenesAjustados.inferior >= margenesAjustados.limiteVertical;
  const anchoEscritura = pageMm.width - margenesAjustados.izquierdo - margenesAjustados.derecho;
  const altoEscritura = pageMm.height - margenesAjustados.superior - margenesAjustados.inferior;
  const seleccionarTamanoHoja = (valor: string) => {
    if (!valor) { setTamanoHojaId(null); return; }
    const id = Number(valor);
    const item = tamanos_hoja.find(t => t.id === id);
    if (item) {
      setTamanoHojaId(item.id);
      const dims = { width: Math.round(item.ancho), height: Math.round(item.alto) };
      setMargenesPlantilla(prev => {
        const ajustados = aplicarLimiteMargenes(prev, dims.width, dims.height);
        return {
          superior: ajustados.superior,
          inferior: ajustados.inferior,
          izquierdo: ajustados.izquierdo,
          derecho: ajustados.derecho,
        };
      });
    }
  };
  const crearTamanoHoja = async (datos: { nombre: string; anchoCm: number; altoCm: number; descripcion?: string }) => {
    const creado = await (catalogoApi as any).crearTamanoHoja?.({ nombre: datos.nombre, ancho: datos.anchoCm, alto: datos.altoCm, descripcion: datos.descripcion });
    await cargarTamanosHoja();
    if (creado?.id) setTamanoHojaId(creado.id);
  };

  useEffect(() => {
    const mapCodigoNombre = new Map<string, string>(
      etiquetas_personalizadas.map((e) => [e.codigo, e.nombre]),
    );
    const usados = new Set<string>();
    plantillas.forEach((p) => {
      extraerEtiquetasDelContenido(p.contenido).forEach((c) => usados.add(c));
    });
    const opciones = Array.from(usados).map((c) => ({ valor: c, etiqueta: mapCodigoNombre.get(c) || c }));
    opciones.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
    setOpcionesEtiquetas(opciones);
  }, [plantillas, etiquetas_personalizadas]);

  const cargarEtiquetasPersonalizadas = async () => {
    try {
      const etiquetas = await catalogoApi.obtenerEtiquetasPlantilla();
      setEtiquetasPersonalizadas(etiquetas);
    } catch (error) {
      console.error('Error al cargar etiquetas personalizadas:', error);
    }
  };

  const cargarPlantillas = async () => {
    setCargando(true);
    try {
      const datos = await plantillasConsentimientoApi.obtenerTodas();
      setPlantillas(datos);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setCargando(false);
    }
  };

  const crearPlantilla = async () => {
    if (!nombre_plantilla.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la plantilla es requerido',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (!contenido_plantilla.trim()) {
      toast({
        title: 'Error',
        description: 'El contenido de la plantilla es requerido',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setCargando(true);
    try {
      await plantillasConsentimientoApi.crear({
        nombre: nombre_plantilla,
        contenido: contenido_plantilla,
        tamano_papel,
        tamano_hoja_id: tamano_hoja_id ?? null,
        ancho_mm: pageMm.width,
        alto_mm: pageMm.height,
        margen_superior: margenes_plantilla.superior,
        margen_inferior: margenes_plantilla.inferior,
        margen_izquierdo: margenes_plantilla.izquierdo,
        margen_derecho: margenes_plantilla.derecho,
      });

      toast({
        title: 'Plantilla creada',
        description: 'La plantilla se ha creado correctamente',
        duration: 3000,
      });

      setDialogoAbierto(false);
      setNombrePlantilla('');
      setContenidoPlantilla('');
      setTamanoPapel('carta');
      setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
      setBotonesEtiquetas([]);
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la plantilla',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setCargando(false);
    }
  };

  const actualizarPlantilla = async () => {
    if (!plantilla_seleccionada) return;

    if (!nombre_plantilla.trim() || !contenido_plantilla.trim()) {
      toast({
        title: 'Error',
        description: 'Todos los campos son requeridos',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setCargando(true);
    try {
      await plantillasConsentimientoApi.actualizar(plantilla_seleccionada.id, {
        nombre: nombre_plantilla,
        contenido: contenido_plantilla,
        tamano_papel,
        tamano_hoja_id: tamano_hoja_id ?? null,
        ancho_mm: pageMm.width,
        alto_mm: pageMm.height,
        margen_superior: margenes_plantilla.superior,
        margen_inferior: margenes_plantilla.inferior,
        margen_izquierdo: margenes_plantilla.izquierdo,
        margen_derecho: margenes_plantilla.derecho,
      });

      toast({
        title: 'Plantilla actualizada',
        description: 'La plantilla se ha actualizado correctamente',
        duration: 3000,
      });

      setDialogoEdicion(false);
      setPlantillaSeleccionada(null);
      setNombrePlantilla('');
      setContenidoPlantilla('');
      setTamanoPapel('carta');
      setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
      setBotonesEtiquetas([]);
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la plantilla',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setCargando(false);
    }
  };

  const abrirDialogoConfirmarEliminar = (id: number) => {
    setPlantillaAEliminar(id);
    setDialogoConfirmarEliminar(true);
  };

  const eliminarPlantilla = async () => {
    if (!plantilla_a_eliminar) return;

    try {
      await plantillasConsentimientoApi.eliminar(plantilla_a_eliminar);
      toast({
        title: 'Plantilla eliminada',
        description: 'La plantilla se ha eliminado correctamente',
        duration: 3000,
      });
      setDialogoConfirmarEliminar(false);
      setPlantillaAEliminar(null);
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la plantilla',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const abrirEdicion = (plantilla: PlantillaConsentimiento) => {
    setPlantillaSeleccionada(plantilla);
    setNombrePlantilla(plantilla.nombre);
    setContenidoPlantilla(plantilla.contenido);
    setTamanoPapel((plantilla as any).tamano_papel || 'carta');
    setTamanoHojaId((plantilla as any).tamano_hoja_id ?? null);
    setMargenesPlantilla({
      superior: plantilla.margen_superior || 20,
      inferior: plantilla.margen_inferior || 20,
      izquierdo: plantilla.margen_izquierdo || 20,
      derecho: plantilla.margen_derecho || 20,
    });
    const etiquetas_en_contenido = extraerEtiquetasDelContenido(plantilla.contenido);
    const botones = etiquetas_en_contenido.map(codigo => {
      const etiqueta_encontrada = todas_las_etiquetas.find(e => e.codigo === codigo);
      return {
        codigo,
        nombre: etiqueta_encontrada?.nombre || codigo,
        descripcion: etiqueta_encontrada?.descripcion || '',
      };
    });
    setBotonesEtiquetas(botones);

    setDialogoEdicion(true);
  };

  const visualizarPlantilla = (plantilla: PlantillaConsentimiento) => {
    setPlantillaVisualizando(plantilla);
    setDialogoVisualizacion(true);
  };

  const extraerEtiquetasDelContenido = (contenido: string): string[] => {
    const regex = /data-etiqueta="([^"]+)"/g;
    const etiquetas: string[] = [];
    let match;

    while ((match = regex.exec(contenido)) !== null) {
      if (!etiquetas.includes(match[1])) {
        etiquetas.push(match[1]);
      }
    }

    return etiquetas;
  };

  const obtenerNombresEtiquetas = (plantilla: PlantillaConsentimiento): string[] => {
    const codigos = extraerEtiquetasDelContenido(plantilla.contenido);
    return codigos.map(codigo => {
      const etiqueta = todas_las_etiquetas.find(e => e.codigo === codigo);
      return etiqueta?.nombre || codigo;
    });
  };

  const toggleEtiquetasExpandidas = (id: number) => {
    setEtiquetasExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const agregarEtiquetaComoBoton = (codigo: string) => {
    if (!botones_etiquetas.some(b => b.codigo === codigo)) {
      const etiqueta_encontrada = todas_las_etiquetas.find(e => e.codigo === codigo);
      if (etiqueta_encontrada) {
        setBotonesEtiquetas([...botones_etiquetas, etiqueta_encontrada]);
      }
    }
  };

  const eliminarBotonEtiqueta = (codigo: string) => {
    setBotonesEtiquetas(botones_etiquetas.filter(b => b.codigo !== codigo));
  };

  const insertarEtiquetaEnEditor = (codigo: string) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().insertarEtiqueta(codigo).run();
    }
  };

  const crearNuevaEtiqueta = async () => {
    if (!nueva_etiqueta.nombre.trim() || !nueva_etiqueta.codigo.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre y código son requeridos',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (!nueva_etiqueta.codigo.startsWith("[") || !nueva_etiqueta.codigo.endsWith("]")) {
      toast({
        title: 'Error',
        description: 'El código debe estar entre corchetes, ej: [MI_ETIQUETA]',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setGuardandoEtiqueta(true);
    try {
      await catalogoApi.crearEtiquetaPlantilla({
        nombre: nueva_etiqueta.nombre.trim(),
        codigo: nueva_etiqueta.codigo.trim().toUpperCase(),
        descripcion: nueva_etiqueta.descripcion.trim(),
      });

      await cargarEtiquetasPersonalizadas();

      toast({
        title: 'Éxito',
        description: 'Etiqueta creada correctamente',
        duration: 3000,
      });

      setDialogoNuevaEtiqueta(false);
      setNuevaEtiqueta({ nombre: '', codigo: '', descripcion: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la etiqueta',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setGuardandoEtiqueta(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={dialogo_abierto} onOpenChange={(open) => {
        setDialogoAbierto(open);
        if (open) {
          const carta = buscarCartaPorDefecto(tamanos_hoja);
          setTamanoHojaId(carta?.id ?? null);
          setTamanoPapel('carta');
        } else {
          setNombrePlantilla('');
          setContenidoPlantilla('');
          setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
          setBotonesEtiquetas([]);
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            <DialogDescription>
              Crea una plantilla de consentimiento informado con etiquetas reemplazables
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 pr-4 overflow-y-auto overflow-x-auto">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la plantilla</Label>
                <Input
                  id="nombre"
                  value={nombre_plantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                  placeholder="Ej: Consentimiento para extracción dental"
                />
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Tamaño de hoja y márgenes</p>
                    <p className="text-xs text-muted-foreground">Configura el tamaño que verán tus pacientes en el PDF. Carta queda seleccionada por defecto.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <Label className="text-xs">Tamaño de papel</Label>
                    <SelectConAgregar
                      opciones={opciones_tamanos}
                      valor={tamano_hoja_id ? String(tamano_hoja_id) : ''}
                      onChange={seleccionarTamanoHoja}
                      tamanoConfig={{ onCrear: crearTamanoHoja, ocultarDescripcion: true }}
                      placeholder="Seleccionar tamaño"
                      tituloModal="Agregar tamaño de hoja"
                      descripcionModal="Ingresa nombre y medidas; se guardan en mm"
                      placeholderInput="Nombre"
                      textoAgregar='Agregar nuevo tamaño'
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 flex flex-col justify-center min-h-[44px] self-center pt-3">
                    <div className="text-foreground text-sm font-medium leading-tight">
                      Área escribible: {Math.max(0, anchoEscritura)} × {Math.max(0, altoEscritura)} mm (según márgenes actuales)
                    </div>
                    {tamanoSeleccionado && (
                      <div className="text-foreground text-xs leading-tight">
                        Hoja seleccionada: {tamanoSeleccionado.nombre} • {tamanoSeleccionado.descripcion || `${Math.round(tamanoSeleccionado.ancho)} × ${Math.round(tamanoSeleccionado.alto)} mm`}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los márgenes definen el área donde se puede escribir dentro de la página.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="margen-superior-crear" className="text-xs">Superior (mm)</Label>
                    <Input
                      id="margen-superior-crear"
                      type="number"
                      min={0}
                      max={maxTop}
                      value={margenesAjustados.superior}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxTop);
                        setMargenesPlantilla(prev => ({ ...prev, superior: nuevo }));
                      }}
                      className={cn(
                        'h-8',
                        (margenesAjustados.superior > 999 || verticalZero) && 'border-yellow-400',
                      )}
                      title={verticalZero ? 'Área de escritura vertical nula' : (margenes_plantilla.superior > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-inferior-crear" className="text-xs">Inferior (mm)</Label>
                    <Input
                      id="margen-inferior-crear"
                      type="number"
                      min={0}
                      max={maxBottom}
                      value={margenesAjustados.inferior}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxBottom);
                        setMargenesPlantilla(prev => ({ ...prev, inferior: nuevo }));
                      }}
                      className={cn(
                        'h-8',
                        (margenesAjustados.inferior > 999 || verticalZero) && 'border-yellow-400',
                      )}
                      title={verticalZero ? 'Área de escritura vertical nula' : (margenes_plantilla.inferior > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-izquierdo-crear" className="text-xs">Izquierdo (mm)</Label>
                    <Input
                      id="margen-izquierdo-crear"
                      type="number"
                      min={0}
                      max={maxLeft}
                      value={margenesAjustados.izquierdo}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxLeft);
                        setMargenesPlantilla(prev => ({ ...prev, izquierdo: nuevo }));
                      }}
                      className={cn(
                        'h-8',
                        (margenesAjustados.izquierdo > 999 || horizontalZero) && 'border-yellow-400',
                      )}
                      title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.izquierdo > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-derecho-crear" className="text-xs">Derecho (mm)</Label>
                    <Input
                      id="margen-derecho-crear"
                      type="number"
                      min={0}
                      max={maxRight}
                      value={margenesAjustados.derecho}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxRight);
                        setMargenesPlantilla(prev => ({ ...prev, derecho: nuevo }));
                      }}
                      className={cn(
                        'h-8',
                        (margenesAjustados.derecho > 999 || horizontalZero) && 'border-yellow-400',
                      )}
                      title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.derecho > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Área escribible: {Math.max(0, anchoEscritura)} × {Math.max(0, altoEscritura)} mm (según márgenes actuales)
                </div>
                {(horizontalZero || verticalZero) && (
                  <div className="text-xs text-yellow-700 mt-1">
                    ⚠️ El área de escritura {horizontalZero && verticalZero ? 'horizontal y vertical' : horizontalZero ? 'horizontal' : 'vertical'} es nula.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Etiquetas disponibles</Label>
                  <Popover open={combobox_etiquetas_abierto} onOpenChange={setComboboxEtiquetasAbierto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        role="combobox"
                        aria-expanded={combobox_etiquetas_abierto}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Etiqueta
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar etiqueta..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron etiquetas</CommandEmpty>
                          <CommandGroup>
                            {etiquetas_disponibles_para_agregar.map((etiqueta) => (
                              <CommandItem
                                key={etiqueta.codigo}
                                value={etiqueta.nombre}
                                onSelect={() => {
                                  agregarEtiquetaComoBoton(etiqueta.codigo);
                                  setComboboxEtiquetasAbierto(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{etiqueta.nombre}</span>
                                  {etiqueta.descripcion && (
                                    <span className="text-xs text-muted-foreground">
                                      {etiqueta.descripcion}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                            <CommandItem
                              onSelect={() => {
                                setComboboxEtiquetasAbierto(false);
                                setDialogoNuevaEtiqueta(true);
                              }}
                              className="text-primary font-medium"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear Nueva Etiqueta
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {botones_etiquetas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Haz clic en una etiqueta para insertarla en el editor
                    </p>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                      {botones_etiquetas.map((etiqueta) => (
                        <div key={etiqueta.codigo} className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => insertarEtiquetaEnEditor(etiqueta.codigo)}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            {etiqueta.nombre}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => eliminarBotonEtiqueta(etiqueta.codigo)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contenido de la plantilla</Label>
                <EditorConEtiquetasPersonalizado
                  ref={editorRef}
                  contenido={contenido_plantilla}
                  onChange={setContenidoPlantilla}
                  minHeight="400px"
                  tamanoPapel={tamano_papel}
                  tamanoPersonalizado={tamanoActual ? { widthMm: tamanoActual.widthMm, heightMm: tamanoActual.heightMm } : undefined as any}
                  margenes={{ top: margenesAjustados.superior, right: margenesAjustados.derecho, bottom: margenesAjustados.inferior, left: margenesAjustados.izquierdo }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoAbierto(false);
                setNombrePlantilla('');
                setContenidoPlantilla('');
                setTamanoPapel('carta');
                setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
                setBotonesEtiquetas([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={crearPlantilla} disabled={cargando}>
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plantillas de Consentimiento Informado</h2>
          <p className="text-muted-foreground">
            Gestiona tus plantillas de consentimiento. Para generar un consentimiento, ve a la sección de Pacientes.
          </p>
        </div>
        <Button
          onClick={() => {
            setNombrePlantilla('');
            setContenidoPlantilla('');
            setBotonesEtiquetas([]);
            setDialogoAbierto(true);
          }}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Nueva Plantilla
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Buscar por nombre</Label>
          <Input
            placeholder="Escribe el nombre de la plantilla..."
            value={filtro_nombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Etiquetas</Label>
          <MultiSelect
            opciones={opciones_etiquetas}
            valores={filtro_etiquetas}
            onChange={setFiltroEtiquetas}
            placeholder="Filtrar por etiquetas (opcional)"
            textoVacio="Sin etiquetas"
          />
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : plantillas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay plantillas creadas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primera plantilla de consentimiento informado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plantillas
            .filter((p) => {
              const termino = filtro_nombre.trim().toLowerCase();
              const coincideNombre = termino ? p.nombre.toLowerCase().includes(termino) : true;
              const codigos = extraerEtiquetasDelContenido(p.contenido);
              const coincideEtiquetas = filtro_etiquetas.length === 0 ||
                filtro_etiquetas.every((sel) => codigos.includes(sel));
              return coincideNombre && coincideEtiquetas;
            })
            .map((plantilla) => {
              const etiquetas = obtenerNombresEtiquetas(plantilla);
              const expandido = etiquetas_expandidas.has(plantilla.id);
              const mostrar_boton = etiquetas.length > 3;
              const etiquetas_mostradas = expandido ? etiquetas : etiquetas.slice(0, 3);

              return (
                <Card key={plantilla.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {plantilla.nombre}
                        </CardTitle>

                        {etiquetas.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {etiquetas_mostradas.map((nombre, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                >
                                  <Tag className="h-3 w-3" />
                                  {nombre}
                                </span>
                              ))}
                            </div>

                            {mostrar_boton && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEtiquetasExpandidas(plantilla.id)}
                                className="h-7 text-xs gap-1 -ml-2"
                              >
                                {expandido ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" />
                                    Ver menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    Ver {etiquetas.length - 3} más
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => visualizarPlantilla(plantilla)}
                          title="Visualizar plantilla"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => abrirEdicion(plantilla)}
                          title="Editar plantilla"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => abrirDialogoConfirmarEliminar(plantilla.id)}
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
        </div>
      )}

      <Dialog open={dialogo_edicion} onOpenChange={(open) => {
        setDialogoEdicion(open);
        if (!open) {
          setPlantillaSeleccionada(null);
          setNombrePlantilla('');
          setContenidoPlantilla('');
          setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
          setBotonesEtiquetas([]);
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica el contenido de la plantilla
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 pr-4 overflow-y-auto overflow-x-auto">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-editar">Nombre de la plantilla</Label>
                <Input
                  id="nombre-editar"
                  value={nombre_plantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                />
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Tamaño de hoja y márgenes</p>
                    <p className="text-xs text-muted-foreground">Configura el tamaño que verán tus pacientes en el PDF. Carta queda seleccionada por defecto.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <Label className="text-xs">Tamaño de papel</Label>
                    <SelectConAgregar
                      opciones={opciones_tamanos}
                      valor={tamano_hoja_id ? String(tamano_hoja_id) : ''}
                      onChange={seleccionarTamanoHoja}
                      tamanoConfig={{ onCrear: crearTamanoHoja, ocultarDescripcion: true }}
                      placeholder="Seleccionar tamaño"
                      tituloModal="Agregar tamaño de hoja"
                      descripcionModal="Ingresa nombre y medidas; se guardan en mm"
                      placeholderInput="Nombre"
                      textoAgregar="Agregar nuevo tamaño"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 flex flex-col justify-center min-h-[44px] self-center pt-3">
                    <div className="text-foreground text-sm font-medium leading-tight">
                      Área escribible: {Math.max(0, anchoEscritura)} × {Math.max(0, altoEscritura)} mm (según márgenes actuales)
                    </div>
                    {tamanoSeleccionado && (
                      <div className="text-foreground text-xs leading-tight">
                        Hoja seleccionada: {tamanoSeleccionado.nombre} • {tamanoSeleccionado.descripcion || `${Math.round(tamanoSeleccionado.ancho)} × ${Math.round(tamanoSeleccionado.alto)} mm`}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los márgenes definen el área donde se puede escribir dentro de la página.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="margen-superior-edit" className="text-xs">Superior (mm)</Label>
                    <Input
                      id="margen-superior-edit"
                      type="number"
                      min={0}
                      max={maxTop}
                      value={margenes_plantilla.superior}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxTop);
                        setMargenesPlantilla({ ...margenes_plantilla, superior: nuevo });
                      }}
                      className={cn('h-8', (margenes_plantilla.superior > 999 || verticalZero) && 'border-yellow-400')}
                      title={verticalZero ? 'Área de escritura vertical nula' : (margenes_plantilla.superior > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-inferior-edit" className="text-xs">Inferior (mm)</Label>
                    <Input
                      id="margen-inferior-edit"
                      type="number"
                      min={0}
                      max={maxBottom}
                      value={margenes_plantilla.inferior}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxBottom);
                        setMargenesPlantilla({ ...margenes_plantilla, inferior: nuevo });
                      }}
                      className={cn('h-8', (margenes_plantilla.inferior > 999 || verticalZero) && 'border-yellow-400')}
                      title={verticalZero ? 'Área de escritura vertical nula' : (margenes_plantilla.inferior > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-izquierdo-edit" className="text-xs">Izquierdo (mm)</Label>
                    <Input
                      id="margen-izquierdo-edit"
                      type="number"
                      min={0}
                      max={maxLeft}
                      value={margenes_plantilla.izquierdo}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxLeft);
                        setMargenesPlantilla({ ...margenes_plantilla, izquierdo: nuevo });
                      }}
                      className={cn('h-8', (margenes_plantilla.izquierdo > 999 || horizontalZero) && 'border-yellow-400')}
                      title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.izquierdo > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margen-derecho-edit" className="text-xs">Derecho (mm)</Label>
                    <Input
                      id="margen-derecho-edit"
                      type="number"
                      min={0}
                      max={maxRight}
                      value={margenes_plantilla.derecho}
                      onChange={(e) => {
                        const nuevo = clamp(Number(e.target.value), 0, maxRight);
                        setMargenesPlantilla({ ...margenes_plantilla, derecho: nuevo });
                      }}
                      className={cn('h-8', (margenes_plantilla.derecho > 999 || horizontalZero) && 'border-yellow-400')}
                      title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.derecho > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Área escribible: {Math.max(0, anchoEscritura)} × {Math.max(0, altoEscritura)} mm (según márgenes actuales)
                </div>
                {(horizontalZero || verticalZero) && (
                  <div className="text-xs text-yellow-700 mt-1">
                    ⚠️ El área de escritura {horizontalZero && verticalZero ? 'horizontal y vertical' : horizontalZero ? 'horizontal' : 'vertical'} es nula.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Etiquetas disponibles</Label>
                  <Popover open={combobox_etiquetas_edicion_abierto} onOpenChange={setComboboxEtiquetasEdicionAbierto}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        role="combobox"
                        aria-expanded={combobox_etiquetas_edicion_abierto}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Etiqueta
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar etiqueta..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron etiquetas</CommandEmpty>
                          <CommandGroup>
                            {etiquetas_disponibles_para_agregar.map((etiqueta) => (
                              <CommandItem
                                key={etiqueta.codigo}
                                value={etiqueta.nombre}
                                onSelect={() => {
                                  agregarEtiquetaComoBoton(etiqueta.codigo);
                                  setComboboxEtiquetasEdicionAbierto(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{etiqueta.nombre}</span>
                                  {etiqueta.descripcion && (
                                    <span className="text-xs text-muted-foreground">
                                      {etiqueta.descripcion}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                            <CommandItem
                              onSelect={() => {
                                setComboboxEtiquetasEdicionAbierto(false);
                                setDialogoNuevaEtiqueta(true);
                              }}
                              className="text-primary font-medium"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear Nueva Etiqueta
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {botones_etiquetas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Haz clic en una etiqueta para insertarla en el editor
                    </p>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                      {botones_etiquetas.map((etiqueta) => (
                        <div key={etiqueta.codigo} className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => insertarEtiquetaEnEditor(etiqueta.codigo)}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            {etiqueta.nombre}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => eliminarBotonEtiqueta(etiqueta.codigo)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contenido de la plantilla</Label>
                <EditorConEtiquetasPersonalizado
                  ref={editorRef}
                  contenido={contenido_plantilla}
                  onChange={setContenidoPlantilla}
                  minHeight="400px"
                  tamanoPapel={tamano_papel}
                  tamanoPersonalizado={tamanoActual ? { widthMm: tamanoActual.widthMm, heightMm: tamanoActual.heightMm } : undefined as any}
                  margenes={{ top: margenesAjustados.superior, right: margenesAjustados.derecho, bottom: margenesAjustados.inferior, left: margenesAjustados.izquierdo }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoEdicion(false);
                setPlantillaSeleccionada(null);
                setNombrePlantilla('');
                setContenidoPlantilla('');
                setTamanoPapel('carta');
                setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
                setBotonesEtiquetas([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={actualizarPlantilla} disabled={cargando}>
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_nueva_etiqueta} onOpenChange={setDialogoNuevaEtiqueta}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Etiqueta</DialogTitle>
            <DialogDescription>
              Define una nueva etiqueta personalizada para tus plantillas de consentimiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="etiqueta-nombre">Nombre de la etiqueta *</Label>
              <Input
                id="etiqueta-nombre"
                value={nueva_etiqueta.nombre}
                onChange={(e) => setNuevaEtiqueta({ ...nueva_etiqueta, nombre: e.target.value })}
                placeholder="Ej: Tratamiento Realizado"
              />
              <p className="text-xs text-muted-foreground">
                Nombre descriptivo de la etiqueta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etiqueta-codigo">Código de la etiqueta *</Label>
              <Input
                id="etiqueta-codigo"
                value={nueva_etiqueta.codigo}
                onChange={(e) => setNuevaEtiqueta({ ...nueva_etiqueta, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: [TRATAMIENTO_REALIZADO]"
              />
              <p className="text-xs text-muted-foreground">
                Debe estar entre corchetes y en mayúsculas, ej: [MI_ETIQUETA]
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoNuevaEtiqueta(false);
                setNuevaEtiqueta({ nombre: '', codigo: '', descripcion: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={crearNuevaEtiqueta} disabled={guardando_etiqueta}>
              {guardando_etiqueta && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogo_visualizacion} onOpenChange={setDialogoVisualizacion}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Previa de Plantilla
            </DialogTitle>
            <DialogDescription>
              {plantilla_visualizando?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <RenderizadorHtml
              contenido={plantilla_visualizando?.contenido || ''}
              modoDocumento
              escala={0.8}
              altura="calc(90vh - 180px)"
              ajustarAncho
              tamanoPapel={(plantilla_visualizando as any)?.tamano_papel || 'carta'}
              tamanoPersonalizado={plantilla_visualizando ? obtenerTamanoPlantilla(
                (plantilla_visualizando as any)?.tamano_hoja_id ?? null,
                (plantilla_visualizando as any)?.ancho_mm ?? null,
                (plantilla_visualizando as any)?.alto_mm ?? null,
              ) : undefined as any}
              margenes={{
                top: plantilla_visualizando?.margen_superior ?? 20,
                bottom: plantilla_visualizando?.margen_inferior ?? 20,
                left: plantilla_visualizando?.margen_izquierdo ?? 20,
                right: plantilla_visualizando?.margen_derecho ?? 20,
              }}
              className="[&_span[data-etiqueta]]:bg-yellow-100 [&_span[data-etiqueta]]:px-2 [&_span[data-etiqueta]]:py-0.5 [&_span[data-etiqueta]]:rounded [&_span[data-etiqueta]]:font-medium [&_span[data-etiqueta]]:text-yellow-900"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoVisualizacion(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar} onOpenChange={setDialogoConfirmarEliminar}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta plantilla de consentimiento informado?
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
                setDialogoConfirmarEliminar(false);
                setPlantillaAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarPlantilla}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
