import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { ListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { useEffect, useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Toggle } from '@/componentes/ui/toggle';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { HexColorPicker } from 'react-colorful';

interface EditorHtmlRicoProps {
  contenido: string;
  onChange: (contenido: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const colores_predefinidos = [
  '#000000', '#ef4444', '#22c55e', '#3b82f6', 
  '#eab308', '#a855f7', '#ec4899', '#6b7280',
];

export function EditorHtmlRico({ 
  contenido, 
  onChange, 
  placeholder = 'Escribe aquí...', 
  className,
  minHeight = '150px'
}: EditorHtmlRicoProps) {
  const [colorActual, setColorActual] = useState('#000000');
  const [popoverAbierto, setPopoverAbierto] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      TextStyle,
      Color,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      const color = editor.getAttributes('textStyle').color || '#000000';
      setColorActual(color);
    },
  });

  useEffect(() => {
    if (editor && contenido !== editor.getHTML()) {
      editor.commands.setContent(contenido);
    }
  }, [contenido, editor]);

  useEffect(() => {
    if (editor) {
      const color = editor.getAttributes('textStyle').color || '#000000';
      setColorActual(color);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const aplicarColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setColorActual(color);
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Título 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Título 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('paragraph')}
          onPressedChange={() => editor.chain().focus().setParagraph().run()}
          aria-label="Texto normal"
        >
          <Type className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Negrita"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Subrayado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Tachado"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Popover open={popoverAbierto} onOpenChange={setPopoverAbierto}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
              aria-label="Color de texto"
            >
              <div 
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: colorActual }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-3" 
            align="start"
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              // No cerrar si se hace clic dentro del popover completo
              if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              // Prevenir cierre al hacer clic en cualquier parte del selector de color
              if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                e.preventDefault();
              }
            }}
          >
            <div className="space-y-3">
              <HexColorPicker 
                color={colorActual}
                onChange={(color) => {
                  setColorActual(color);
                  aplicarColor(color);
                }}
              />
              <div className="grid grid-cols-8 gap-2">
                {colores_predefinidos.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-6 w-6 rounded border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => aplicarColor(color)}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorActual('#000000');
                }}
              >
                Quitar color
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => setPopoverAbierto(false)}
              >
                Cerrar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror {
          min-height: ${minHeight};
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder}';
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          float: left;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          line-height: 1.4;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding: 0 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ul li,
        .ProseMirror ol li {
          margin: 0.25rem 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
      `}</style>
    </div>
  );
}
