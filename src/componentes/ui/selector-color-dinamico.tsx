import { useState } from 'react';
import { Label } from '@/componentes/ui/label';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utilidades';

interface SelectorColorDinamicoProps {
  color: string;
  onChange: (color: string) => void;
  colores_predefinidos?: { nombre: string; valor: string }[];
  label?: string;
  className?: string;
}

const colores_default = [
  { nombre: 'Rojo', valor: '#ef4444' },
  { nombre: 'Naranja', valor: '#f97316' },
  { nombre: 'Amarillo', valor: '#eab308' },
  { nombre: 'Lima', valor: '#84cc16' },
  { nombre: 'Verde', valor: '#22c55e' },
  { nombre: 'Esmeralda', valor: '#10b981' },
  { nombre: 'Turquesa', valor: '#14b8a6' },
  { nombre: 'Cian', valor: '#06b6d4' },
  { nombre: 'Azul', valor: '#3b82f6' },
  { nombre: 'Índigo', valor: '#6366f1' },
  { nombre: 'Violeta', valor: '#8b5cf6' },
  { nombre: 'Morado', valor: '#a855f7' },
  { nombre: 'Fucsia', valor: '#d946ef' },
  { nombre: 'Rosa', valor: '#ec4899' },
  { nombre: 'Carmesí', valor: '#f43f5e' },
  { nombre: 'Gris', valor: '#6b7280' },
];

export function SelectorColorDinamico({
  color,
  onChange,
  colores_predefinidos = colores_default,
  label = 'Color',
  className,
}: SelectorColorDinamicoProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
          >
            <div
              className="w-5 h-5 rounded border-2 border-border"
              style={{ backgroundColor: color }}
            />
            <span className="flex-1 text-left">{color}</span>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Color personalizado</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-16 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(valor)) {
                      onChange(valor);
                    }
                  }}
                  placeholder="#808080"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Colores predefinidos</Label>
              <div className="grid grid-cols-8 gap-2">
                {colores_predefinidos.map((color_predefinido) => (
                  <button
                    key={color_predefinido.valor}
                    type="button"
                    className={cn(
                      'relative h-8 w-8 rounded border-2 hover:scale-110 transition-transform',
                      color === color_predefinido.valor
                        ? 'border-foreground ring-2 ring-primary ring-offset-2'
                        : 'border-border'
                    )}
                    style={{ backgroundColor: color_predefinido.valor }}
                    onClick={() => {
                      onChange(color_predefinido.valor);
                      setAbierto(false);
                    }}
                    title={color_predefinido.nombre}
                  >
                    {color === color_predefinido.valor && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg border-2 border-border bg-secondary/20">
              <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">Color seleccionado</p>
                  <p className="text-xs text-muted-foreground font-mono">{color}</p>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
