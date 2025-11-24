import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { ZoomIn, ZoomOut, RotateCw, FileText, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stage, Layer, Image as KonvaImage, Group, Circle, Text } from "react-konva";
import { edicionesImagenesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  tipo_mime: string;
  descripcion?: string;
  url?: string;
  fecha_subida?: string | Date;
}

interface ComentarioImagen {
    id: number;
    edicion_imagen_id: number;
    x: number;
    y: number;
    titulo: string;
    contenido: string;
    color: string;
    fecha_creacion: string;
    usuario?: {
      nombre: string;
    };
}

interface Props {
  archivo: ArchivoAdjunto;
  abierto: boolean;
  onCerrar: () => void;
  es_version?: boolean;
}

export function VisualizadorArchivos({ archivo, abierto, onCerrar, es_version = false }: Props) {
  const [zoom, setZoom] = useState(100);
  const [rotacion, setRotacion] = useState(0);
  const [comentarios, setComentarios] = useState<ComentarioImagen[]>([]);
  const [imagenCargada, setImagenCargada] = useState<HTMLImageElement | null>(null);
  const [dimensionesImagen, setDimensionesImagen] = useState({ ancho: 0, alto: 0 });
  const [hover_info, setHoverInfo] = useState<{ visible: boolean, x: number, y: number, comentario: ComentarioImagen | null }>({ 
      visible: false, x: 0, y: 0, comentario: null 
  });

  useEffect(() => {
    if (abierto && es_version && archivo.id) {
        cargarComentarios(archivo.id);
    } else {
        setComentarios([]);
    }
    
    if (abierto) {
        setZoom(100);
        setRotacion(0);
        setHoverInfo({ visible: false, x: 0, y: 0, comentario: null });
    }
  }, [abierto, es_version, archivo]);

  const es_imagen = archivo.tipo_mime.startsWith('image/');

  useEffect(() => {
      if (abierto && es_imagen && archivo.url) {
          const img = new window.Image();
          img.src = archivo.url;
          img.onload = () => {
              setImagenCargada(img);
              setDimensionesImagen({ ancho: img.width, alto: img.height });
          };
      } else {
          setImagenCargada(null);
      }
  }, [abierto, archivo, es_imagen]);

  const cargarComentarios = async (edicion_id: number) => {
      try {
          const datos = await edicionesImagenesApi.obtenerComentarios(edicion_id);
          setComentarios(datos);
      } catch (error) {
          console.error("Error al cargar comentarios:", error);
      }
  };

  const aumentarZoom = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const disminuirZoom = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const rotar = () => {
    setRotacion(prev => (prev + 90) % 360);
  };

  const resetearVista = () => {
    setZoom(100);
    setRotacion(0);
  };

  const es_pdf = archivo.tipo_mime === 'application/pdf';

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogDescription className="sr-only">
          Vista previa del archivo seleccionado.
        </DialogDescription>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{archivo.nombre_archivo}</DialogTitle>
            <div className="flex gap-2 items-center">
              {es_imagen && (
                <>
                  {(zoom !== 100 || rotacion !== 0) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetearVista}
                      className="mr-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 shadow-sm transition-all duration-200"
                    >
                      <RotateCcw className="h-3 w-3 mr-2" />
                      Resetear
                    </Button>
                  )}
                  
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
                </>
              )}
            </div>
          </div>
          {archivo.descripcion && (
            <p className="text-sm text-muted-foreground mt-2">{archivo.descripcion}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-secondary/10 rounded-lg p-4 min-h-[400px] max-h-[600px] relative">
          {es_imagen && imagenCargada ? (
            <div className="flex items-center justify-center min-h-full min-w-full">
               <Stage
                  width={
                    (rotacion % 180 === 0
                      ? dimensionesImagen.ancho
                      : dimensionesImagen.alto) * (zoom / 100)
                  }
                  height={
                    (rotacion % 180 === 0
                      ? dimensionesImagen.alto
                      : dimensionesImagen.ancho) * (zoom / 100)
                  }
                  scaleX={zoom / 100}
                  scaleY={zoom / 100}
                  className="shadow-lg bg-white"
                >
                  <Layer>
                      <KonvaImage
                        image={imagenCargada}
                        width={dimensionesImagen.ancho}
                        height={dimensionesImagen.alto}
                        rotation={rotacion}
                        x={
                          rotacion === 90
                            ? dimensionesImagen.alto
                            : rotacion === 180
                              ? dimensionesImagen.ancho
                              : rotacion === 270
                                ? 0
                                : 0
                        }
                        y={
                          rotacion === 90
                            ? 0
                            : rotacion === 180
                              ? dimensionesImagen.alto
                              : rotacion === 270
                                ? dimensionesImagen.ancho
                                : 0
                        }
                      />
                  </Layer>
                  {es_version && comentarios.length > 0 && (
                      <Layer>
                           {comentarios.map((comentario) => (
                            <Group 
                                key={comentario.id}
                                x={comentario.x} 
                                y={comentario.y}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) {
                                        stage.container().style.cursor = "pointer";
                                        const pointerPos = stage.getPointerPosition();
                                        if (pointerPos) {
                                            const containerRect = stage.container().getBoundingClientRect();
                                            setHoverInfo({
                                                visible: true,
                                                x: containerRect.left + pointerPos.x,
                                                y: containerRect.top + pointerPos.y,
                                                comentario: comentario
                                            });
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) {
                                        stage.container().style.cursor = "default";
                                    }
                                    setHoverInfo({ ...hover_info, visible: false, comentario: null });
                                }}
                            >
                                <Circle 
                                    radius={12} 
                                    fill={comentario.color} 
                                    shadowColor="black"
                                    shadowBlur={5}
                                    shadowOpacity={0.3}
                                />
                                <Circle radius={10} fill="white" opacity={0.2} />
                                <Text
                                    text="!"
                                    fontSize={14}
                                    fontStyle="bold"
                                    fill="white"
                                    align="center"
                                    verticalAlign="middle"
                                    x={-4}
                                    y={-7}
                                    listening={false}
                                />
                            </Group>
                        ))}
                      </Layer>
                  )}
                </Stage>
            </div>
          ) : es_pdf && archivo.url ? (
            <div className="h-full">
              <iframe
                src={archivo.url}
                className="w-full h-full min-h-[500px] rounded border-0"
                title={archivo.nombre_archivo}
              />
            </div>
          ) : !es_imagen && !es_pdf && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Vista previa no disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Este tipo de archivo no se puede visualizar en el navegador
                  </p>
                </div>
              </div>
            </div>
          )}

           {hover_info.visible && hover_info.comentario && createPortal(
                  <div 
                    style={{ 
                        position: 'fixed', 
                        top: (window.innerHeight - hover_info.y < 200) ? undefined : hover_info.y + 20,
                        bottom: (window.innerHeight - hover_info.y < 200) ? window.innerHeight - hover_info.y + 20 : undefined,
                        left: hover_info.x - 100, 
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                  >
                      <Card className="w-64 shadow-xl border-2 animate-in fade-in zoom-in duration-200">
                          <CardHeader className="p-3 pb-1">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hover_info.comentario.color }} />
                                  <CardTitle className="text-sm font-bold truncate">{hover_info.comentario.titulo}</CardTitle>
                              </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                              <p className="text-xs text-muted-foreground line-clamp-3">{hover_info.comentario.contenido}</p>
                          </CardContent>
                      </Card>
                  </div>,
                  document.body
              )}
        </div>

        {es_imagen && (
          <div className="text-center text-sm text-muted-foreground pt-2">
            Zoom: {zoom}%
            {rotacion > 0 && ` • Rotación: ${rotacion}°`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}