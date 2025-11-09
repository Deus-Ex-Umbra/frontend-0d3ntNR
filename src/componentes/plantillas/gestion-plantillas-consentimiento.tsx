import { useState, useEffect } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { plantillasConsentimientoApi, pacientesApi } from '@/lib/api';
import { PlantillaConsentimiento, ETIQUETAS_PREDEFINIDAS, Paciente } from '@/tipos';
import { FileText, Edit, Trash2, Plus, Download, Eye, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditorHtmlRico } from '@/componentes/ui/editor-html-rico';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Badge } from '@/componentes/ui/badge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ConsentimientoGenerado {
  id: string;
  plantilla_id: number;
  plantilla_nombre: string;
  paciente_nombre: string;
  contenido_html: string;
  pdf_url: string;
  fecha_creacion: Date;
}

export function GestionPlantillasConsentimiento() {
  const [plantillas, setPlantillas] = useState<PlantillaConsentimiento[]>([]);
  const [plantilla_seleccionada, setPlantillaSeleccionada] = useState<PlantillaConsentimiento | null>(null);
  const [cargando, setCargando] = useState(false);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_edicion, setDialogoEdicion] = useState(false);
  const [dialogo_generar, setDialogoGenerar] = useState(false);
  const [nombre_plantilla, setNombrePlantilla] = useState('');
  const [contenido_plantilla, setContenidoPlantilla] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [paciente_seleccionado, setPacienteSeleccionado] = useState<number | null>(null);
  const [consentimientos_generados, setConsentimientosGenerados] = useState<ConsentimientoGenerado[]>([]);
  const [pdf_visible, setPdfVisible] = useState<string | null>(null);
  const [generando_pdf, setGenerandoPdf] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    cargarPlantillas();
    cargarPacientes();
  }, []);

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
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarPacientes = async () => {
    try {
      const datos = await pacientesApi.obtenerTodos();
      setPacientes(datos);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const crearPlantilla = async () => {
    if (!nombre_plantilla.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la plantilla es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (!contenido_plantilla.trim()) {
      toast({
        title: 'Error',
        description: 'El contenido de la plantilla es requerido',
        variant: 'destructive',
      });
      return;
    }

    setCargando(true);
    try {
      await plantillasConsentimientoApi.crear({
        nombre: nombre_plantilla,
        contenido: contenido_plantilla,
      });

      toast({
        title: 'Plantilla creada',
        description: 'La plantilla se ha creado correctamente',
      });

      setDialogoAbierto(false);
      setNombrePlantilla('');
      setContenidoPlantilla('');
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la plantilla',
        variant: 'destructive',
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
      });
      return;
    }

    setCargando(true);
    try {
      await plantillasConsentimientoApi.actualizar(plantilla_seleccionada.id, {
        nombre: nombre_plantilla,
        contenido: contenido_plantilla,
      });

      toast({
        title: 'Plantilla actualizada',
        description: 'La plantilla se ha actualizado correctamente',
      });

      setDialogoEdicion(false);
      setPlantillaSeleccionada(null);
      setNombrePlantilla('');
      setContenidoPlantilla('');
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al actualizar plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la plantilla',
        variant: 'destructive',
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
      });
      await cargarPlantillas();
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la plantilla',
        variant: 'destructive',
      });
    }
  };

  const abrirEdicion = (plantilla: PlantillaConsentimiento) => {
    setPlantillaSeleccionada(plantilla);
    setNombrePlantilla(plantilla.nombre);
    setContenidoPlantilla(plantilla.contenido);
    setDialogoEdicion(true);
  };

  const abrirGenerarConsentimiento = (plantilla: PlantillaConsentimiento) => {
    setPlantillaSeleccionada(plantilla);
    setDialogoGenerar(true);
  };

  const procesarContenidoConPaciente = (contenido: string, paciente: Paciente): string => {
    let procesado = contenido;
    procesado = procesado.replace(/\[PACIENTE_NOMBRE\]/g, paciente.nombre);
    procesado = procesado.replace(/\[PACIENTE_APELLIDOS\]/g, paciente.apellidos);
    procesado = procesado.replace(/\[PACIENTE_TELEFONO\]/g, paciente.telefono || '');
    procesado = procesado.replace(/\[PACIENTE_CORREO\]/g, paciente.correo || '');
    procesado = procesado.replace(/\[PACIENTE_DIRECCION\]/g, paciente.direccion || '');
    procesado = procesado.replace(/\[FECHA_ACTUAL\]/g, new Date().toLocaleDateString('es-BO'));
    return procesado;
  };

  const generarConsentimientoPDF = async () => {
    if (!plantilla_seleccionada || !paciente_seleccionado) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un paciente',
        variant: 'destructive',
      });
      return;
    }

    setGenerandoPdf(true);
    try {
      const paciente = pacientes.find(p => p.id === paciente_seleccionado);
      if (!paciente) return;

      const contenido_procesado = procesarContenidoConPaciente(
        plantilla_seleccionada.contenido,
        paciente
      );

      // Crear elemento temporal para renderizar
      const elemento_temporal = document.createElement('div');
      elemento_temporal.style.cssText = 'position: absolute; left: -9999px; width: 800px; background: white; padding: 40px;';
      elemento_temporal.innerHTML = contenido_procesado;
      document.body.appendChild(elemento_temporal);

      // Generar PDF
      const canvas = await html2canvas(elemento_temporal, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(elemento_temporal);

      const img_data = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const img_width = 210;
      const img_height = (canvas.height * img_width) / canvas.width;
      let altura_restante = img_height;
      let posicion = 0;

      while (altura_restante > 0) {
        pdf.addImage(img_data, 'PNG', 0, posicion, img_width, img_height);
        altura_restante -= 297;
        posicion -= 297;
        if (altura_restante > 0) {
          pdf.addPage();
        }
      }

      const pdf_blob = pdf.output('blob');
      const pdf_url = URL.createObjectURL(pdf_blob);

      const nuevo_consentimiento: ConsentimientoGenerado = {
        id: Date.now().toString(),
        plantilla_id: plantilla_seleccionada.id,
        plantilla_nombre: plantilla_seleccionada.nombre,
        paciente_nombre: `${paciente.nombre} ${paciente.apellidos}`,
        contenido_html: contenido_procesado,
        pdf_url,
        fecha_creacion: new Date(),
      };

      setConsentimientosGenerados(prev => [nuevo_consentimiento, ...prev]);

      toast({
        title: 'Consentimiento generado',
        description: 'El consentimiento informado se ha generado correctamente',
      });

      setDialogoGenerar(false);
      setPacienteSeleccionado(null);
      setPlantillaSeleccionada(null);
    } catch (error) {
      console.error('Error al generar consentimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el consentimiento',
        variant: 'destructive',
      });
    } finally {
      setGenerandoPdf(false);
    }
  };

  const descargarConsentimiento = (consentimiento: ConsentimientoGenerado) => {
    const link = document.createElement('a');
    link.href = consentimiento.pdf_url;
    link.download = `consentimiento-${consentimiento.plantilla_nombre}-${consentimiento.paciente_nombre}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const eliminarConsentimiento = (id: string) => {
    setConsentimientosGenerados(prev => {
      const consentimiento = prev.find(c => c.id === id);
      if (consentimiento) {
        URL.revokeObjectURL(consentimiento.pdf_url);
      }
      return prev.filter(c => c.id !== id);
    });
    if (pdf_visible === id) {
      setPdfVisible(null);
    }
  };

  const verConsentimiento = (id: string) => {
    setPdfVisible(id === pdf_visible ? null : id);
  };

  const insertarEtiqueta = (etiqueta: string) => {
    setContenidoPlantilla(prev => prev + etiqueta);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plantillas de Consentimiento Informado</h2>
          <p className="text-muted-foreground">
            Crea y gestiona plantillas para consentimientos informados
          </p>
        </div>
        <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Plantilla</DialogTitle>
              <DialogDescription>
                Crea una plantilla de consentimiento informado con etiquetas reemplazables
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
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

                <div className="space-y-2">
                  <Label>Etiquetas disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {ETIQUETAS_PREDEFINIDAS.map((etiqueta) => (
                      <Badge
                        key={etiqueta.etiqueta}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => insertarEtiqueta(etiqueta.etiqueta)}
                      >
                        {etiqueta.etiqueta}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Haz clic en una etiqueta para insertarla en el contenido
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Contenido de la plantilla</Label>
                  <EditorHtmlRico
                    contenido={contenido_plantilla}
                    onChange={setContenidoPlantilla}
                    placeholder="Escribe el contenido del consentimiento informado..."
                    minHeight="400px"
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={crearPlantilla} disabled={cargando}>
                {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Plantilla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={dialogo_edicion} onOpenChange={setDialogoEdicion}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica el contenido de la plantilla
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-editar">Nombre de la plantilla</Label>
                <Input
                  id="nombre-editar"
                  value={nombre_plantilla}
                  onChange={(e) => setNombrePlantilla(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Etiquetas disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {ETIQUETAS_PREDEFINIDAS.map((etiqueta) => (
                    <Badge
                      key={etiqueta.etiqueta}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertarEtiqueta(etiqueta.etiqueta)}
                    >
                      {etiqueta.etiqueta}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido de la plantilla</Label>
                <EditorHtmlRico
                  contenido={contenido_plantilla}
                  onChange={setContenidoPlantilla}
                  minHeight="400px"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEdicion(false)}>
              Cancelar
            </Button>
            <Button onClick={actualizarPlantilla} disabled={cargando}>
              {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para generar consentimiento */}
      <Dialog open={dialogo_generar} onOpenChange={setDialogoGenerar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar Consentimiento Informado</DialogTitle>
            <DialogDescription>
              Selecciona un paciente para generar el consentimiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seleccionar paciente</Label>
              <Select
                value={paciente_seleccionado?.toString()}
                onValueChange={(value) => setPacienteSeleccionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente) => (
                    <SelectItem key={paciente.id} value={paciente.id.toString()}>
                      {paciente.nombre} {paciente.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paciente_seleccionado && plantilla_seleccionada && (
              <div className="space-y-2">
                <Label>Vista previa</Label>
                <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-white">
                  <RenderizadorHtml
                    contenido={procesarContenidoConPaciente(
                      plantilla_seleccionada.contenido,
                      pacientes.find(p => p.id === paciente_seleccionado)!
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoGenerar(false)}>
              Cancelar
            </Button>
            <Button onClick={generarConsentimientoPDF} disabled={generando_pdf || !paciente_seleccionado}>
              {generando_pdf && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista de plantillas */}
        <Card>
          <CardHeader>
            <CardTitle>Plantillas</CardTitle>
            <CardDescription>
              Tus plantillas de consentimiento informado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay plantillas creadas</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {plantillas.map((plantilla) => (
                    <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base">{plantilla.nombre}</CardTitle>
                            <CardDescription className="text-xs">
                              Creada el {new Date(plantilla.fecha_creacion).toLocaleDateString('es-BO')}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirGenerarConsentimiento(plantilla)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEdicion(plantilla)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarPlantilla(plantilla.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Consentimientos generados */}
        <Card>
          <CardHeader>
            <CardTitle>Consentimientos Generados</CardTitle>
            <CardDescription>
              PDFs de consentimientos informados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consentimientos_generados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay consentimientos generados</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {consentimientos_generados.map((consentimiento) => (
                    <Card key={consentimiento.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base">{consentimiento.plantilla_nombre}</CardTitle>
                            <CardDescription className="text-xs">
                              {consentimiento.paciente_nombre} • {new Date(consentimiento.fecha_creacion).toLocaleDateString('es-BO')}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => verConsentimiento(consentimiento.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => descargarConsentimiento(consentimiento)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarConsentimiento(consentimiento.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {pdf_visible === consentimiento.id && (
                        <CardContent className="pt-0">
                          <iframe
                            src={consentimiento.pdf_url}
                            className="w-full h-[400px] border rounded-lg"
                            title={`Consentimiento ${consentimiento.id}`}
                          />
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
