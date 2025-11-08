import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MenuContexto {
  colapsado: boolean;
  setColapsado: (colapsado: boolean) => void;
}

const MenuContext = createContext<MenuContexto | undefined>(undefined);

export function ProveedorMenu({ children }: { children: ReactNode }) {
  const [colapsado, setColapsadoState] = useState(() => {
    const guardado = localStorage.getItem('menu-colapsado');
    return guardado === 'true';
  });

  const setColapsado = (valor: boolean) => {
    setColapsadoState(valor);
    localStorage.setItem('menu-colapsado', valor.toString());
  };

  useEffect(() => {
    localStorage.setItem('menu-colapsado', colapsado.toString());
  }, [colapsado]);

  return (
    <MenuContext.Provider value={{ colapsado, setColapsado }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const contexto = useContext(MenuContext);
  if (contexto === undefined) {
    throw new Error('useMenu debe usarse dentro de un ProveedorMenu');
  }
  return contexto;
}

