import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { SelectConAgregar } from '@/componentes/ui/select-with-add';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { EditorDocumento, DocumentoConfig } from '@/componentes/ui/editor-documento';
import { plantillasRecetasApi, archivosApi, catalogoApi } from '@/lib/api';
import { PlantillaReceta, ItemCatalogo } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Pill, Settings, Sparkles, X, ArrowLeft, Search, Eye, EyeOff } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  
  // Estados principales
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [fase, setFase] = useState<'seleccion' | 'creacion' | 'edicion'>('seleccion');
  
  // Datos
  const [plantillas, setPlantillas] = useState<PlantillaReceta[]>([]);
  const [plantillasFiltradas, setPlantillasFiltradas] = useState<PlantillaReceta[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  
  // Selección
  const [filtro, setFiltro] = useState('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaReceta | null>(null);
  
  // Creación
  const [valoresMedicamentos, setValoresMedicamentos] = useState<ValorMedicamento[]>([]);
  const [medicamentoParaAgregar, setMedicamentoParaAgregar] = useState<string>('');
  const [vistaPrevia, setVistaPrevia] = useState(false);
  
  // Edición
  const [contenidoEditado, setContenidoEditado] = useState('');
  const [configuracionDocumento, setConfiguracionDocumento] = useState<DocumentoConfig>(() => aplicarLimiteMargenes({
    widthMm: 216,
    heightMm: 279,
    margenes: { top: 20, right: 20, bottom: 20, left: 20 },
    nombre_tamano: 'Carta'
  }));
  const actualizarConfiguracionDocumento = (cfg: DocumentoConfig) => setConfiguracionDocumento(aplicarLimiteMargenes(cfg));

  // Estados de carga
  const [cargando, setCargando] = useState(false);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  // Efectos
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

  // Carga de datos
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

  // Lógica de procesamiento de contenido
  const procesarContenido = useCallback((): string => {
    if (!plantillaSeleccionada) return '';
    const html = plantillaSeleccionada.contenido;
    
    // Procesamiento simple con regex para reemplazar etiquetas
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]{}\\]/g, '\\$&');
    let contenido = html;
    
    valoresMedicamentos.forEach(({ codigo, nombre, indicaciones }) => {
      const texto = indicaciones.trim() ? `${nombre}: ${indicaciones}` : nombre;
      const escapedCodigo = escapeRegExp(codigo);
      
      // Reemplazar spans con data-etiqueta
      const tagRegex = new RegExp(`<span[^>]*data-etiqueta="${escapedCodigo}"[^>]*>([\\s\\S]*?)<\\/span>`, 'g');
      contenido = contenido.replace(tagRegex, () => `<span>${texto}</span>`);
      
      // Reemplazar texto plano del código
      const simpleRegex = new RegExp(escapedCodigo, 'g');
      contenido = contenido.replace(simpleRegex, texto);
    });
    
    // Limpiar etiquetas restantes no encontradas
    contenido = contenido.replace(/data-etiqueta="[^"]*"/g, '');
    return contenido;
  }, [plantillaSeleccionada, valoresMedicamentos]);

  const contenidoProcesado = useMemo(() => procesarContenido(), [procesarContenido]);

  // Helpers
  const opcionesMedicamentos = useMemo(
    () => medicamentos.map((m) => ({ value: `MED_${m.id}`, label: m.nombre })),
    [medicamentos]
  );

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

  // Acciones
  const seleccionarPlantilla = (plantilla: PlantillaReceta) => {
    setPlantillaSeleccionada(plantilla);
    prepararMedicamentos(plantilla.contenido);
    setFase('creacion');
  };

  const actualizarIndicacion = (codigo: string, valor: string) => {
    setValoresMedicamentos((prev) => prev.map((m) => (m.codigo === codigo ? { ...m, indicaciones: valor } : m)));
  };

  const agregarMedicamentoManual = () => {
    if (!medicamentoParaAgregar) return;
    const existe = valoresMedicamentos.some((m) => m.codigo === medicamentoParaAgregar);
    if (existe) return;
    const med = medicamentos.find((m) => `MED_${m.id}` === medicamentoParaAgregar);
    setValoresMedicamentos((prev) => ([...prev, { codigo: medicamentoParaAgregar, nombre: med?.nombre || medicamentoParaAgregar, indicaciones: '' }]));
    setMedicamentoParaAgregar('');
  };

  const crearMedicamento = async (nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    try {
      const creado = await catalogoApi.crearMedicamento({ nombre: limpio });
      await cargarMedicamentos();
      const codigo = `MED_${creado.id}`;
      setMedicamentoParaAgregar(codigo);
      toast({ title: 'Medicamento creado', description: `${limpio} añadido al catálogo.` });
    } catch (error) {
      console.error('Error creando medicamento:', error);
      toast({ title: 'Error', description: 'No se pudo crear el medicamento', variant: 'destructive' });
    }
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
      const contenedor = document.createElement('div');
      
      // Configuración de dimensiones y márgenes
      const cfgAjustado = aplicarLimiteMargenes(config || {
        widthMm: 216,
        heightMm: 279,
        margenes: { top: 20, right: 20, bottom: 20, left: 20 },
      });
      const widthMm = cfgAjustado.widthMm || 216; // Carta por defecto
      const heightMm = cfgAjustado.heightMm || 279;
      const margenes = cfgAjustado.margenes;
      
      // Convertir mm a px (aprox 3.78 px por mm)
      const mmToPx = 3.78;
      const widthPx = widthMm * mmToPx;
      
      contenedor.style.cssText = `
        position: fixed; 
        left: -9999px; 
        top: 0; 
        width: ${widthPx}px; 
        background: white; 
        padding: ${margenes.top}mm ${margenes.right}mm ${margenes.bottom}mm ${margenes.left}mm; 
        font-family: "Times New Roman", Times, serif;
        box-sizing: border-box;
        z-index: -1000;
      `;
      
      contenedor.innerHTML = contenidoHtml;
      document.body.appendChild(contenedor);

      // Esperar un momento para asegurar renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(contenedor, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: widthPx,
      });

      document.body.removeChild(contenedor);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ 
        orientation: widthMm > heightMm ? 'landscape' : 'portrait', 
        unit: 'mm', 
        format: [widthMm, heightMm] 
      });
      
      const imgWidth = widthMm;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let alturaRestante = imgHeight;
      let posicion = 0;
      
      // Primera página
      pdf.addImage(imgData, 'PNG', 0, posicion, imgWidth, imgHeight);
      alturaRestante -= heightMm;
      posicion -= heightMm;
      
      // Páginas adicionales si es necesario
      while (alturaRestante > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, posicion, imgWidth, imgHeight);
        alturaRestante -= heightMm;
        posicion -= heightMm;
      }

      const base64 = pdf.output('dataurlstring').split(',')[1];
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
          className={`max-w-5xl max-h-[90vh] overflow-hidden flex flex-col ${
            fase === 'edicion' || (fase === 'creacion' && vistaPrevia) ? 'h-[90vh]' : ''
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
                className={`flex flex-col overflow-hidden min-h-0 ${
                  vistaPrevia ? 'max-h-[70vh]' : ''
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
