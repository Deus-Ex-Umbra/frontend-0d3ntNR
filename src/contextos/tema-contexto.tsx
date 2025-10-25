import { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'oscuro' | 'azul' | 'verde' | 'rosa' | 'beige' | 'gris' | 'morado' | 'naranja' | 'clinico' | 'menta' | 'sistema';

interface ContextoTema {
  tema: Tema;
  cambiarTema: (tema: Tema) => void;
  tema_efectivo: 'claro' | 'oscuro' | 'azul' | 'verde' | 'rosa' | 'beige' | 'gris' | 'morado' | 'naranja' | 'clinico' | 'menta';
}

const ContextoTema = createContext<ContextoTema | undefined>(undefined);

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const tema_guardado = localStorage.getItem('tema');
    return (tema_guardado as Tema) || 'oscuro';
  });

  const [tema_efectivo, setTemaEfectivo] = useState<'claro' | 'oscuro' | 'azul' | 'verde' | 'rosa' | 'beige' | 'gris' | 'morado' | 'naranja' | 'clinico' | 'menta'>('oscuro');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'blue', 'green', 'rose', 'beige', 'gray', 'purple', 'orange', 'clinical', 'mint');
    
    let tema_aplicar: 'claro' | 'oscuro' | 'azul' | 'verde' | 'rosa' | 'beige' | 'gris' | 'morado' | 'naranja' | 'clinico' | 'menta' = 'oscuro';
    
    if (tema === 'sistema') {
      const es_oscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      tema_aplicar = es_oscuro ? 'oscuro' : 'claro';
    } else {
      tema_aplicar = tema;
    }
    
    setTemaEfectivo(tema_aplicar);
    
    if (tema_aplicar === 'oscuro') {
      root.classList.add('dark');
    } else if (tema_aplicar === 'azul') {
      root.classList.add('blue');
    } else if (tema_aplicar === 'verde') {
      root.classList.add('green');
    } else if (tema_aplicar === 'rosa') {
      root.classList.add('rose');
    } else if (tema_aplicar === 'beige') {
      root.classList.add('beige');
    } else if (tema_aplicar === 'gris') {
      root.classList.add('gray');
    } else if (tema_aplicar === 'morado') {
      root.classList.add('purple');
    } else if (tema_aplicar === 'naranja') {
      root.classList.add('orange');
    } else if (tema_aplicar === 'clinico') {
      root.classList.add('clinical');
    } else if (tema_aplicar === 'menta') {
      root.classList.add('mint');
    }
    
    localStorage.setItem('tema', tema);
  }, [tema]);

  useEffect(() => {
    if (tema !== 'sistema') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const manejarCambio = () => {
      const es_oscuro = mediaQuery.matches;
      const nuevo_tema = es_oscuro ? 'oscuro' : 'claro';
      setTemaEfectivo(nuevo_tema);
      
      const root = window.document.documentElement;
      root.classList.remove('dark', 'blue', 'green', 'rose', 'beige', 'gray', 'purple', 'orange', 'clinical', 'mint');
      if (nuevo_tema === 'oscuro') {
        root.classList.add('dark');
      }
    };
    
    mediaQuery.addEventListener('change', manejarCambio);
    return () => mediaQuery.removeEventListener('change', manejarCambio);
  }, [tema]);

  const cambiarTema = (nuevo_tema: Tema) => {
    setTema(nuevo_tema);
  };

  return (
    <ContextoTema.Provider value={{ tema, cambiarTema, tema_efectivo }}>
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