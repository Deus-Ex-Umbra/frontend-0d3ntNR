import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command';
import { SelectConAgregar, OpcionSelectConAgregar } from '@/componentes/ui/select-with-add';
import { EditorConEtiquetasPersonalizado, EditorHandle } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { plantillasRecetasApi, catalogoApi } from '@/lib/api';
import { PlantillaReceta, ItemCatalogo } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Eye, Plus, Loader2, Pill, ChevronsUpDown, Info, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utilidades';

interface Margenes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_MARGENES: Margenes = { top: 20, right: 20, bottom: 20, left: 20 };

export function GestionPlantillasRecetas() {
  const { toast } = useToast();
  const editorRef = useRef<EditorHandle | null>(null);

  const [plantillas, setPlantillas] = useState<PlantillaReceta[]>([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaReceta | null>(null);
  const [plantillaVisualizando, setPlantillaVisualizando] = useState<PlantillaReceta | null>(null);

  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [dialogoEditar, setDialogoEditar] = useState(false);
  const [dialogoVista, setDialogoVista] = useState(false);
  const [dialogoNuevoMedicamento, setDialogoNuevoMedicamento] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardandoMedicamento, setGuardandoMedicamento] = useState(false);

  const [nombre, setNombre] = useState('');
  const [contenido, setContenido] = useState('');
  const [tamanoPapel, setTamanoPapel] = useState<'carta' | 'legal' | 'a4'>('carta');
  const [tamanoHojaId, setTamanoHojaId] = useState<number | null>(null);
  const [tamanosHoja, setTamanosHoja] = useState<Array<{ id: number; nombre: string; ancho: number; alto: number; descripcion?: string; protegido: boolean }>>([]);
  const [margenes, setMargenes] = useState<Margenes>({ ...DEFAULT_MARGENES });

  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMedicamentos, setFiltroMedicamentos] = useState<string[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);

  const [medicamentosPaleta, setMedicamentosPaleta] = useState<ItemCatalogo[]>([]);
  const [comboboxMedicamentosAbierto, setComboboxMedicamentosAbierto] = useState(false);
  const [nuevoMedicamentoNombre, setNuevoMedicamentoNombre] = useState('');

  const [etiquetasExpandidas, setEtiquetasExpandidas] = useState<Set<number>>(new Set());

  useEffect(() => {
    cargarData();
  }, []);

  useEffect(() => {
    if (!tamanoHojaId && tamanosHoja.length > 0 && (dialogoCrear || dialogoEditar)) {
      if (dialogoCrear) {
        const carta = buscarCartaPorDefecto(tamanosHoja);
        if (carta) {
          setTamanoHojaId(carta.id);
          setTamanoPapel('carta');
        }
      }
    }
  }, [tamanoHojaId, tamanosHoja, dialogoCrear]);

  const cargarData = async () => {
    setCargando(true);
    try {
      await Promise.all([cargarPlantillas(), cargarMedicamentos(), cargarTamanosHoja()]);
    } finally {
      setCargando(false);
    }
  };

  const cargarPlantillas = async () => {
    try {
      const datos = await plantillasRecetasApi.obtenerTodas();
      setPlantillas(datos);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas', variant: 'destructive' });
    }
  };

  const cargarMedicamentos = async () => {
    try {
      const datos = await catalogoApi.obtenerMedicamentos();
      setMedicamentos(datos);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    }
  };

  const cargarTamanosHoja = async () => {
    try {
      const lista = await (catalogoApi as any).obtenerTamanosHoja?.();
      if (Array.isArray(lista)) setTamanosHoja(lista);
    } catch (e) {
      console.error('Error cargando tamaños de hoja', e);
    }
  };

  const buscarCartaPorDefecto = (lista: Array<{ id: number; nombre: string; ancho: number; alto: number }>) => {
    const porNombre = lista.find(t => t.nombre?.toLowerCase().includes('carta'));
    if (porNombre) return porNombre;
    return lista.find(t => Math.round(t.ancho) === 216 && Math.round(t.alto) === 279);
  };

  const clamp = (v: number, min: number, max: number) => {
    if (Number.isNaN(v)) return min;
    return Math.min(Math.max(v, min), max);
  };
  const aplicarLimiteMargenes = (m: { top: number; right: number; bottom: number; left: number }, widthMm: number, heightMm: number) => {
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
    const [top, bottom] = clampPair(m.top, m.bottom, limiteVertical);
    const [left, right] = clampPair(m.left, m.right, limiteHorizontal);
    return { top, bottom, left, right, limiteVertical, limiteHorizontal };
  };

  const tamanoSeleccionado = tamanoHojaId ? tamanosHoja.find(t => t.id === tamanoHojaId) : undefined;

  const obtenerTamanoPlantilla = (id?: number | null, ancho?: number | null, alto?: number | null) => {
    const encontrado = id ? tamanosHoja.find(t => t.id === id) : undefined;
    if (encontrado) return { widthMm: Math.round(encontrado.ancho), heightMm: Math.round(encontrado.alto) };
    if (ancho && alto) return { widthMm: Math.round(ancho), heightMm: Math.round(alto) };
    return undefined;
  };

  const tamanoActual = obtenerTamanoPlantilla(tamanoHojaId, plantillaSeleccionada?.ancho_mm, plantillaSeleccionada?.alto_mm);

  const pageBase = tamanoActual
    ? { width: tamanoActual.widthMm, height: tamanoActual.heightMm }
    : tamanoPapel === 'carta'
      ? { width: 216, height: 279 }
      : tamanoPapel === 'legal'
        ? { width: 216, height: 356 }
        : { width: 210, height: 297 };

  const margenesAjustados = aplicarLimiteMargenes(margenes, pageBase.width, pageBase.height);
  const maxLeft = Math.max(0, margenesAjustados.limiteHorizontal - margenesAjustados.right);
  const maxRight = Math.max(0, margenesAjustados.limiteHorizontal - margenesAjustados.left);
  const maxTop = Math.max(0, margenesAjustados.limiteVertical - margenesAjustados.bottom);
  const maxBottom = Math.max(0, margenesAjustados.limiteVertical - margenesAjustados.top);

  const horizontalZero = margenesAjustados.left + margenesAjustados.right >= margenesAjustados.limiteHorizontal;
  const verticalZero = margenesAjustados.top + margenesAjustados.bottom >= margenesAjustados.limiteVertical;
  const anchoEscritura = pageBase.width - margenesAjustados.left - margenesAjustados.right;
  const altoEscritura = pageBase.height - margenesAjustados.top - margenesAjustados.bottom;

  const opcionesTamanos: OpcionSelectConAgregar[] = useMemo(() => tamanosHoja.map((t) => {
    const etiquetaMedidas = `${Math.round(t.ancho)} × ${Math.round(t.alto)} mm`;
    return ({ valor: String(t.id), etiqueta: `${t.nombre} (${t.descripcion || etiquetaMedidas})` });
  }), [tamanosHoja]);

  const opcionesFiltroMedicamentos = useMemo(() => medicamentos.map((m) => ({
    valor: `MED_${m.id}`,
    etiqueta: m.nombre,
  })), [medicamentos]);

  const medicamentosDisponiblesParaAgregar = useMemo(() => {
    return medicamentos.filter(m => !medicamentosPaleta.some(p => p.id === m.id));
  }, [medicamentos, medicamentosPaleta]);

  const plantillasFiltradas = useMemo(() => {
    const termino = filtroNombre.trim().toLowerCase();
    return plantillas.filter((p) => {
      const coincideNombre = !termino || p.nombre.toLowerCase().includes(termino);
      if (!coincideNombre) return false;
      if (filtroMedicamentos.length === 0) return true;
      const usados = extraerEtiquetasDelContenido(p.contenido);
      return filtroMedicamentos.every((codigo) => usados.includes(codigo));
    });
  }, [plantillas, filtroNombre, filtroMedicamentos]);

  function extraerEtiquetasDelContenido(contenidoHtml: string): string[] {
    const regex = /data-etiqueta="([^\"]+)"/g;
    const encontrados: string[] = [];
    let match;
    while ((match = regex.exec(contenidoHtml)) !== null) {
      if (!encontrados.includes(match[1])) {
        encontrados.push(match[1]);
      }
    }
    return encontrados;
  }

  const enriquecerContenidoConNombres = (html: string) => {
    if (!html) return html;
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const spans = doc.querySelectorAll('span[data-etiqueta^="MED_"]');

      spans.forEach((span) => {
        const codigo = span.getAttribute('data-etiqueta') || '';
        const id = codigo.replace('MED_', '');
        const med = medicamentos.find((m) => String(m.id) === id);
        if (!med) return;
        span.setAttribute('data-texto', med.nombre);
        span.textContent = med.nombre;
      });

      return doc.body.innerHTML;
    } catch (error) {
      console.error('No se pudo enriquecer el contenido con nombres de medicamentos', error);
      return html;
    }
  };

  const crearTamanoHoja = async (datos: { nombre: string; anchoCm: number; altoCm: number; descripcion?: string }) => {
    const creado = await (catalogoApi as any).crearTamanoHoja?.({ nombre: datos.nombre, ancho: datos.anchoCm, alto: datos.altoCm, descripcion: datos.descripcion });
    await cargarTamanosHoja();
    if (creado?.id) setTamanoHojaId(creado.id);
  };

  const seleccionarTamanoHoja = (valor: string) => {
    if (!valor) { setTamanoHojaId(null); return; }
    const id = Number(valor);
    const item = tamanosHoja.find(t => t.id === id);
    if (item) {
      setTamanoHojaId(item.id);
      const dims = { width: Math.round(item.ancho), height: Math.round(item.alto) };
      setMargenes(prev => {
        const ajustados = aplicarLimiteMargenes(prev, dims.width, dims.height);
        return { top: ajustados.top, bottom: ajustados.bottom, left: ajustados.left, right: ajustados.right };
      });
    }
  };

  const abrirCrear = () => {
    setNombre('');
    setContenido('');
    setTamanoPapel('carta');
    setTamanoHojaId(null);
    setMargenes({ ...DEFAULT_MARGENES });
    setMedicamentosPaleta([]);

    const carta = buscarCartaPorDefecto(tamanosHoja);
    if (carta) {
      setTamanoHojaId(carta.id);
    }

    setDialogoCrear(true);
  };

  const abrirEdicion = (plantilla: PlantillaReceta) => {
    setPlantillaSeleccionada(plantilla);
    setNombre(plantilla.nombre);
    setContenido(enriquecerContenidoConNombres(plantilla.contenido));
    setTamanoPapel(plantilla.tamano_papel || 'carta');
    setTamanoHojaId(plantilla.tamano_hoja_id ?? null);
    setMargenes({
      top: plantilla.margen_superior || 20,
      bottom: plantilla.margen_inferior || 20,
      left: plantilla.margen_izquierdo || 20,
      right: plantilla.margen_derecho || 20,
    });

    const etiquetas = extraerEtiquetasDelContenido(plantilla.contenido);
    const medsEnUso = etiquetas.map(tag => {
      const id = tag.replace('MED_', '');
      return medicamentos.find(m => String(m.id) === id);
    }).filter((m): m is ItemCatalogo => !!m);

    setMedicamentosPaleta(medsEnUso);
    setDialogoEditar(true);
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta plantilla de receta?')) return;
    try {
      await plantillasRecetasApi.eliminar(id);
      toast({ title: 'Eliminada', description: 'La plantilla se eliminó correctamente' });
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la plantilla', variant: 'destructive' });
    }
  };

  const construirPayload = () => ({
    nombre: nombre.trim(),
    contenido,
    tamano_papel: tamanoPapel,
    tamano_hoja_id: tamanoHojaId ?? null,
    ancho_mm: pageBase.width,
    alto_mm: pageBase.height,
    margen_superior: margenes.top,
    margen_inferior: margenes.bottom,
    margen_izquierdo: margenes.left,
    margen_derecho: margenes.right,
  });

  const guardarPlantilla = async (esEdicion: boolean) => {
    if (!nombre.trim() || !contenido.trim()) {
      toast({ title: 'Faltan datos', description: 'Nombre y contenido son obligatorios', variant: 'destructive' });
      return;
    }
    setGuardando(true);
    try {
      if (esEdicion && plantillaSeleccionada) {
        await plantillasRecetasApi.actualizar(plantillaSeleccionada.id, construirPayload());
        toast({ title: 'Plantilla actualizada', description: 'La receta se actualizó correctamente' });
        setDialogoEditar(false);
      } else {
        await plantillasRecetasApi.crear(construirPayload());
        toast({ title: 'Plantilla creada', description: 'La receta se creó correctamente' });
        setDialogoCrear(false);
      }
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la plantilla', variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const agregarMedicamentoAPaleta = (med: ItemCatalogo) => {
    if (!medicamentosPaleta.some(m => m.id === med.id)) {
      setMedicamentosPaleta([...medicamentosPaleta, med]);
    }
  };

  const eliminarDePaleta = (id: number) => {
    setMedicamentosPaleta(medicamentosPaleta.filter(m => m.id !== id));
  };

  const insertarMedicamentoEnEditor = (med: ItemCatalogo) => {
    const codigo = `MED_${med.id}`;
    editorRef.current?.chain()?.focus()?.insertarEtiqueta(codigo, med.nombre)?.run();
  };

  const crearNuevoMedicamento = async () => {
    if (!nuevoMedicamentoNombre.trim()) return;
    setGuardandoMedicamento(true);
    try {
      const creado = await catalogoApi.crearMedicamento({ nombre: nuevoMedicamentoNombre.trim() });
      await cargarMedicamentos();
      agregarMedicamentoAPaleta(creado);
      toast({ title: 'Medicamento creado', description: 'Se añadió a la lista disponible.' });
      setDialogoNuevoMedicamento(false);
      setNuevoMedicamentoNombre('');
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el medicamento', variant: 'destructive' });
    } finally {
      setGuardandoMedicamento(false);
    }
  };

  const toggleEtiquetasExpandidas = (id: number) => {
    setEtiquetasExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const renderDialogContent = (titulo: string, onGuardar: () => void) => (
    <div className="flex-1 pr-4 overflow-y-auto overflow-x-auto">
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label>Nombre de la plantilla</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Receta Estándar" />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Tamaño de hoja y márgenes</p>
              <p className="text-xs text-muted-foreground">Configura la página tal como se imprimirá o generará en PDF.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <Label className="text-xs">Tamaño de papel</Label>
              <SelectConAgregar
                opciones={opcionesTamanos}
                valor={tamanoHojaId ? String(tamanoHojaId) : ''}
                onChange={seleccionarTamanoHoja}
                tamanoConfig={{ onCrear: crearTamanoHoja, ocultarDescripcion: true }}
                placeholder="Seleccionar tamaño"
                tituloModal="Agregar tamaño de hoja"
                descripcionModal="Ingresa nombre y medidas (mm)"
                placeholderInput="Nombre"
                textoAgregar="Agregar nuevo tamaño"
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1 flex flex-col justify-center min-h-[44px] self-center pt-3">
              <div className="text-foreground text-sm font-medium leading-tight">
                Área escribible: {Math.max(0, anchoEscritura)} × {Math.max(0, altoEscritura)} mm
              </div>
              {tamanoSeleccionado && (
                <div className="text-foreground text-xs leading-tight">
                  Hoja: {tamanoSeleccionado.nombre} • {Math.round(tamanoSeleccionado.ancho)}×{Math.round(tamanoSeleccionado.alto)} mm
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Superior (mm)</Label>
              <Input
                type="number" min={0} max={maxTop} value={margenesAjustados.top}
                onChange={(e) => setMargenes(prev => ({ ...prev, top: clamp(Number(e.target.value), 0, maxTop) }))}
                className={cn("h-8", (margenesAjustados.top > 999 || verticalZero) && "border-yellow-400")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Inferior (mm)</Label>
              <Input
                type="number" min={0} max={maxBottom} value={margenesAjustados.bottom}
                onChange={(e) => setMargenes(prev => ({ ...prev, bottom: clamp(Number(e.target.value), 0, maxBottom) }))}
                className={cn("h-8", (margenesAjustados.bottom > 999 || verticalZero) && "border-yellow-400")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Izquierdo (mm)</Label>
              <Input
                type="number" min={0} max={maxLeft} value={margenesAjustados.left}
                onChange={(e) => setMargenes(prev => ({ ...prev, left: clamp(Number(e.target.value), 0, maxLeft) }))}
                className={cn("h-8", (margenesAjustados.left > 999 || horizontalZero) && "border-yellow-400")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Derecho (mm)</Label>
              <Input
                type="number" min={0} max={maxRight} value={margenesAjustados.right}
                onChange={(e) => setMargenes(prev => ({ ...prev, right: clamp(Number(e.target.value), 0, maxRight) }))}
                className={cn("h-8", (margenesAjustados.right > 999 || horizontalZero) && "border-yellow-400")}
              />
            </div>
          </div>
          {(horizontalZero || verticalZero) && (
            <div className="text-xs text-yellow-700 mt-1">⚠️ Área de escritura nula.</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Medicamentos disponibles</Label>
            <Popover open={comboboxMedicamentosAbierto} onOpenChange={setComboboxMedicamentosAbierto}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" className="gap-2">
                  <Plus className="h-4 w-4" /> Agregar Medicamento
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Buscar medicamento..." />
                  <CommandList>
                    <CommandEmpty>No encontrado</CommandEmpty>
                    <CommandGroup>
                      {medicamentosDisponiblesParaAgregar.map((med) => (
                        <CommandItem key={med.id} value={med.nombre} onSelect={() => {
                          agregarMedicamentoAPaleta(med);
                          setComboboxMedicamentosAbierto(false);
                        }}>
                          {med.nombre}
                        </CommandItem>
                      ))}
                      <CommandItem onSelect={() => {
                        setComboboxMedicamentosAbierto(false);
                        setDialogoNuevoMedicamento(true);
                      }} className="text-primary font-medium">
                        <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Medicamento
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {medicamentosPaleta.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Haz clic para insertar en el editor.</p>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                {medicamentosPaleta.map((med) => (
                  <div key={med.id} className="flex items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => insertarMedicamentoEnEditor(med)} className="gap-2">
                      <Pill className="h-3 w-3" /> {med.nombre}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => eliminarDePaleta(med.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Contenido</Label>
          <EditorConEtiquetasPersonalizado
            ref={editorRef}
            contenido={contenido}
            onChange={setContenido}
            minHeight="400px"
            tamanoPapel={tamanoPapel}
            tamanoPersonalizado={tamanoActual}
            margenes={{ top: margenesAjustados.top, right: margenesAjustados.right, bottom: margenesAjustados.bottom, left: margenesAjustados.left }}
          />
        </div>
      </div>
    </div>
  );

  const contenidoVista = plantillaVisualizando
    ? enriquecerContenidoConNombres(plantillaVisualizando.contenido)
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plantillas de Recetas</h2>
          <p className="text-muted-foreground">Gestiona las plantillas para las recetas de tus pacientes.</p>
        </div>
        <Button onClick={abrirCrear} size="lg" className="gap-2">
          <Plus className="h-5 w-5" /> Nueva Plantilla
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Buscar por nombre</Label>
          <Input placeholder="Buscar..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Filtrar por medicamentos</Label>
          <MultiSelect opciones={opcionesFiltroMedicamentos} valores={filtroMedicamentos} onChange={setFiltroMedicamentos} placeholder="Seleccionar medicamentos" textoVacio="Sin selección" />
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : plantillasFiltradas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Pill className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay plantillas</h3>
            <p className="text-muted-foreground text-center">Crea tu primera plantilla de receta.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plantillasFiltradas.map((plantilla) => {
            const etiquetas = extraerEtiquetasDelContenido(plantilla.contenido);
            const nombresMeds = etiquetas.map(tag => {
              const id = tag.replace('MED_', '');
              return medicamentos.find(m => String(m.id) === id)?.nombre || tag;
            });
            const expandido = etiquetasExpandidas.has(plantilla.id);
            const mostrados = expandido ? nombresMeds : nombresMeds.slice(0, 3);

            return (
              <Card key={plantilla.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 overflow-hidden">
                      <CardTitle className="flex items-center gap-2 truncate">
                        <Pill className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate" title={plantilla.nombre}>{plantilla.nombre}</span>
                      </CardTitle>

                      {nombresMeds.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {mostrados.map((nombre, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                <Tag className="h-3 w-3" /> {nombre}
                              </span>
                            ))}
                          </div>
                          {nombresMeds.length > 3 && (
                            <Button variant="ghost" size="sm" onClick={() => toggleEtiquetasExpandidas(plantilla.id)} className="h-7 text-xs gap-1 -ml-2">
                              {expandido ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Ver {nombresMeds.length - 3} más</>}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" onClick={() => { setPlantillaVisualizando(plantilla); setDialogoVista(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => abrirEdicion(plantilla)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => manejarEliminar(plantilla.id)}>
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
      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nueva Plantilla</DialogTitle>
            <DialogDescription>Crea una plantilla de receta.</DialogDescription>
          </DialogHeader>
          {renderDialogContent('Crear', () => guardarPlantilla(false))}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoCrear(false)}>Cancelar</Button>
            <Button onClick={() => guardarPlantilla(false)} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogoEditar} onOpenChange={setDialogoEditar}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>Modifica la plantilla existente.</DialogDescription>
          </DialogHeader>
          {renderDialogContent('Editar', () => guardarPlantilla(true))}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEditar(false)}>Cancelar</Button>
            <Button onClick={() => guardarPlantilla(true)} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogoVista} onOpenChange={setDialogoVista}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Vista Previa
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <RenderizadorHtml
              contenido={contenidoVista}
              modoDocumento
              escala={0.8}
              altura="calc(90vh - 180px)"
              ajustarAncho
              tamanoPersonalizado={plantillaVisualizando ? obtenerTamanoPlantilla(plantillaVisualizando.tamano_hoja_id, plantillaVisualizando.ancho_mm, plantillaVisualizando.alto_mm) : undefined}
              margenes={plantillaVisualizando ? {
                top: plantillaVisualizando.margen_superior,
                bottom: plantillaVisualizando.margen_inferior,
                left: plantillaVisualizando.margen_izquierdo,
                right: plantillaVisualizando.margen_derecho,
              } : undefined}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogoVista(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogoNuevoMedicamento} onOpenChange={setDialogoNuevoMedicamento}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Medicamento</DialogTitle>
            <DialogDescription>Se añadirá al catálogo global.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Nombre del medicamento</Label>
            <Input value={nuevoMedicamentoNombre} onChange={(e) => setNuevoMedicamentoNombre(e.target.value)} placeholder="Ej. Ibuprofeno 400mg" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoNuevoMedicamento(false)}>Cancelar</Button>
            <Button onClick={crearNuevoMedicamento} disabled={guardandoMedicamento}>
              {guardandoMedicamento && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}