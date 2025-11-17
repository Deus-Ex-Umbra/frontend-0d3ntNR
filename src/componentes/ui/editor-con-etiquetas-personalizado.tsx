import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { ListItem as BaseListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize } from '@/lib/tiptap-font-size';
import { Node, mergeAttributes } from '@tiptap/core';
import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
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
import { Switch } from '@/componentes/ui/switch';
import { Input } from '@/componentes/ui/input';
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
  tamanoPapel?: 'carta' | 'legal' | 'a4';
  margenes?: { top: number; right: number; bottom: number; left: number }; // mm
  tamanoPersonalizado?: { widthMm: number; heightMm: number } | null;
  habilitarEtiquetas?: boolean;
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
  minHeight = '150px',
  tamanoPapel = 'carta',
  margenes = { top: 20, right: 20, bottom: 20, left: 20 },
  tamanoPersonalizado = null,
  habilitarEtiquetas = true,
}, ref) => {
  // Configuración de página con defensas ante tamaños inválidos
  const mmToPx = (mm: number) => (mm / 25.4) * 96;
  const defaultLetterMm = { widthMm: 216, heightMm: 279 };
  const baseMm = tamanoPersonalizado
    ? { widthMm: tamanoPersonalizado.widthMm, heightMm: tamanoPersonalizado.heightMm }
    : tamanoPapel === 'carta'
      ? defaultLetterMm
      : tamanoPapel === 'legal'
        ? { widthMm: 216, heightMm: 356 }
        : { widthMm: 210, heightMm: 297 };

  // Calcular dimensiones en px y aplicar fallbacks si no son finitas o positivas
  const rawPageWidthPx = Math.round(mmToPx(baseMm.widthMm));
  const rawPageHeightPx = Math.round(mmToPx(baseMm.heightMm));
  const fallbackWidthPx = Math.round(mmToPx(defaultLetterMm.widthMm));
  const fallbackHeightPx = Math.round(mmToPx(defaultLetterMm.heightMm));
  const pageWidthPx = Number.isFinite(rawPageWidthPx) && rawPageWidthPx > 0 ? rawPageWidthPx : fallbackWidthPx;
  const pageHeightPx = Number.isFinite(rawPageHeightPx) && rawPageHeightPx > 0 ? rawPageHeightPx : fallbackHeightPx;

  const rawMarginTopPx = Math.round(mmToPx(margenes.top));
  const rawMarginBottomPx = Math.round(mmToPx(margenes.bottom));
  const rawMarginLeftPx = Math.round(mmToPx(margenes.left));
  const rawMarginRightPx = Math.round(mmToPx(margenes.right));
  const marginTopPx = Number.isFinite(rawMarginTopPx) && rawMarginTopPx >= 0 ? rawMarginTopPx : 0;
  const marginBottomPx = Number.isFinite(rawMarginBottomPx) && rawMarginBottomPx >= 0 ? rawMarginBottomPx : 0;
  const marginLeftPx = Number.isFinite(rawMarginLeftPx) && rawMarginLeftPx >= 0 ? rawMarginLeftPx : 0;
  const marginRightPx = Number.isFinite(rawMarginRightPx) && rawMarginRightPx >= 0 ? rawMarginRightPx : 0;

  const contentWidthPx = Math.max(0, pageWidthPx - marginLeftPx - marginRightPx);
  const contentHeightPx = Math.max(0, pageHeightPx - marginTopPx - marginBottomPx);

  const [colorActual, setColorActual] = useState('#000000'); // color aplicado
  const [colorTemporal, setColorTemporal] = useState('#000000'); // color en previsualización dentro del popover
  const [popoverColorAbierto, setPopoverColorAbierto] = useState(false);
  const [tamanoActual, setTamanoActual] = useState('16px');
  const [mostrarGuiasMargen, setMostrarGuiasMargen] = useState(false);
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2];
  const [formatosActivos, setFormatosActivos] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });
  const contentMeasureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageInputValue, setPageInputValue] = useState('1');

  // Debounce de onChange para mejorar rendimiento mientras se escribe
  const debounceRef = useRef<number | null>(null);

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
      BaseListItem.extend({
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
      ...(habilitarEtiquetas ? [EtiquetaNode] : []),
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3',
      },
    },
    onUpdate: ({ editor }) => {
      // Debounce para no bloquear la UI en cada keystroke
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
      // Si no hay atributo de color, forzamos negro para evitar quedar en gris anterior
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
      setColorTemporal(color);
      const tamano = editor.getAttributes('textStyle').fontSize || '16px';
      setTamanoActual(tamano);
    }
  }, [editor]);

  // Recalcular cantidad de páginas según altura de contenido
  useEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const update = () => {
      const h = el.scrollHeight;
      if (contentHeightPx <= 0) {
        setPageCount(1);
        return;
      }
      const pages = Math.max(1, Math.ceil(h / contentHeightPx));
      setPageCount(pages);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentHeightPx, contenido]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, pageCount)));
  }, [pageCount]);

  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const onScroll = () => {
      const step = pageHeightPx * zoom;
      const p = Math.floor(cont.scrollTop / Math.max(1, step)) + 1;
      const clamped = Math.max(1, Math.min(p, pageCount));
      setCurrentPage(clamped);
    };
    cont.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => cont.removeEventListener('scroll', onScroll);
  }, [pageHeightPx, zoom, pageCount]);

  const irAPagina = (p: number) => {
    const cont = containerRef.current;
    if (!cont) return;
    const page = Math.max(1, Math.min(p, pageCount));
    const top = (page - 1) * pageHeightPx * zoom;
    cont.scrollTo({ top, behavior: 'smooth' });
    setCurrentPage(page);
  };

  if (!editor) {
    return null;
  }

  const [selectionGuardada, setSelectionGuardada] = useState<{from:number;to:number}|null>(null);

  useEffect(() => {
    if (popoverColorAbierto && editor) {
      const { from, to } = editor.state.selection;
      setSelectionGuardada({ from, to });
      setColorTemporal(colorActual); // al abrir popover inicializamos color temporal
    }
  }, [popoverColorAbierto, editor, colorActual]);

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

  const aumentarZoom = () => {
    const idx = ZOOM_STEPS.findIndex(z => z === zoom);
    if (idx < ZOOM_STEPS.length - 1) setZoom(ZOOM_STEPS[idx + 1]);
  };
  const disminuirZoom = () => {
    const idx = ZOOM_STEPS.findIndex(z => z === zoom);
    if (idx > 0) setZoom(ZOOM_STEPS[idx - 1]);
  };
  const resetZoom = () => setZoom(1);

  return (
    <div className="space-y-2">
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        {/* Botones para editar contenido */}
        <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={disminuirTamano}
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
                    {/* Picker ahora solo previsualiza sin aplicar inmediatamente */}
                    <HexColorPicker 
                      color={colorTemporal} 
                      onChange={(color) => setColorTemporal(color)}
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
                      setPopoverColorAbierto(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" /> Aplicar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setColorTemporal(colorActual); // revertimos
                      setPopoverColorAbierto(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* Botones para visualización de contenido */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={disminuirZoom}
              title="Reducir zoom"
            >
              -
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={resetZoom}
              title="Restablecer (100%)"
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={aumentarZoom}
              title="Aumentar zoom"
            >
              +
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => irAPagina(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Página anterior"
            >
              ◀
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Input
                type="number"
                min={1}
                max={pageCount}
                value={pageInputValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPageInputValue(val === '' ? '' : String(Number(val)));
                }}
                onBlur={() => {
                  const n = Number(pageInputValue);
                  if (!Number.isFinite(n) || n < 1) {
                    setPageInputValue(String(currentPage));
                    return;
                  }
                  irAPagina(Math.min(Math.max(1, n), pageCount));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = Number(pageInputValue);
                    if (!Number.isFinite(n) || n < 1) {
                      setPageInputValue(String(currentPage));
                      return;
                    }
                    irAPagina(Math.min(Math.max(1, n), pageCount));
                  }
                }}
                className="h-8 w-16 text-center"
              />
              <span>/ {pageCount}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => irAPagina(currentPage + 1)}
              disabled={currentPage >= pageCount}
              title="Página siguiente"
            >
              ▶
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Guías de margen</Label>
            <Switch checked={mostrarGuiasMargen} onCheckedChange={setMostrarGuiasMargen} />
          </div>
        </div>
        </div>

        {/* Área de documento con hojas reales de fondo (stack) y contenido dentro del área de márgenes */}
        <div
          className="editor-doc-container"
          style={{
            minHeight,
            maxHeight: '600px',
            overflowY: 'auto',
            overflowX: 'auto',
            display: 'block',
          }}
          ref={containerRef}
        >
          <div
            className="editor-doc-zoom-sizer"
            style={{
              width: `${Math.max(1, pageWidthPx * zoom)}px`,
              position: 'relative',
              height: `${pageCount * pageHeightPx * zoom}px`,
              margin: '0 auto',
            }}
          >
            {/* Fondo de páginas */}
            <div className="absolute top-0 left-0" style={{ width: pageWidthPx, height: pageCount * pageHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <div key={i} style={{ position: 'absolute', top: i * pageHeightPx, left: 0, width: pageWidthPx, height: pageHeightPx, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.08)' }} />
              ))}
            </div>
            {/* Guías de márgenes */}
            {mostrarGuiasMargen && (
              <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: pageCount * pageHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div key={i} style={{ position: 'absolute', top: i * pageHeightPx, left: 0, width: pageWidthPx, height: pageHeightPx }}>
                    {/* Líneas horizontales */}
                    <div style={{ position: 'absolute', top: marginTopPx, left: 0, width: pageWidthPx, borderTop: '1px dashed rgba(0,0,0,0.3)' }} />
                    <div style={{ position: 'absolute', bottom: marginBottomPx, left: 0, width: pageWidthPx, borderBottom: '1px dashed rgba(0,0,0,0.3)' }} />
                    {/* Líneas verticales */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(0,0,0,0.3)' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(0,0,0,0.3)' }} />
                  </div>
                ))}
              </div>
            )}
            {/* Capa de contenido dentro de los márgenes */}
            <div className="absolute top-0 left-0" style={{ width: pageWidthPx, height: pageCount * pageHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <div style={{ position: 'absolute', top: marginTopPx, left: marginLeftPx, width: contentWidthPx }}>
                <div ref={contentMeasureRef}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            {/* Máscaras de márgenes y separadores entre páginas */}
            <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: pageCount * pageHeightPx, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <div key={`mask-${i}`} style={{ position: 'absolute', top: i * pageHeightPx, left: 0, width: pageWidthPx, height: pageHeightPx }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: pageWidthPx, height: marginTopPx, background: '#ffffff' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: pageWidthPx, height: marginBottomPx, background: '#ffffff' }} />
                </div>
              ))}
              {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, i) => (
                <div key={`cut-${i}`} style={{ position: 'absolute', top: (i + 1) * pageHeightPx - 6, left: 8, width: pageWidthPx - 16, height: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 6 }} />
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .ProseMirror {
            min-height: ${minHeight};
            white-space: pre-wrap;
            background-color: transparent !important;
            padding: 0;
            color: #000000;
            box-sizing: content-box;
            /* Respeto de márgenes y ajuste de texto */
            overflow-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
          }
          .ProseMirror:focus {
            outline: none;
          }
          .ProseMirror p {
            margin: 0.5em 0;
            min-height: 1em;
            color: inherit;
            max-width: 100%;
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
          /* Garantizar que elementos no excedan el ancho disponible */
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
