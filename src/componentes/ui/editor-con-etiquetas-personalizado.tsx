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
import { Node, mergeAttributes, InputRule, wrappingInputRule } from '@tiptap/core';
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
  margenes?: { top: number; right: number; bottom: number; left: number };
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
  const mmToPx = (mm: number) => (mm / 25.4) * 96;
  const defaultLetterMm = { widthMm: 216, heightMm: 279 };
  const baseMm = tamanoPersonalizado
    ? { widthMm: tamanoPersonalizado.widthMm, heightMm: tamanoPersonalizado.heightMm }
    : tamanoPapel === 'carta'
      ? defaultLetterMm
      : tamanoPapel === 'legal'
        ? { widthMm: 216, heightMm: 356 }
        : { widthMm: 210, heightMm: 297 };
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
  const effectivePageOffset = pageHeightPx - marginTopPx - marginBottomPx;
  const [maskClipPath, setMaskClipPath] = useState<string>('none');

  const [colorActual, setColorActual] = useState('#000000');
  const [colorTemporal, setColorTemporal] = useState('#000000');
  const [popoverColorAbierto, setPopoverColorAbierto] = useState(false);
  const [tamanoActual, setTamanoActual] = useState('16px');
  const [mostrarGuiasMargen, setMostrarGuiasMargen] = useState(false);
  const [zoom, setZoom] = useState(1);
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
      ...(habilitarEtiquetas ? [EtiquetaNode] : []),
    ],
    content: contenido,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-0',
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
  useEffect(() => {
    if (!editor) return;
    
    const updatePage = () => {
      const { selection } = editor.state;
      const { from } = selection;
      const view = editor.view;
      const coords = view.coordsAtPos(from);
      const dom = view.dom;
      const domRect = dom.getBoundingClientRect();
      const relativeYZoomed = (coords.bottom - 2) - domRect.top;
      const relativeY = relativeYZoomed / zoom;
      const absoluteY = relativeY;
      const pageIndex = Math.max(0, Math.floor(absoluteY / effectivePageOffset));
      setCurrentPage(pageIndex + 1);
    };

    editor.on('selectionUpdate', updatePage);
    editor.on('update', updatePage);
    
    return () => {
      editor.off('selectionUpdate', updatePage);
      editor.off('update', updatePage);
    };
  }, [editor, zoom, effectivePageOffset]);
  useEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const update = () => {
      const h = el.scrollHeight;
      if (effectivePageOffset <= 0) {
        setPageCount(1);
        return;
      }
      const pages = Math.max(1, Math.ceil(h / effectivePageOffset));
      setPageCount(pages);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [effectivePageOffset, contenido]);
  useEffect(() => {
    if (pageCount <= 0) return;
    const pageIndex = currentPage - 1;
    const top = pageIndex * effectivePageOffset;
    const bottom = top + effectivePageOffset;
    const totalContainerHeight = pageCount * effectivePageOffset;
    const buffer = 20; 
    const insetTop = Math.max(0, top - buffer);
    const insetBottom = Math.max(0, totalContainerHeight - bottom - buffer);
    setMaskClipPath(`inset(${insetTop}px 0px ${insetBottom}px 0px)`);
  }, [currentPage, pageCount, effectivePageOffset]);
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
      setColorTemporal(colorActual);
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
                      setColorTemporal(colorActual);
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
              height: `${(pageCount * effectivePageOffset + marginTopPx + marginBottomPx) * zoom}px`,
              margin: '0 auto',
            }}
          >
            <div className="absolute top-0 left-0" style={{ width: pageWidthPx, height: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              {Array.from({ length: pageCount }).map((_, i) => {
                const isCurrentPage = (i + 1) === currentPage;
                const topPos = i * effectivePageOffset + marginTopPx;
                return (
                  <div 
                    key={i} 
                    style={{ 
                      position: 'absolute', 
                      top: topPos, 
                      left: 0, 
                      width: pageWidthPx, 
                      height: effectivePageOffset,
                      background: '#fff',
                      zIndex: isCurrentPage ? 10 : 1,
                      boxShadow: isCurrentPage ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                    }} 
                  />
                );
              })}
            </div>
            {mostrarGuiasMargen && (
              <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 20 }}>
                {Array.from({ length: pageCount }).map((_, i) => {
                  if ((i + 1) !== currentPage) return null;
                  const topPos = i * effectivePageOffset + marginTopPx;
                  return (
                    <div key={i} style={{ position: 'absolute', top: topPos, left: 0, width: pageWidthPx, height: effectivePageOffset }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: pageWidthPx, borderTop: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: pageWidthPx, borderBottom: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div 
              className="absolute top-0 left-0" 
              style={{ 
                width: pageWidthPx, 
                height: '100%', 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top left', 
                zIndex: 30,
                clipPath: maskClipPath,
                transition: 'clip-path 0.2s ease-out'
              }}
            >
              <div style={{ position: 'absolute', top: marginTopPx, left: marginLeftPx, width: contentWidthPx }}>
                <div ref={contentMeasureRef}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 40 }}>
              {Array.from({ length: pageCount }).map((_, i) => {
                const isCurrentPage = (i + 1) === currentPage;
                const topPos = i * effectivePageOffset + marginTopPx;
                return (
                  <div 
                    key={`dim-${i}`} 
                    style={{ 
                      position: 'absolute', 
                      top: topPos, 
                      left: 0, 
                      width: pageWidthPx, 
                      height: effectivePageOffset,
                      backgroundColor: isCurrentPage ? 'transparent' : '#e2e8f0', 
                      opacity: isCurrentPage ? 0 : 1,
                      borderBottom: i < pageCount - 1 ? '1px solid #94a3b8' : 'none',
                      transition: 'opacity 0.2s ease, background-color 0.2s ease',
                      pointerEvents: isCurrentPage ? 'none' : 'auto',
                      cursor: isCurrentPage ? 'text' : 'pointer',
                    }}
                    onClick={(e) => {
                      if (!isCurrentPage) {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentPage(i + 1);
                      }
                    }}
                  >
                    {!isCurrentPage && (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-50">
                            <span className="text-slate-500 font-bold text-lg select-none">Página {i + 1}</span>
                            <span className="text-slate-400 text-xs select-none">(Clic para editar)</span>
                        </div>
                    )}
                    {isCurrentPage && (
                      <div style={{ position: 'absolute', bottom: 4, right: 8, fontSize: '10px', color: '#94a3b8', pointerEvents: 'none' }}>
                        Pág. {i + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute top-0 left-0 pointer-events-none" style={{ width: pageWidthPx, height: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left', zIndex: 50 }}>
              {(() => {
                const topPos = (currentPage - 1) * effectivePageOffset + marginTopPx;
                return (
                  <>
                    {marginTopPx > 0 && (
                      <div 
                        className="margin-deploy-top"
                        style={{
                          position: 'absolute',
                          top: topPos - marginTopPx,
                          left: 0,
                          width: pageWidthPx,
                          height: marginTopPx,
                          backgroundColor: '#fff',
                          boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
                        }}
                      >
                        {mostrarGuiasMargen && (
                          <>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                          </>
                        )}
                      </div>
                    )}
                    {marginBottomPx > 0 && (
                      <div 
                        className="margin-deploy-bottom"
                        style={{
                          position: 'absolute',
                          top: topPos + effectivePageOffset,
                          left: 0,
                          width: pageWidthPx,
                          height: marginBottomPx,
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        }}
                      >
                        {mostrarGuiasMargen && (
                          <>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: marginLeftPx, borderLeft: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: marginRightPx, borderRight: '1px dashed rgba(59, 130, 246, 0.5)' }} />
                          </>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
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

          @keyframes deploy-vertical {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }
          .margin-deploy-top {
            transform-origin: bottom;
            animation: deploy-vertical 0.3s ease-out forwards;
          }
          .margin-deploy-bottom {
            transform-origin: top;
            animation: deploy-vertical 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
});

EditorConEtiquetasPersonalizado.displayName = 'EditorConEtiquetasPersonalizado';
