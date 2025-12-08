import { cn } from '@/lib/utilidades';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RenderizadorHtmlProps {
  contenido: string;
  className?: string;
  modoDocumento?: boolean;
  tamanoPapel?: 'carta' | 'legal' | 'a4';
  margenes?: { top: number; right: number; bottom: number; left: number };
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
  escala?: number;
}

export function RenderizadorHtml({ 
  contenido, 
  className, 
  modoDocumento = false, 
  tamanoPapel = 'carta', 
  margenes, 
  tamanoPersonalizado = null,
  escala = 1 
}: RenderizadorHtmlProps) {
  
  if (!contenido) {
    return null;
  }

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
    };
  }, [tamanoPapel, margenes, tamanoPersonalizado]);

  const pageWidthPx = Math.round(mmToPx(PAGE.widthMm));
  const pageHeightPx = Math.round(mmToPx(PAGE.heightMm));
  
  const contentAreaHeight = pageHeightPx - PAGE.paddingTop - PAGE.paddingBottom;
  const contentAreaWidth = pageWidthPx - PAGE.paddingLeft - PAGE.paddingRight;

  const [contentHeight, setContentHeight] = useState(0);
  const measurerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modoDocumento) return;

    const measure = () => {
      if (measurerRef.current) {
        setContentHeight(measurerRef.current.scrollHeight);
      }
    };

    measure();
    const timeoutId = setTimeout(measure, 200);
    
    const resizeObserver = new ResizeObserver(() => measure());
    if (measurerRef.current) {
      resizeObserver.observe(measurerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [contenido, pageWidthPx, modoDocumento]);

  const pageCount = modoDocumento && contentHeight > 0
    ? Math.max(1, Math.ceil(contentHeight / contentAreaHeight)) 
    : 1;

  const contentStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    width: '100%',
    fontFamily: 'Arial, sans-serif',
    fontSize: '11pt',
    lineHeight: '1.5',
    color: '#000',
    textAlign: 'left'
  };

  if (!modoDocumento) {
    return (
      <div
        className={className}
        style={contentStyle}
        dangerouslySetInnerHTML={{ __html: contenido }}
      />
    );
  }

  return (
    <div className={cn('flex flex-col items-center w-full bg-gray-100/50 p-8 rounded-lg overflow-auto border border-border', className)}>
      
      <div 
        style={{ 
          ...contentStyle,
          position: 'absolute', 
          visibility: 'hidden', 
          pointerEvents: 'none',
          width: contentAreaWidth,
          left: 0, 
          top: 0
        }}
        ref={measurerRef}
        className="renderizador-contenido"
        dangerouslySetInnerHTML={{ __html: contenido }}
      />

      <div 
        style={{ 
          transform: `scale(${escala})`, 
          transformOrigin: 'top center',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}
      >
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white shadow-xl"
            style={{
              width: pageWidthPx,
              height: pageHeightPx,
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative'
            }}
          >
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
                style={{
                  ...contentStyle,
                  marginTop: `-${pageIndex * contentAreaHeight}px`
                }}
                dangerouslySetInnerHTML={{ __html: contenido }}
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
              Página {pageIndex + 1} de {pageCount}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .renderizador-contenido p { margin: 0 0 1em 0; }
        .renderizador-contenido h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .renderizador-contenido h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        .renderizador-contenido h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        
        .renderizador-contenido ul { 
          list-style-type: disc; 
          padding-left: 2.5em; 
          margin: 1em 0; 
        }
        .renderizador-contenido ol { 
          list-style-type: decimal; 
          padding-left: 2.5em; 
          margin: 1em 0; 
        }
        .renderizador-contenido li { 
          margin-bottom: 0.5em; 
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
      `}</style>
    </div>
  );
}