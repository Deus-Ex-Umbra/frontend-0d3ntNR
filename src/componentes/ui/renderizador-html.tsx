import { cn } from '@/lib/utilidades';
import { useEffect, useMemo, useRef, useState } from 'react';

interface RenderizadorHtmlProps {
  contenido: string;
  className?: string;
  modoDocumento?: boolean; // Respeta colores del documento (fondo blanco, texto negro por defecto)
  tamanoPapel?: 'carta' | 'legal' | 'a4';
  margenes?: { top: number; right: number; bottom: number; left: number }; // mm
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
}

export function RenderizadorHtml({ contenido, className, modoDocumento = false, tamanoPapel = 'carta', margenes, tamanoPersonalizado = null }: RenderizadorHtmlProps) {
  if (!contenido || contenido.trim() === '') {
    return (
      <div className={cn('text-muted-foreground italic', className)}>
        No hay contenido para mostrar
      </div>
    );
  }

  // Configuración por defecto: tamaño Carta (Letter)
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
      marginTopMm: m.top,
      marginBottomMm: m.bottom,
      marginLeftMm: m.left,
      marginRightMm: m.right,
    };
  }, [tamanoPapel, margenes, tamanoPersonalizado]);
  const pageWidthPx = Math.round(mmToPx(PAGE.widthMm));
  const pageHeightPx = Math.round(mmToPx(PAGE.heightMm));
  const marginTopPx = Math.round(mmToPx(PAGE.marginTopMm));
  const marginBottomPx = Math.round(mmToPx(PAGE.marginBottomMm));
  const marginLeftPx = Math.round(mmToPx(PAGE.marginLeftMm));
  const marginRightPx = Math.round(mmToPx(PAGE.marginRightMm));
  const contentWidthPx = pageWidthPx - marginLeftPx - marginRightPx;
  const contentHeightPx = pageHeightPx - marginTopPx - marginBottomPx;

  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!modoDocumento) return;
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const h = el.scrollHeight; // altura total del contenido
      const base = contentHeightPx > 0 ? contentHeightPx : 1;
      const pages = Math.max(1, Math.ceil(h / base));
      setPageCount(pages);
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [modoDocumento, contentHeightPx, contenido]);

  return (
    <>
      {modoDocumento ? (
        <div className={cn('w-full', className)} style={{ display: 'flex', justifyContent: 'center' }}>
          <div className={cn('doc-wrapper')} style={{ width: pageWidthPx, position: 'relative' }}>
            <div className="pages-bg" style={{ position: 'relative', width: pageWidthPx, height: pageCount * pageHeightPx }}>
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="page-box"
                style={{
                  position: 'absolute',
                  top: i * pageHeightPx,
                  left: 0,
                  width: pageWidthPx,
                  height: pageHeightPx,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}
              />
            ))}
            </div>
            <div
              className="content-layer renderizador-documento"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: pageWidthPx,
                height: pageCount * pageHeightPx,
              }}
            >
              <div
                className={cn('renderizador-html', 'prose prose-sm max-w-none')}
                ref={contentRef}
                style={{
                  position: 'absolute',
                  top: marginTopPx,
                  left: marginLeftPx,
                  width: contentWidthPx,
                }}
                dangerouslySetInnerHTML={{ __html: contenido }}
              />
            </div>
            {/* Máscaras de márgenes y separadores entre páginas */}
            <div className="masks-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <div key={`mask-${i}`} style={{ position: 'absolute', top: i * pageHeightPx, left: 0, width: pageWidthPx, height: pageHeightPx }}>
                  {/* Máscara superior */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: pageWidthPx, height: marginTopPx, background: '#ffffff' }} />
                  {/* Máscara inferior */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: pageWidthPx, height: marginBottomPx, background: '#ffffff' }} />
                </div>
              ))}
              {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, i) => (
                <div key={`cut-${i}`} style={{ position: 'absolute', top: (i + 1) * pageHeightPx - 6, left: 8, width: pageWidthPx - 16, height: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 6 }} />
              ))}
            </div>
            <div style={{ height: pageCount * pageHeightPx }} />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'prose prose-sm max-w-none renderizador-html',
            className,
          )}
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      )}
      <style>{`
        /* Modo documento: fondo blanco y texto negro por defecto;
           NO invalida colores inline definidos en el contenido. */
        .renderizador-documento {
          background-color: #ffffff;
          color: #000000; /* color base cuando no hay estilos inline */
          color-scheme: light; /* fuerza esquema claro para UA y componentes */
          /* Reestablecer variables de Tailwind Typography a modo claro */
          --tw-prose-body: #111827; /* gris-900 */
          --tw-prose-headings: #111827;
          --tw-prose-links: #111827;
          --tw-prose-bold: #111827;
          --tw-prose-counters: #6b7280; /* gris-500 */
          --tw-prose-bullets: currentColor;
          --tw-prose-hr: #e5e7eb; /* gris-200 */
          --tw-prose-quotes: #111827;
          --tw-prose-quote-borders: #e5e7eb;
          --tw-prose-captions: #6b7280;
          --tw-prose-code: #111827;
          --tw-prose-pre-code: #e5e7eb;
          --tw-prose-pre-bg: #111827;
          --tw-prose-th-borders: #d1d5db; /* gris-300 */
          --tw-prose-td-borders: #e5e7eb;
        }
        /* Para cualquier nodo sin color inline explícito, forzamos negro.
           Aumentamos especificidad combinando ambas clases del contenedor. */
        .renderizador-documento.renderizador-html *:not([style*="color"]) {
          color: #000000;
        }
        /* Asegurar que marcadores usan el color del item */
        .renderizador-documento :where(ul > li)::marker,
        .renderizador-documento :where(ol > li)::marker {
          color: currentColor;
        }
        /* Resets de color para evitar que .prose fuerce gris sobre listas */
        .renderizador-html ul,
        .renderizador-html ol,
        .renderizador-html li {
          color: inherit;
        }
        /* Asegurar que el marcador (• y números) use el color del texto */
        .renderizador-html :where(ul > li)::marker,
        .renderizador-html :where(ol > li)::marker {
          color: currentColor !important;
        }
        .renderizador-html ul[style*="color"] li *,
        .renderizador-html ol[style*="color"] li * {
          color: inherit;
        }
        /* Caso general: evitar que la clase prose fuerce gris en listas sin color inline en <li> pero sí en ancestros */
        .renderizador-html ul li,
        .renderizador-html ol li {
          /* No fijamos ningún color explícito para permitir herencia del autor (si la hay) */
          color: inherit;
        }
        /* Reglas generales de colapso/ajuste de texto para evitar desbordes horizontales */
        .renderizador-html {
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
          white-space: normal;
        }
        .renderizador-html h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          line-height: 1.2;
        }
        .renderizador-html h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          line-height: 1.3;
        }
        .renderizador-html h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          line-height: 1.4;
        }
        .renderizador-html p {
          margin: 0.5em 0;
          line-height: 1.6;
          min-height: 1em;
        }
        .renderizador-html p:empty {
          min-height: 1.6em;
        }
        .renderizador-html br {
          display: block;
          content: "";
          margin: 0.8em 0;
        }
        .renderizador-html ul,
        .renderizador-html ol {
          padding-left: 2rem;
          margin: 1rem 0;
          list-style-position: outside;
        }
        .renderizador-html ul li,
        .renderizador-html ol li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        /* Replicar lógica de centrado de listas del editor sin modificar el componente original */
        .renderizador-html ul[style*="text-align: center"],
        .renderizador-html ol[style*="text-align: center"] {
          display: table;
          text-align: left; /* Mantener items alineados internos */
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: auto;
          margin-right: auto;
        }
        .renderizador-html ul[style*="text-align: right"],
        .renderizador-html ol[style*="text-align: right"] {
          display: table;
          text-align: left;
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: auto;
          margin-right: 0;
        }
        .renderizador-html ul[style*="text-align: left"],
        .renderizador-html ol[style*="text-align: left"] {
          display: block;
          text-align: left;
          list-style-position: outside;
          padding-left: 2rem;
          margin-left: 0;
          margin-right: auto;
        }
        .renderizador-html ul[style*="text-align: center"] li,
        .renderizador-html ol[style*="text-align: center"] li,
        .renderizador-html ul[style*="text-align: right"] li,
        .renderizador-html ol[style*="text-align: right"] li {
          text-align: left;
          display: list-item;
        }
        .renderizador-html ul {
          list-style-type: disc;
        }
        .renderizador-html ol {
          list-style-type: decimal;
        }
        .renderizador-html ul ul {
          list-style-type: circle;
          margin: 0.25rem 0;
        }
        .renderizador-html ul ul ul {
          list-style-type: square;
        }
        .renderizador-html strong {
          font-weight: bold;
        }
        .renderizador-html em {
          font-style: italic;
        }
        .renderizador-html u {
          text-decoration: underline;
        }
        .renderizador-html s {
          text-decoration: line-through;
        }
        .renderizador-html [style*="text-align: left"] {
          text-align: left;
        }
        .renderizador-html [style*="text-align: center"] {
          text-align: center;
        }
        .renderizador-html [style*="text-align: right"] {
          text-align: right;
        }
        /* Garantizar que elementos de bloque no se salgan horizontalmente */
        .renderizador-html table,
        .renderizador-html img,
        .renderizador-html pre,
        .renderizador-html code,
        .renderizador-html blockquote,
        .renderizador-html div,
        .renderizador-html p,
        .renderizador-html ul,
        .renderizador-html ol {
          max-width: 100%;
        }
      `}</style>
    </>
  );
}
