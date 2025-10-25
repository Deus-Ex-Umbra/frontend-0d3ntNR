import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Badge } from '@/componentes/ui/badge';
import { 
  ImageIcon, 
  Search, 
  User, 
  FileImage, 
  Edit, 
  Eye,
  Loader2,
  AlertCircle,
  Calendar,
  History,
  Copy,
  Trash2,
  Download,
  Pencil,
  ChevronRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { pacientesApi, archivosApi, edicionesImagenesApi } from '@/lib/api';
import { EditorImagenes } from '@/componentes/editor-imagenes/editor-imagenes';
import { VisualizadorArchivos } from '@/componentes/archivos/visualizador-archivos';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  color_categoria?: string;
}

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  tipo_mime: string;
  descripcion?: string;
  contenido_base64: string;
  fecha_subida: string;
}

interface EdicionVersion {
  id: number;
  nombre?: string;
  descripcion?: string;
  version: number;
  fecha_creacion: string;
  imagen_resultado_base64: string;
  datos_canvas?: { objetos: any[] };
  usuario: {
    nombre: string;
  };
}

export default function EdicionImagenes() {
  const [busqueda, setBusqueda] = useState('');
  const [todos_pacientes, setTodosPacientes] = useState<Paciente[]>([]);
  const [pacientes_filtrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [paciente_seleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [archivos, setArchivos] = useState<ArchivoAdjunto[]>([]);
  const [archivo_seleccionado, setArchivoSeleccionado] = useState<ArchivoAdjunto | null>(null);
  const [versiones, setVersiones] = useState<EdicionVersion[]>([]);
  const [version_editar, setVersionEditar] = useState<EdicionVersion | null>(null);
  
  const [cargando_inicial, setCargandoInicial] = useState(true);
  const [cargando_archivos, setCargandoArchivos] = useState(false);
  const [cargando_versiones, setCargandoVersiones] = useState(false);
  
  const [editor_abierto, setEditorAbierto] = useState(false);
  const [visualizador_abierto, setVisualizadorAbierto] = useState(false);
  const [dialogo_versiones_abierto, setDialogoVersionesAbierto] = useState(false);
  const [version_visualizar, setVersionVisualizar] = useState<EdicionVersion | null>(null);

  useEffect(() => {
    cargarTodosPacientes();
  }, []);

  useEffect(() => {
    filtrarPacientes();
  }, [busqueda, todos_pacientes]);

  useEffect(() => {
    if (paciente_seleccionado) {
      cargarArchivos();
    } else {
      setArchivos([]);
      setArchivoSeleccionado(null);
    }
  }, [paciente_seleccionado]);

  const cargarTodosPacientes = async () => {
    setCargandoInicial(true);
    try {
      const datos = await pacientesApi.obtenerTodos();
      setTodosPacientes(datos);
      setPacientesFiltrados(datos);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pacientes',
        variant: 'destructive',
      });
    } finally {
      setCargandoInicial(false);
    }
  };

  const filtrarPacientes = () => {
    if (!busqueda.trim()) {
      setPacientesFiltrados(todos_pacientes);
      return;
    }

    const termino = busqueda.toLowerCase();
    const filtrados = todos_pacientes.filter(paciente => 
      paciente.nombre.toLowerCase().includes(termino) ||
      paciente.apellidos.toLowerCase().includes(termino) ||
      paciente.id.toString().includes(termino) ||
      (paciente.telefono && paciente.telefono.includes(termino))
    );
    setPacientesFiltrados(filtrados);
  };

  const cargarArchivos = async () => {
    if (!paciente_seleccionado) return;
    
    setCargandoArchivos(true);
    try {
      const datos = await archivosApi.obtenerPorPaciente(paciente_seleccionado.id);
      const imagenes = datos.filter((archivo: ArchivoAdjunto) => 
        archivo.tipo_mime.startsWith('image/')
      );
      setArchivos(imagenes);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los archivos del paciente',
        variant: 'destructive',
      });
    } finally {
      setCargandoArchivos(false);
    }
  };

  const cargarVersiones = async (archivo_id: number) => {
    setCargandoVersiones(true);
    try {
      const datos = await edicionesImagenesApi.obtenerPorArchivo(archivo_id);
      setVersiones(datos);
    } catch (error) {
      console.error('Error al cargar versiones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las versiones',
        variant: 'destructive',
      });
    } finally {
      setCargandoVersiones(false);
    }
  };

  const seleccionarPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setArchivoSeleccionado(null);
    setVersiones([]);
  };

  const abrirEditor = async (archivo: ArchivoAdjunto, version?: EdicionVersion) => {
    setArchivoSeleccionado(archivo);
    setVersionEditar(version || null);
    await cargarVersiones(archivo.id);
    setEditorAbierto(true);
  };

  const abrirVisualizador = (archivo: ArchivoAdjunto) => {
    setArchivoSeleccionado(archivo);
    setVisualizadorAbierto(true);
  };

  const abrirDialogoVersiones = async (archivo: ArchivoAdjunto) => {
    setArchivoSeleccionado(archivo);
    await cargarVersiones(archivo.id);
    setDialogoVersionesAbierto(true);
  };

  const verVersion = (version: EdicionVersion) => {
    setVersionVisualizar(version);
    setVisualizadorAbierto(true);
  };

  const editarVersion = async (version: EdicionVersion) => {
    if (!archivo_seleccionado) return;
    
    try {
      const datos_completos = await edicionesImagenesApi.obtenerPorId(version.id);
      setVersionEditar(datos_completos);
      setDialogoVersionesAbierto(false);
      setEditorAbierto(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la versión para editar',
        variant: 'destructive',
      });
    }
  };

  const descargarVersion = (version: EdicionVersion) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${version.imagen_resultado_base64}`;
    link.download = `${version.nombre || `version_${version.version}`}.png`;
    link.click();
    toast({
      title: 'Versión descargada',
      description: 'La imagen se descargó correctamente',
    });
  };

  const duplicarVersion = async (version: EdicionVersion) => {
    try {
      await edicionesImagenesApi.duplicar(version.id);
      toast({
        title: 'Versión duplicada',
        description: 'Se creó una copia de la versión',
      });
      if (archivo_seleccionado) {
        await cargarVersiones(archivo_seleccionado.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo duplicar la versión',
        variant: 'destructive',
      });
    }
  };

  const eliminarVersion = async (version: EdicionVersion) => {
    if (!confirm(`¿Eliminar la versión ${version.version}?`)) return;
    
    try {
      await edicionesImagenesApi.eliminar(version.id);
      toast({
        title: 'Versión eliminada',
        description: 'La versión se eliminó correctamente',
      });
      if (archivo_seleccionado) {
        await cargarVersiones(archivo_seleccionado.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la versión',
        variant: 'destructive',
      });
    }
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cargando_inicial) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
              Editor de Imágenes
            </h1>
            <p className="text-lg text-muted-foreground">
              Edita y marca radiografías e imágenes dentales con herramientas profesionales
            </p>
          </div>

          {!paciente_seleccionado ? (
            <>
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Search className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Buscar Paciente</CardTitle>
                      <CardDescription>
                        {pacientes_filtrados.length} de {todos_pacientes.length} paciente{todos_pacientes.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Buscar por nombre, apellidos, teléfono o ID..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="h-11 hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </CardContent>
              </Card>

              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
                      <CardDescription>Selecciona un paciente para ver sus imágenes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pacientes_filtrados.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {busqueda ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {busqueda 
                            ? 'Intenta con otros términos de búsqueda' 
                            : 'Registra pacientes desde la sección de Pacientes'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pacientes_filtrados.map((paciente) => (
                            <TableRow 
                              key={paciente.id} 
                              className="hover:bg-secondary/50 transition-colors duration-200 cursor-pointer"
                              onClick={() => seleccionarPaciente(paciente)}
                            >
                              <TableCell>
                                {paciente.color_categoria && (
                                  <div
                                    className="w-4 h-4 rounded-full hover:scale-125 transition-transform duration-200"
                                    style={{ backgroundColor: paciente.color_categoria }}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {paciente.nombre} {paciente.apellidos}
                              </TableCell>
                              <TableCell>{paciente.telefono || '-'}</TableCell>
                              <TableCell>{paciente.correo || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    seleccionarPaciente(paciente);
                                  }}
                                  className="hover:bg-primary/20 hover:text-primary hover:scale-105 transition-all duration-200"
                                >
                                  Ver Imágenes
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-2 border-primary/30 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Paciente Seleccionado</CardTitle>
                      <CardDescription>
                        {paciente_seleccionado.nombre} {paciente_seleccionado.apellidos}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPacienteSeleccionado(null);
                        setArchivos([]);
                        setArchivoSeleccionado(null);
                      }}
                      className="hover:bg-destructive/20 hover:text-destructive hover:scale-105 transition-all duration-200"
                    >
                      Cambiar Paciente
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <FileImage className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Imágenes Disponibles</CardTitle>
                      <CardDescription>
                        {archivos.length} imagen{archivos.length !== 1 ? 'es' : ''} encontrada{archivos.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cargando_archivos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : archivos.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No hay imágenes disponibles
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Este paciente no tiene imágenes cargadas. Sube una imagen desde la sección de Pacientes para comenzar a editarla.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {archivos.map((archivo) => (
                        <Card key={archivo.id} className="hover:shadow-md transition-all duration-200 overflow-hidden group">
                          <div className="aspect-video bg-secondary/20 relative overflow-hidden">
                            <img
                              src={`data:${archivo.tipo_mime};base64,${archivo.contenido_base64}`}
                              alt={archivo.nombre_archivo}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <p className="font-semibold text-foreground truncate" title={archivo.nombre_archivo}>
                                {archivo.nombre_archivo}
                              </p>
                              {archivo.descripcion && (
                                <p className="text-sm text-muted-foreground truncate" title={archivo.descripcion}>
                                  {archivo.descripcion}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatearFecha(archivo.fecha_subida)}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => abrirEditor(archivo)}
                                className="w-full hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar y Crear Versiones
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirVisualizador(archivo)}
                                  className="flex-1 hover:bg-primary/20 hover:text-primary hover:scale-105 transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Original
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirDialogoVersiones(archivo)}
                                  className="flex-1 hover:bg-blue-500/20 hover:text-blue-500 hover:scale-105 transition-all duration-200"
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Versiones
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!paciente_seleccionado && todos_pacientes.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </div>
                    Herramientas de Dibujo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dibuja líneas, formas y anotaciones con diferentes colores y grosores sobre tus imágenes.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="bg-purple-500/10 p-2 rounded-lg">
                      <History className="h-4 w-4 text-purple-500" />
                    </div>
                    Control de Versiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Guarda múltiples versiones de tus ediciones y compara la evolución del caso clínico.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {archivo_seleccionado && (
        <>
          <EditorImagenes
            archivo_id={archivo_seleccionado.id}
            archivo_nombre={archivo_seleccionado.nombre_archivo}
            archivo_base64={archivo_seleccionado.contenido_base64}
            tipo_mime={archivo_seleccionado.tipo_mime}
            abierto={editor_abierto}
            onCerrar={() => {
              setEditorAbierto(false);
              setVersionEditar(null);
            }}
            onGuardar={() => {
              if (archivo_seleccionado) {
                cargarVersiones(archivo_seleccionado.id);
              }
            }}
            version_editar={version_editar || undefined}
          />

          {!version_visualizar ? (
            <VisualizadorArchivos
              archivo={archivo_seleccionado}
              abierto={visualizador_abierto}
              onCerrar={() => setVisualizadorAbierto(false)}
            />
          ) : (
            <Dialog open={visualizador_abierto} onOpenChange={(abierto) => {
              setVisualizadorAbierto(abierto);
              if (!abierto) {
                setVersionVisualizar(null);
              }
            }}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <div className="flex items-center justify-between pr-8">
                    <DialogTitle className="truncate pr-4">
                      {version_visualizar.nombre || `Versión ${version_visualizar.version}`}
                    </DialogTitle>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => descargarVersion(version_visualizar)}
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {version_visualizar.descripcion && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {version_visualizar.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Badge variant="outline">v{version_visualizar.version}</Badge>
                    <span>•</span>
                    <span>Por {version_visualizar.usuario.nombre}</span>
                    <span>•</span>
                    <span>{formatearFecha(version_visualizar.fecha_creacion)}</span>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-secondary/10 rounded-lg p-4 min-h-[400px] max-h-[600px]">
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={`data:image/png;base64,${version_visualizar.imagen_resultado_base64}`}
                      alt={version_visualizar.nombre || `Versión ${version_visualizar.version}`}
                      className="max-w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}

      <Dialog open={dialogo_versiones_abierto} onOpenChange={setDialogoVersionesAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Versiones de Edición</DialogTitle>
            <DialogDescription>
              {archivo_seleccionado?.nombre_archivo}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {cargando_versiones ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : versiones.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    No hay versiones guardadas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Abre el editor y guarda tu primera versión de esta imagen
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {versiones.map((version) => (
                  <Card key={version.id} className="hover:bg-secondary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-secondary/30 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={`data:image/png;base64,${version.imagen_resultado_base64}`}
                            alt={version.nombre || `Versión ${version.version}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                            onClick={() => verVersion(version)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">v{version.version}</Badge>
                            <h4 className="font-semibold truncate">
                              {version.nombre || `Versión ${version.version}`}
                            </h4>
                          </div>
                          {version.descripcion && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {version.descripcion}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Por {version.usuario.nombre} • {formatearFecha(version.fecha_creacion)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editarVersion(version)}
                            title="Editar versión"
                            className="hover:bg-primary/20 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verVersion(version)}
                            title="Ver versión"
                            className="hover:bg-blue-500/20 hover:text-blue-500"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => descargarVersion(version)}
                            title="Descargar"
                            className="hover:bg-green-500/20 hover:text-green-500"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicarVersion(version)}
                            title="Duplicar versión"
                            className="hover:bg-yellow-500/20 hover:text-yellow-500"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => eliminarVersion(version)}
                            title="Eliminar versión"
                            className="hover:bg-destructive/20 hover:text-destructive"
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}