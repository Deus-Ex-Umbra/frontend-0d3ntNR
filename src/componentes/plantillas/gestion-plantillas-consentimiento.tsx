import { useState, useEffect, useRef } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { Label } from '@/componentes/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion';
import { plantillasConsentimientoApi, catalogoApi } from '@/lib/api';
import { PlantillaConsentimiento } from '@/tipos';
import { FileText, Edit, Trash2, Plus, Loader2, X, ChevronsUpDown, Eye, Tag, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditorConEtiquetasPersonalizado } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { ScrollArea } from '@/componentes/ui/scroll-area';
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
    const [tamanos_hoja, setTamanosHoja] = useState<Array<{ id:number; nombre:string; ancho:number; alto:number; descripcion?:string; protegido:boolean }>>([]);
    const [tamano_hoja_id, setTamanoHojaId] = useState<number | null>(null);
  const [margenes_plantilla, setMargenesPlantilla] = useState({
    superior: 20,
    inferior: 20,
    izquierdo: 20,
    derecho: 20,
  });
  const pageMm = tamano_papel === 'carta'
    ? { width: 216, height: 279 }
    : tamano_papel === 'legal'
    ? { width: 216, height: 356 }
    : { width: 210, height: 297 };
  const maxLeft = Math.max(0, pageMm.width - margenes_plantilla.derecho);
  const maxRight = Math.max(0, pageMm.width - margenes_plantilla.izquierdo);
  const maxTop = Math.max(0, pageMm.height - margenes_plantilla.inferior);
  const maxBottom = Math.max(0, pageMm.height - margenes_plantilla.superior);
  const horizontalZero = margenes_plantilla.izquierdo + margenes_plantilla.derecho === pageMm.width;
  const verticalZero = margenes_plantilla.superior + margenes_plantilla.inferior === pageMm.height;

  const clamp = (v: number, min: number, max: number) => {
    if (Number.isNaN(v)) return min;
    return Math.min(Math.max(v, min), max);
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
  const [filtro_nombre, setFiltroNombre] = useState('');
  const [filtro_etiquetas, setFiltroEtiquetas] = useState<string[]>([]);
  const [opciones_etiquetas, setOpcionesEtiquetas] = useState<Array<{ valor: string; etiqueta: string }>>([]);
  const editorRef = useRef<any>(null);

  const { toast } = useToast();
  const todas_las_etiquetas = etiquetas_personalizadas.map(e => ({ 
    codigo: e.codigo, 
    nombre: e.nombre, 
    descripcion: e.descripcion || '' 
  }));
  const etiquetas_disponibles_para_agregar = todas_las_etiquetas.filter(
    etiqueta => !botones_etiquetas.some(boton => boton.codigo === etiqueta.codigo)
  );

  useEffect(() => {
    cargarPlantillas();
    cargarEtiquetasPersonalizadas();
    cargarTamanosHoja();
  }, []);

  const cargarTamanosHoja = async () => {
    try {
      const lista = await (catalogoApi as any).obtenerTamanosHoja?.();
      if (Array.isArray(lista)) setTamanosHoja(lista);
    } catch (e) {
      console.error('Error cargando tamaños de hoja', e);
    }
  };

  const opciones_tamanos: OpcionSelectConAgregar[] = tamanos_hoja.map(t => {
    const etiquetaMedidas = `${Math.round(t.ancho)} × ${Math.round(t.alto)} mm`;
    return ({ valor: String(t.id), etiqueta: `${t.nombre} (${t.descripcion || etiquetaMedidas})` });
  });
  const tamanoSeleccionado = tamano_hoja_id ? tamanos_hoja.find(t => t.id === tamano_hoja_id) : undefined;
  const seleccionarTamanoHoja = (valor: string) => {
    if (!valor) { setTamanoHojaId(null); return; }
    const id = Number(valor);
    const item = tamanos_hoja.find(t => t.id === id);
    if (item) {
      setTamanoHojaId(item.id);
      const dims = { width: Math.round(item.ancho), height: Math.round(item.alto) };
      const maxL = Math.max(0, dims.width - margenes_plantilla.derecho);
      const maxR = Math.max(0, dims.width - margenes_plantilla.izquierdo);
      const maxT = Math.max(0, dims.height - margenes_plantilla.inferior);
      const maxB = Math.max(0, dims.height - margenes_plantilla.superior);
      setMargenesPlantilla({
        superior: clamp(margenes_plantilla.superior, 0, maxT),
        inferior: clamp(margenes_plantilla.inferior, 0, maxB),
        izquierdo: clamp(margenes_plantilla.izquierdo, 0, maxL),
        derecho: clamp(margenes_plantilla.derecho, 0, maxR),
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
      etiquetas_personalizadas.map((e) => [e.codigo, e.nombre])
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

  const eliminarPlantilla = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      await plantillasConsentimientoApi.eliminar(id);
      toast({
        title: 'Plantilla eliminada',
        description: 'La plantilla se ha eliminado correctamente',
        duration: 3000,
      });
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

    if (!nueva_etiqueta.codigo.startsWith('[') || !nueva_etiqueta.codigo.endsWith(']')) {
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
        if (!open) {
          setNombrePlantilla('');
          setContenidoPlantilla('');
          setMargenesPlantilla({ superior: 20, inferior: 20, izquierdo: 20, derecho: 20 });
          setBotonesEtiquetas([]);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            <DialogDescription>
              Crea una plantilla de consentimiento informado con etiquetas reemplazables
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-200px)] pr-4 overflow-y-auto overflow-x-auto">
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

              <Accordion type="single" collapsible className="w-full border rounded-lg px-4">
                <AccordionItem value="margenes-config" className="border-none">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Configuración de papel y márgenes del PDF</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Tamaño de papel</Label>
                          <SelectConAgregar
                            opciones={opciones_tamanos}
                            valor={tamano_hoja_id ? String(tamano_hoja_id) : ''}
                            onChange={seleccionarTamanoHoja}
                            tamanoConfig={{ onCrear: crearTamanoHoja }}
                            placeholder="Seleccionar tamaño"
                            tituloModal="Agregar tamaño de hoja"
                            descripcionModal="Ingresa nombre y medidas; se guardan en mm"
                            placeholderInput="Nombre"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Selecciona el tamaño de hoja para vista previa y PDF. Los márgenes se aplican encima del área útil de la hoja.
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Define los márgenes predeterminados para esta plantilla. Estos valores se utilizarán al generar el PDF.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="margen-superior-crear" className="text-xs">Superior (mm)</Label>
                          <Input
                            id="margen-superior-crear"
                            type="number"
                            min={0}
                            max={maxTop}
                            value={margenes_plantilla.superior}
                            onChange={(e) => {
                              const nuevo = clamp(Number(e.target.value), 0, maxTop);
                              setMargenesPlantilla({ ...margenes_plantilla, superior: nuevo });
                            }}
                            className={cn(
                              "h-8",
                              (margenes_plantilla.superior > 999 || verticalZero) && "border-yellow-400"
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
                            value={margenes_plantilla.inferior}
                            onChange={(e) => {
                              const nuevo = clamp(Number(e.target.value), 0, maxBottom);
                              setMargenesPlantilla({ ...margenes_plantilla, inferior: nuevo });
                            }}
                            className={cn(
                              "h-8",
                              (margenes_plantilla.inferior > 999 || verticalZero) && "border-yellow-400"
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
                            value={margenes_plantilla.izquierdo}
                            onChange={(e) => {
                              const nuevo = clamp(Number(e.target.value), 0, maxLeft);
                              setMargenesPlantilla({ ...margenes_plantilla, izquierdo: nuevo });
                            }}
                            className={cn(
                              "h-8",
                              (margenes_plantilla.izquierdo > 999 || horizontalZero) && "border-yellow-400"
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
                            value={margenes_plantilla.derecho}
                            onChange={(e) => {
                              const nuevo = clamp(Number(e.target.value), 0, maxRight);
                              setMargenesPlantilla({ ...margenes_plantilla, derecho: nuevo });
                            }}
                            className={cn(
                              "h-8",
                              (margenes_plantilla.derecho > 999 || horizontalZero) && "border-yellow-400"
                            )}
                            title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.derecho > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                          />
                        </div>
                      </div>
                      {(horizontalZero || verticalZero) && (
                        <div className="text-xs text-yellow-700 mt-1">
                          ⚠️ El área de escritura {horizontalZero && verticalZero ? 'horizontal y vertical' : horizontalZero ? 'horizontal' : 'vertical'} es nula.
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
                    tamanoPersonalizado={tamanoSeleccionado ? { widthMm: Math.round(tamanoSeleccionado.ancho), heightMm: Math.round(tamanoSeleccionado.alto) } : undefined as any}
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
                        onClick={() => eliminarPlantilla(plantilla.id)}
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
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica el contenido de la plantilla
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-200px)] pr-4 overflow-y-auto overflow-x-auto">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-editar">Nombre de la plantilla</Label>
                <Input
                  id="nombre-editar"
                  value={nombre_plantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                />
              </div>

              <Accordion type="single" collapsible className="w-full border rounded-lg px-4">
                <AccordionItem value="margenes-config-edit" className="border-none">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Configuración de papel y márgenes del PDF</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Tamaño de papel</Label>
                          <SelectConAgregar
                            opciones={opciones_tamanos}
                            valor={tamano_hoja_id ? String(tamano_hoja_id) : ''}
                            onChange={seleccionarTamanoHoja}
                            tamanoConfig={{ onCrear: crearTamanoHoja }}
                            placeholder="Seleccionar tamaño"
                            tituloModal="Agregar tamaño de hoja"
                            descripcionModal="Ingresa nombre y medidas; se guardan en mm"
                            placeholderInput="Nombre"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Selecciona el tamaño de hoja para vista previa y PDF. Los márgenes se aplican encima del área útil de la hoja.
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Define los márgenes predeterminados para esta plantilla. Estos valores se utilizarán al generar el PDF.
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
                            className={cn("h-8", (margenes_plantilla.superior > 999 || verticalZero) && "border-yellow-400")}
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
                            className={cn("h-8", (margenes_plantilla.inferior > 999 || verticalZero) && "border-yellow-400")}
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
                            className={cn("h-8", (margenes_plantilla.izquierdo > 999 || horizontalZero) && "border-yellow-400")}
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
                            className={cn("h-8", (margenes_plantilla.derecho > 999 || horizontalZero) && "border-yellow-400")}
                            title={horizontalZero ? 'Área de escritura horizontal nula' : (margenes_plantilla.derecho > 999 ? 'Valor muy alto, puede causar problemas de visualización' : undefined)}
                          />
                        </div>
                      </div>
                      {(horizontalZero || verticalZero) && (
                        <div className="text-xs text-yellow-700 mt-1">
                          ⚠️ El área de escritura {horizontalZero && verticalZero ? 'horizontal y vertical' : horizontalZero ? 'horizontal' : 'vertical'} es nula.
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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
                  tamanoPersonalizado={tamanoSeleccionado ? { widthMm: Math.round(tamanoSeleccionado.ancho), heightMm: Math.round(tamanoSeleccionado.alto) } : undefined as any}
                  margenes={{ top: margenes_plantilla.superior, right: margenes_plantilla.derecho, bottom: margenes_plantilla.inferior, left: margenes_plantilla.izquierdo }}
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Previa de Plantilla
            </DialogTitle>
            <DialogDescription>
              {plantilla_visualizando?.nombre}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-4 py-4">
              <div className="border-2 rounded-lg bg-transparent shadow-sm">
                <div className="bg-muted/30 px-4 py-2 border-b">
                  <p className="text-sm font-medium text-muted-foreground">
                    Vista previa del documento
                  </p>
                </div>
                <div className="p-8 overflow-x-auto">
                  <RenderizadorHtml 
                    contenido={plantilla_visualizando?.contenido || ''}
                    modoDocumento
                    tamanoPapel={(plantilla_visualizando as any)?.tamano_papel || 'carta'}
                    tamanoPersonalizado={tamanoSeleccionado ? { widthMm: Math.round(tamanoSeleccionado.ancho), heightMm: Math.round(tamanoSeleccionado.alto) } : undefined as any}
                    margenes={{
                      top: plantilla_visualizando?.margen_superior ?? 20,
                      bottom: plantilla_visualizando?.margen_inferior ?? 20,
                      left: plantilla_visualizando?.margen_izquierdo ?? 20,
                      right: plantilla_visualizando?.margen_derecho ?? 20,
                    }}
                    className="[&_span[data-etiqueta]]:bg-yellow-100 [&_span[data-etiqueta]]:px-2 [&_span[data-etiqueta]]:py-0.5 [&_span[data-etiqueta]]:rounded [&_span[data-etiqueta]]:font-medium [&_span[data-etiqueta]]:text-yellow-900"
                  />
                </div>
              </div>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-2 text-sm text-blue-900">
                      <p className="font-semibold">Acerca de esta vista previa:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Las <span className="bg-yellow-100 px-1.5 py-0.5 rounded font-medium">etiquetas resaltadas</span> se reemplazarán con datos reales del paciente</li>
                        <li>El formato y estilo del documento final se mantendrá tal como se muestra aquí</li>
                        <li>Para generar un consentimiento completo, ve a <strong>Pacientes → Archivos → Generar Consentimiento</strong></li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoVisualizacion(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
