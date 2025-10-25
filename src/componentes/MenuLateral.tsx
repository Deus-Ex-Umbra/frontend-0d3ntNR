import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Settings, 
  LogOut,
  Home,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { cn } from '@/lib/utilidades';
import { Button } from '@/componentes/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/componentes/ui/avatar';

interface ItemMenu {
  icono: React.ElementType;
  etiqueta: string;
  ruta: string;
}

const items_menu: ItemMenu[] = [
  { icono: Home, etiqueta: 'Inicio', ruta: '/inicio' },
  { icono: Users, etiqueta: 'Pacientes', ruta: '/pacientes' },
  { icono: Calendar, etiqueta: 'Agenda', ruta: '/agenda' },
  { icono: ImageIcon, etiqueta: 'Editor de Imágenes', ruta: '/edicion-imagenes' },
  { icono: FileText, etiqueta: 'Tratamientos', ruta: '/tratamientos' },
  { icono: DollarSign, etiqueta: 'Finanzas', ruta: '/finanzas' },
  { icono: Settings, etiqueta: 'Configuración', ruta: '/configuracion' },
];

export function MenuLateral() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { cerrarSesion, usuario } = useAutenticacion();
  const [colapsado, setColapsado] = useState(false);
  const github_url = 'https://github.com/deus-ex-umbra';

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navegar('/inicio-sesion');
  };

  const abrirGithub = () => {
    window.open(github_url, '_blank');
  };

  return (
    <div className={cn(
      "flex h-screen flex-col border-r-2 border-border bg-card/50 backdrop-blur-sm transition-all duration-300",
      colapsado ? "w-20" : "w-72"
    )}>
      <div className="border-b-2 border-border p-6 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", colapsado && "justify-center w-full")}>
            <button
              onClick={abrirGithub}
              className="group relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform overflow-hidden"
              title="Visitar GitHub"
            >
              <img 
                src="/deus_ex_umbra.svg" 
                alt="GitHub"
                className="h-8 w-8 transition-all duration-300 group-hover:scale-110 relative z-10"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.8)]" />
              <ExternalLink className="absolute top-1 right-1 h-3 w-3 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity z-20" />
            </button>
            {!colapsado && (
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                  0d3ntApp
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Gestión Odontológica</p>
              </div>
            )}
          </div>
          {!colapsado && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setColapsado(true)}
              className="h-8 w-8 hover:bg-primary/20 hover:scale-110 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        {colapsado && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setColapsado(false)}
            className="h-8 w-8 mt-2 mx-auto hover:bg-primary/20 hover:scale-110 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {items_menu.map((item) => {
            const Icono = item.icono;
            const activo = ubicacion.pathname === item.ruta;
            
            return (
              <Button
                key={item.ruta}
                variant={activo ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full h-12 text-base font-medium transition-all duration-200',
                  colapsado ? 'justify-center px-0' : 'justify-start gap-3',
                  activo 
                    ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:scale-105' 
                    : 'hover:bg-secondary/80 text-muted-foreground hover:text-foreground hover:scale-105 hover:shadow-md'
                )}
                onClick={() => navegar(item.ruta)}
                title={colapsado ? item.etiqueta : undefined}
              >
                <Icono className="h-5 w-5 flex-shrink-0" />
                {!colapsado && <span>{item.etiqueta}</span>}
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="border-t-2 border-border p-4 space-y-3 bg-secondary/20">
        {!colapsado ? (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3 border border-border hover:bg-secondary/80 hover:shadow-md transition-all duration-200">
              <Avatar className="h-11 w-11 flex-shrink-0 hover:scale-110 transition-transform duration-200">
                {usuario?.avatar && <AvatarImage src={usuario.avatar} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-base font-bold">
                  {usuario?.nombre.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-foreground">{usuario?.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">{usuario?.correo}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/15 border border-transparent hover:border-destructive/30 font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
              onClick={manejarCerrarSesion}
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </>
        ) : (
          <>
            <Avatar className="h-11 w-11 mx-auto hover:scale-110 transition-transform duration-200 cursor-pointer">
              {usuario?.avatar && <AvatarImage src={usuario.avatar} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-base font-bold">
                {usuario?.nombre.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/15 hover:scale-110 transition-all duration-200"
              onClick={manejarCerrarSesion}
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}