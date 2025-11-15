import { useState, useEffect, useRef } from 'react';
import { Button } from '@/componentes/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Label } from '@/componentes/ui/label';
import { Input } from '@/componentes/ui/input';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Switch } from '@/componentes/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { plantillasConsentimientoApi, archivosApi, catalogoApi } from '@/lib/api';
import { PlantillaConsentimiento } from '@/tipos';
import { useToast } from '@/hooks/use-toast';
import { FileText, Settings } from 'lucide-react';
import { RenderizadorHtml } from '@/componentes/ui/renderizador-html';
import { HexColorPicker } from 'react-colorful';
import { useReactToPrint } from 'react-to-print';

interface GeneradorConsentimientoPacienteProps {
  paciente_id: number;
  paciente_nombre: string;
  paciente_apellidos: string;
  paciente_telefono?: string;
  paciente_correo?: string;
  paciente_direccion?: string;
  onConsentimientoGenerado?: () => void;
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
  mostrar_caja?: boolean;
  color_caja?: string;
}

export function GeneradorConsentimientoPaciente({
  paciente_id,
  paciente_nombre,
  paciente_apellidos,
  paciente_telefono,
  paciente_correo,
  paciente_direccion,
  onConsentimientoGenerado
}: GeneradorConsentimientoPacienteProps) {
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaConsentimiento[]>([]);
  const [plantillas_filtradas, setPlantillasFiltradas] = useState<PlantillaConsentimiento[]>([]);
  const [filtro_busqueda, setFiltroBusqueda] = useState('');
  const [plantilla_seleccionada, setPlantillaSeleccionada] = useState<PlantillaConsentimiento | null>(null);
  const [etiquetas_personalizadas, setEtiquetasPersonalizadas] = useState<EtiquetaPersonalizada[]>([]);
  const [valores_etiquetas, setValoresEtiquetas] = useState<ValorEtiqueta[]>([]);
  const [vista_previa, setVistaPrevia] = useState(false);
  const [mostrar_cajas_etiquetas, setMostrarCajasEtiquetas] = useState(true);
  const [color_cajas_global, setColorCajasGlobal] = useState('#dbeafe');
  const [usar_colores_individuales, setUsarColoresIndividuales] = useState(false);
  const [nombre_archivo, setNombreArchivo] = useState('');
  const [margenes, setMargenes] = useState({
    superior: 20,
    inferior: 20,
    izquierdo: 20,
    derecho: 20,
  });
  const { toast } = useToast();
  const contenido_imprimible_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialogo_abierto) {
      cargarPlantillas();
      cargarEtiquetasPersonalizadas();
    }
  }, [dialogo_abierto]);

  useEffect(() => {
    filtrarPlantillas();
  }, [filtro_busqueda, plantillas]);

  useEffect(() => {
    if (plantilla_seleccionada) {
      extraerYPrepararEtiquetas();
      setMargenes({
        superior: plantilla_seleccionada.margen_superior || 20,
        inferior: plantilla_seleccionada.margen_inferior || 20,
        izquierdo: plantilla_seleccionada.margen_izquierdo || 20,
        derecho: plantilla_seleccionada.margen_derecho || 20,
      });
      const fecha = new Date().toISOString().split('T')[0];
      setNombreArchivo(`Consentimiento_${plantilla_seleccionada.nombre}_${fecha}`);
    }
  }, [plantilla_seleccionada]);

  const cargarPlantillas = async () => {
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
    }
  };

  const filtrarPlantillas = () => {
    if (!filtro_busqueda.trim()) {
      setPlantillasFiltradas(plantillas);
      return;
    }

    const termino = filtro_busqueda.toLowerCase();
    const filtradas = plantillas.filter(plantilla =>
      plantilla.nombre.toLowerCase().includes(termino)
    );
    setPlantillasFiltradas(filtradas);
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

  const extraerYPrepararEtiquetas = () => {
    if (!plantilla_seleccionada) return;

    const codigos_etiquetas = extraerEtiquetasDelContenido(plantilla_seleccionada.contenido);
    
    const valores: ValorEtiqueta[] = codigos_etiquetas.map(codigo => {
      const etiqueta_encontrada = etiquetas_personalizadas.find(e => e.codigo === codigo);
      return {
        codigo,
        nombre: etiqueta_encontrada?.nombre || codigo,
        valor: obtenerValorPredeterminado(codigo),
        mostrar_caja: true,
        color_caja: '#dbeafe',
      };
    });

    setValoresEtiquetas(valores);
  };

  const obtenerValorPredeterminado = (codigo: string): string => {
    switch (codigo) {
      case '[PACIENTE_NOMBRE]':
        return paciente_nombre;
      case '[PACIENTE_APELLIDOS]':
        return paciente_apellidos;
      case '[PACIENTE_TELEFONO]':
        return paciente_telefono || '';
      case '[PACIENTE_CORREO]':
        return paciente_correo || '';
      case '[PACIENTE_DIRECCION]':
        return paciente_direccion || '';
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

    valores_etiquetas.forEach(({ codigo, valor, mostrar_caja, color_caja }) => {
      const regex_etiqueta = new RegExp(
        `<span[^>]*data-etiqueta="${codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]*)<\\/span>`,
        'g'
      );
      const debe_mostrar_caja = usar_colores_individuales ? (mostrar_caja !== false) : mostrar_cajas_etiquetas;
      const color_a_usar = usar_colores_individuales ? (color_caja || '#dbeafe') : color_cajas_global;
      if (debe_mostrar_caja) {
        contenido_procesado = contenido_procesado.replace(regex_etiqueta, (match) => {
          const styleMatch = match.match(/style="([^"]*)"/);
          let existingStyles = styleMatch ? styleMatch[1] : '';
          existingStyles = existingStyles.replace(/background-color:[^;]+(;|$)/g, '');
          existingStyles += `; background-color: ${color_a_usar};`;
          return match
            .replace(/style="[^"]*"/, `style="${existingStyles}"`)
            .replace(/>[^<]*<\/span>/, `>${valor}</span>`);
        });
      } else {
        contenido_procesado = contenido_procesado.replace(regex_etiqueta, (match) => {
          const styleMatch = match.match(/style="([^"]*)"/);
          if (styleMatch) {
            let textStyles = styleMatch[1];
            textStyles = textStyles.replace(/background-color:[^;]+(;|$)/g, '');
            textStyles = textStyles.replace(/border:[^;]+(;|$)/g, '');
            textStyles = textStyles.replace(/padding:[^;]+(;|$)/g, '');
            textStyles = textStyles.replace(/margin:[^;]+(;|$)/g, '');
            textStyles = textStyles.replace(/border-radius:[^;]+(;|$)/g, '');
            textStyles = textStyles.replace(/display:[^;]+(;|$)/g, '');
            textStyles = textStyles.trim();
            if (textStyles) {
              return `<span style="${textStyles}">${valor}</span>`;
            }
          }
          return `<span>${valor}</span>`;
        });
      }
      const regex_simple = new RegExp(codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      contenido_procesado = contenido_procesado.replace(regex_simple, valor);
    });

    return contenido_procesado;
  };

  const manejarGenerarPDF = () => {
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

    generarYGuardarConsentimiento();
  };

  const generarYGuardarConsentimiento = useReactToPrint({
    contentRef: contenido_imprimible_ref,
    documentTitle: nombre_archivo.trim() || `Consentimiento_${plantilla_seleccionada?.nombre}_${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: async () => {
      try {
        toast({
          title: 'PDF generado',
          description: 'El consentimiento se ha generado. Nota: Debes guardarlo manualmente como PDF desde el diálogo de impresión.',
        });

        setDialogoAbierto(false);
        setPlantillaSeleccionada(null);
        setValoresEtiquetas([]);
        setVistaPrevia(false);
        setNombreArchivo('');

        if (onConsentimientoGenerado) {
          onConsentimientoGenerado();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    },
    pageStyle: `
      @page {
        size: A4;
        margin: ${margenes.superior}mm ${margenes.derecho}mm ${margenes.inferior}mm ${margenes.izquierdo}mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <>
      <Button onClick={() => setDialogoAbierto(true)} className="gap-2">
        <FileText className="h-4 w-4" />
        Generar Consentimiento
      </Button>

      <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generar Consentimiento Informado</DialogTitle>
            <DialogDescription>
              Para {paciente_nombre} {paciente_apellidos}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {!plantilla_seleccionada ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Seleccionar plantilla</Label>
                    <Input
                      placeholder="Buscar plantilla..."
                      value={filtro_busqueda}
                      onChange={(e) => setFiltroBusqueda(e.target.value)}
                      className="mb-3"
                    />
                  </div>
                  {plantillas_filtradas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>
                        {filtro_busqueda 
                          ? 'No se encontraron plantillas con ese nombre' 
                          : 'No hay plantillas disponibles'}
                      </p>
                      {!filtro_busqueda && (
                        <p className="text-sm">Crea una plantilla primero en la sección de Inicio</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {plantillas_filtradas.map((plantilla) => (
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

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <Label className="text-base font-semibold">Opciones de formato del PDF</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nombre-archivo" className="text-sm font-medium">Nombre del archivo</Label>
                        <Input
                          id="nombre-archivo"
                          value={nombre_archivo}
                          onChange={(e) => setNombreArchivo(e.target.value)}
                          placeholder="Nombre del archivo PDF (sin extensión)"
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">
                          El archivo se guardará como: <strong>{nombre_archivo || 'Consentimiento'}.pdf</strong>
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Márgenes (mm)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="margen-superior" className="text-xs">Superior</Label>
                            <Input
                              id="margen-superior"
                              type="number"
                              min="0"
                              max="50"
                              value={margenes.superior}
                              onChange={(e) => setMargenes({ ...margenes, superior: Number(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="margen-inferior" className="text-xs">Inferior</Label>
                            <Input
                              id="margen-inferior"
                              type="number"
                              min="0"
                              max="50"
                              value={margenes.inferior}
                              onChange={(e) => setMargenes({ ...margenes, inferior: Number(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="margen-izquierdo" className="text-xs">Izquierdo</Label>
                            <Input
                              id="margen-izquierdo"
                              type="number"
                              min="0"
                              max="50"
                              value={margenes.izquierdo}
                              onChange={(e) => setMargenes({ ...margenes, izquierdo: Number(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="margen-derecho" className="text-xs">Derecho</Label>
                            <Input
                              id="margen-derecho"
                              type="number"
                              min="0"
                              max="50"
                              value={margenes.derecho}
                              onChange={(e) => setMargenes({ ...margenes, derecho: Number(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="mostrar-cajas-config"
                            checked={mostrar_cajas_etiquetas}
                            onCheckedChange={(checked) => {
                              setMostrarCajasEtiquetas(checked);
                              if (!checked) {
                                setUsarColoresIndividuales(false);
                              }
                            }}
                          />
                          <Label htmlFor="mostrar-cajas-config" className="text-sm cursor-pointer">
                            Mostrar cajas de etiquetas en el PDF
                          </Label>
                        </div>
                        
                        {mostrar_cajas_etiquetas && (
                          <div className="ml-6 space-y-3 pl-4 border-l-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="usar-color-global"
                                checked={!usar_colores_individuales}
                                onCheckedChange={(checked) => setUsarColoresIndividuales(!checked)}
                              />
                              <Label htmlFor="usar-color-global" className="text-sm cursor-pointer">
                                Usar el mismo color para todas las cajas
                              </Label>
                            </div>
                            
                            {!usar_colores_individuales ? (
                              <div className="ml-6 flex items-center gap-2">
                                <Label className="text-xs">Color de las cajas:</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 w-20"
                                    >
                                      <div 
                                        className="w-4 h-4 rounded border border-border mr-1"
                                        style={{ backgroundColor: color_cajas_global }}
                                      />
                                      Color
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-3">
                                    <HexColorPicker 
                                      color={color_cajas_global}
                                      onChange={setColorCajasGlobal}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : (
                              <div className="ml-6 space-y-2">
                                <Label className="text-xs font-medium">Configurar color por etiqueta:</Label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                  {valores_etiquetas.map((etiqueta) => (
                                    <div key={etiqueta.codigo} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20">
                                      <Switch
                                        id={`mostrar-${etiqueta.codigo}`}
                                        checked={etiqueta.mostrar_caja !== false}
                                        onCheckedChange={(checked) => {
                                          setValoresEtiquetas(prev => 
                                            prev.map(e => 
                                              e.codigo === etiqueta.codigo 
                                                ? { ...e, mostrar_caja: checked }
                                                : e
                                            )
                                          );
                                        }}
                                      />
                                      <Label htmlFor={`mostrar-${etiqueta.codigo}`} className="flex-1 text-xs cursor-pointer">
                                        {etiqueta.nombre}
                                      </Label>
                                      {etiqueta.mostrar_caja !== false && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-7 w-16"
                                            >
                                              <div 
                                                className="w-3 h-3 rounded border border-border mr-1"
                                                style={{ backgroundColor: etiqueta.color_caja || '#dbeafe' }}
                                              />
                                              <span className="text-xs">Color</span>
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-64 p-3">
                                            <HexColorPicker 
                                              color={etiqueta.color_caja || '#dbeafe'}
                                              onChange={(color) => {
                                                setValoresEtiquetas(prev => 
                                                  prev.map(e => 
                                                    e.codigo === etiqueta.codigo 
                                                      ? { ...e, color_caja: color }
                                                      : e
                                                  )
                                                );
                                              }}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Vista previa del contenido</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVistaPrevia(!vista_previa)}
                        >
                          {vista_previa ? 'Ocultar' : 'Mostrar'} vista previa
                        </Button>
                      </div>
                      
                      {vista_previa && (
                        <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-white">
                          <RenderizadorHtml contenido={procesarContenidoConValores()} />
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
                setDialogoAbierto(false);
                setPlantillaSeleccionada(null);
                setValoresEtiquetas([]);
                setVistaPrevia(false);
                setNombreArchivo('');
              }}
            >
              Cancelar
            </Button>
            {plantilla_seleccionada && (
              <Button 
                onClick={manejarGenerarPDF} 
                disabled={valores_etiquetas.some(e => !e.valor.trim())}
              >
                Generar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div style={{ display: 'none' }}>
        <div ref={contenido_imprimible_ref}>
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: ${margenes.superior}mm ${margenes.derecho}mm ${margenes.inferior}mm ${margenes.izquierdo}mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #000000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                page-break-inside: avoid;
              }
              p {
                margin: 0.5em 0;
                line-height: 1.6;
                white-space: pre-wrap;
                page-break-inside: avoid;
              }
              p:empty {
                min-height: 1.6em;
              }
              br {
                display: block;
                content: "";
                margin: 0.8em 0;
              }
              ul, ol {
                margin: 1em 0;
                padding-left: 2em;
                list-style-position: outside;
                color: currentColor;
                page-break-inside: avoid;
              }
              ul {
                list-style-type: disc;
              }
              ol {
                list-style-type: decimal;
              }
              li {
                margin: 0.5em 0;
                line-height: 1.6;
                display: list-item;
                color: currentColor;
                white-space: pre-wrap;
              }
              li::marker {
                color: currentColor;
              }
              strong {
                font-weight: bold;
              }
              em {
                font-style: italic;
              }
              u {
                text-decoration: underline;
              }
              s {
                text-decoration: line-through;
              }
              h1 {
                font-size: 2em;
                font-weight: bold;
                margin: 0.67em 0;
                page-break-after: avoid;
              }
              h2 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 0.75em 0;
                page-break-after: avoid;
              }
              h3 {
                font-size: 1.17em;
                font-weight: bold;
                margin: 0.83em 0;
                page-break-after: avoid;
              }
              [style*="text-align: center"] {
                text-align: center;
              }
              [style*="text-align: right"] {
                text-align: right;
              }
              [style*="text-align: left"] {
                text-align: left;
              }
              ul[style*="text-align: center"],
              ol[style*="text-align: center"] {
                display: table;
                text-align: left;
                list-style-position: outside;
                padding-left: 2em;
                margin-left: auto;
                margin-right: auto;
              }
              ul[style*="text-align: right"],
              ol[style*="text-align: right"] {
                display: table;
                text-align: left;
                list-style-position: outside;
                padding-left: 2em;
                margin-left: auto;
                margin-right: 0;
              }
              ul[style*="text-align: center"] li,
              ol[style*="text-align: center"] li,
              ul[style*="text-align: right"] li,
              ol[style*="text-align: right"] li {
                text-align: left;
              }
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: plantilla_seleccionada ? procesarContenidoConValores() : '' }} />
        </div>
      </div>
    </>
  );
}
