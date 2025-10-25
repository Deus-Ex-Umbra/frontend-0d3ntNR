import { useState, useEffect } from 'react';
import { verificarConexion } from '@/lib/api';

export function usarConexion() {
  const [en_linea, setEnLinea] = useState(true);
  const [verificando, setVerificando] = useState(false);

  const verificar = async () => {
    setVerificando(true);
    const conectado = await verificarConexion();
    setEnLinea(conectado);
    setVerificando(false);
    return conectado;
  };

  useEffect(() => {
    verificar();

    const intervalo = setInterval(verificar, 30000);

    const manejarOnline = () => {
      setEnLinea(true);
      verificar();
    };
    
    const manejarOffline = () => setEnLinea(false);

    window.addEventListener('online', manejarOnline);
    window.addEventListener('offline', manejarOffline);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('online', manejarOnline);
      window.removeEventListener('offline', manejarOffline);
    };
  }, []);

  return { en_linea, verificando, verificar };
}