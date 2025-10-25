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
import { FileText, Upload, Download, Trash2, Edit, Loader2, Eye, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { archivosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  tipo_mime: string;
  descripcion?: string;
  contenido_base64: string;
  fecha_subida: Date;
}

interface GestorArchivosProps {
  paciente_id: number;
  plan_tratamiento_id?: number;
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
    return {
      valido: false,
      error: 'El nombre contiene caracteres no permitidos',
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

export function GestorArchivos({ paciente_id, plan_tratamiento_id, modo = 'paciente' }: GestorArchivosProps) {
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogo_subir_abierto, setDialogoSubirAbierto] = useState(false);
  const [dialogo_editar_abierto, setDialogoEditarAbierto] = useState(false);
  const [dialogo_ver_abierto, setDialogoVerAbierto] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [archivo_seleccionado, setArchivoSeleccionado] = useState<ArchivoAdjunto | null>(null);
  const [archivo_a_eliminar, setArchivoAEliminar] = useState<ArchivoAdjunto | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotacion, setRotacion] = useState(0);

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
  }, [paciente_id, plan_tratamiento_id, modo]);

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
    const link = document.createElement('a');
    link.href = `data:${archivo.tipo_mime};base64,${archivo.contenido_base64}`;
    link.download = archivo.nombre_archivo;
    link.click();
  };

  const verArchivo = (archivo: ArchivoAdjunto) => {
    setArchivoSeleccionado(archivo);
    setZoom(100);
    setRotacion(0);
    setDialogoVerAbierto(true);
  };

  const aumentarZoom = () => setZoom(prev => Math.min(prev + 25, 200));
  const disminuirZoom = () => setZoom(prev => Math.max(prev - 25, 50));
  const rotar = () => setRotacion(prev => (prev + 90) % 360);
  const resetearVista = () => {
    setZoom(100);
    setRotacion(0);
  };

  const formatearFecha = (fecha: Date): string => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearTamano = (base64: string): string => {
    const bytes = (base64.length * 3) / 4;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
        <Button
          onClick={() => setDialogoSubirAbierto(true)}
          size="sm"
          className="hover:scale-105 transition-all duration-200"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir Archivo
        </Button>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{obtenerIconoTipo(archivo.tipo_mime)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{archivo.nombre_archivo}</p>
                      {archivo.descripcion && (
                        <p className="text-sm text-muted-foreground truncate">
                          {archivo.descripcion}
                        </p>
                      )}
                      <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                        <span>{formatearFecha(archivo.fecha_subida)}</span>
                        <span>•</span>
                        <span>{formatearTamano(archivo.contenido_base64)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
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

      <Dialog open={dialogo_ver_abierto} onOpenChange={setDialogoVerAbierto}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="truncate pr-4">
                {archivo_seleccionado?.nombre_archivo}
              </DialogTitle>
              <div className="flex gap-2 flex-shrink-0">
                {archivo_seleccionado && esImagen(archivo_seleccionado.tipo_mime) && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={disminuirZoom}
                      disabled={zoom <= 50}
                      title="Alejar"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={aumentarZoom}
                      disabled={zoom >= 200}
                      title="Acercar"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={rotar}
                      title="Rotar"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    {(zoom !== 100 || rotacion !== 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetearVista}
                      >
                        Resetear
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => archivo_seleccionado && manejarDescargar(archivo_seleccionado)}
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {archivo_seleccionado?.descripcion && (
              <p className="text-sm text-muted-foreground mt-2">
                {archivo_seleccionado.descripcion}
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-secondary/10 rounded-lg p-4 min-h-[400px] max-h-[600px]">
            {archivo_seleccionado && esImagen(archivo_seleccionado.tipo_mime) && (
              <div className="flex items-center justify-center h-full">
                <img
                  src={`data:${archivo_seleccionado.tipo_mime};base64,${archivo_seleccionado.contenido_base64}`}
                  alt={archivo_seleccionado.nombre_archivo}
                  className="max-w-full h-auto object-contain transition-all duration-300"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotacion}deg)`,
                    transformOrigin: 'center',
                  }}
                />
              </div>
            )}

            {archivo_seleccionado && esPdf(archivo_seleccionado.tipo_mime) && (
              <div className="h-full">
                <iframe
                  src={`data:${archivo_seleccionado.tipo_mime};base64,${archivo_seleccionado.contenido_base64}`}
                  className="w-full h-full min-h-[500px] rounded border-0"
                  title={archivo_seleccionado.nombre_archivo}
                />
              </div>
            )}
          </div>

          {archivo_seleccionado && esImagen(archivo_seleccionado.tipo_mime) && (
            <div className="text-center text-sm text-muted-foreground pt-2">
              Zoom: {zoom}%
              {rotacion > 0 && ` • Rotación: ${rotacion}°`}
            </div>
          )}
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
    </div>
  );
}