import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAutenticacion } from './autenticacion-contexto';

type Tema = 'claro' | 'oscuro' | 'clinico' |
  'azul' | 'azul-claro' |
  'verde' | 'verde-claro' |
  'rosa' | 'rosa-claro' |
  'beige' | 'beige-claro' |
  'gris' | 'gris-claro' |
  'morado' | 'morado-claro' |
  'naranja' | 'naranja-claro' |
  'menta' | 'menta-claro' |
  'cielo-abierto' | 'esmeralda' | 'atardecer' | 'cafe-leche' |
  'artico' | 'neon-cyber' | 'vintage-sepia' | 'azul-hielo' |
  'mono-claro' | 'mono-oscuro' |
  'personalizado';

type TemaEfectivo = Exclude<Tema, 'personalizado'> | 'personalizado';

export interface TemaPersonalizado {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
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

function obtenerTemaKey(usuario_id: number | undefined): string {
  return usuario_id ? `tema-${usuario_id}` : 'tema';
}

function obtenerTemaPersonalizadoKey(usuario_id: number | undefined): string {
  return usuario_id ? `tema_personalizado-${usuario_id}` : 'tema_personalizado';
}

export function limpiarCacheTema(usuario_id: number | undefined): void {
  if (!usuario_id) return;
  try {
    localStorage.removeItem(obtenerTemaKey(usuario_id));
    localStorage.removeItem(obtenerTemaPersonalizadoKey(usuario_id));
  } catch (error) {
    console.error('Error al limpiar caché de tema:', error);
  }
}

function hexToHSL(hex: string): string {
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

function generarForeground(_hex: string, esClaro: boolean): string {
  if (esClaro) {
    return hexToHSL('#0a0a0a');
  }
  return hexToHSL('#fafafa');
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
  const { usuario } = useAutenticacion();
  const usuario_id = usuario?.id;
  const [tema, setTema] = useState<Tema>('claro');
  const [tema_efectivo, setTemaEfectivo] = useState<TemaEfectivo>('claro');
  const [tema_personalizado, setTemaPersonalizado] = useState<TemaPersonalizado | null>(TEMA_PERSONALIZADO_DEFAULT);
  useEffect(() => {
    const tema_key = obtenerTemaKey(usuario_id);
    const tema_personalizado_key = obtenerTemaPersonalizadoKey(usuario_id);

    const tema_guardado = localStorage.getItem(tema_key);
    if (tema_guardado === 'sistema') {
      setTema('claro');
    } else if (tema_guardado) {
      setTema(tema_guardado as Tema);
    } else {
      setTema('claro');
    }

    const guardado_personalizado = localStorage.getItem(tema_personalizado_key);
    if (guardado_personalizado) {
      try {
        setTemaPersonalizado(JSON.parse(guardado_personalizado));
      } catch {
        setTemaPersonalizado(TEMA_PERSONALIZADO_DEFAULT);
      }
    } else {
      setTemaPersonalizado(TEMA_PERSONALIZADO_DEFAULT);
    }
  }, [usuario_id]);

  const aplicarColoresPersonalizados = useCallback((colores: TemaPersonalizado) => {
    const root = window.document.documentElement;
    const obtenerForeground = (colorPersonalizado: string | undefined, colorBase: string) => {
      if (colorPersonalizado) return hexToHSL(colorPersonalizado);
      return generarForeground(colorBase, esColorClaro(colorBase));
    };
    root.style.setProperty('--custom-background', hexToHSL(colores.background));
    root.style.setProperty('--custom-foreground', colores.foreground ? hexToHSL(colores.foreground) : generarForeground(colores.background, esColorClaro(colores.background)));
    root.style.setProperty('--custom-card', colores.card ? hexToHSL(colores.card) : hexToHSL(colores.background));
    root.style.setProperty('--custom-card-foreground', obtenerForeground(colores.cardForeground, colores.card || colores.background));
    root.style.setProperty('--custom-popover', colores.popover ? hexToHSL(colores.popover) : hexToHSL(colores.background));
    root.style.setProperty('--custom-popover-foreground', obtenerForeground(colores.popoverForeground, colores.popover || colores.background));
    root.style.setProperty('--custom-primary', hexToHSL(colores.primary));
    root.style.setProperty('--custom-primary-foreground', obtenerForeground(colores.primaryForeground, colores.primary));
    root.style.setProperty('--custom-secondary', hexToHSL(colores.secondary));
    root.style.setProperty('--custom-secondary-foreground', obtenerForeground(colores.secondaryForeground, colores.secondary));
    root.style.setProperty('--custom-muted', hexToHSL(colores.muted));
    root.style.setProperty('--custom-muted-foreground', obtenerForeground(colores.mutedForeground, colores.muted));
    root.style.setProperty('--custom-accent', hexToHSL(colores.accent));
    root.style.setProperty('--custom-accent-foreground', obtenerForeground(colores.accentForeground, colores.accent));
    root.style.setProperty('--custom-border', hexToHSL(colores.border));
    root.style.setProperty('--custom-input', colores.input ? hexToHSL(colores.input) : hexToHSL(colores.border));
    root.style.setProperty('--custom-ring', colores.ring ? hexToHSL(colores.ring) : hexToHSL(colores.primary));
    root.style.setProperty('--custom-destructive', colores.destructive ? hexToHSL(colores.destructive) : '0 84.2% 60.2%');
    root.style.setProperty('--custom-destructive-foreground', colores.destructiveForeground ? hexToHSL(colores.destructiveForeground) : '210 40% 98%');
  }, []);

  const actualizarTemaPersonalizado = useCallback((colores: TemaPersonalizado) => {
    setTemaPersonalizado(colores);
    const tema_personalizado_key = obtenerTemaPersonalizadoKey(usuario_id);
    localStorage.setItem(tema_personalizado_key, JSON.stringify(colores));
    // También guardar en la key global para que las páginas públicas usen el último tema
    localStorage.setItem('tema_personalizado', JSON.stringify(colores));
    if (tema === 'personalizado') {
      aplicarColoresPersonalizados(colores);
    }
  }, [usuario_id, tema, aplicarColoresPersonalizados]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      'dark', 'blue', 'green', 'rose', 'beige', 'gray', 'purple', 'orange', 'clinical', 'mint',
      'blue-light', 'green-light', 'rose-light', 'beige-light', 'gray-light', 'purple-light', 'orange-light', 'mint-light',
      'sky-open', 'emerald', 'sunset', 'coffee-cream', 'arctic', 'neon-cyber', 'vintage-sepia', 'ice-blue',
      'mono-light', 'mono-dark',
      'custom'
    );
    setTemaEfectivo(tema);
    const temaClaseMap: Record<Tema, string | null> = {
      'claro': null,
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
      'cielo-abierto': 'sky-open',
      'esmeralda': 'emerald',
      'atardecer': 'sunset',
      'cafe-leche': 'coffee-cream',
      'artico': 'arctic',
      'neon-cyber': 'neon-cyber',
      'vintage-sepia': 'vintage-sepia',
      'azul-hielo': 'ice-blue',
      'mono-claro': 'mono-light',
      'mono-oscuro': 'mono-dark',
      'personalizado': 'custom',
    };

    const clase = temaClaseMap[tema];
    if (clase) {
      root.classList.add(clase);
    }
    if (tema === 'personalizado' && tema_personalizado) {
      aplicarColoresPersonalizados(tema_personalizado);
    }
    const tema_key = obtenerTemaKey(usuario_id);
    localStorage.setItem(tema_key, tema);
    // También guardar en la key global para que las páginas públicas usen el último tema
    localStorage.setItem('tema', tema);
  }, [tema, tema_personalizado, usuario_id, aplicarColoresPersonalizados]);

  const cambiarTema = useCallback((nuevo_tema: Tema) => {
    setTema(nuevo_tema);
  }, []);

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
