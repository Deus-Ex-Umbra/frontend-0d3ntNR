import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/componentes/ui/command';
import { SelectConAgregar, OpcionSelectConAgregar } from '@/componentes/ui/select-with-add';
import { EditorConEtiquetasPersonalizado, EditorHandle } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { plantillasRecetasApi, catalogoApi } from '@/lib/api';
import { PlantillaReceta, ItemCatalogo } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Eye, Plus, Loader2, Pill, ChevronsUpDown } from 'lucide-react';

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
  const [cargando, setCargando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contenido, setContenido] = useState('');
  const [tamanoPapel, setTamanoPapel] = useState<'carta' | 'legal' | 'a4'>('carta');
  const [tamanoHojaId, setTamanoHojaId] = useState<number | null>(null);
  const [tamanosHoja, setTamanosHoja] = useState<Array<{ id:number; nombre:string; ancho:number; alto:number; descripcion?:string; protegido:boolean }>>([]);
  const [margenes, setMargenes] = useState<Margenes>({ ...DEFAULT_MARGENES });
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMedicamentos, setFiltroMedicamentos] = useState<string[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarData();
  }, []);

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
      console.error('Error al cargar plantillas de recetas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas de recetas',
        variant: 'destructive',
      });
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

  const opcionesMedicamentos = useMemo(() => medicamentos.map((m) => ({
    valor: `MED_${m.id}`,
    etiqueta: m.nombre,
  })), [medicamentos]);

  const opcionesTamanos: OpcionSelectConAgregar[] = useMemo(() => tamanosHoja.map((t) => {
    const etiquetaMedidas = `${Math.round(t.ancho)} × ${Math.round(t.alto)} mm`;
    return ({ valor: String(t.id), etiqueta: `${t.nombre} (${t.descripcion || etiquetaMedidas})` });
  }), [tamanosHoja]);

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

  const extraerEtiquetasDelContenido = (contenidoHtml: string): string[] => {
    const regex = /data-etiqueta="([^\"]+)"/g;
    const encontrados: string[] = [];
    let match;
    while ((match = regex.exec(contenidoHtml)) !== null) {
      if (!encontrados.includes(match[1])) {
        encontrados.push(match[1]);
      }
    }
    return encontrados;
  };

  const abrirCrear = () => {
    setNombre('');
    setContenido('');
    setTamanoPapel('carta');
    setTamanoHojaId(null);
    setMargenes({ ...DEFAULT_MARGENES });
    setMedicamentoSeleccionado('');
    setDialogoCrear(true);
  };

  const prepararEdicion = (plantilla: PlantillaReceta) => {
    setPlantillaSeleccionada(plantilla);
    setNombre(plantilla.nombre);
    setContenido(plantilla.contenido);
    setTamanoPapel((plantilla as any).tamano_papel || 'carta');
    setTamanoHojaId((plantilla as any).tamano_hoja_id ?? null);
    setMargenes({
      top: plantilla.margen_superior || 20,
      bottom: plantilla.margen_inferior || 20,
      left: plantilla.margen_izquierdo || 20,
      right: plantilla.margen_derecho || 20,
    });
    setMedicamentoSeleccionado('');
    setDialogoEditar(true);
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta plantilla de receta?')) return;
    try {
      await plantillasRecetasApi.eliminar(id);
      toast({ title: 'Eliminada', description: 'La plantilla se eliminó correctamente' });
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la plantilla', variant: 'destructive' });
    }
  };

  const construirPayload = () => ({
    nombre: nombre.trim(),
    contenido,
    tamano_papel: tamanoPapel,
    tamano_hoja_id: tamanoHojaId ?? null,
    ancho_mm: tamanoHojaId ? Math.round(tamanosHoja.find(t => t.id === tamanoHojaId)?.ancho ?? 216) : undefined,
    alto_mm: tamanoHojaId ? Math.round(tamanosHoja.find(t => t.id === tamanoHojaId)?.alto ?? 279) : undefined,
    margen_superior: margenes.top,
    margen_inferior: margenes.bottom,
    margen_izquierdo: margenes.left,
    margen_derecho: margenes.right,
  });

  const crearPlantilla = async () => {
    if (!nombre.trim() || !contenido.trim()) {
      toast({ title: 'Faltan datos', description: 'Nombre y contenido son obligatorios', variant: 'destructive' });
      return;
    }
    setGuardando(true);
    try {
      await plantillasRecetasApi.crear(construirPayload());
      toast({ title: 'Plantilla creada', description: 'La receta se guardó correctamente' });
      setDialogoCrear(false);
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      toast({ title: 'Error', description: 'No se pudo crear la plantilla', variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const actualizarPlantilla = async () => {
    if (!plantillaSeleccionada) return;
    if (!nombre.trim() || !contenido.trim()) {
      toast({ title: 'Faltan datos', description: 'Nombre y contenido son obligatorios', variant: 'destructive' });
      return;
    }
    setGuardando(true);
    try {
      await plantillasRecetasApi.actualizar(plantillaSeleccionada.id, construirPayload());
      toast({ title: 'Plantilla actualizada', description: 'La receta se actualizó' });
      setDialogoEditar(false);
      setPlantillaSeleccionada(null);
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la plantilla', variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  const insertarMedicamento = (codigo: string) => {
    editorRef.current?.chain()?.focus()?.insertarEtiqueta(codigo)?.run();
  };

  const crearMedicamento = async (nombreMedicamento: string) => {
    const nombreLimpio = nombreMedicamento.trim();
    if (!nombreLimpio) return;
    try {
      const creado = await catalogoApi.crearMedicamento({ nombre: nombreLimpio });
      await cargarMedicamentos();
      setMedicamentoSeleccionado(`MED_${creado.id}`);
      toast({ title: 'Medicamento agregado', description: `${nombreLimpio} está disponible para usar en la plantilla.` });
    } catch (error) {
      console.error('Error al crear medicamento:', error);
      toast({ title: 'Error', description: 'No se pudo crear el medicamento', variant: 'destructive' });
    }
  };

  const tamanoSeleccionado = tamanoHojaId ? tamanosHoja.find(t => t.id === tamanoHojaId) : null;
  const pageDims = tamanoSeleccionado
    ? { widthMm: Math.round(tamanoSeleccionado.ancho), heightMm: Math.round(tamanoSeleccionado.alto) }
    : tamanoPapel === 'legal'
      ? { widthMm: 216, heightMm: 356 }
      : tamanoPapel === 'a4'
        ? { widthMm: 210, heightMm: 297 }
        : { widthMm: 216, heightMm: 279 };

  const margenesVista = plantillaVisualizando
    ? {
        top: (plantillaVisualizando as any).margen_superior ?? 20,
        right: (plantillaVisualizando as any).margen_derecho ?? 20,
        bottom: (plantillaVisualizando as any).margen_inferior ?? 20,
        left: (plantillaVisualizando as any).margen_izquierdo ?? 20,
      }
    : margenes;

  const tamanoVista = plantillaVisualizando
    ? (plantillaVisualizando.tamano_hoja_id
      ? {
          widthMm: Math.round((plantillaVisualizando as any).ancho_mm || 216),
          heightMm: Math.round((plantillaVisualizando as any).alto_mm || 279),
        }
      : {
          widthMm: (plantillaVisualizando as any).tamano_papel === 'legal' ? 216 : (plantillaVisualizando as any).tamano_papel === 'a4' ? 210 : 216,
          heightMm: (plantillaVisualizando as any).tamano_papel === 'legal' ? 356 : (plantillaVisualizando as any).tamano_papel === 'a4' ? 297 : 279,
        })
    : pageDims;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Plantillas de Recetas</h3>
            <p className="text-sm text-muted-foreground">Usa medicamentos como etiquetas rápidas.</p>
          </div>
        </div>
        <Button onClick={abrirCrear} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva plantilla
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input
            placeholder="Buscar por nombre..."
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
          <MultiSelect
            valores={filtroMedicamentos}
            onChange={setFiltroMedicamentos}
            opciones={opcionesMedicamentos}
            placeholder="Filtrar por medicamentos"
          />
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : plantillasFiltradas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay plantillas que coincidan
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plantillasFiltradas.map((plantilla) => (
              <Card key={plantilla.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span className="truncate" title={plantilla.nombre}>{plantilla.nombre}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setPlantillaVisualizando(plantilla); setDialogoVista(true); }} title="Ver" aria-label="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => prepararEdicion(plantilla)} title="Editar" aria-label="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => manejarEliminar(plantilla.id)} title="Eliminar" aria-label="Eliminar" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                  <p>Última edición: {new Date(plantilla.fecha_actualizacion || plantilla.fecha_creacion).toLocaleDateString('es-BO')}</p>
                  <p>Etiquetas: {extraerEtiquetasDelContenido(plantilla.contenido).length}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Crear */}
      <Dialog open={dialogoCrear} onOpenChange={setDialogoCrear}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nueva plantilla de receta</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Analgésicos básicos" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tamaño de papel</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2 capitalize">{tamanoPapel}</span>
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar tamaño" />
                        <CommandList>
                          <CommandEmpty>Sin resultados</CommandEmpty>
                          <CommandGroup>
                            {['carta', 'legal', 'a4'].map((opc) => (
                              <CommandItem key={opc} value={opc} onSelect={() => setTamanoPapel(opc as any)}>
                                {opc.toUpperCase()}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Tamaño personalizado</Label>
                  <SelectConAgregar
                    opciones={opcionesTamanos}
                    valor={tamanoHojaId ? String(tamanoHojaId) : ''}
                    onChange={(valor) => setTamanoHojaId(valor ? Number(valor) : null)}
                    tamanoConfig={{ onCrear: async (datos) => {
                      await (catalogoApi as any).crearTamanoHoja?.(datos);
                      await cargarTamanosHoja();
                    }, ocultarDescripcion: false }}
                    placeholder="Selecciona o crea"
                    textoAgregar="Crear tamaño"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Margen superior (mm)</Label>
                  <Input type="number" value={margenes.top} onChange={(e) => setMargenes({ ...margenes, top: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen inferior (mm)</Label>
                  <Input type="number" value={margenes.bottom} onChange={(e) => setMargenes({ ...margenes, bottom: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen izquierdo (mm)</Label>
                  <Input type="number" value={margenes.left} onChange={(e) => setMargenes({ ...margenes, left: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen derecho (mm)</Label>
                  <Input type="number" value={margenes.right} onChange={(e) => setMargenes({ ...margenes, right: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Medicamentos (etiquetas)</Label>
                <SelectConAgregar
                  opciones={opcionesMedicamentos}
                  valor={medicamentoSeleccionado}
                  onChange={(v) => setMedicamentoSeleccionado(v)}
                  onAgregarNuevo={crearMedicamento}
                  placeholder="Elegir o crear medicamento"
                  textoAgregar="Agregar medicamento"
                  estiloAgregar="destacado"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!medicamentoSeleccionado}
                  onClick={() => {
                    if (medicamentoSeleccionado) insertarMedicamento(medicamentoSeleccionado);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Insertar en el contenido
                </Button>
                <div className="rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
                  Usa medicamentos como etiquetas en el texto. Luego se rellenan con indicaciones al generar la receta del paciente.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido</Label>
                <div className="border rounded-lg">
                  <EditorConEtiquetasPersonalizado
                    ref={editorRef}
                    contenido={contenido}
                    onChange={setContenido}
                    tamanoPapel={tamanoPapel}
                    margenes={{ top: margenes.top, right: margenes.right, bottom: margenes.bottom, left: margenes.left }}
                    tamanoPersonalizado={tamanoSeleccionado ? { widthMm: pageDims.widthMm, heightMm: pageDims.heightMm } : null}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogoCrear(false)}>Cancelar</Button>
            <Button onClick={crearPlantilla} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogoEditar} onOpenChange={setDialogoEditar}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar plantilla de receta</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tamaño de papel</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2 capitalize">{tamanoPapel}</span>
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar tamaño" />
                        <CommandList>
                          <CommandEmpty>Sin resultados</CommandEmpty>
                          <CommandGroup>
                            {['carta', 'legal', 'a4'].map((opc) => (
                              <CommandItem key={opc} value={opc} onSelect={() => setTamanoPapel(opc as any)}>
                                {opc.toUpperCase()}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Tamaño personalizado</Label>
                  <SelectConAgregar
                    opciones={opcionesTamanos}
                    valor={tamanoHojaId ? String(tamanoHojaId) : ''}
                    onChange={(valor) => setTamanoHojaId(valor ? Number(valor) : null)}
                    tamanoConfig={{ onCrear: async (datos) => {
                      await (catalogoApi as any).crearTamanoHoja?.(datos);
                      await cargarTamanosHoja();
                    }, ocultarDescripcion: false }}
                    placeholder="Selecciona o crea"
                    textoAgregar="Crear tamaño"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Margen superior (mm)</Label>
                  <Input type="number" value={margenes.top} onChange={(e) => setMargenes({ ...margenes, top: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen inferior (mm)</Label>
                  <Input type="number" value={margenes.bottom} onChange={(e) => setMargenes({ ...margenes, bottom: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen izquierdo (mm)</Label>
                  <Input type="number" value={margenes.left} onChange={(e) => setMargenes({ ...margenes, left: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Margen derecho (mm)</Label>
                  <Input type="number" value={margenes.right} onChange={(e) => setMargenes({ ...margenes, right: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Medicamentos (etiquetas)</Label>
                <SelectConAgregar
                  opciones={opcionesMedicamentos}
                  valor={medicamentoSeleccionado}
                  onChange={(v) => setMedicamentoSeleccionado(v)}
                  onAgregarNuevo={crearMedicamento}
                  placeholder="Elegir o crear medicamento"
                  textoAgregar="Agregar medicamento"
                  estiloAgregar="destacado"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!medicamentoSeleccionado}
                  onClick={() => {
                    if (medicamentoSeleccionado) insertarMedicamento(medicamentoSeleccionado);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Insertar en el contenido
                </Button>
                <div className="rounded-lg border bg-secondary/30 p-3 text-xs text-muted-foreground">
                  Usa medicamentos como etiquetas en el texto. Luego se rellenan con indicaciones al generar la receta del paciente.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido</Label>
                <div className="border rounded-lg">
                  <EditorConEtiquetasPersonalizado
                    ref={editorRef}
                    contenido={contenido}
                    onChange={setContenido}
                    tamanoPapel={tamanoPapel}
                    margenes={{ top: margenes.top, right: margenes.right, bottom: margenes.bottom, left: margenes.left }}
                    tamanoPersonalizado={tamanoSeleccionado ? { widthMm: pageDims.widthMm, heightMm: pageDims.heightMm } : null}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogoEditar(false)}>Cancelar</Button>
            <Button onClick={actualizarPlantilla} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Vista */}
      <Dialog open={dialogoVista} onOpenChange={setDialogoVista}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <RenderizadorHtml
              contenido={plantillaVisualizando?.contenido || ''}
              modoDocumento
              tamanoPersonalizado={tamanoVista}
              margenes={{ top: margenesVista.top, right: margenesVista.right, bottom: margenesVista.bottom, left: margenesVista.left }}
            />
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setDialogoVista(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
