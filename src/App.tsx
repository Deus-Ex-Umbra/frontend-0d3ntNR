import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion, useAutenticacion } from './contextos/autenticacion-contexto';
import { ProveedorTema } from './contextos/tema-contexto';
import { ProveedorMenu } from './contextos/menu-contexto';
import { ProveedorClinica } from './contextos/clinica-contexto';
import { ProveedorEdicionImagenes } from './contextos/edicion-imagenes-contexto';
import InicioSesion from './paginas/InicioSesion';
import Registro from './paginas/Registro';
import Inicio from './paginas/Inicio';
import Pacientes from './paginas/Pacientes';
import Agenda from './paginas/Agenda';
import EdicionImagenes from './paginas/EdicionImagenes';
import Tratamientos from './paginas/Tratamientos';
import Finanzas from './paginas/Finanzas';
import Inventarios from './paginas/Inventarios';
import Configuracion from './paginas/Configuracion';
import { VistaMovil } from './componentes/VistaMovil';
import { Loader2 } from 'lucide-react';
import { useResponsive } from './hooks/use-responsive';

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

function InicioResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Inicio />;
}

function PacientesResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Pacientes />;
}

function AgendaResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Agenda />;
}

function EdicionImagenesResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <EdicionImagenes />;
}

function TratamientosResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Tratamientos />;
}

function FinanzasResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Finanzas />;
}

function InventariosResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Inventarios />;
}

function ConfiguracionResponsive() {
  const { es_movil } = useResponsive();
  return es_movil ? <VistaMovil /> : <Configuracion />;
}

function App() {
  return (
    <ProveedorTema>
      <ProveedorAutenticacion>
        <ProveedorClinica>
          <ProveedorMenu>
            <ProveedorEdicionImagenes>
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
                        <InicioResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/pacientes"
                    element={
                      <RutaProtegida>
                        <PacientesResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/agenda"
                    element={
                      <RutaProtegida>
                        <AgendaResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/edicion-imagenes"
                    element={
                      <RutaProtegida>
                        <EdicionImagenesResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/tratamientos"
                    element={
                      <RutaProtegida>
                        <TratamientosResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/finanzas"
                    element={
                      <RutaProtegida>
                        <FinanzasResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/inventarios"
                    element={
                      <RutaProtegida>
                        <InventariosResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/configuracion"
                    element={
                      <RutaProtegida>
                        <ConfiguracionResponsive />
                      </RutaProtegida>
                    }
                  />
                  <Route path="/" element={<Navigate to="/inicio" replace />} />
                </Routes>
              </BrowserRouter>
            </ProveedorEdicionImagenes>
          </ProveedorMenu>
        </ProveedorClinica>
      </ProveedorAutenticacion>
    </ProveedorTema>
  );
}

export default App;
