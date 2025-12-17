import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { EditorDocumento, DocumentoConfig } from '@/componentes/ui/editor-documento';
import { plantillasRecetasApi, archivosApi, catalogoApi } from '@/lib/api';
import { PlantillaReceta, ItemCatalogo } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Pill, Settings, ArrowLeft, Search, Eye, EyeOff } from 'lucide-react';
import { generarPdfDesdeHtml, ConfiguracionPdf, TAMANOS_PAPEL} from '@/lib/pdf-utils';

interface EditorRecetasProps {
  paciente_id: number;
  paciente_nombre: string;
  paciente_apellidos: string;
  onRecetaGenerada?: () => void;
}

interface ValorMedicamento {
  codigo: string;
  nombre: string;
  indicaciones: string;
}

const aplicarLimiteMargenes = (cfg: DocumentoConfig): DocumentoConfig => {
  const widthMm = Math.max(0, cfg.widthMm || 0);
  const heightMm = Math.max(0, cfg.heightMm || 0);
  const limiteVerticalMm = Math.max(0, Math.floor(heightMm * 0.25));
  const limiteHorizontalMm = Math.max(0, Math.floor(widthMm * 0.30));
  const toNonNegative = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0);
  const clampPair = (primero: number, segundo: number, limite: number): [number, number] => {
    const limpioPrimero = toNonNegative(primero);
    const limpioSegundo = toNonNegative(segundo);
    const cappedPrimero = Math.min(limpioPrimero, Math.max(0, limite - limpioSegundo));
    const cappedSegundo = Math.min(limpioSegundo, Math.max(0, limite - cappedPrimero));
    return [cappedPrimero, cappedSegundo];
  };
  const [top, bottom] = clampPair(cfg.margenes.top, cfg.margenes.bottom, limiteVerticalMm);
  const [left, right] = clampPair(cfg.margenes.left, cfg.margenes.right, limiteHorizontalMm);
  return {
    ...cfg,
    widthMm,
    heightMm,
    margenes: { top, bottom, left, right },
  };
};

export function EditorRecetas({ paciente_id, paciente_nombre, paciente_apellidos, onRecetaGenerada }: EditorRecetasProps) {
  const { toast } = useToast();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [fase, setFase] = useState<'seleccion' | 'creacion' | 'edicion'>('seleccion');
  const [plantillas, setPlantillas] = useState<PlantillaReceta[]>([]);
  const [plantillasFiltradas, setPlantillasFiltradas] = useState<PlantillaReceta[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaReceta | null>(null);
  const [valoresMedicamentos, setValoresMedicamentos] = useState<ValorMedicamento[]>([]);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [contenidoEditado, setContenidoEditado] = useState('');
  const [configuracionDocumento, setConfiguracionDocumento] = useState<DocumentoConfig>(() => aplicarLimiteMargenes({
    widthMm: 216,
    heightMm: 279,
    margenes: { top: 20, right: 20, bottom: 20, left: 20 },
    nombre_tamano: 'Carta'
  }));
  const actualizarConfiguracionDocumento = (cfg: DocumentoConfig) => setConfiguracionDocumento(aplicarLimiteMargenes(cfg));
  const [cargando, setCargando] = useState(false);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  useEffect(() => {
    if (dialogoAbierto) {
      setFase('seleccion');
      setPlantillaSeleccionada(null);
      setValoresMedicamentos([]);
      setFiltro('');
      setVistaPrevia(false);
      cargarPlantillas();
      cargarMedicamentos();
    }
  }, [dialogoAbierto]);

  useEffect(() => {
    const termino = filtro.trim().toLowerCase();
    if (!termino) {
      setPlantillasFiltradas(plantillas);
      return;
    }
    setPlantillasFiltradas(
      plantillas.filter((p) => p.nombre.toLowerCase().includes(termino))
    );
  }, [filtro, plantillas]);
  const cargarPlantillas = async () => {
    setCargandoPlantillas(true);
    try {
      const datos = await plantillasRecetasApi.obtenerTodas();
      setPlantillas(datos);
      setPlantillasFiltradas(datos);
    } catch (error) {
      console.error('Error al cargar plantillas de recetas:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas', variant: 'destructive' });
    } finally {
      setCargandoPlantillas(false);
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
  const procesarContenido = useCallback((): string => {
    if (!plantillaSeleccionada) return '';
    const html = plantillaSeleccionada.contenido;
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]{}\\]/g, '\\$&');
    let contenido = html;

    valoresMedicamentos.forEach(({ codigo, nombre, indicaciones }) => {
      const texto = indicaciones.trim() ? `${nombre}: ${indicaciones}` : nombre;
      const escapedCodigo = escapeRegExp(codigo);
      const tagRegex = new RegExp(`<span[^>]*data-etiqueta="${escapedCodigo}"[^>]*>([\\s\\S]*?)<\\/span>`, 'g');
      contenido = contenido.replace(tagRegex, () => `<span>${texto}</span>`);
      const simpleRegex = new RegExp(escapedCodigo, 'g');
      contenido = contenido.replace(simpleRegex, texto);
    });
    contenido = contenido.replace(/data-etiqueta="[^"]*"/g, '');
    return contenido;
  }, [plantillaSeleccionada, valoresMedicamentos]);

  const contenidoProcesado = useMemo(() => procesarContenido(), [procesarContenido]);

  const extraerEtiquetasDelContenido = (contenido: string): string[] => {
    const regex = /data-etiqueta="([^\"]+)"/g;
    const etiquetas: string[] = [];
    let match;
    while ((match = regex.exec(contenido)) !== null) {
      if (!etiquetas.includes(match[1])) etiquetas.push(match[1]);
    }
    return etiquetas;
  };

  const prepararMedicamentos = (contenido: string) => {
    const etiquetas = extraerEtiquetasDelContenido(contenido);
    const nuevos = etiquetas.map((codigo) => {
      const med = medicamentos.find((m) => `MED_${m.id}` === codigo);
      return { codigo, nombre: med?.nombre || codigo, indicaciones: '' } as ValorMedicamento;
    });
    setValoresMedicamentos(nuevos);
  };
  const seleccionarPlantilla = (plantilla: PlantillaReceta) => {
    setPlantillaSeleccionada(plantilla);
    prepararMedicamentos(plantilla.contenido);
    setFase('creacion');
  };

  const generarNombreArchivo = () => {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-BO').replace(/\//g, '-');
    const hora = ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
    return 'Receta-' + fecha + '_' + hora + '.pdf';
  };

  const generarPdf = async (contenidoHtml: string, config?: DocumentoConfig) => {
    if (!plantillaSeleccionada) return;
    setCargando(true);
    try {
      const cfgAjustado = aplicarLimiteMargenes(config || {
        widthMm: 216,
        heightMm: 279,
        margenes: { top: 20, right: 20, bottom: 20, left: 20 },
      });
      const configPdf: ConfiguracionPdf = {
        widthMm: cfgAjustado.widthMm || TAMANOS_PAPEL.carta.widthMm,
        heightMm: cfgAjustado.heightMm || TAMANOS_PAPEL.carta.heightMm,
        margenes: cfgAjustado.margenes,
      };

      const base64 = await generarPdfDesdeHtml(contenidoHtml, configPdf);
      const nombre_archivo = generarNombreArchivo();

      await archivosApi.subir({
        nombre_archivo,
        tipo_mime: 'application/pdf',
        descripcion: 'Receta generada para ' + paciente_nombre + ' ' + paciente_apellidos,
        contenido_base64: base64,
        paciente_id,
      });

      toast({ title: 'Receta guardada', description: 'Se generó y almacenó el PDF en archivos del paciente.' });
      setDialogoAbierto(false);
      if (onRecetaGenerada) onRecetaGenerada();
    } catch (error) {
      console.error('Error al generar receta:', error);
      toast({ title: 'Error', description: 'No se pudo generar la receta', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  };

  const irAEdicion = () => {
    setContenidoEditado(contenidoProcesado);
    setFase('edicion');
  };

  return (
    <>
      <Button
        onClick={() => setDialogoAbierto(true)}
        variant="outline"
        size="sm"
        className="hover:scale-105 transition-all duration-200"
      >
        <Pill className="h-4 w-4 mr-2" />
        Recetar
      </Button>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent
          className={`max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ${fase === 'edicion' || (fase === 'creacion' && vistaPrevia) ? 'h-[90vh]' : ''
            }`}
        >
          <DialogHeader>
            <DialogTitle>
              {fase === 'seleccion' && 'Seleccionar Plantilla de Receta'}
              {fase === 'creacion' && 'Generar Receta'}
              {fase === 'edicion' && 'Editar y Generar Receta'}
            </DialogTitle>
            <DialogDescription>
              {fase === 'seleccion' && 'Elige una plantilla para comenzar.'}
              {fase === 'creacion' && `Para ${paciente_nombre} ${paciente_apellidos}`}
              {fase === 'edicion' && 'Personaliza el documento antes de generar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {fase === 'seleccion' && (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar plantilla por nombre..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-[calc(90vh-280px)] border rounded-md p-2">
                  {cargandoPlantillas ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando plantillas...
                    </div>
                  ) : plantillasFiltradas.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No se encontraron plantillas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {plantillasFiltradas.map((plantilla) => (
                        <Button
                          key={plantilla.id}
                          variant="outline"
                          className="h-auto p-3 flex flex-col items-start gap-1 hover:border-primary hover:bg-primary/5 w-full"
                          onClick={() => seleccionarPlantilla(plantilla)}
                        >
                          <span className="font-semibold text-base">{plantilla.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(plantilla.fecha_actualizacion || plantilla.fecha_creacion).toLocaleDateString('es-BO')}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {fase === 'creacion' && plantillaSeleccionada && (
              <div
                className={`flex flex-col overflow-hidden min-h-0 ${vistaPrevia ? 'max-h-[70vh]' : ''
                  }`}
              >
                <ScrollArea className="flex-1 pr-3 h-full min-h-0">
                  <div className="space-y-4 p-1">
                    <div className="flex items-center justify-between bg-secondary/20 p-3 rounded-lg border">
                      <div>
                        <Label className="text-xs text-muted-foreground">Plantilla</Label>
                        <p className="font-semibold">{plantillaSeleccionada.nombre}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setFase('seleccion')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Cambiar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Pill className="h-4 w-4" /> Medicamentos de la receta
                      </Label>
                      {valoresMedicamentos.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                          No hay medicamentos en esta plantilla.
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {valoresMedicamentos.map((med) => (
                            <div key={med.codigo} className="space-y-1.5 p-3 rounded-md border bg-card shadow-sm">
                              <div className="font-medium text-sm">{med.nombre}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Vista Previa</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVistaPrevia(!vistaPrevia)}
                          className="h-8 gap-2"
                        >
                          {vistaPrevia ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {vistaPrevia ? 'Ocultar' : 'Mostrar'}
                        </Button>
                      </div>

                      {vistaPrevia && (
                        <div className="border rounded-lg p-4 bg-white shadow-sm min-h-[200px]">
                          <RenderizadorHtml contenido={contenidoProcesado} modoDocumento />
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="mt-4 border-t pt-4">
                  <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={irAEdicion}
                  >
                    <Settings className="h-4 w-4 mr-2" /> Editar y Generar
                  </Button>
                  <Button
                    onClick={() => generarPdf(contenidoProcesado)}
                    disabled={cargando}
                  >
                    {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Generar y Guardar
                  </Button>
                </DialogFooter>
              </div>
            )}

            {fase === 'edicion' && (
              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full min-h-0 -mr-6 pr-6">
                  <div className="flex flex-col gap-4 min-h-[500px] pb-4">
                    <div className="flex-1 border rounded-lg overflow-hidden">
                      <EditorDocumento
                        valorHtml={contenidoEditado}
                        onChangeHtml={setContenidoEditado}
                        config={configuracionDocumento}
                        onChangeConfig={actualizarConfiguracionDocumento}
                        className="h-full border-0 min-h-[600px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
                      <Button variant="outline" onClick={() => setFase('creacion')}>
                        Cancelar
                      </Button>
                      <Button onClick={() => generarPdf(contenidoEditado, configuracionDocumento)} disabled={cargando}>
                        {cargando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Generar PDF
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
