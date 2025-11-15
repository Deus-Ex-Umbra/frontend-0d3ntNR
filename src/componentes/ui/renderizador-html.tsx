import { cn } from '@/lib/utilidades';

interface RenderizadorHtmlProps {
  contenido: string;
  className?: string;
}

export function RenderizadorHtml({ contenido, className }: RenderizadorHtmlProps) {
  if (!contenido || contenido.trim() === '') {
    return (
      <div className={cn('text-muted-foreground italic', className)}>
        No hay contenido para mostrar
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('prose prose-sm max-w-none renderizador-html', className)}
        dangerouslySetInnerHTML={{ __html: contenido }}
      />
      <style>{`
        .renderizador-html {
          white-space: pre-wrap;
          line-height: 1.6;
          word-wrap: break-word;
        }
        .renderizador-html * {
          margin-revert;
          padding-revert;
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
      `}</style>
    </>
  );
}
