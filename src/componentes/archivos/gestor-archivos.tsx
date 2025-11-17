import { useState, useEffect } from 'react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import {
  Card,
  CardContent,
} from '@/componentes/ui/card';
import { FileText, Upload, Download, Trash2, Edit, Loader2, Eye, FileSignature } from 'lucide-react';
import { archivosApi, plantillasConsentimientoApi, catalogoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { VisualizadorArchivos } from '@/componentes/archivos/visualizador-archivos';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  tipo_mime: string;
  descripcion?: string;
  url?: string;
  fecha_subida: Date;
}

interface Plantilla {
  id: number;
  nombre: string;
  contenido: string;
  fecha_creacion: Date;
}

interface EtiquetaPersonalizada {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}

interface ValorEtiqueta {
  codigo: string;
  nombre: string;
  valor: string;
}

interface GestorArchivosProps {
  paciente_id: number;
  plan_tratamiento_id?: number;
  paciente?: {
    nombre: string;
    apellidos: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
  };
  modo?: 'paciente' | 'plan';
}

const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

const EXTENSIONES_PERMITIDAS = '.jpg,.jpeg,.png,.gif,.webp,.pdf';
const TAMANO_MAXIMO = 10 * 1024 * 1024;

const validarNombreArchivo = (nombre: string): { valido: boolean; error?: string } => {
  const caracteres_invalidos = /[<>:"/\\|?*\x00-\x1F]/g;
  
  if (caracteres_invalidos.test(nombre)) {
    const simbolos_encontrados = nombre.match(caracteres_invalidos)?.join(' ') || '';
    return {
      valido: false,
      error: `El nombre contiene símbolos no permitidos: ${simbolos_encontrados}. No uses: < > : " / \\ | ? *`,
    };
  }

  const partes = nombre.split('.');
  if (partes.length > 2) {
    return {
      valido: false,
      error: 'El nombre no puede contener múltiples extensiones',
    };
  }

  if (nombre.length > 100) {
    return {
      valido: false,
      error: 'El nombre es demasiado largo (máximo 100 caracteres)',
    };
  }

  return { valido: true };
};

const obtenerNombreSinExtension = (nombre_completo: string): string => {
  const ultima_punto = nombre_completo.lastIndexOf('.');
  if (ultima_punto === -1) return nombre_completo;
  return nombre_completo.substring(0, ultima_punto);
};

const obtenerExtension = (nombre_completo: string): string => {
  const ultima_punto = nombre_completo.lastIndexOf('.');
  if (ultima_punto === -1) return '';
  return nombre_completo.substring(ultima_punto);
};

export function GestorArchivos({ paciente_id, plan_tratamiento_id, paciente, modo = 'paciente' }: GestorArchivosProps) {
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogo_subir_abierto, setDialogoSubirAbierto] = useState(false);
  const [dialogo_editar_abierto, setDialogoEditarAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [archivo_seleccionado, setArchivoSeleccionado] = useState<ArchivoAdjunto | null>(null);
  const [archivo_a_eliminar, setArchivoAEliminar] = useState<ArchivoAdjunto | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [visualizador_abierto, setVisualizadorAbierto] = useState(false);
  const [archivo_visualizando, setArchivoVisualizando] = useState<ArchivoAdjunto | null>(null);
  const [dialogo_consentimiento_abierto, setDialogoConsentimientoAbierto] = useState(false);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantilla_seleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null);
  const [etiquetas_personalizadas, setEtiquetasPersonalizadas] = useState<EtiquetaPersonalizada[]>([]);
  const [valores_etiquetas, setValoresEtiquetas] = useState<ValorEtiqueta[]>([]);
  const [generando, setGenerando] = useState(false);
  const [vista_previa, setVistaPrevia] = useState(false);
  const [filtro_plantillas, setFiltroPlantillas] = useState('');
  const [filtro_etiquetas, setFiltroEtiquetas] = useState<string[]>([]);

  const [formulario, setFormulario] = useState({
    nombre_sin_extension: '',
    extension: '',
    descripcion: '',
    archivo: null as File | null,
  });

  const [formulario_editar, setFormularioEditar] = useState({
    nombre_sin_extension: '',
    extension: '',
    descripcion: '',
  });

  useEffect(() => {
    cargarArchivos();
    if (paciente) {
      cargarPlantillas();
      cargarEtiquetasPersonalizadas();
    }
  }, [paciente_id, plan_tratamiento_id, modo]);

  useEffect(() => {
    if (plantilla_seleccionada) {
      extraerYPrepararEtiquetas();
    }
  }, [plantilla_seleccionada, etiquetas_personalizadas]);

  const cargarArchivos = async () => {
    setCargando(true);
    try {
      let datos;
      if (modo === 'plan' && plan_tratamiento_id) {
        datos = await archivosApi.obtenerPorPlan(plan_tratamiento_id);
      } else {
        datos = await archivosApi.obtenerPorPaciente(paciente_id);
      }
      setArchivos(datos);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los archivos',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarPlantillas = async () => {
    try {
      const datos = await plantillasConsentimientoApi.obtenerTodas();
      setPlantillas(datos);
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
    }
  };

  const cargarEtiquetasPersonalizadas = async () => {
    try {
      const etiquetas = await catalogoApi.obtenerEtiquetasPlantilla();
      setEtiquetasPersonalizadas(etiquetas);
    } catch (error) {
      console.error('Error al cargar etiquetas personalizadas:', error);
    }
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
  const etiquetasUsadasEnPlantillas = (): Array<{ valor: string; etiqueta: string }> => {
    const usados = new Set<string>();
    plantillas.forEach((p) => {
      extraerEtiquetasDelContenido(p.contenido).forEach((c) => usados.add(c));
    });
    const mapCodigoNombre = new Map(etiquetas_personalizadas.map(e => [e.codigo, e.nombre]));
    const opciones = Array.from(usados).map((c) => ({ valor: c, etiqueta: mapCodigoNombre.get(c) || c }));
    opciones.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
    return opciones;
  };

  const extraerYPrepararEtiquetas = () => {
    if (!plantilla_seleccionada) return;

    const codigos_etiquetas = extraerEtiquetasDelContenido(plantilla_seleccionada.contenido);
    
    const valores: ValorEtiqueta[] = codigos_etiquetas.map(codigo => {
      const etiqueta_encontrada = etiquetas_personalizadas.find(e => e.codigo === codigo);
      return {
        codigo,
        nombre: etiqueta_encontrada?.nombre || codigo,
        valor: obtenerValorPredeterminado(codigo)
      };
    });

    setValoresEtiquetas(valores);
  };

  const obtenerValorPredeterminado = (codigo: string): string => {
    if (!paciente) return '';
    
    switch (codigo) {
      case '[PACIENTE_NOMBRE]':
        return paciente.nombre;
      case '[PACIENTE_APELLIDOS]':
        return paciente.apellidos;
      case '[PACIENTE_TELEFONO]':
        return paciente.telefono || '';
      case '[PACIENTE_CORREO]':
        return paciente.correo || '';
      case '[PACIENTE_DIRECCION]':
        return paciente.direccion || '';
      case '[FECHA_ACTUAL]':
        return new Date().toLocaleDateString('es-BO');
      default:
        return '';
    }
  };

  const actualizarValorEtiqueta = (codigo: string, valor: string) => {
    setValoresEtiquetas(prev => 
      prev.map(etiqueta => 
        etiqueta.codigo === codigo ? { ...etiqueta, valor } : etiqueta
      )
    );
  };

  const procesarContenidoConValores = (): string => {
    if (!plantilla_seleccionada) return '';

    let contenido_procesado = plantilla_seleccionada.contenido;

    valores_etiquetas.forEach(({ codigo, valor }) => {
      const regex = new RegExp(codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      contenido_procesado = contenido_procesado.replace(regex, valor);
    });
    contenido_procesado = contenido_procesado.replace(/data-etiqueta="[^"]*"/g, '');
    contenido_procesado = contenido_procesado.replace(/contenteditable="[^"]*"/g, '');
    contenido_procesado = contenido_procesado.replace(/class="[^"]*editable[^"]*"/g, '');
    contenido_procesado = contenido_procesado.replace(/style="[^"]*border[^"]*dashed[^"]*"/g, '');

    return contenido_procesado;
  };

  const abrirDialogoConsentimiento = () => {
    setPlantillaSeleccionada(null);
    setValoresEtiquetas([]);
    setVistaPrevia(false);
    setDialogoConsentimientoAbierto(true);
  };

  const generarYGuardarConsentimiento = async () => {
    if (!plantilla_seleccionada) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una plantilla',
        variant: 'destructive',
      });
      return;
    }
    const etiquetas_vacias = valores_etiquetas.filter(e => !e.valor.trim());
    if (etiquetas_vacias.length > 0) {
      toast({
        title: 'Error',
        description: `Debes completar todas las etiquetas: ${etiquetas_vacias.map(e => e.nombre).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setGenerando(true);
    try {
      const contenido_procesado = procesarContenidoConValores();
      const elemento_temporal = document.createElement('div');
      elemento_temporal.style.cssText = 'position: absolute; left: -9999px; width: 800px; background: white; padding: 40px; font-family: "Times New Roman", Times, serif; font-size: 12px; line-height: 1.6;';
      elemento_temporal.innerHTML = contenido_procesado;
      document.body.appendChild(elemento_temporal);
      const canvas = await html2canvas(elemento_temporal, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
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

      const pdf_base64 = pdf.output('dataurlstring').split(',')[1];
      const fecha_actual = new Date().toISOString().split('T')[0];
      const nombre_archivo = `Consentimiento_${plantilla_seleccionada.nombre}_${fecha_actual}.pdf`;

      await archivosApi.subir({
        nombre_archivo,
        tipo_mime: 'application/pdf',
        descripcion: `Consentimiento informado generado desde la plantilla: ${plantilla_seleccionada.nombre}`,
        contenido_base64: pdf_base64,
        paciente_id: paciente_id,
      });

      toast({
        title: 'Consentimiento generado',
        description: 'El consentimiento informado se ha generado y guardado correctamente',
      });

      setDialogoConsentimientoAbierto(false);
      setPlantillaSeleccionada(null);
      setValoresEtiquetas([]);
      setVistaPrevia(false);

      await cargarArchivos();
    } catch (error) {
      console.error('Error al generar consentimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el consentimiento',
        variant: 'destructive',
      });
    } finally {
      setGenerando(false);
    }
  };

  const validarArchivo = (archivo: File): boolean => {
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      toast({
        title: 'Tipo de archivo no permitido',
        description: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y archivos PDF',
        variant: 'destructive',
      });
      return false;
    }

    if (archivo.size > TAMANO_MAXIMO) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El archivo no debe superar los ${(TAMANO_MAXIMO / 1024 / 1024).toFixed(0)}MB`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (validarArchivo(archivo)) {
        const nombre_sin_ext = obtenerNombreSinExtension(archivo.name);
        const ext = obtenerExtension(archivo.name);
        
        setFormulario({
          ...formulario,
          archivo,
          nombre_sin_extension: nombre_sin_ext,
          extension: ext,
        });
      } else {
        e.target.value = '';
      }
    }
  };

  const manejarSubir = async () => {
    if (!formulario.archivo) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un archivo',
        variant: 'destructive',
      });
      return;
    }

    const nombre_completo = formulario.nombre_sin_extension.trim() + formulario.extension;
    const validacion = validarNombreArchivo(nombre_completo);
    
    if (!validacion.valido) {
      toast({
        title: 'Error',
        description: validacion.error,
        variant: 'destructive',
      });
      return;
    }

    setSubiendo(true);
    try {
      const lector = new FileReader();
      lector.onload = async () => {
        const base64 = (lector.result as string).split(',')[1];
        
        await archivosApi.subir({
          nombre_archivo: nombre_completo,
          tipo_mime: formulario.archivo!.type,
          descripcion: formulario.descripcion || undefined,
          contenido_base64: base64,
          paciente_id,
          plan_tratamiento_id,
        });

        toast({
          title: 'Éxito',
          description: 'Archivo subido correctamente',
        });

        setDialogoSubirAbierto(false);
        setFormulario({
          nombre_sin_extension: '',
          extension: '',
          descripcion: '',
          archivo: null,
        });
        cargarArchivos();
      };
      
      lector.onerror = () => {
        toast({
          title: 'Error',
          description: 'No se pudo leer el archivo',
          variant: 'destructive',
        });
      };
      
      lector.readAsDataURL(formulario.archivo);
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo subir el archivo',
        variant: 'destructive',
      });
    } finally {
      setSubiendo(false);
    }
  };

  const abrirDialogoEditar = (archivo: ArchivoAdjunto) => {
    const nombre_sin_ext = obtenerNombreSinExtension(archivo.nombre_archivo);
    const ext = obtenerExtension(archivo.nombre_archivo);
    
    setArchivoSeleccionado(archivo);
    setFormularioEditar({
      nombre_sin_extension: nombre_sin_ext,
      extension: ext,
      descripcion: archivo.descripcion || '',
    });
    setDialogoEditarAbierto(true);
  };

  const manejarEditar = async () => {
    if (!archivo_seleccionado) return;

    const nombre_completo = formulario_editar.nombre_sin_extension.trim() + formulario_editar.extension;
    const validacion = validarNombreArchivo(nombre_completo);
    
    if (!validacion.valido) {
      toast({
        title: 'Error',
        description: validacion.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      await archivosApi.actualizar(archivo_seleccionado.id, {
        nombre_archivo: nombre_completo,
        descripcion: formulario_editar.descripcion,
      });
      toast({
        title: 'Éxito',
        description: 'Archivo actualizado correctamente',
      });
      setDialogoEditarAbierto(false);
      cargarArchivos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el archivo',
        variant: 'destructive',
      });
    }
  };

  const abrirDialogoConfirmarEliminar = (archivo: ArchivoAdjunto) => {
    setArchivoAEliminar(archivo);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const eliminarArchivo = async () => {
    if (!archivo_a_eliminar) return;

    try {
      await archivosApi.eliminar(archivo_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: 'Archivo eliminado correctamente',
      });
      cargarArchivos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el archivo',
        variant: 'destructive',
      });
    } finally {
      setDialogoConfirmarEliminarAbierto(false);
      setArchivoAEliminar(null);
    }
  };

  const manejarDescargar = (archivo: ArchivoAdjunto) => {
    if (archivo.url) {
      const link = document.createElement('a');
      link.href = archivo.url;
      link.download = archivo.nombre_archivo;
      link.target = '_blank';
      link.click();
    }
  };

  const verArchivo = async (archivo: ArchivoAdjunto) => {
    if (archivo.url) {
      setArchivoVisualizando(archivo);
      setVisualizadorAbierto(true);
    }
  };

  const formatearFecha = (fecha: Date | string): string => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerIconoTipo = (tipo_mime: string) => {
    if (tipo_mime.startsWith('image/')) return '🖼️';
    if (tipo_mime === 'application/pdf') return '📄';
    return '📎';
  };

  const esImagen = (tipo_mime: string) => tipo_mime.startsWith('image/');
  const esPdf = (tipo_mime: string) => tipo_mime === 'application/pdf';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Archivos Adjuntos</h3>
            <p className="text-sm text-muted-foreground">
              {archivos.length} archivo{archivos.length !== 1 ? 's' : ''} • PDF e imágenes únicamente
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setDialogoSubirAbierto(true)}
            size="sm"
            className="hover:scale-105 transition-all duration-200"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
          {paciente && (
            <Button
              onClick={abrirDialogoConsentimiento}
              size="sm"
              variant="outline"
              className="hover:scale-105 transition-all duration-200"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Consentimiento
            </Button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : archivos.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">
              No hay archivos adjuntos
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Solo se permiten archivos PDF e imágenes (máx. 10MB)
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {archivos.map((archivo) => (
            <Card key={archivo.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">{obtenerIconoTipo(archivo.tipo_mime)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-words">{archivo.nombre_archivo}</p>
                      {archivo.descripcion && (
                        <p className="text-sm text-muted-foreground break-words mt-1">
                          {archivo.descripcion}
                        </p>
                      )}
                      <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                        <span>{formatearFecha(archivo.fecha_subida)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(esImagen(archivo.tipo_mime) || esPdf(archivo.tipo_mime)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => verArchivo(archivo)}
                        className="hover:bg-primary/20 hover:text-primary transition-all"
                        title="Ver archivo"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => manejarDescargar(archivo)}
                      className="hover:bg-blue-500/20 hover:text-blue-500 transition-all"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirDialogoEditar(archivo)}
                      className="hover:bg-yellow-500/20 hover:text-yellow-500 transition-all"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirDialogoConfirmarEliminar(archivo)}
                      className="hover:bg-destructive/20 hover:text-destructive transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogo_subir_abierto} onOpenChange={setDialogoSubirAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>
              Adjunta un archivo al {modo === 'plan' ? 'plan de tratamiento' : 'paciente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo *</Label>
              <Input
                id="archivo"
                type="file"
                accept={EXTENSIONES_PERMITIDAS}
                onChange={manejarSeleccionArchivo}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Tipos permitidos: PDF, JPG, PNG, GIF, WEBP • Tamaño máximo: 10MB
              </p>
            </div>

            {formulario.archivo && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del archivo *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nombre"
                      value={formulario.nombre_sin_extension}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[<>:"/\\|?*\x00-\x1F.]/g, '');
                        setFormulario({ ...formulario, nombre_sin_extension: valor });
                      }}
                      placeholder="nombre-del-archivo"
                      className="flex-1"
                    />
                    <Input
                      value={formulario.extension}
                      disabled
                      className="w-20 bg-secondary cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No uses caracteres especiales. La extensión no se puede modificar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="descripcion"
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    placeholder="Radiografía panorámica inicial..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoSubirAbierto(false);
                setFormulario({
                  nombre_sin_extension: '',
                  extension: '',
                  descripcion: '',
                  archivo: null,
                });
              }}
              disabled={subiendo}
            >
              Cancelar
            </Button>
            <Button onClick={manejarSubir} disabled={subiendo || !formulario.archivo}>
              {subiendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_editar_abierto} onOpenChange={setDialogoEditarAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Archivo</DialogTitle>
            <DialogDescription>
              Modifica los metadatos del archivo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-editar">Nombre del archivo</Label>
              <div className="flex gap-2">
                <Input
                  id="nombre-editar"
                  value={formulario_editar.nombre_sin_extension}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[<>:"/\\|?*\x00-\x1F.]/g, '');
                    setFormularioEditar({ ...formulario_editar, nombre_sin_extension: valor });
                  }}
                  className="flex-1"
                />
                <Input
                  value={formulario_editar.extension}
                  disabled
                  className="w-20 bg-secondary cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                La extensión no se puede modificar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-editar">Descripción</Label>
              <Textarea
                id="descripcion-editar"
                value={formulario_editar.descripcion}
                onChange={(e) => setFormularioEditar({ ...formulario_editar, descripcion: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoEditarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={manejarEditar}>
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este archivo?
            </DialogDescription>
          </DialogHeader>
    
          {archivo_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {archivo_a_eliminar.nombre_archivo}
                </p>
              </div>
              {archivo_a_eliminar.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {archivo_a_eliminar.descripcion}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(archivo_a_eliminar.fecha_subida).toLocaleString('es-BO')}
              </p>
            </div>
          )}

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
                setArchivoAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarArchivo}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar Archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {archivo_visualizando && visualizador_abierto && (
        <VisualizadorArchivos
          archivo={archivo_visualizando}
          abierto={visualizador_abierto}
          onCerrar={() => {
            setVisualizadorAbierto(false);
            setArchivoVisualizando(null);
          }}
        />
      )}

      <Dialog open={dialogo_consentimiento_abierto} onOpenChange={setDialogoConsentimientoAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generar Consentimiento Informado</DialogTitle>
            <DialogDescription>
              {paciente && `Para ${paciente.nombre} ${paciente.apellidos}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 overflow-y-auto">
            <div className="space-y-6 py-4">
              {!plantilla_seleccionada ? (
                <div className="space-y-4">
                  <Label>Seleccionar plantilla</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Buscar por nombre..."
                      value={filtro_plantillas}
                      onChange={(e) => setFiltroPlantillas(e.target.value)}
                    />
                    <MultiSelect
                      opciones={etiquetasUsadasEnPlantillas()}
                      valores={filtro_etiquetas}
                      onChange={setFiltroEtiquetas}
                      placeholder="Filtrar por etiquetas (opcional)"
                      textoVacio="Sin etiquetas"
                    />
                  </div>
                  {plantillas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay plantillas disponibles</p>
                      <p className="text-sm">Crea una plantilla primero en la sección de Inicio</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {plantillas
                        .filter((p) => {
                          const termino = filtro_plantillas.trim().toLowerCase();
                          const coincideNombre = termino ? p.nombre.toLowerCase().includes(termino) : true;
                          if (filtro_etiquetas.length === 0) return coincideNombre;
                          const codigos = extraerEtiquetasDelContenido(p.contenido);
                          const coincideEtiquetas = filtro_etiquetas.every((sel) => codigos.includes(sel));
                          return coincideNombre && coincideEtiquetas;
                        })
                        .map((plantilla) => (
                        <Button
                          key={plantilla.id}
                          variant="outline"
                          className="h-auto py-4 px-4 justify-start text-left"
                          onClick={() => setPlantillaSeleccionada(plantilla)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold">{plantilla.nombre}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Creada el {new Date(plantilla.fecha_creacion).toLocaleDateString('es-BO')}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Plantilla: {plantilla_seleccionada.nombre}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPlantillaSeleccionada(null);
                          setValoresEtiquetas([]);
                          setVistaPrevia(false);
                        }}
                      >
                        Cambiar plantilla
                      </Button>
                    </div>

                    {valores_etiquetas.length > 0 && (
                      <div className="space-y-3">
                        <Label>Completar información</Label>
                        <div className="grid gap-4">
                          {valores_etiquetas.map((etiqueta) => (
                            <div key={etiqueta.codigo} className="space-y-2">
                              <Label htmlFor={etiqueta.codigo}>
                                {etiqueta.nombre}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({etiqueta.codigo})
                                </span>
                              </Label>
                              <Input
                                id={etiqueta.codigo}
                                value={etiqueta.valor}
                                onChange={(e) => actualizarValorEtiqueta(etiqueta.codigo, e.target.value)}
                                placeholder={`Ingrese ${etiqueta.nombre.toLowerCase()}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Vista previa</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVistaPrevia(!vista_previa)}
                        >
                          {vista_previa ? 'Ocultar' : 'Mostrar'} vista previa
                        </Button>
                      </div>
                      
                      {vista_previa && (
                        <div className="border rounded-lg p-4 bg-white">
                          <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12px', lineHeight: '1.6' }}>
                            <RenderizadorHtml contenido={procesarContenidoConValores()} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogoConsentimientoAbierto(false);
                setPlantillaSeleccionada(null);
                setValoresEtiquetas([]);
                setVistaPrevia(false);
              }}
            >
              Cancelar
            </Button>
            {plantilla_seleccionada && (
              <Button 
                onClick={generarYGuardarConsentimiento} 
                disabled={generando || valores_etiquetas.some(e => !e.valor.trim())}
              >
                {generando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar y Guardar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
