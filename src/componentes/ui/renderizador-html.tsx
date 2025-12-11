import { cn } from '@/lib/utilidades';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff,
  Palette,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ValorEtiqueta {
  codigo: string;
  valor: string;
  color?: string;
  mostrar_caja?: boolean;
}

interface RenderizadorHtmlProps {
  contenido: string;
  className?: string;
  modoDocumento?: boolean;
  tamanoPapel?: 'carta' | 'legal' | 'a4';
  margenes?: { top: number; right: number; bottom: number; left: number };
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
  escala?: number;
  modoInteractivo?: boolean;
  onEstablecerEtiqueta?: (codigo: string) => void;
  modoPlantilla?: boolean;
  valoresEtiquetas?: ValorEtiqueta[];
}

export function RenderizadorHtml({ 
  contenido, 
  className, 
  modoDocumento = false, 
  tamanoPapel = 'carta', 
  margenes, 
  tamanoPersonalizado = null,
  escala: escalaInicial = 1,
  modoInteractivo = false,
  onEstablecerEtiqueta,
  modoPlantilla = false,
  valoresEtiquetas = []
}: RenderizadorHtmlProps) {
  
  const [contenidoLocal, setContenidoLocal] = useState(contenido);
  const [paginas, setPaginas] = useState<string[]>([]);
  const [htmlParaMostrar, setHtmlParaMostrar] = useState(contenido);
  const measurerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados para controles de documento
  const [zoom, setZoom] = useState(escalaInicial);
  const [mostrarMargenes, setMostrarMargenes] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  
  // Estados para modo interactivo
  const [colorEtiquetas, setColorEtiquetas] = useState('#dbeafe'); // Color por defecto (celeste claro)
  const [colorBordeEtiquetas, setColorBordeEtiquetas] = useState('#93c5fd'); // Color borde por defecto

  useEffect(() => {
    let nuevoContenido = contenido;

    if (modoPlantilla && valoresEtiquetas.length > 0) {
      valoresEtiquetas.forEach(({ codigo, valor, color, mostrar_caja }) => {
        // Reemplazo de etiquetas span data-etiqueta
        const regexEtiqueta = new RegExp(
          `<span[^>]*data-etiqueta="${codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]*)<\\/span>`,
          'g'
        );
        
        nuevoContenido = nuevoContenido.replace(regexEtiqueta, (match) => {
          const styleMatch = match.match(/style="([^"]*)"/);
          let existingStyles = styleMatch ? styleMatch[1] : '';
          
          // Limpiar estilos previos conflictivos
          existingStyles = existingStyles.replace(/background-color:[^;]+(;|$)/g, '');
          
          if (mostrar_caja !== false) {
             const colorFondo = color || colorEtiquetas;
             existingStyles += `; background-color: ${colorFondo};`;
             // Asegurar que se vea como etiqueta
             if (!existingStyles.includes('padding')) existingStyles += '; padding: 0 4px; border-radius: 4px;';
          } else {
             // Si no se muestra caja, limpiar estilos de caja
             existingStyles = existingStyles.replace(/border:[^;]+(;|$)/g, '');
             existingStyles = existingStyles.replace(/padding:[^;]+(;|$)/g, '');
             existingStyles = existingStyles.replace(/border-radius:[^;]+(;|$)/g, '');
          }

          return match
            .replace(/style="[^"]*"/, `style="${existingStyles}"`)
            .replace(/>[^<]*<\/span>/, `>${valor || match.match(/>([^<]*)<\/span>/)?.[1] || ''}</span>`);
        });

        // Reemplazo de texto simple {{CODIGO}}
        const regexSimple = new RegExp(codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        nuevoContenido = nuevoContenido.replace(regexSimple, valor);
      });
    }

    setContenidoLocal(nuevoContenido);
  }, [contenido, modoPlantilla, valoresEtiquetas, colorEtiquetas]);

  useEffect(() => {
    setZoom(escalaInicial);
  }, [escalaInicial]);

  const mmToPx = (mm: number) => (mm / 25.4) * 96;
  
  const PAGE = useMemo(() => {
    const base = tamanoPersonalizado
      ? { widthMm: tamanoPersonalizado.widthMm, heightMm: tamanoPersonalizado.heightMm }
      : tamanoPapel === 'carta'
        ? { widthMm: 216, heightMm: 279 }
        : tamanoPapel === 'legal'
          ? { widthMm: 216, heightMm: 356 }
          : { widthMm: 210, heightMm: 297 };
          
    const m = margenes || { top: 20, right: 20, bottom: 20, left: 20 };
    
    return {
      widthMm: base.widthMm,
      heightMm: base.heightMm,
      paddingTop: mmToPx(m.top),
      paddingBottom: mmToPx(m.bottom),
      paddingLeft: mmToPx(m.left),
      paddingRight: mmToPx(m.right),
      marginTop: m.top,
      marginBottom: m.bottom,
      marginLeft: m.left,
      marginRight: m.right
    };
  }, [tamanoPapel, margenes, tamanoPersonalizado]);

  const pageWidthPx = Math.round(mmToPx(PAGE.widthMm));
  const pageHeightPx = Math.round(mmToPx(PAGE.heightMm));
  
  const contentAreaHeight = pageHeightPx - PAGE.paddingTop - PAGE.paddingBottom;
  const contentAreaWidth = pageWidthPx - PAGE.paddingLeft - PAGE.paddingRight;

  useEffect(() => {
    if (!measurerRef.current) return;

    const procesarContenido = () => {
      const container = measurerRef.current!;
      
      // 1. Procesar etiquetas interactivas (botones)
      if (modoInteractivo && !modoPlantilla) {
        const etiquetas = container.querySelectorAll('span[data-etiqueta]');
        etiquetas.forEach((etiqueta: Element) => {
            const el = etiqueta as HTMLElement;
            
            // Verificar si ya tiene botón
            if (el.nextElementSibling?.classList.contains('btn-establecer-etiqueta')) {
                const btn = el.nextElementSibling as HTMLElement;
                btn.style.display = 'inline-flex';
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'btn-establecer-etiqueta ml-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-sm';
            btn.textContent = 'Establecer';
            btn.setAttribute('data-codigo', el.getAttribute('data-codigo') || '');
            btn.type = 'button'; 
            
            el.after(btn);
        });
      }

      // Actualizar HTML para modo normal
      setHtmlParaMostrar(container.innerHTML);

      // 2. Calcular paginación (Solo si es modo documento)
      if (modoDocumento) {
        const children = Array.from(container.children) as HTMLElement[];
        const newPages: string[] = [];
        let currentPageNodes: HTMLElement[] = [];
        let currentHeight = 0;

        children.forEach(child => {
            const style = window.getComputedStyle(child);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            const childHeight = child.offsetHeight + marginTop + marginBottom;

            if (currentHeight + childHeight > contentAreaHeight && currentPageNodes.length > 0) {
                newPages.push(currentPageNodes.map(n => n.outerHTML).join(''));
                currentPageNodes = [child];
                currentHeight = childHeight;
            } else {
                currentPageNodes.push(child);
                currentHeight += childHeight;
            }
        });

        if (currentPageNodes.length > 0) {
            newPages.push(currentPageNodes.map(n => n.outerHTML).join(''));
        }
        
        setPaginas(newPages);
      }
    };

    const timer = setTimeout(procesarContenido, 50);
    return () => clearTimeout(timer);

  }, [contenidoLocal, modoDocumento, contentAreaHeight, modoInteractivo, modoPlantilla]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('btn-establecer-etiqueta')) {
      e.preventDefault();
      e.stopPropagation();
      const codigo = target.getAttribute('data-codigo');
      if (codigo) {
        if (onEstablecerEtiqueta) {
            onEstablecerEtiqueta(codigo);
        }
        expandirEtiqueta(codigo);
      }
    }
  };

  const expandirEtiqueta = (codigo: string) => {
    const div = document.createElement('div');
    div.innerHTML = contenidoLocal;
    
    const tags = div.querySelectorAll(`span[data-codigo="${codigo}"]`);
    let changed = false;
    
    tags.forEach(tag => {
        const texto = tag.getAttribute('data-texto');
        if (texto) {
            const span = document.createElement('span');
            span.innerHTML = texto;
            tag.replaceWith(...Array.from(span.childNodes));
            changed = true;
        }
    });

    if (changed) {
        setContenidoLocal(div.innerHTML);
    }
  };

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= paginas.length) {
        setPaginaActual(pagina);
        const el = document.getElementById(`pagina-${pagina-1}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  const contentStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    width: '100%',
    fontFamily: 'Arial, sans-serif',
    fontSize: '11pt',
    lineHeight: '1.5',
    color: modoDocumento ? '#000' : 'inherit',
    textAlign: 'left'
  };

  if (!contenido) return null;

  return (
    <div 
        className={cn(
            'flex flex-col w-full h-full', 
            className
        )}
        onClick={handleContainerClick}
    >
      {/* Barra de herramientas para Modo Documento */}
      {modoDocumento && (
        <div className="flex items-center justify-between mb-0 p-2 bg-background/80 backdrop-blur border-b shadow-sm z-10">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Reducir Zoom">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} title="Aumentar Zoom">
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-2" />
                <Button 
                    variant={mostrarMargenes ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setMostrarMargenes(!mostrarMargenes)}
                    title={mostrarMargenes ? "Ocultar Márgenes" : "Mostrar Márgenes"}
                >
                    {mostrarMargenes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    <span className="text-xs hidden sm:inline">Márgenes</span>
                </Button>
            </div>
            
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={paginaActual <= 1}
                    onClick={() => irAPagina(paginaActual - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    <span className="text-xs">Página</span>
                    <Input 
                        className="h-6 w-12 text-center px-1" 
                        value={paginaActual} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) irAPagina(val);
                        }}
                    />
                    <span className="text-xs">de {paginas.length}</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={paginaActual >= paginas.length}
                    onClick={() => irAPagina(paginaActual + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      )}

      {/* Barra de herramientas para Modo Interactivo (Etiquetas) */}
      {modoInteractivo && (
        <div className="flex items-center gap-4 p-3 bg-blue-50/50 border-b border-blue-100">
            <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Color de Etiquetas:</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className={cn(
                        "w-6 h-6 rounded-full border transition-all",
                        colorEtiquetas === '#dbeafe' ? "ring-2 ring-offset-2 ring-blue-400" : ""
                    )}
                    style={{ backgroundColor: '#dbeafe', borderColor: '#93c5fd' }}
                    onClick={() => { setColorEtiquetas('#dbeafe'); setColorBordeEtiquetas('#93c5fd'); }}
                    title="Por defecto (Azul)"
                />
                <button
                    className={cn(
                        "w-6 h-6 rounded-full border transition-all",
                        colorEtiquetas === '#ffffff' ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    )}
                    style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                    onClick={() => { setColorEtiquetas('#ffffff'); setColorBordeEtiquetas('#e5e7eb'); }}
                    title="Blanco (Limpio)"
                />
            </div>
        </div>
      )}

      {/* Contenedor oculto para mediciones */}
      <div 
        style={{ 
          ...contentStyle,
          position: 'absolute', 
          visibility: 'hidden', 
          pointerEvents: 'none',
          width: modoDocumento ? contentAreaWidth : '100%',
          left: 0, 
          top: 0
        }}
        ref={measurerRef}
        className="renderizador-contenido"
        dangerouslySetInnerHTML={{ __html: contenidoLocal }}
      />

      <style>{`
        .renderizador-contenido {
            font-variant-ligatures: none;
        }
        .renderizador-contenido p { margin: 0 0 1em 0; white-space: pre-wrap; }
        .renderizador-contenido h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .renderizador-contenido h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        .renderizador-contenido h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        
        /* Corrección de Listas */
        .renderizador-contenido ul, 
        .renderizador-contenido ol { 
          margin: 1em 0; 
          padding-left: 2.5em; /* Espacio suficiente para viñetas/números */
          list-style-position: outside; /* Viñeta fuera del flujo de texto */
        }
        
        .renderizador-contenido ul { list-style-type: disc; }
        .renderizador-contenido ol { list-style-type: decimal; }
        
        .renderizador-contenido li { 
          margin-bottom: 0.5em; 
          display: list-item; /* Asegurar comportamiento de lista */
          white-space: pre-wrap; /* Respetar espacios en items de lista */
        }
        
        /* Forzar que los párrafos dentro de listas sean inline para evitar saltos de línea */
        .renderizador-contenido li p {
            display: inline;
            margin: 0;
        }
        
        .renderizador-contenido img { max-width: 100%; height: auto; }
        .renderizador-contenido blockquote {
          border-left: 4px solid #ccc;
          margin: 1em 0;
          padding-left: 1em;
          font-style: italic;
        }
        
        .renderizador-contenido [style*="text-align: center"] { text-align: center; }
        .renderizador-contenido [style*="text-align: right"] { text-align: right; }
        .renderizador-contenido [style*="text-align: justify"] { text-align: justify; }

        .btn-establecer-etiqueta {
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            transition: all 0.2s;
            border: none;
            outline: none;
            vertical-align: middle;
        }
      `}</style>

      {!modoDocumento ? (
        <div
          className="renderizador-contenido w-full"
          style={contentStyle}
          dangerouslySetInnerHTML={{ __html: htmlParaMostrar }}
        />
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100/50 w-full relative flex flex-col items-center p-8"
          onScroll={() => {
             // Opcional: Detectar página actual al hacer scroll
          }}
        >
          <div 
            className="flex flex-col items-center gap-8"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top center',
            }}
          >
            {paginas.length > 0 ? paginas.map((paginaHtml, pageIndex) => (
              <div
                key={pageIndex}
                id={`pagina-${pageIndex}`}
                className="bg-white shadow-xl transition-shadow hover:shadow-2xl"
                style={{
                  width: pageWidthPx,
                  height: pageHeightPx,
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative'
                }}
              >
                {/* Guías de márgenes */}
                {mostrarMargenes && (
                  <div 
                      className="absolute border border-dashed border-gray-300 pointer-events-none"
                      style={{
                          top: PAGE.paddingTop,
                          left: PAGE.paddingLeft,
                          width: contentAreaWidth,
                          height: contentAreaHeight,
                          zIndex: 5
                      }}
                  />
                )}

                <div
                  style={{
                    position: 'absolute',
                    top: PAGE.paddingTop,
                    left: PAGE.paddingLeft,
                    width: contentAreaWidth,
                    height: contentAreaHeight,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    className="renderizador-contenido"
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: paginaHtml }}
                  />
                </div>

                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '10px', 
                    right: '20px', 
                    fontSize: '10px', 
                    color: '#aaa',
                    userSelect: 'none'
                  }}
                >
                  Página {pageIndex + 1} de {paginas.length}
                </div>
              </div>
            )) : (
               <div className="flex items-center justify-center text-muted-foreground p-4">
                  Procesando vista previa...
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
