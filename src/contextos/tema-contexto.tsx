import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'oscuro' | 'clinico' |
  'azul' | 'azul-claro' |
  'verde' | 'verde-claro' |
  'rosa' | 'rosa-claro' |
  'beige' | 'beige-claro' |
  'gris' | 'gris-claro' |
  'morado' | 'morado-claro' |
  'naranja' | 'naranja-claro' |
  'menta' | 'menta-claro' |
  // Especiales
  'cielo-abierto' | 'esmeralda' | 'atardecer' | 'cafe-leche' |
  'artico' | 'neon-cyber' | 'vintage-sepia' | 'azul-hielo' |
  // Monocromáticos (escala de grises pura)
  'mono-claro' | 'mono-oscuro' |
  'personalizado';

type TemaEfectivo = Exclude<Tema, 'personalizado'> | 'personalizado';

export interface TemaPersonalizado {
  // Colores principales (obligatorios)
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;

  // Colores derivados (opcionales - si no se especifican, se calculan automáticamente)
  card?: string;
  cardForeground?: string;
  popover?: string;
  popoverForeground?: string;
  primaryForeground?: string;
  secondaryForeground?: string;
  mutedForeground?: string;
  accentForeground?: string;
  destructive?: string;
  destructiveForeground?: string;
  input?: string;
  ring?: string;
}

interface ContextoTema {
  tema: Tema;
  cambiarTema: (tema: Tema) => void;
  tema_efectivo: TemaEfectivo;
  tema_personalizado: TemaPersonalizado | null;
  actualizarTemaPersonalizado: (colores: TemaPersonalizado) => void;
  aplicarColoresPersonalizados: (colores: TemaPersonalizado) => void;
}

const TEMA_PERSONALIZADO_DEFAULT: TemaPersonalizado = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  primary: '#3b82f6',
  secondary: '#f1f5f9',
  accent: '#e0f2fe',
  muted: '#f1f5f9',
  border: '#e2e8f0',
};

const ContextoTema = createContext<ContextoTema | undefined>(undefined);

// Convertir hex a HSL string para CSS
function hexToHSL(hex: string): string {
  // Quitar el # si existe
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generar colores derivados (foregrounds) automáticamente
function generarForeground(_hex: string, esClaro: boolean): string {
  if (esClaro) {
    return hexToHSL('#0a0a0a'); // Texto oscuro para fondo claro
  }
  return hexToHSL('#fafafa'); // Texto claro para fondo oscuro
}

function esColorClaro(hex: string): boolean {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const tema_guardado = localStorage.getItem('tema');
    // Migrar de tema 'sistema' al nuevo default 'claro'
    if (tema_guardado === 'sistema') {
      return 'claro';
    }
    return (tema_guardado as Tema) || 'claro';
  });

  const [tema_efectivo, setTemaEfectivo] = useState<TemaEfectivo>('claro');

  const [tema_personalizado, setTemaPersonalizado] = useState<TemaPersonalizado | null>(() => {
    const guardado = localStorage.getItem('tema_personalizado');
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch {
        return TEMA_PERSONALIZADO_DEFAULT;
      }
    }
    return TEMA_PERSONALIZADO_DEFAULT;
  });

  const aplicarColoresPersonalizados = (colores: TemaPersonalizado) => {
    const root = window.document.documentElement;

    // Helper: usar valor personalizado o generar automáticamente
    const obtenerForeground = (colorPersonalizado: string | undefined, colorBase: string) => {
      if (colorPersonalizado) return hexToHSL(colorPersonalizado);
      return generarForeground(colorBase, esColorClaro(colorBase));
    };

    // Colores principales
    root.style.setProperty('--custom-background', hexToHSL(colores.background));
    root.style.setProperty('--custom-foreground', colores.foreground ? hexToHSL(colores.foreground) : generarForeground(colores.background, esColorClaro(colores.background)));

    // Card y Popover (usan background o valor personalizado)
    root.style.setProperty('--custom-card', colores.card ? hexToHSL(colores.card) : hexToHSL(colores.background));
    root.style.setProperty('--custom-card-foreground', obtenerForeground(colores.cardForeground, colores.card || colores.background));
    root.style.setProperty('--custom-popover', colores.popover ? hexToHSL(colores.popover) : hexToHSL(colores.background));
    root.style.setProperty('--custom-popover-foreground', obtenerForeground(colores.popoverForeground, colores.popover || colores.background));

    // Primary
    root.style.setProperty('--custom-primary', hexToHSL(colores.primary));
    root.style.setProperty('--custom-primary-foreground', obtenerForeground(colores.primaryForeground, colores.primary));

    // Secondary
    root.style.setProperty('--custom-secondary', hexToHSL(colores.secondary));
    root.style.setProperty('--custom-secondary-foreground', obtenerForeground(colores.secondaryForeground, colores.secondary));

    // Muted
    root.style.setProperty('--custom-muted', hexToHSL(colores.muted));
    root.style.setProperty('--custom-muted-foreground', obtenerForeground(colores.mutedForeground, colores.muted));

    // Accent
    root.style.setProperty('--custom-accent', hexToHSL(colores.accent));
    root.style.setProperty('--custom-accent-foreground', obtenerForeground(colores.accentForeground, colores.accent));

    // Border, Input, Ring
    root.style.setProperty('--custom-border', hexToHSL(colores.border));
    root.style.setProperty('--custom-input', colores.input ? hexToHSL(colores.input) : hexToHSL(colores.border));
    root.style.setProperty('--custom-ring', colores.ring ? hexToHSL(colores.ring) : hexToHSL(colores.primary));

    // Destructive (error/danger colors)
    root.style.setProperty('--custom-destructive', colores.destructive ? hexToHSL(colores.destructive) : '0 84.2% 60.2%');
    root.style.setProperty('--custom-destructive-foreground', colores.destructiveForeground ? hexToHSL(colores.destructiveForeground) : '210 40% 98%');
  };

  const actualizarTemaPersonalizado = (colores: TemaPersonalizado) => {
    setTemaPersonalizado(colores);
    localStorage.setItem('tema_personalizado', JSON.stringify(colores));

    // Si estamos en tema personalizado, aplicar inmediatamente
    if (tema === 'personalizado') {
      aplicarColoresPersonalizados(colores);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;

    // Remover todas las clases de tema
    root.classList.remove(
      'dark', 'blue', 'green', 'rose', 'beige', 'gray', 'purple', 'orange', 'clinical', 'mint',
      'blue-light', 'green-light', 'rose-light', 'beige-light', 'gray-light', 'purple-light', 'orange-light', 'mint-light',
      // Especiales
      'sky-open', 'emerald', 'sunset', 'coffee-cream', 'arctic', 'neon-cyber', 'vintage-sepia', 'ice-blue',
      // Monocromáticos
      'mono-light', 'mono-dark',
      'custom'
    );

    setTemaEfectivo(tema);

    // Mapa de tema a clase CSS
    const temaClaseMap: Record<Tema, string | null> = {
      'claro': null, // :root es el tema claro por defecto
      'oscuro': 'dark',
      'clinico': 'clinical',
      'azul': 'blue',
      'azul-claro': 'blue-light',
      'verde': 'green',
      'verde-claro': 'green-light',
      'rosa': 'rose',
      'rosa-claro': 'rose-light',
      'beige': 'beige',
      'beige-claro': 'beige-light',
      'gris': 'gray',
      'gris-claro': 'gray-light',
      'morado': 'purple',
      'morado-claro': 'purple-light',
      'naranja': 'orange',
      'naranja-claro': 'orange-light',
      'menta': 'mint',
      'menta-claro': 'mint-light',
      // Especiales
      'cielo-abierto': 'sky-open',
      'esmeralda': 'emerald',
      'atardecer': 'sunset',
      'cafe-leche': 'coffee-cream',
      'artico': 'arctic',
      'neon-cyber': 'neon-cyber',
      'vintage-sepia': 'vintage-sepia',
      'azul-hielo': 'ice-blue',
      // Monocromáticos
      'mono-claro': 'mono-light',
      'mono-oscuro': 'mono-dark',
      'personalizado': 'custom',
    };

    const clase = temaClaseMap[tema];
    if (clase) {
      root.classList.add(clase);
    }

    // Si es tema personalizado, aplicar colores
    if (tema === 'personalizado' && tema_personalizado) {
      aplicarColoresPersonalizados(tema_personalizado);
    }

    localStorage.setItem('tema', tema);
  }, [tema, tema_personalizado]);

  const cambiarTema = (nuevo_tema: Tema) => {
    setTema(nuevo_tema);
  };

  return (
    <ContextoTema.Provider value={{
      tema,
      cambiarTema,
      tema_efectivo,
      tema_personalizado,
      actualizarTemaPersonalizado,
      aplicarColoresPersonalizados,
    }}>
      {children}
    </ContextoTema.Provider>
  );
}

export function useTema() {
  const contexto = useContext(ContextoTema);
  if (contexto === undefined) {
    throw new Error('useTema debe ser usado dentro de un ProveedorTema');
  }
  return contexto;
}
