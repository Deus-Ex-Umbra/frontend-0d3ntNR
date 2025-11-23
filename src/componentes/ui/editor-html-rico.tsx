import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { ListItem as BaseListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { InputRule, wrappingInputRule } from '@tiptap/core';
import { FontSize } from '@/lib/tiptap-font-size';
import { useEffect, useRef, useState } from 'react';
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

interface EditorHtmlRicoProps {
  contenido: string;
  onChange: (contenido: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
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

const CustomOrderedList = OrderedList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*(\d+)\.\s$/,
        type: this.type,
        getAttributes: (match) => {
          const attributes = this.editor.state.selection.$from.parent.attrs
          return {
            start: +match[1],
            ...(attributes.textAlign ? { textAlign: attributes.textAlign } : {})
          }
        },
      }),
    ]
  },
})

const CustomBulletList = BulletList.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*([-+*])\s$/,
        type: this.type,
        getAttributes: (match) => {
          const attributes = this.editor.state.selection.$from.parent.attrs
          return attributes.textAlign ? { textAlign: attributes.textAlign } : {}
        },
      }),
    ]
  },
})

export function EditorHtmlRico({ 
  contenido, 
  onChange, 
  placeholder = 'Escribe aquí...', 
  className,
  minHeight = '150px'
}: EditorHtmlRicoProps) {
  const [colorActual, setColorActual] = useState('#000000');
  const [colorTemporal, setColorTemporal] = useState('#000000');
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const [tamanoActual, setTamanoActual] = useState('16px');
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
      CustomBulletList,
      CustomOrderedList,
      BaseListItem.extend({
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              if (this.editor.isActive('listItem')) {
                const { state } = this.editor
                const { selection } = state
                if (selection.empty && (selection.$from.parent.content.size === 0 || selection.$from.parent.textContent.trim().length === 0)) {
                  return this.editor.commands.liftListItem('listItem')
                }
                return this.editor.commands.splitListItem('listItem')
              }
              return false
            },
          }
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            color: {
              default: null,
              parseHTML: element => element.style?.color || null,
              renderHTML: attributes => {
                if (!attributes.color) return {};
                return { style: `color: ${attributes.color}` };
              },
            },
          };
        },
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading', 'bulletList', 'orderedList'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3',
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        onChange(editor.getHTML());
      }, 120);

      const tamano = editor.getAttributes('textStyle').fontSize;
      if (tamano) {
        setTamanoActual(tamano);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const color = editor.getAttributes('textStyle').color;
      setColorActual(color || '#000000');
      if (!color) {
        setColorTemporal('#000000');
      } else {
        setColorTemporal(color);
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
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (editor && contenido !== editor.getHTML()) {
      editor.commands.setContent(contenido);
    }
  }, [contenido, editor]);

  useEffect(() => {
    if (editor) {
      const color = editor.getAttributes('textStyle').color || '#000000';
      setColorActual(color);
      setColorTemporal(color);
      const tamano = editor.getAttributes('textStyle').fontSize || '16px';
      setTamanoActual(tamano);
    }
  }, [editor]);

  

  if (!editor) {
    return null;
  }

  const [selectionGuardada, setSelectionGuardada] = useState<{from:number;to:number}|null>(null);

  useEffect(() => {
    if (popoverAbierto && editor) {
      const { from, to } = editor.state.selection;
      setSelectionGuardada({ from, to });
      setColorTemporal(colorActual);
    }
  }, [popoverAbierto, editor, colorActual]);

  const aplicarColor = (color: string) => {
    if (!editor) return;
    const { from, to } = selectionGuardada || editor.state.selection;
    editor.chain().focus().setTextSelection({ from, to }).setColor(color).run();
    editor.commands.command(({ tr, state }) => {
      const listItemType = state.schema.nodes.listItem;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === listItemType) {
          tr.setNodeMarkup(pos, listItemType, { ...node.attrs, color });
        }
      });
      return true;
    });
    editor.chain().setTextSelection({ from, to }).run();
    setColorActual(color);
    setColorTemporal(color);
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
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/30">
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
          pressed={editor.isActive('bulletList') ? (editor.getAttributes('bulletList').textAlign === 'left' || !editor.getAttributes('bulletList').textAlign) : (editor.isActive('orderedList') ? (editor.getAttributes('orderedList').textAlign === 'left' || !editor.getAttributes('orderedList').textAlign) : editor.isActive({ textAlign: 'left' }))}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="Alinear a la izquierda"
          data-state={(editor.isActive('bulletList') ? (editor.getAttributes('bulletList').textAlign === 'left' || !editor.getAttributes('bulletList').textAlign) : (editor.isActive('orderedList') ? (editor.getAttributes('orderedList').textAlign === 'left' || !editor.getAttributes('orderedList').textAlign) : editor.isActive({ textAlign: 'left' }))) ? 'on' : 'off'}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList') ? editor.getAttributes('bulletList').textAlign === 'center' : (editor.isActive('orderedList') ? editor.getAttributes('orderedList').textAlign === 'center' : editor.isActive({ textAlign: 'center' }))}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="Centrar"
          data-state={(editor.isActive('bulletList') ? editor.getAttributes('bulletList').textAlign === 'center' : (editor.isActive('orderedList') ? editor.getAttributes('orderedList').textAlign === 'center' : editor.isActive({ textAlign: 'center' }))) ? 'on' : 'off'}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList') ? editor.getAttributes('bulletList').textAlign === 'right' : (editor.isActive('orderedList') ? editor.getAttributes('orderedList').textAlign === 'right' : editor.isActive({ textAlign: 'right' }))}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="Alinear a la derecha"
          data-state={(editor.isActive('bulletList') ? editor.getAttributes('bulletList').textAlign === 'right' : (editor.isActive('orderedList') ? editor.getAttributes('orderedList').textAlign === 'right' : editor.isActive({ textAlign: 'right' }))) ? 'on' : 'off'}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-6 bg-border mx-1" />
        <div className="flex items-center gap-1">
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
                color={colorTemporal}
                onChange={(color) => {
                  setColorTemporal(color);
                }}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded border bg-muted" style={{ backgroundColor: colorTemporal, color: '#fff' }}>
                  {colorTemporal.toUpperCase()}
                </span>
                {colorTemporal !== colorActual && (
                  <span className="text-muted-foreground">(no aplicado)</span>
                )}
              </div>
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
                  setColorTemporal('#000000');
                }}
              >
                Quitar color
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    aplicarColor(colorTemporal);
                    setPopoverAbierto(false);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" /> Aplicar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setColorTemporal(colorActual);
                    setPopoverAbierto(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      </div>
      <div style={{ minHeight, maxHeight: '600px', overflowY: 'auto', padding: '12px' }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror {
          min-height: ${minHeight};
          white-space: pre-wrap;
          background-color: transparent !important;
          padding: 0;
          box-sizing: content-box;
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
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
        .ProseMirror p {
          margin: 0.5em 0;
          min-height: 1em;
          color: inherit;
          max-width: 100%;
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
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror table,
        .ProseMirror img,
        .ProseMirror pre,
        .ProseMirror code,
        .ProseMirror blockquote,
        .ProseMirror div,
        .ProseMirror p,
        .ProseMirror ul,
        .ProseMirror ol {
          max-width: 100%;
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
      `}</style>
    </div>
  );
}
