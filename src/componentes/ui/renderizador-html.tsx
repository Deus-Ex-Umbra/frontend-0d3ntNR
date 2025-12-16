import { cn } from '@/lib/utilidades';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  altura?: string;
  ajustarAncho?: boolean;
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
  valoresEtiquetas = [],
  altura = '500px',
  ajustarAncho = false
}: RenderizadorHtmlProps) {

  const [contenidoLocal, setContenidoLocal] = useState(contenido);
  const [paginas, setPaginas] = useState<string[]>([]);
  const [htmlParaMostrar, setHtmlParaMostrar] = useState(contenido);
  const measurerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(escalaInicial || 0.6);
  const [mostrarMargenes, setMostrarMargenes] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [colorEtiquetas, setColorEtiquetas] = useState('#dbeafe');
  const [barraTranslucida, setBarraTranslucida] = useState(false);
  const [anchoContenedor, setAnchoContenedor] = useState(0);
  const [zoomManual, setZoomManual] = useState(false);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  useEffect(() => {
    let nuevoContenido = contenido;

    if (modoPlantilla && valoresEtiquetas.length > 0) {
      valoresEtiquetas.forEach(({ codigo, valor, color, mostrar_caja }) => {
        const regexEtiqueta = new RegExp(
          `<span[^>]*data-etiqueta="${codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]*)<\\/span>`,
          'g'
        );

        nuevoContenido = nuevoContenido.replace(regexEtiqueta, (match) => {
          const styleMatch = match.match(/style="([^"]*)"/);
          let existingStyles = styleMatch ? styleMatch[1] : '';
          existingStyles = existingStyles.replace(/background-color:[^;]+(;|$)/g, '');

          if (mostrar_caja !== false) {
            const colorFondo = color || colorEtiquetas;
            existingStyles += `; background-color: ${colorFondo};`;
            if (!existingStyles.includes('padding')) existingStyles += '; padding: 0 4px; border-radius: 4px;';
          } else {
            existingStyles = existingStyles.replace(/border:[^;]+(;|$)/g, '');
            existingStyles = existingStyles.replace(/padding:[^;]+(;|$)/g, '');
            existingStyles = existingStyles.replace(/border-radius:[^;]+(;|$)/g, '');
          }

          return match
            .replace(/style="[^"]*"/, `style="${existingStyles}"`)
            .replace(/>[^<]*<\/span>/, `>${valor || match.match(/>([^<]*)<\/span>/)?.[1] || ''}</span>`);
        });
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
  const PAGE_GAP = 24;

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
      paddingTop: Math.round(mmToPx(m.top)),
      paddingBottom: Math.round(mmToPx(m.bottom)),
      paddingLeft: Math.round(mmToPx(m.left)),
      paddingRight: Math.round(mmToPx(m.right)),
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
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 2.0;
  const escalaCalculada = useMemo(() => {
    if (!ajustarAncho || zoomManual || anchoContenedor <= 0) return zoom;
    const padding = 32;
    const disponible = anchoContenedor - padding;
    const escalaAuto = disponible / pageWidthPx;
    return Math.min(Math.max(escalaAuto, ZOOM_MIN), escalaInicial || 1);
  }, [ajustarAncho, zoomManual, anchoContenedor, pageWidthPx, zoom, escalaInicial, ZOOM_MIN]);

  const escalaFinal = (ajustarAncho && !zoomManual) ? escalaCalculada : zoom;
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAnchoContenedor(entry.contentRect.width);
      }
    });
    ro.observe(scrollContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Función para calcular saltos de página respetando límites de líneas
  const calcularSaltosDePagina = useCallback((container: HTMLDivElement, alturaDisponible: number): number[] => {
    const breaks: number[] = [0];

    // Calcular line-height dinámicamente del contenedor
    const computedStyle = window.getComputedStyle(container);
    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.625;
    
    // Buffer de seguridad basado en line-height real (1.5x para estar seguros)
    const bufferSeguridad = lineHeight * 1.5;

    // Obtener todos los elementos de bloque dentro del contenedor
    const elementos = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, div, table, tr, blockquote');

    if (elementos.length === 0) {
      // Si no hay elementos de bloque, usar el método tradicional
      const totalHeight = container.scrollHeight;
      const numPages = Math.max(1, Math.ceil(totalHeight / alturaDisponible));
      for (let i = 1; i < numPages; i++) {
        breaks.push(i * alturaDisponible);
      }
      return breaks;
    }

    let paginaActualTop = 0;
    let alturaAcumulada = 0;

    elementos.forEach((elemento) => {
      const rect = elemento.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const elementoTop = rect.top - containerRect.top;
      const elementoBottom = rect.bottom - containerRect.top;
      const elementoHeight = rect.height;

      // Calcular posición relativa desde el inicio de la página actual
      const posicionEnPagina = elementoBottom - paginaActualTop;

      // Si el elemento completo excede la altura disponible de la página
      if (posicionEnPagina > alturaDisponible) {
        // Verificar si el elemento cabe completo en una página
        if (elementoHeight <= alturaDisponible) {
          // El elemento cabe completo, hacer salto antes de él
          const nuevoBreak = elementoTop;
          if (nuevoBreak > breaks[breaks.length - 1]) {
            breaks.push(nuevoBreak);
            paginaActualTop = nuevoBreak;
            alturaAcumulada = elementoHeight;
          }
        } else {
          // El elemento es más alto que una página (por ejemplo, una tabla grande)
          // Hacer salto de página donde estamos y dejar que se corte
          const nuevoBreak = paginaActualTop + alturaDisponible;
          if (nuevoBreak > breaks[breaks.length - 1]) {
            breaks.push(nuevoBreak);
            paginaActualTop = nuevoBreak;
            alturaAcumulada = elementoBottom - nuevoBreak;

            // Continuar agregando saltos si el elemento sigue siendo muy alto
            while (alturaAcumulada > alturaDisponible - bufferSeguridad) {
              const siguienteBreak = paginaActualTop + alturaDisponible;
              breaks.push(siguienteBreak);
              paginaActualTop = siguienteBreak;
              alturaAcumulada = elementoBottom - siguienteBreak;
            }
          }
        }
      } else {
        alturaAcumulada = posicionEnPagina;
      }
    });

    return breaks;
  }, []);

  useEffect(() => {
    if (!measurerRef.current) return;

    const procesarContenido = () => {
      const container = measurerRef.current!;
      if (modoInteractivo && !modoPlantilla) {
        const etiquetas = container.querySelectorAll('span[data-etiqueta]');
        etiquetas.forEach((etiqueta: Element) => {
          const el = etiqueta as HTMLElement;
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
      setHtmlParaMostrar(container.innerHTML);
      if (modoDocumento) {
        // Calcular saltos de página respetando límites de elementos
        const breaks = calcularSaltosDePagina(container, contentAreaHeight);
        setPageBreaks(breaks);

        const numPages = breaks.length;
        const pageArray = Array.from({ length: numPages }, (_, i) => i);
        setPaginas(pageArray.map(String));
        setHtmlParaMostrar(container.innerHTML);
      }
    };

    const timer = setTimeout(procesarContenido, 100);
    return () => clearTimeout(timer);

  }, [contenidoLocal, modoDocumento, contentAreaHeight, contentAreaWidth, modoInteractivo, modoPlantilla, PAGE.paddingTop, PAGE.paddingBottom, pageHeightPx, calcularSaltosDePagina]);

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
      const el = document.getElementById(`pagina-render-${pagina - 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const scrollTop = scrollContainerRef.current.scrollTop;
    setBarraTranslucida(scrollTop > 10);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Estilos sincronizados con el editor TipTap (prose-sm) para evitar discrepancias
  // IMPORTANTE: Debe coincidir EXACTAMENTE con el editor para evitar diferencias de ajuste de texto
  const contentStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    width: '100%',
    // Usar la misma familia de fuentes que el navegador usa en TipTap prose-sm
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: '16px',
    // Mantener exactamente el mismo line-height que el editor ProseMirror (prose-sm)
    lineHeight: '1.5',
    color: modoDocumento ? '#000' : 'inherit',
    textAlign: 'left',
    // Evitar ligaduras que puedan causar diferencias de anchura
    fontVariantLigatures: 'none',
    // Establecer letter-spacing normal para evitar diferencias
    letterSpacing: 'normal',
    // Asegurar el mismo kerning
    fontKerning: 'normal',
    // Box-sizing para cálculos consistentes
    boxSizing: 'border-box',
    // Padding 0 explícito para evitar diferencias
    padding: '0',
    margin: '0',
    // Forzar el mismo rendering de texto
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };


  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col w-full border rounded-lg bg-background shadow-sm overflow-hidden',
        className
      )}
      style={{ height: modoDocumento ? altura : 'auto' }}
      onClick={handleContainerClick}
    >
      {modoDocumento && (
        <div
          className={cn(
            "flex items-center justify-between p-2 border-b z-10 transition-all duration-200",
            barraTranslucida
              ? "bg-background/70 backdrop-blur-md shadow-sm"
              : "bg-background/95 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoomManual(true);
                setZoom(z => Math.max(ZOOM_MIN, z - 0.1));
              }}
              title="Reducir Zoom"
              disabled={escalaFinal <= ZOOM_MIN}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">
              {Math.round(escalaFinal * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoomManual(true);
                setZoom(z => Math.min(ZOOM_MAX, z + 0.1));
              }}
              title="Aumentar Zoom"
              disabled={escalaFinal >= ZOOM_MAX}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={paginaActual <= 1}
              onClick={() => irAPagina(paginaActual - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-xs">Pág.</span>
              <Input
                className="h-6 w-10 text-center px-1 text-xs"
                value={paginaActual}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) irAPagina(val);
                }}
              />
              <span className="text-xs">/ {paginas.length}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={paginaActual >= paginas.length}
              onClick={() => irAPagina(paginaActual + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={mostrarMargenes ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMostrarMargenes(!mostrarMargenes)}
              title={mostrarMargenes ? "Ocultar Márgenes" : "Mostrar Márgenes"}
            >
              {mostrarMargenes ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              <span className="text-xs hidden sm:inline">Márgenes</span>
            </Button>
          </div>
        </div>
      )}

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
              onClick={() => { setColorEtiquetas('#dbeafe'); }}
              title="Por defecto (Azul)"
            />
            <button
              className={cn(
                "w-6 h-6 rounded-full border transition-all",
                colorEtiquetas === '#ffffff' ? "ring-2 ring-offset-2 ring-gray-400" : ""
              )}
              style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              onClick={() => { setColorEtiquetas('#ffffff'); }}
              title="Blanco (Limpio)"
            />
          </div>
        </div>
      )}
      <div
        style={{
          ...contentStyle,
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          width: modoDocumento ? `${contentAreaWidth}px` : '100%',
          left: 0,
          top: 0,
          paddingLeft: '0',
          paddingRight: '0',
          boxSizing: 'border-box'
        }}
        ref={measurerRef}
        className="renderizador-contenido"
        dangerouslySetInnerHTML={{ __html: contenidoLocal }}
      />


      <style>{`
        .renderizador-contenido {
            font-variant-ligatures: none;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
            color: #000000;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            letter-spacing: normal;
            font-kerning: normal;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
        }
        .renderizador-contenido p {
          margin: 0.5em 0;
          min-height: 1em;
          min-width: 0;
          box-sizing: border-box;
          max-width: 100%;
          white-space: pre-wrap;
          line-height: 1.5;
          color: inherit;
        }
        .renderizador-contenido p:first-child {
          margin-top: 0;
        }
        .renderizador-contenido p:last-child {
          margin-bottom: 0;
        }
        .renderizador-contenido p:empty,
        .renderizador-contenido p:has(> br:only-child) {
          min-height: 1em;
          display: block;
          margin: 0.5em 0;
        }
        .renderizador-contenido p:empty::before {
          content: '';
          display: inline-block;
        }
        .renderizador-contenido p br {
          display: inline;
          margin: 0;
        }
        .renderizador-contenido h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; white-space: pre-wrap; line-height: 1.5; }
        .renderizador-contenido h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; white-space: pre-wrap; line-height: 1.5; }
        .renderizador-contenido h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; white-space: pre-wrap; line-height: 1.5; }
        .renderizador-contenido ul, 
        .renderizador-contenido ol { 
          margin: 0.5rem 0; 
          padding-left: 2rem;
          list-style-position: outside;
        }
        .renderizador-contenido ul { list-style-type: disc; }
        .renderizador-contenido ol { list-style-type: decimal; }
        .renderizador-contenido li { 
          margin: 0.25rem 0;
          display: list-item;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .renderizador-contenido li::marker {
          color: currentColor;
        }
        .renderizador-contenido li p {
          display: inline;
          margin: 0;
          white-space: pre-wrap;
        }
        .renderizador-contenido ul[style*="text-align: center"],
        .renderizador-contenido ol[style*="text-align: center"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: auto;
          margin-right: auto;
        }
        .renderizador-contenido ul[style*="text-align: right"],
        .renderizador-contenido ol[style*="text-align: right"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: auto;
          margin-right: 0;
        }
        .renderizador-contenido ul[style*="text-align: left"],
        .renderizador-contenido ol[style*="text-align: left"] {
          display: block;
          text-align: left;
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: 0;
          margin-right: auto;
        }
        .renderizador-contenido ul[style*="text-align: center"] li,
        .renderizador-contenido ol[style*="text-align: center"] li,
        .renderizador-contenido ul[style*="text-align: right"] li,
        .renderizador-contenido ol[style*="text-align: right"] li {
          text-align: left;
          display: list-item;
        }
        .renderizador-contenido img { max-width: 100%; height: auto; }
        .renderizador-contenido blockquote {
          border-left: 4px solid #ccc;
          margin: 1em 0;
          padding-left: 1em;
          font-style: italic;
          white-space: pre-wrap;
        }
        
        .renderizador-contenido [style*="text-align: center"]:not(ul):not(ol) { text-align: center; }
        .renderizador-contenido [style*="text-align: right"]:not(ul):not(ol) { text-align: right; }
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
          className="renderizador-contenido flex-1 overflow-auto"
          style={{
            ...contentStyle,
            maxWidth: '800px',
            margin: '0 auto',
            padding: '1rem'
          }}
          dangerouslySetInnerHTML={{ __html: htmlParaMostrar }}
        />
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100/50 w-full"
          style={{ position: 'relative' }}
        >
          <div className="flex flex-col items-center p-4">
            {(() => {
              const stackHeightPx = paginas.length > 0
                ? paginas.length * pageHeightPx + (paginas.length - 1) * PAGE_GAP
                : pageHeightPx;
              const scaledStackHeight = stackHeightPx * escalaFinal;
              const scaledWidth = pageWidthPx * escalaFinal;

              return (
                <div
                  style={{
                    position: 'relative',
                    width: scaledWidth,
                    height: scaledStackHeight,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: `scale(${escalaFinal})`,
                      transformOrigin: 'top left',
                      width: pageWidthPx,
                      height: stackHeightPx,
                      overflow: 'visible'
                    }}
                  >
                    <div className="flex flex-col items-center" style={{ gap: PAGE_GAP }}>
                      {paginas.length > 0 ? paginas.map((_, pageIndex) => {
                        const offsetY = pageBreaks[pageIndex] || 0;
                        const nextBreak = pageBreaks[pageIndex + 1];
                        const pageContentHeight = nextBreak ? (nextBreak - offsetY) : contentAreaHeight;

                        return (
                          <div
                            key={pageIndex}
                            id={`pagina-render-${pageIndex}`}
                            className="bg-white shadow-xl transition-shadow hover:shadow-2xl"
                            style={{
                              width: pageWidthPx,
                              height: pageHeightPx,
                              overflow: 'hidden',
                              flexShrink: 0,
                              position: 'relative'
                            }}
                          >
                            {mostrarMargenes && (
                              <div
                                className="absolute border border-dashed border-blue-300 pointer-events-none"
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
                                height: pageContentHeight,
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                className="renderizador-contenido"
                                style={{
                                  ...contentStyle,
                                  transform: `translateY(-${offsetY}px)`,
                                  paddingLeft: '0',
                                  paddingRight: '0',
                                  boxSizing: 'border-box'
                                }}
                                dangerouslySetInnerHTML={{ __html: htmlParaMostrar }}
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
                        );
                      }) : (
                        <div className="flex items-center justify-center text-muted-foreground p-4">
                          Procesando vista previa...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
