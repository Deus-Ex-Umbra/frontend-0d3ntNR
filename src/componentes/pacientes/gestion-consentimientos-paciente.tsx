import { useState, useEffect } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Label } from '@/componentes/ui/label';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { Input } from '@/componentes/ui/input';
import { consentimientosApi, plantillasConsentimientoApi, catalogoApi } from '@/lib/api';
import { FileSignature, Download, Trash2, Plus, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { VisualizadorArchivos } from '@/componentes/archivos/visualizador-archivos';
import { Combobox } from '@/componentes/ui/combobox';

interface ConsentimientoGuardado {
  id: number;
  nombre: string;
  fecha_creacion: Date;
}

interface Plantilla {
  id: number;
  nombre: string;
  contenido: string;
}

interface GestionConsentimientosPacienteProps {
  paciente_id: number;
  paciente: {
    nombre: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
  };
}

export function GestionConsentimientosPaciente({
  paciente_id,
  paciente,
}: GestionConsentimientosPacienteProps) {
  const [consentimientos, setConsentimientos] = useState<ConsentimientoGuardado[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargando_plantillas, setCargandoPlantillas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [plantilla_seleccionada, setPlantillaSeleccionada] = useState<number | null>(null);
  const [nombre_consentimiento, setNombreConsentimiento] = useState('');
  const [contenido_preview, setContenidoPreview] = useState('');
  const [visualizador_abierto, setVisualizadorAbierto] = useState(false);
  const [consentimiento_visualizando, setConsentimientoVisualizando] = useState<{
    id: number;
    nombre_archivo: string;
    tipo_mime: string;
    descripcion?: string;
    url?: string;
    fecha_subida: string;
  } | null>(null);
  const [consentimiento_cargando_id, setConsentimientoCargandoId] = useState<number | null>(null);
  const [filtro_plantillas, setFiltroPlantillas] = useState('');
  const [etiquetas_disponibles, setEtiquetasDisponibles] = useState<Array<{ valor: string; etiqueta: string }>>([]);
  const [etiquetas_seleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    cargarConsentimientos();
    cargarPlantillas();
  }, [paciente_id]);

  useEffect(() => {
    const prepararEtiquetas = async () => {
      try {
        const catalogo = await catalogoApi.obtenerEtiquetasPlantilla();
        const mapCodigoNombre = new Map<string, string>(
          catalogo.map((e: { codigo: string; nombre: string }) => [e.codigo, e.nombre])
        );

        const codigosUsados = new Set<string>();
        plantillas.forEach((p) => {
          extraerEtiquetasDelContenido(p.contenido).forEach((cod) => codigosUsados.add(cod));
        });

        const opciones = Array.from(codigosUsados).map((codigo) => ({
          valor: codigo,
          etiqueta: mapCodigoNombre.get(codigo) || codigo,
        }));
        opciones.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
        setEtiquetasDisponibles(opciones);
      } catch (e) {
        const codigosUsados = new Set<string>();
        plantillas.forEach((p) => {
          extraerEtiquetasDelContenido(p.contenido).forEach((cod) => codigosUsados.add(cod));
        });
        const opciones = Array.from(codigosUsados).map((codigo) => ({ valor: codigo, etiqueta: codigo }));
        opciones.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
        setEtiquetasDisponibles(opciones);
      }
    };
    if (plantillas.length > 0) prepararEtiquetas();
  }, [plantillas]);

  useEffect(() => {
    if (plantilla_seleccionada) {
      const plantilla = plantillas.find(p => p.id === plantilla_seleccionada);
      if (plantilla) {
        const contenido_reemplazado = reemplazarVariables(plantilla.contenido);
        setContenidoPreview(contenido_reemplazado);
      }
    } else {
      setContenidoPreview('');
    }
  }, [plantilla_seleccionada, plantillas, paciente]);

  const cargarConsentimientos = async () => {
    setCargando(true);
    try {
      const datos = await consentimientosApi.obtenerPorPaciente(paciente_id);
      setConsentimientos(datos);
    } catch (error) {
      console.error('Error al cargar consentimientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los consentimientos',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarPlantillas = async () => {
    setCargandoPlantillas(true);
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
      setCargandoPlantillas(false);
    }
  };

  const reemplazarVariables = (contenido: string): string => {
    return contenido
      .replace(/{{nombre}}/g, paciente.nombre)
      .replace(/{{apellidos}}/g, paciente.apellidos)
      .replace(/{{nombre_completo}}/g, `${paciente.nombre} ${paciente.apellidos}`)
      .replace(/{{telefono}}/g, paciente.telefono || 'No registrado')
      .replace(/{{correo}}/g, paciente.correo || 'No registrado')
      .replace(/{{direccion}}/g, paciente.direccion || 'No registrada')
      .replace(/{{fecha}}/g, format(new Date(), 'dd/MM/yyyy', { locale: es }));
  };

  const extraerEtiquetasDelContenido = (contenido: string): string[] => {
    const regex = /data-etiqueta="([^"]+)"/g;
    const etiquetas: string[] = [];
    let match;
    while ((match = regex.exec(contenido)) !== null) {
      if (!etiquetas.includes(match[1])) etiquetas.push(match[1]);
    }
    return etiquetas;
  };

  const abrirDialogoNuevo = () => {
    setPlantillaSeleccionada(null);
    setNombreConsentimiento('');
    setContenidoPreview('');
    setDialogoAbierto(true);
  };

  const crearConsentimiento = async () => {
    if (!plantilla_seleccionada) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una plantilla',
        variant: 'destructive',
      });
      return;
    }

    if (!nombre_consentimiento.trim()) {
      toast({
        title: 'Error',
        description: 'Debes ingresar un nombre para el consentimiento',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await consentimientosApi.crear(paciente_id, {
        plantilla_id: plantilla_seleccionada,
        nombre: nombre_consentimiento.trim(),
      });

      toast({
        title: 'Éxito',
        description: 'Consentimiento informado creado correctamente',
      });

      setDialogoAbierto(false);
      await cargarConsentimientos();
    } catch (error: any) {
      console.error('Error al crear consentimiento:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el consentimiento',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const descargarConsentimiento = async (consentimiento: ConsentimientoGuardado) => {
    try {
      const blob = await consentimientosApi.descargar(consentimiento.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${consentimiento.nombre}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el consentimiento',
        variant: 'destructive',
      });
    }
  };

  const verConsentimiento = async (consentimiento: ConsentimientoGuardado) => {
    setConsentimientoCargandoId(consentimiento.id);
    try {
      const blob = await consentimientosApi.descargar(consentimiento.id);
      const url = URL.createObjectURL(blob);

      setConsentimientoVisualizando({
        id: consentimiento.id,
        nombre_archivo: `${consentimiento.nombre}.pdf`,
        tipo_mime: 'application/pdf',
        descripcion: `Generado el ${format(new Date(consentimiento.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}`,
        url: url,
        fecha_subida: new Date(consentimiento.fecha_creacion).toISOString(),
      });
      setVisualizadorAbierto(true);
    } catch (error) {
      console.error('Error al visualizar consentimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el consentimiento seleccionado',
        variant: 'destructive',
      });
    } finally {
      setConsentimientoCargandoId(null);
    }
  };

  const eliminarConsentimiento = async (id: number) => {
    try {
      await consentimientosApi.eliminar(id);
      toast({
        title: 'Éxito',
        description: 'Consentimiento eliminado correctamente',
      });
      await cargarConsentimientos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el consentimiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Consentimientos Informados</h3>
          <p className="text-sm text-muted-foreground">
            Documentos de consentimiento generados para este paciente
          </p>
        </div>
        <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoNuevo}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Consentimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Crear Consentimiento Informado</DialogTitle>
              <DialogDescription>
                Selecciona una plantilla y genera el consentimiento para {paciente.nombre} {paciente.apellidos}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-2">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Documento</Label>
                <div className="flex gap-2">
                  <Input
                    id="nombre"
                    value={nombre_consentimiento}
                    onChange={(e) => setNombreConsentimiento(e.target.value)}
                    placeholder="Ej: Consentimiento para Extracción Dental"
                    className="flex-1"
                  />
                  <Input
                    value=".pdf"
                    disabled
                    className="w-16 text-center bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plantilla">Plantilla</Label>
                <Input
                  placeholder="Buscar por nombre de plantilla..."
                  value={filtro_plantillas}
                  onChange={(e) => setFiltroPlantillas(e.target.value)}
                />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Etiquetas</Label>
                  <MultiSelect
                    opciones={etiquetas_disponibles}
                    valores={etiquetas_seleccionadas}
                    onChange={setEtiquetasSeleccionadas}
                    placeholder="Filtrar por etiquetas (opcional)"
                    textoVacio="No hay etiquetas disponibles"
                  />
                </div>
                {(() => {
                  const termino = filtro_plantillas.trim().toLowerCase();
                  const filtrarPorEtiquetas = (p: Plantilla) => {
                    if (etiquetas_seleccionadas.length === 0) return true;
                    const codigos = extraerEtiquetasDelContenido(p.contenido);
                    return etiquetas_seleccionadas.every((sel) => codigos.includes(sel));
                  };
                  const plantillas_filtradas = plantillas.filter(
                    (p) => (termino ? p.nombre.toLowerCase().includes(termino) : true) && filtrarPorEtiquetas(p)
                  );
                  return (
                    <Combobox
                      opciones={plantillas_filtradas.map(p => ({ valor: p.id.toString(), etiqueta: p.nombre }))}
                      valor={plantilla_seleccionada?.toString() || ''}
                      onChange={(valor: string) => setPlantillaSeleccionada(parseInt(valor))}
                      placeholder="Seleccionar plantilla..."
                      textoVacio="No se encontraron plantillas"
                      disabled={cargando_plantillas}
                    />
                  );
                })()}
              </div>

              {contenido_preview && (
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className="border rounded-lg p-4 bg-white">
                    <p className="text-xs text-muted-foreground mb-2">
                      Las líneas azules indican salto de hoja (tamaño carta 8.5" × 11").
                    </p>
                    <div className="max-h-[60vh] overflow-y-auto preview-paginas" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      <RenderizadorHtml contenido={contenido_preview} modoDocumento />
                    </div>
                  </div>
                  <style>{`
                    .preview-paginas {
                      --page-height: 1056px;
                      background-image: repeating-linear-gradient(
                        to bottom,
                        transparent 0,
                        transparent calc(var(--page-height) - 2px),
                        rgba(59,130,246,0.35) calc(var(--page-height) - 2px),
                        rgba(59,130,246,0.35) calc(var(--page-height)),
                        transparent calc(var(--page-height) + 1px)
                      );
                      background-attachment: local;
                      background-repeat: repeat;
                      background-size: 100% var(--page-height);
                    }
                  `}</style>
                </div>
              )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogoAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={crearConsentimiento} disabled={guardando}>
                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear y Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : consentimientos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay consentimientos</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Crea el primer consentimiento informado para este paciente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consentimientos.map((consentimiento) => (
            <Card key={consentimiento.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSignature className="h-5 w-5" />
                      {consentimiento.nombre}
                    </CardTitle>
                    <CardDescription>
                      Generado: {format(new Date(consentimiento.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => verConsentimiento(consentimiento)}
                      disabled={consentimiento_cargando_id === consentimiento.id}
                      title="Ver PDF"
                    >
                      {consentimiento_cargando_id === consentimiento.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => descargarConsentimiento(consentimiento)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => eliminarConsentimiento(consentimiento.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {consentimiento_visualizando && visualizador_abierto && (
        <VisualizadorArchivos
          archivo={consentimiento_visualizando}
          abierto={visualizador_abierto}
          onCerrar={() => {
            setVisualizadorAbierto(false);
            setConsentimientoVisualizando(null);
          }}
        />
      )}
    </div>
  );
}
