import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useState } from 'react';

interface ArchivoAdjunto {
  id: number;
  nombre_archivo: string;
  tipo_mime: string;
  descripcion?: string;
  url?: string;
  fecha_subida: string;
}

interface Props {
  archivo: ArchivoAdjunto;
  abierto: boolean;
  onCerrar: () => void;
}

export function VisualizadorArchivosMovil({ archivo, abierto, onCerrar }: Props) {
  const [zoom, setZoom] = useState(100);
  const [rotacion, setRotacion] = useState(0);

  const descargar = () => {
    if (archivo.url) {
      const enlace = document.createElement('a');
      enlace.href = archivo.url;
      enlace.download = archivo.nombre_archivo;
      enlace.target = '_blank';
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
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

  const es_imagen = archivo.tipo_mime.startsWith('image/');
  const es_pdf = archivo.tipo_mime === 'application/pdf';

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4 text-sm md:text-base">{archivo.nombre_archivo}</DialogTitle>
            <div className="flex gap-1 md:gap-2">
              {es_imagen && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={disminuirZoom}
                    disabled={zoom <= 50}
                    title="Alejar"
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={aumentarZoom}
                    disabled={zoom >= 200}
                    title="Acercar"
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={rotar}
                    title="Rotar"
                    className="h-8 w-8"
                  >
                    <RotateCw className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  {(zoom !== 100 || rotacion !== 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetearVista}
                      className="text-xs h-8"
                    >
                      Reset
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={descargar}
                title="Descargar"
                className="h-8 w-8"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
          {archivo.descripcion && (
            <p className="text-xs md:text-sm text-muted-foreground mt-2">{archivo.descripcion}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-secondary/10 rounded-lg p-4 min-h-[300px] max-h-[500px]">
          {es_imagen && archivo.url && (
            <div className="flex items-center justify-center h-full">
              <img
                src={archivo.url}
                alt={archivo.nombre_archivo}
                className="max-w-full h-auto object-contain transition-all duration-300"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotacion}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </div>
          )}

          {es_pdf && archivo.url && (
            <div className="h-full">
              <iframe
                src={archivo.url}
                className="w-full h-full min-h-[300px] rounded border-0"
                title={archivo.nombre_archivo}
              />
            </div>
          )}

          {!es_imagen && !es_pdf && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                  <Download className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold">Vista previa no disponible</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Descarga el archivo para verlo
                  </p>
                </div>
                <Button onClick={descargar} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          )}
        </div>

        {es_imagen && (
          <div className="text-center text-xs md:text-sm text-muted-foreground pt-2">
            Zoom: {zoom}%
            {rotacion > 0 && ` • Rotación: ${rotacion}°`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
