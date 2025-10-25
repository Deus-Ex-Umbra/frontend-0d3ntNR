import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { autenticacionApi, usuariosApi } from '@/lib/api';

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  avatar?: string;
}

interface AutenticacionContexto {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
  registrar: (nombre: string, correo: string, contrasena: string) => Promise<void>;
  actualizarUsuario: (datos: Partial<Usuario>) => void;
}

const AutenticacionContexto = createContext<AutenticacionContexto | undefined>(undefined);

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const token = localStorage.getItem('token_acceso');
      console.log('Token en localStorage:', token ? 'Existe' : 'No existe');
      
      if (!token) {
        setCargando(false);
        return;
      }
      
      const datos_usuario = await usuariosApi.obtenerPerfil();
      console.log('Usuario cargado:', datos_usuario);
      setUsuario(datos_usuario);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      localStorage.removeItem('token_acceso');
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesion = async (correo: string, contrasena: string) => {
    console.log('Intentando iniciar sesión con:', correo);
    
    try {
      const respuesta = await autenticacionApi.iniciarSesion({ correo, contrasena });
      console.log('Respuesta del servidor:', respuesta);
      
      if (!respuesta.token_acceso) {
        throw new Error('No se recibió el token de acceso');
      }
      
      localStorage.setItem('token_acceso', respuesta.token_acceso);
      console.log('Token guardado en localStorage');
      
      setUsuario(respuesta.usuario);
      console.log('Usuario establecido en el contexto:', respuesta.usuario);
    } catch (error) {
      console.error('Error completo en iniciarSesion:', error);
      throw error;
    }
  };

  const cerrarSesion = () => {
    console.log('Cerrando sesión');
    localStorage.removeItem('token_acceso');
    setUsuario(null);
  };

  const registrar = async (nombre: string, correo: string, contrasena: string) => {
    console.log('Intentando registrar usuario:', correo);
    
    try {
      const respuesta = await autenticacionApi.registrar({ nombre, correo, contrasena });
      console.log('Usuario registrado:', respuesta);
      
      await iniciarSesion(correo, contrasena);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  const actualizarUsuario = (datos: Partial<Usuario>) => {
    setUsuario(prev => prev ? { ...prev, ...datos } : null);
  };

  return (
    <AutenticacionContexto.Provider value={{ 
      usuario, 
      cargando, 
      iniciarSesion, 
      cerrarSesion, 
      registrar,
      actualizarUsuario
    }}>
      {children}
    </AutenticacionContexto.Provider>
  );
}

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContexto);
  if (contexto === undefined) {
    throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}