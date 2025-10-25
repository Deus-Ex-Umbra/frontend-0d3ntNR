import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contextos/autenticacion-contexto';
import { ProveedorTema } from './contextos/tema-contexto';
import InicioSesion from './paginas/InicioSesion';
import Registro from './paginas/Registro';
import Inicio from './paginas/Inicio';
import Pacientes from './paginas/Pacientes';
import Agenda from './paginas/Agenda';
import EdicionImagenes from './paginas/EdicionImagenes';
import Tratamientos from './paginas/Tratamientos';
import Finanzas from './paginas/Finanzas';
import Configuracion from './paginas/Configuracion';
import { Loader2 } from 'lucide-react';

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAutenticacion();

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/inicio-sesion" replace />;
  }

  return <>{children}</>;
}

function RutaPublica({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAutenticacion();

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (usuario) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ProveedorTema>
      <ProveedorAutenticacion>
        <BrowserRouter>
          <Routes>
            <Route
              path="/inicio-sesion"
              element={
                <RutaPublica>
                  <InicioSesion />
                </RutaPublica>
              }
            />
            <Route
              path="/registro"
              element={
                <RutaPublica>
                  <Registro />
                </RutaPublica>
              }
            />
            <Route
              path="/inicio"
              element={
                <RutaProtegida>
                  <Inicio />
                </RutaProtegida>
              }
            />
            <Route
              path="/pacientes"
              element={
                <RutaProtegida>
                  <Pacientes />
                </RutaProtegida>
              }
            />
            <Route
              path="/agenda"
              element={
                <RutaProtegida>
                  <Agenda />
                </RutaProtegida>
              }
            />
            <Route
              path="/edicion-imagenes"
              element={
                <RutaProtegida>
                  <EdicionImagenes />
                </RutaProtegida>
              }
            />
            <Route
              path="/tratamientos"
              element={
                <RutaProtegida>
                  <Tratamientos />
                </RutaProtegida>
              }
            />
            <Route
              path="/finanzas"
              element={
                <RutaProtegida>
                  <Finanzas />
                </RutaProtegida>
              }
            />
            <Route
              path="/configuracion"
              element={
                <RutaProtegida>
                  <Configuracion />
                </RutaProtegida>
              }
            />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </BrowserRouter>
      </ProveedorAutenticacion>
    </ProveedorTema>
  );
}

export default App;