import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { ListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize } from '@/lib/tiptap-font-size';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/componentes/ui/button';
import { Toggle } from '@/componentes/ui/toggle';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { HexColorPicker } from 'react-colorful';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select';
import { Label } from '@/componentes/ui/label';
const EtiquetaNode = Node.create({
  name: 'etiqueta',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      codigo: {
        default: null,
        parseHTML: element => element.getAttribute('data-codigo'),
        renderHTML: attributes => {
          return {
            'data-codigo': attributes.codigo,
          };
        },
      },
      eliminada: {
        default: false,
        parseHTML: element => element.getAttribute('data-eliminada') === 'true',
        renderHTML: attributes => {
          return {
            'data-eliminada': attributes.eliminada,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-etiqueta]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { codigo, eliminada } = node.attrs;
    const existingStyle = HTMLAttributes.style || '';
    const baseStyle = eliminada
      ? 'display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 2px; border-radius: 0.375rem; background-color: #fee2e2; border: 1px solid #fca5a5;'
      : 'display: inline-flex; align-items: center; padding: 2px 8px; margin: 0 2px; border-radius: 0.375rem; background-color: #dbeafe; border: 1px solid #93c5fd;';
    const combinedStyle = existingStyle ? `${baseStyle} ${existingStyle}` : baseStyle;
    
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-etiqueta': codigo,
        'data-codigo': codigo,
        'data-eliminada': eliminada,
        class: eliminada 
          ? 'etiqueta-plantilla etiqueta-eliminada' 
          : 'etiqueta-plantilla',
        style: combinedStyle,
      }),
      codigo,
    ];
  },

  addCommands() {
    return {
      insertarEtiqueta: (codigo: string) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: { codigo, eliminada: false },
        });
      },
    } as any;
  },
});

interface EditorConEtiquetasPersonalizadoProps {
  contenido: string;
  onChange: (contenido: string) => void;
  className?: string;
  minHeight?: string;
}

export interface EditorHandle {
  chain: () => any;
  getHTML: () => string;
}

const colores_predefinidos = [
  '#000000', '#FFFFFF', '#ef4444', '#22c55e', '#3b82f6', 
  '#eab308', '#a855f7', '#ec4899', '#6b7280',
];

const tamanos_fuente = [
  { label: '8px', value: '8px' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
];

export const EditorConEtiquetasPersonalizado = forwardRef<EditorHandle, EditorConEtiquetasPersonalizadoProps>(({ 
  contenido, 
  onChange, 
  className,
  minHeight = '150px'
}, ref) => {
  const [colorActual, setColorActual] = useState('#000000');
  const [popoverColorAbierto, setPopoverColorAbierto] = useState(false);
  const [tamanoActual, setTamanoActual] = useState('16px');
  const [colorFondo, setColorFondo] = useState('#FFFFFF');
  const [formatosActivos, setFormatosActivos] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
      }),
      TextStyle,
      Color,
      FontSize,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      TextAlign.configure({
        types: ['paragraph', 'heading', 'bulletList', 'orderedList'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      EtiquetaNode,
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      const tamano = editor.getAttributes('textStyle').fontSize;
      if (tamano) {
        setTamanoActual(tamano);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const color = editor.getAttributes('textStyle').color;
      if (color) {
        setColorActual(color);
      }
      
      const tamano = editor.getAttributes('textStyle').fontSize;
      if (tamano) {
        setTamanoActual(tamano);
      }
      setFormatosActivos({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
      });
    },
  });
  useImperativeHandle(ref, () => ({
    chain: () => editor?.chain(),
    getHTML: () => editor?.getHTML() || '',
  }), [editor]);

  useEffect(() => {
    if (editor && contenido !== editor.getHTML()) {
      const pos = editor.state.selection.anchor;
      editor.commands.setContent(contenido);
      
      if (pos <= editor.state.doc.content.size) {
        editor.commands.setTextSelection(pos);
      }
    }
  }, [contenido, editor]);

  useEffect(() => {
    if (editor) {
      const color = editor.getAttributes('textStyle').color || '#000000';
      setColorActual(color);
      
      const tamano = editor.getAttributes('textStyle').fontSize || '16px';
      setTamanoActual(tamano);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const aplicarColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setColorActual(color);
  };

  const aplicarTamano = (tamano: string) => {
    editor.chain().focus().setFontSize(tamano).run();
    setTamanoActual(tamano);
  };

  const aumentarTamano = () => {
    const tamanoActualIndex = tamanos_fuente.findIndex(t => t.value === tamanoActual);
    if (tamanoActualIndex < tamanos_fuente.length - 1) {
      aplicarTamano(tamanos_fuente[tamanoActualIndex + 1].value);
    }
  };

  const disminuirTamano = () => {
    const tamanoActualIndex = tamanos_fuente.findIndex(t => t.value === tamanoActual);
    if (tamanoActualIndex > 0) {
      aplicarTamano(tamanos_fuente[tamanoActualIndex - 1].value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-muted/30 border rounded-lg">
        <Label htmlFor="color-fondo" className="text-sm font-medium">Color de fondo del editor:</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-24"
              aria-label="Color de fondo"
            >
              <div 
                className="w-4 h-4 rounded border border-border mr-2"
                style={{ backgroundColor: colorFondo }}
              />
              Fondo
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <HexColorPicker 
                color={colorFondo}
                onChange={setColorFondo}
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="h-8 rounded border-2 hover:scale-105 transition-transform bg-white border-gray-300"
                  onClick={() => setColorFondo('#FFFFFF')}
                  title="Blanco"
                >
                  Blanco
                </button>
                <button
                  type="button"
                  className="h-8 rounded border-2 hover:scale-105 transition-transform bg-gray-100 border-gray-400"
                  onClick={() => setColorFondo('#F3F4F6')}
                  title="Gris claro"
                >
                  Gris
                </button>
                <button
                  type="button"
                  className="h-8 rounded border-2 hover:scale-105 transition-transform bg-blue-50 border-blue-300"
                  onClick={() => setColorFondo('#EFF6FF')}
                  title="Azul claro"
                >
                  Azul
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={disminuirTamano}
              disabled={tamanos_fuente[0].value === tamanoActual}
              title="Disminuir tamaño"
            >
              A-
            </Button>
            
            <Select value={tamanoActual} onValueChange={aplicarTamano}>
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tamanos_fuente.map((tamano) => (
                  <SelectItem key={tamano.value} value={tamano.value}>
                    {tamano.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={aumentarTamano}
              disabled={tamanos_fuente[tamanos_fuente.length - 1].value === tamanoActual}
              title="Aumentar tamaño"
            >
              A+
            </Button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={formatosActivos.bold}
            onPressedChange={() => {
              editor.chain().focus().toggleBold().run();
              setFormatosActivos(prev => ({ ...prev, bold: !prev.bold }));
            }}
            aria-label="Negrita"
            data-state={formatosActivos.bold ? 'on' : 'off'}
          >
            <Bold className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={formatosActivos.italic}
            onPressedChange={() => {
              editor.chain().focus().toggleItalic().run();
              setFormatosActivos(prev => ({ ...prev, italic: !prev.italic }));
            }}
            aria-label="Cursiva"
            data-state={formatosActivos.italic ? 'on' : 'off'}
          >
            <Italic className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={formatosActivos.underline}
            onPressedChange={() => {
              editor.chain().focus().toggleUnderline().run();
              setFormatosActivos(prev => ({ ...prev, underline: !prev.underline }));
            }}
            aria-label="Subrayado"
            data-state={formatosActivos.underline ? 'on' : 'off'}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={formatosActivos.strike}
            onPressedChange={() => {
              editor.chain().focus().toggleStrike().run();
              setFormatosActivos(prev => ({ ...prev, strike: !prev.strike }));
            }}
            aria-label="Tachado"
            data-state={formatosActivos.strike ? 'on' : 'off'}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>

          <div className="w-px h-6 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Lista con viñetas"
            data-state={editor.isActive('bulletList') ? 'on' : 'off'}
          >
            <List className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Lista numerada"
            data-state={editor.isActive('orderedList') ? 'on' : 'off'}
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <div className="w-px h-6 bg-border mx-1" />
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="Alinear a la izquierda"
            data-state={editor.isActive({ textAlign: 'left' }) ? 'on' : 'off'}
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="Centrar"
            data-state={editor.isActive({ textAlign: 'center' }) ? 'on' : 'off'}
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>

          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="Alinear a la derecha"
            data-state={editor.isActive({ textAlign: 'right' }) ? 'on' : 'off'}
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-1">
            <Popover open={popoverColorAbierto} onOpenChange={setPopoverColorAbierto}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Seleccionar color"
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
                if (target.closest('.react-colorful') || target.closest('[role="dialog"]')) {
                  e.preventDefault();
                }
              }}
              onPointerDownOutside={(e) => {
                const target = e.target as HTMLElement;
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
                <div className="grid grid-cols-9 gap-2">
                  {colores_predefinidos.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded border-2 hover:scale-110 transition-transform",
                        color === '#FFFFFF' ? 'border-gray-300' : 'border-border'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => aplicarColor(color)}
                      title={color}
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
                  onClick={() => setPopoverColorAbierto(false)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        </div>

        <div style={{ minHeight, maxHeight: '600px', overflowY: 'auto', backgroundColor: colorFondo }}>
          <EditorContent editor={editor} />
        </div>

        <style>{`
          .ProseMirror {
            min-height: ${minHeight};
            white-space: pre-wrap;
            background-color: ${colorFondo} !important;
            padding: 12px;
            color: #000000;
          }
          .ProseMirror:focus {
            outline: none;
          }
          .ProseMirror p {
            margin: 0.5em 0;
            min-height: 1em;
            color: inherit;
          }
          .ProseMirror br {
            display: block;
            margin: 0.5em 0;
          }
          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 2rem;
            margin: 0.5rem 0;
            list-style-position: outside;
            color: currentColor;
          }
          .ProseMirror ul li,
          .ProseMirror ol li {
            margin: 0.25rem 0;
            display: list-item;
            color: currentColor;
          }
          .ProseMirror ul li::marker,
          .ProseMirror ol li::marker {
            color: currentColor;
          }
          .ProseMirror ul {
            list-style-type: disc;
            display: block;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            display: block;
          }
          .ProseMirror ul[style*="text-align: center"],
          .ProseMirror ol[style*="text-align: center"] {
            display: table;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: auto;
            margin-right: auto;
          }
          .ProseMirror ul[style*="text-align: right"],
          .ProseMirror ol[style*="text-align: right"] {
            display: table;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: auto;
            margin-right: 0;
          }
          .ProseMirror ul[style*="text-align: left"],
          .ProseMirror ol[style*="text-align: left"] {
            display: block;
            text-align: left;
            list-style-position: outside;
            padding-left: 2rem;
            margin-left: 0;
            margin-right: auto;
          }
          .ProseMirror ul[style*="text-align: center"] li,
          .ProseMirror ol[style*="text-align: center"] li,
          .ProseMirror ul[style*="text-align: right"] li,
          .ProseMirror ol[style*="text-align: right"] li {
            text-align: left;
            display: list-item;
          }
          button[data-state="on"] {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
          }
          .etiqueta-plantilla {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            margin: 0 2px;
            border-radius: 0.375rem;
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
          }
          
          .etiqueta-eliminada {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
          }
        `}</style>
      </div>
    </div>
  );
});

EditorConEtiquetasPersonalizado.displayName = 'EditorConEtiquetasPersonalizado';
