import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utilidades';

interface MarkdownRendererProps {
  contenido: string;
  className?: string;
}

export function MarkdownRenderer({ contenido, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 text-foreground" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-3 text-foreground" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mb-2 text-foreground" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-bold mb-2 text-foreground" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-bold mb-1 text-foreground" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-xs font-bold mb-1 text-foreground" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0 text-foreground leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-foreground" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 mb-4 italic text-muted-foreground bg-secondary/30 rounded-r" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-secondary p-4 rounded-lg mb-4 overflow-x-auto text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-secondary p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-primary hover:underline font-medium" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-border my-6" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-border rounded-lg" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-secondary" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-border" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-bold text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-foreground" {...props} />
          ),
        }}
      >
        {contenido}
      </ReactMarkdown>
    </div>
  );
}