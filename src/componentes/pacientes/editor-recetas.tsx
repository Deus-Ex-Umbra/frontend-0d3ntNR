import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { SelectConAgregar } from '@/componentes/ui/select-with-add';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { EditorConEtiquetasPersonalizado, EditorHandle } from '@/componentes/ui/editor-con-etiquetas-personalizado';
import { plantillasRecetasApi, archivosApi, catalogoApi } from '@/lib/api';
import { PlantillaReceta, ItemCatalogo } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Pill, Settings, Sparkles, X } from 'lucide-react';
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

export function EditorRecetas({ paciente_id, paciente_nombre, paciente_apellidos, onRecetaGenerada }: EditorRecetasProps) {
  const { toast } = useToast();
  const editorRef = useRef<EditorHandle | null>(null);
  const [contenidoPersonalizado, setContenidoPersonalizado] = useState('');

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [dialogoPersonalizar, setDialogoPersonalizar] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaReceta[]>([]);
  const [plantillasFiltradas, setPlantillasFiltradas] = useState<PlantillaReceta[]>([]);
  const [filtro, setFiltro] = useState('');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaReceta | null>(null);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [valoresMedicamentos, setValoresMedicamentos] = useState<ValorMedicamento[]>([]);
  const [medicamentoParaAgregar, setMedicamentoParaAgregar] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  useEffect(() => {
    if (dialogoAbierto) {
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

  const seleccionarPlantilla = (plantilla: PlantillaReceta) => {
    setPlantillaSeleccionada(plantilla);
    prepararMedicamentos(plantilla.contenido);
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

  const procesarContenido = (): string => {
    if (!plantillaSeleccionada) return '';
    let contenido = plantillaSeleccionada.contenido;

    valoresMedicamentos.forEach(({ codigo, nombre, indicaciones }) => {
      const texto = indicaciones.trim() ? `${nombre}: ${indicaciones}` : nombre;
      const escapedCodigo = codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('<span[^>]*data-etiqueta="' + escapedCodigo + '"[^>]*>([^<]*)<\\/span>', 'g');
      contenido = contenido.replace(regex, (match) => {
        const limpio = match
          .replace(/data-etiqueta="[^"]*"/g, '')
          .replace(/data-codigo="[^"]*"/g, '')
          .replace(/data-eliminada="[^"]*"/g, '')
          .replace(/class="[^"]*"/g, '')
          .replace(/style="[^"]*"/g, '');
        return limpio.replace(/>([^<]*)<\/span>/, '>' + texto + '</span>');
      });
      const simpleRegex = new RegExp(escapedCodigo, 'g');
      contenido = contenido.replace(simpleRegex, texto);
    });

    contenido = contenido.replace(/data-etiqueta="[^\"]*"/g, '');
    return contenido;
  };

  const generarNombreArchivo = () => {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-BO').replace(/\//g, '-');
    const hora = ahora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
    return 'Receta-' + fecha + '_' + hora + '.pdf';
  };

  const generarPdf = async (contenidoHtml: string) => {
    if (!plantillaSeleccionada) return;
    setCargando(true);
    try {
      const contenedor = document.createElement('div');
      contenedor.style.cssText = 'position:absolute; left:-9999px; top:0; width:800px; background:white; padding:32px; font-family: "Times New Roman", Times, serif;';
      contenedor.innerHTML = contenidoHtml;
      document.body.appendChild(contenedor);

      const canvas = await html2canvas(contenedor, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(contenedor);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let alturaRestante = imgHeight;
      let posicion = 0;
      while (alturaRestante > 0) {
        pdf.addImage(imgData, 'PNG', 0, posicion, imgWidth, imgHeight);
        alturaRestante -= 297;
        posicion -= 297;
        if (alturaRestante > 0) pdf.addPage();
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
      setDialogoPersonalizar(false);
      setPlantillaSeleccionada(null);
      setValoresMedicamentos([]);
      if (onRecetaGenerada) onRecetaGenerada();
    } catch (error) {
      console.error('Error al generar receta:', error);
      toast({ title: 'Error', description: 'No se pudo generar la receta', variant: 'destructive' });
    } finally {
      setCargando(false);
    }
  };

  const manejarGuardarPdf = () => {
    if (!plantillaSeleccionada) {
      toast({ title: 'Selecciona una plantilla', description: 'Elige una plantilla para continuar', variant: 'destructive' });
      return;
    }
    const vacios = valoresMedicamentos.filter((m) => !m.indicaciones.trim());
    if (vacios.length > 0) {
      toast({ title: 'Faltan indicaciones', description: 'Completa las indicaciones de todos los medicamentos.', variant: 'destructive' });
      return;
    }
    const contenido = procesarContenido();
    generarPdf(contenido);
  };

  const abrirPersonalizar = () => {
    if (!plantillaSeleccionada) return;
    const contenido = procesarContenido();
    setContenidoPersonalizado(contenido);
    setDialogoPersonalizar(true);
  };

  const guardarPersonalizado = () => {
    if (!plantillaSeleccionada) return;
    const contenidoFinal = contenidoPersonalizado;
    if (!contenidoFinal.trim()) {
      toast({ title: 'Contenido vacío', description: 'El contenido personalizado no puede estar vacío', variant: 'destructive' });
      return;
    }
    generarPdf(contenidoFinal);
  };

  return (
    <>
      <Button onClick={() => setDialogoAbierto(true)} variant="outline" className="gap-2">
        <Pill className="h-4 w-4" />
        Recetar
      </Button>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generar receta</DialogTitle>
            <DialogDescription>Para {paciente_nombre} {paciente_apellidos}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <ScrollArea className="pr-3">
              {!plantillaSeleccionada ? (
                <div className="space-y-3">
                  <Input placeholder="Buscar plantilla" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                  {cargandoPlantillas ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando plantillas...
                    </div>
                  ) : plantillasFiltradas.length === 0 ? (
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      No hay plantillas disponibles
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {plantillasFiltradas.map((plantilla) => (
                        <Button
                          key={plantilla.id}
                          variant="outline"
                          className="justify-start h-auto py-3"
                          onClick={() => seleccionarPlantilla(plantilla)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">{plantilla.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              Última edición: {new Date(plantilla.fecha_actualizacion || plantilla.fecha_creacion).toLocaleDateString('es-BO')}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Plantilla seleccionada</Label>
                      <p className="font-semibold">{plantillaSeleccionada.nombre}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setPlantillaSeleccionada(null); setValoresMedicamentos([]); }}>
                      Cambiar plantilla
                    </Button>
                  </div>

                  <div className="rounded-lg border p-3 space-y-2 bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Medicamentos</p>
                    </div>
                    {valoresMedicamentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Esta plantilla no tiene etiquetas de medicamentos.</p>
                    ) : (
                      <div className="space-y-3">
                        {valoresMedicamentos.map((med) => (
                          <div key={med.codigo} className="space-y-1">
                            <Label>{med.nombre}</Label>
                            <Input
                              value={med.indicaciones}
                              onChange={(e) => actualizarIndicacion(med.codigo, e.target.value)}
                              placeholder="Dosis, frecuencia, notas"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2 pt-2 border-t">
                      <Label>Agregar medicamento</Label>
                      <div className="flex flex-col gap-2">
                        <SelectConAgregar
                          opciones={opcionesMedicamentos.map((m) => ({ valor: m.value, etiqueta: m.label }))}
                          valor={medicamentoParaAgregar}
                          onChange={setMedicamentoParaAgregar}
                          onAgregarNuevo={crearMedicamento}
                          placeholder="Seleccionar"
                          textoAgregar="Agregar medicamento"
                        />
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={agregarMedicamentoManual} disabled={!medicamentoParaAgregar}>
                            Añadir a la receta
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setMedicamentoParaAgregar('')} aria-label="Limpiar">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vista previa</Label>
                    <div className="border rounded-lg p-3 bg-background">
                      <RenderizadorHtml contenido={procesarContenido()} modoDocumento />
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="space-y-4">
              <div className="rounded-lg border bg-secondary/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Acciones</p>
                </div>
                <Button onClick={manejarGuardarPdf} disabled={cargando || !plantillaSeleccionada} className="w-full">
                  {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar PDF
                </Button>
                <Button onClick={abrirPersonalizar} variant="outline" disabled={!plantillaSeleccionada} className="w-full gap-2">
                  <Settings className="h-4 w-4" /> Personalizar antes de guardar
                </Button>
              </div>
              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                Completa las indicaciones para cada medicamento y luego genera el PDF. El archivo se guarda automáticamente en Archivos del paciente con un nombre basado en la fecha y hora local.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoPersonalizar} onOpenChange={setDialogoPersonalizar}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Personalizar receta</DialogTitle>
            <DialogDescription>Edita libremente antes de generar el PDF.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg">
            <EditorConEtiquetasPersonalizado
              ref={editorRef}
              contenido={contenidoPersonalizado}
              onChange={(html) => setContenidoPersonalizado(html)}
              habilitarEtiquetas={false}
              soloLectura={false}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogoPersonalizar(false)}>Cancelar</Button>
            <Button onClick={guardarPersonalizado} disabled={cargando}>
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
