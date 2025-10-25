import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage, Circle, Rect, Text as KonvaText } from 'react-konva';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Badge } from '@/componentes/ui/badge';
import { 
  Pencil, Square, Circle as CircleIcon, Type, Eraser, Download, 
  Save, Undo, Redo, ZoomIn, ZoomOut, RotateCw, Hand, Image as ImageIcon, 
  Loader2, Trash2, Copy, History, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { edicionesImagenesApi, catalogoApi } from '@/lib/api';

interface Herramienta {
  tipo: 'pencil' | 'line' | 'rect' | 'circle' | 'text' | 'eraser' | 'move' | 'symbol';
  color: string;
  grosor: number;
  opacidad: number;
}

interface ObjetoCanvas {
  tipo: string;
  puntos?: number[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  radio?: number;
  texto?: string;
  color: string;
  grosor: number;
  opacidad: number;
  simbolo_id?: number;
  imagen_base64?: string;
}

interface EditorImagenesProps {
  archivo_id: number;
  archivo_nombre: string;
  archivo_base64: string;
  tipo_mime: string;
  abierto: boolean;
  onCerrar: () => void;
  onGuardar?: () => void;
  version_editar?: {
    id: number;
    nombre?: string;
    descripcion?: string;
    version: number;
    datos_canvas?: { objetos: ObjetoCanvas[] };
  };
}

interface Simbologia {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen_base64: string;
}

interface EdicionVersion {
  id: number;
  nombre?: string;
  descripcion?: string;
  version: number;
  fecha_creacion: string;
  usuario: {
    nombre: string;
  };
}

export function EditorImagenes({ 
  archivo_id, 
  archivo_nombre, 
  archivo_base64, 
  tipo_mime,
  abierto, 
  onCerrar,
  onGuardar,
  version_editar
}: EditorImagenesProps) {
  const [herramienta_actual, setHerramientaActual] = useState<Herramienta>({
    tipo: 'pencil',
    color: '#FF0000',
    grosor: 2,
    opacidad: 1,
  });

  const [objetos, setObjetos] = useState<ObjetoCanvas[]>([]);
  const [historial_deshacer, setHistorialDeshacer] = useState<ObjetoCanvas[][]>([]);
  const [historial_rehacer, setHistorialRehacer] = useState<ObjetoCanvas[][]>([]);
  const [dibujando, setDibujando] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const [imagen_cargada, setImagenCargada] = useState<HTMLImageElement | null>(null);
  const [dimensiones_imagen, setDimensionesImagen] = useState({ ancho: 800, alto: 600 });
  
  const [simbologias, setSimbologias] = useState<Simbologia[]>([]);
  const [cargando_simbologias, setCargandoSimbologias] = useState(false);
  
  const [guardando, setGuardando] = useState(false);
  const [dialogo_guardar_abierto, setDialogoGuardarAbierto] = useState(false);
  const [nombre_version, setNombreVersion] = useState('');
  const [descripcion_version, setDescripcionVersion] = useState('');
  
  const [versiones, setVersiones] = useState<EdicionVersion[]>([]);
  const [cargando_versiones, setCargandoVersiones] = useState(false);
  const [dialogo_versiones_abierto, setDialogoVersionesAbierto] = useState(false);
  
  const stage_ref = useRef<any>(null);
  const layer_dibujo_ref = useRef<any>(null);

  useEffect(() => {
    if (abierto) {
      cargarImagen();
      cargarSimbologias();
      cargarVersiones();
      
      if (version_editar) {
        if (version_editar.datos_canvas && (version_editar.datos_canvas as any).objetos) {
          setObjetos((version_editar.datos_canvas as any).objetos);
          setHistorialDeshacer([]);
          setHistorialRehacer([]);
        }
        setNombreVersion(version_editar.nombre || `Versión ${version_editar.version}`);
        setDescripcionVersion(version_editar.descripcion || '');
      } else {
        setObjetos([]);
        setHistorialDeshacer([]);
        setHistorialRehacer([]);
        setNombreVersion('');
        setDescripcionVersion('');
      }
    }
  }, [abierto, archivo_base64, version_editar]);

  const cargarImagen = () => {
    const img = new window.Image();
    img.src = `data:${tipo_mime};base64,${archivo_base64}`;
    img.onload = () => {
      setImagenCargada(img);
      setDimensionesImagen({ ancho: img.width, alto: img.height });
    };
  };

  const cargarSimbologias = async () => {
    setCargandoSimbologias(true);
    try {
      const datos = await catalogoApi.obtenerSimbologias();
      setSimbologias(datos);
    } catch (error) {
      console.error('Error al cargar simbologías:', error);
    } finally {
      setCargandoSimbologias(false);
    }
  };

  const cargarVersiones = async () => {
    setCargandoVersiones(true);
    try {
      const datos = await edicionesImagenesApi.obtenerPorArchivo(archivo_id);
      setVersiones(datos);
    } catch (error) {
      console.error('Error al cargar versiones:', error);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const guardarEstadoHistorial = () => {
    setHistorialDeshacer([...historial_deshacer, [...objetos]]);
    setHistorialRehacer([]);
  };

  const deshacer = () => {
    if (historial_deshacer.length === 0) return;
    
    const nuevo_historial_deshacer = [...historial_deshacer];
    const estado_anterior = nuevo_historial_deshacer.pop()!;
    
    setHistorialRehacer([...historial_rehacer, [...objetos]]);
    setHistorialDeshacer(nuevo_historial_deshacer);
    setObjetos(estado_anterior);
  };

  const rehacer = () => {
    if (historial_rehacer.length === 0) return;
    
    const nuevo_historial_rehacer = [...historial_rehacer];
    const estado_siguiente = nuevo_historial_rehacer.pop()!;
    
    setHistorialDeshacer([...historial_deshacer, [...objetos]]);
    setHistorialRehacer(nuevo_historial_rehacer);
    setObjetos(estado_siguiente);
  };

  const handleMouseDown = (e: any) => {
    if (herramienta_actual.tipo === 'move') return;
    
    const pos = e.target.getStage().getPointerPosition();
    const punto_ajustado = {
      x: (pos.x - offset.x) / zoom,
      y: (pos.y - offset.y) / zoom,
    };

    if (herramienta_actual.tipo === 'eraser') {
      guardarEstadoHistorial();
      setDibujando(true);
      
      const objetos_filtrados = objetos.filter(obj => {
        if (obj.tipo === 'pencil' || obj.tipo === 'eraser') {
          if (!obj.puntos) return true;
          
          for (let i = 0; i < obj.puntos.length; i += 2) {
            const px = obj.puntos[i];
            const py = obj.puntos[i + 1];
            const distancia = Math.sqrt(
              Math.pow(px - punto_ajustado.x, 2) + 
              Math.pow(py - punto_ajustado.y, 2)
            );
            
            if (distancia < herramienta_actual.grosor * 2) {
              return false;
            }
          }
        }
        return true;
      });
      
      setObjetos(objetos_filtrados);
    } else if (herramienta_actual.tipo === 'pencil') {
      guardarEstadoHistorial();
      setDibujando(true);
      
      const nuevo_objeto: ObjetoCanvas = {
        tipo: herramienta_actual.tipo,
        puntos: [punto_ajustado.x, punto_ajustado.y],
        color: herramienta_actual.color,
        grosor: herramienta_actual.grosor,
        opacidad: herramienta_actual.opacidad,
      };
      setObjetos([...objetos, nuevo_objeto]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!dibujando) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const punto_ajustado = {
      x: (pos.x - offset.x) / zoom,
      y: (pos.y - offset.y) / zoom,
    };

    if (herramienta_actual.tipo === 'eraser') {
      const objetos_filtrados = objetos.filter(obj => {
        if (obj.tipo === 'pencil' || obj.tipo === 'eraser') {
          if (!obj.puntos) return true;
          
          for (let i = 0; i < obj.puntos.length; i += 2) {
            const px = obj.puntos[i];
            const py = obj.puntos[i + 1];
            const distancia = Math.sqrt(
              Math.pow(px - punto_ajustado.x, 2) + 
              Math.pow(py - punto_ajustado.y, 2)
            );
            
            if (distancia < herramienta_actual.grosor * 2) {
              return false;
            }
          }
        }
        return true;
      });
      
      setObjetos(objetos_filtrados);
    } else if (herramienta_actual.tipo === 'pencil') {
      const ultimo_objeto = objetos[objetos.length - 1];
      if (ultimo_objeto && ultimo_objeto.tipo === 'pencil') {
        const nuevos_puntos = ultimo_objeto.puntos!.concat([punto_ajustado.x, punto_ajustado.y]);
        const objetos_actualizados = objetos.slice(0, -1);
        setObjetos([...objetos_actualizados, { ...ultimo_objeto, puntos: nuevos_puntos }]);
      }
    }
  };

  const handleMouseUp = () => {
    setDibujando(false);
  };

  const agregarSimbolo = (simbologia: Simbologia) => {
    guardarEstadoHistorial();
    
    const nuevo_simbolo: ObjetoCanvas = {
      tipo: 'symbol',
      x: dimensiones_imagen.ancho / 2,
      y: dimensiones_imagen.alto / 2,
      ancho: 50,
      alto: 50,
      simbolo_id: simbologia.id,
      imagen_base64: simbologia.imagen_base64,
      color: herramienta_actual.color,
      grosor: 1,
      opacidad: herramienta_actual.opacidad,
    };
    
    setObjetos([...objetos, nuevo_simbolo]);
    toast({
      title: 'Símbolo agregado',
      description: `${simbologia.nombre} añadido al canvas`,
    });
  };

  const limpiarCanvas = () => {
    if (objetos.length === 0) return;
    
    if (confirm('¿Estás seguro de limpiar todo el canvas?')) {
      guardarEstadoHistorial();
      setObjetos([]);
    }
  };

  const exportarImagen = () => {
    if (!stage_ref.current) return;
    
    const uri = stage_ref.current.toDataURL();
    const link = document.createElement('a');
    link.download = `${archivo_nombre}_editado.png`;
    link.href = uri;
    link.click();
    
    toast({
      title: 'Imagen exportada',
      description: 'La imagen se descargó correctamente',
    });
  };

  const abrirDialogoGuardar = () => {
    if (!version_editar) {
      setNombreVersion(`Edición ${versiones.length + 1}`);
      setDescripcionVersion('');
    }
    setDialogoGuardarAbierto(true);
  };

  const guardarVersion = async () => {
    if (!stage_ref.current) return;
    
    setGuardando(true);
    try {
      const uri = stage_ref.current.toDataURL();
      const imagen_resultado = uri.split(',')[1];
      
      if (version_editar) {
        await edicionesImagenesApi.actualizar(version_editar.id, {
          nombre: nombre_version.trim() || undefined,
          descripcion: descripcion_version.trim() || undefined,
          datos_canvas: { objetos },
          imagen_resultado_base64: imagen_resultado,
        });
        
        toast({
          title: 'Versión actualizada',
          description: 'Los cambios se guardaron correctamente',
        });
      } else {
        await edicionesImagenesApi.crear({
          archivo_original_id: archivo_id,
          nombre: nombre_version.trim() || undefined,
          descripcion: descripcion_version.trim() || undefined,
          datos_canvas: { objetos },
          imagen_resultado_base64: imagen_resultado,
        });
        
        toast({
          title: 'Versión guardada',
          description: 'La edición se guardó correctamente',
        });
      }
      
      setDialogoGuardarAbierto(false);
      await cargarVersiones();
      onGuardar?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la versión',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cargarVersion = async (version: EdicionVersion) => {
    try {
      const datos = await edicionesImagenesApi.obtenerPorId(version.id);
      
      if (datos.datos_canvas && (datos.datos_canvas as any).objetos) {
        setObjetos((datos.datos_canvas as any).objetos);
        toast({
          title: 'Versión cargada',
          description: `Se cargó la versión ${version.version}`,
        });
        setDialogoVersionesAbierto(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la versión',
        variant: 'destructive',
      });
    }
  };

  const duplicarVersion = async (version: EdicionVersion) => {
    try {
      await edicionesImagenesApi.duplicar(version.id);
      toast({
        title: 'Versión duplicada',
        description: 'Se creó una copia de la versión',
      });
      await cargarVersiones();
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
      await cargarVersiones();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la versión',
        variant: 'destructive',
      });
    }
  };

  const renderizarObjeto = (obj: ObjetoCanvas, index: number) => {
    if (obj.tipo === 'pencil') {
      return (
        <Line
          key={index}
          points={obj.puntos}
          stroke={obj.color}
          strokeWidth={obj.grosor}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={obj.opacidad}
        />
      );
    }
    
    return null;
  };

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-12">
              <DialogTitle className="text-xl">
                {version_editar ? 'Editar Versión' : 'Editor de Imágenes'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {archivo_nombre}
                {version_editar && (
                  <Badge variant="outline" className="ml-2">
                    v{version_editar.version}
                  </Badge>
                )}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCerrar}
              className="hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r p-4 overflow-y-auto">
            <Tabs defaultValue="herramientas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="herramientas">Herramientas</TabsTrigger>
                <TabsTrigger value="simbolos">Símbolos</TabsTrigger>
              </TabsList>

              <TabsContent value="herramientas" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Herramientas de Dibujo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={herramienta_actual.tipo === 'pencil' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHerramientaActual({ ...herramienta_actual, tipo: 'pencil' })}
                      className="w-full"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={herramienta_actual.tipo === 'eraser' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHerramientaActual({ ...herramienta_actual, tipo: 'eraser' })}
                      className="w-full"
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={herramienta_actual.color}
                      onChange={(e) => setHerramientaActual({ ...herramienta_actual, color: e.target.value })}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={herramienta_actual.color}
                      onChange={(e) => setHerramientaActual({ ...herramienta_actual, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grosor">Grosor: {herramienta_actual.grosor}px</Label>
                  <Input
                    id="grosor"
                    type="range"
                    min="1"
                    max="50"
                    value={herramienta_actual.grosor}
                    onChange={(e) => setHerramientaActual({ ...herramienta_actual, grosor: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opacidad">Opacidad: {Math.round(herramienta_actual.opacidad * 100)}%</Label>
                  <Input
                    id="opacidad"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={herramienta_actual.opacidad}
                    onChange={(e) => setHerramientaActual({ ...herramienta_actual, opacidad: Number(e.target.value) })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="simbolos" className="space-y-2">
                {cargando_simbologias ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : simbologias.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay símbolos disponibles
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-2 pr-4">
                      {simbologias.map((simbologia) => (
                        <button
                          key={simbologia.id}
                          onClick={() => agregarSimbolo(simbologia)}
                          className="p-2 border rounded-lg hover:bg-secondary/50 transition-colors"
                          title={simbologia.descripcion || simbologia.nombre}
                        >
                          <img
                            src={`data:image/png;base64,${simbologia.imagen_base64}`}
                            alt={simbologia.nombre}
                            className="w-full h-16 object-contain"
                          />
                          <p className="text-xs text-center mt-1 truncate">{simbologia.nombre}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deshacer}
                  disabled={historial_deshacer.length === 0}
                  title="Deshacer"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rehacer}
                  disabled={historial_rehacer.length === 0}
                  title="Rehacer"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  title="Alejar"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  title="Acercar"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                  title="Resetear vista"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {!version_editar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogoVersionesAbierto(true)}
                    title="Ver versiones"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Versiones
                    {versiones.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {versiones.length}
                      </Badge>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpiarCanvas}
                  disabled={objetos.length === 0}
                  title="Limpiar canvas"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarImagen}
                  title="Exportar imagen"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={abrirDialogoGuardar}
                  title={version_editar ? "Guardar cambios" : "Guardar versión"}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {version_editar ? 'Guardar Cambios' : 'Guardar Versión'}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-secondary/10 p-4 flex items-center justify-center">
              <Stage
                ref={stage_ref}
                width={dimensiones_imagen.ancho * zoom}
                height={dimensiones_imagen.alto * zoom}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                scaleX={zoom}
                scaleY={zoom}
                className="border-2 border-border shadow-lg bg-white"
              >
                <Layer>
                  {imagen_cargada && (
                    <KonvaImage
                      image={imagen_cargada}
                      width={dimensiones_imagen.ancho}
                      height={dimensiones_imagen.alto}
                    />
                  )}
                </Layer>
                <Layer ref={layer_dibujo_ref}>
                  {objetos.map((obj, i) => renderizarObjeto(obj, i))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
      </DialogContent>

      <Dialog open={dialogo_guardar_abierto} onOpenChange={setDialogoGuardarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {version_editar ? 'Actualizar Versión' : 'Guardar Nueva Versión'}
            </DialogTitle>
            <DialogDescription>
              {version_editar 
                ? 'Actualiza los cambios realizados en esta versión'
                : 'Guarda esta edición como una nueva versión'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-version">Nombre (opcional)</Label>
              <Input
                id="nombre-version"
                value={nombre_version}
                onChange={(e) => setNombreVersion(e.target.value)}
                placeholder="Edición 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-version">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-version"
                value={descripcion_version}
                onChange={(e) => setDescripcionVersion(e.target.value)}
                placeholder="Describe los cambios realizados..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoGuardarAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={guardarVersion} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {version_editar ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_versiones_abierto} onOpenChange={setDialogoVersionesAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Versiones Guardadas</DialogTitle>
            <DialogDescription>
              Gestiona las versiones de edición de esta imagen
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {cargando_versiones ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : versiones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay versiones guardadas</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {versiones.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{version.version}</Badge>
                          <h4 className="font-semibold">
                            {version.nombre || `Versión ${version.version}`}
                          </h4>
                        </div>
                        {version.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Por {version.usuario.nombre} • {new Date(version.fecha_creacion).toLocaleString('es-BO')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cargarVersion(version)}
                          title="Cargar versión"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicarVersion(version)}
                          title="Duplicar versión"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarVersion(version)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                          title="Eliminar versión"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}