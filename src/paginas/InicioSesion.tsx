import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Loader2, AlertCircle, LogIn } from 'lucide-react';
import { usarConexion } from '@/hooks/usar-conexion';

export default function InicioSesion() {
  const { iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const { en_linea } = usarConexion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!en_linea) {
      setError('No hay conexión con el servidor. Verifica tu conexión a internet.');
      return;
    }

    setCargando(true);

    try {
      await iniciarSesion(correo, contrasena);
      navegar('/inicio');
    } catch (err: any) {
      console.error('Error en inicio de sesión:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté funcionando.');
      } else if (err.response?.status === 401) {
        setError('Correo o contraseña incorrectos. Verifica tus credenciales.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
      
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-border shadow-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg hover:scale-110 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300">
              <LogIn className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight hover:text-primary transition-colors">
              Bienvenido de vuelta
            </CardTitle>
            <CardDescription className="text-base">Ingresa a tu cuenta de 0d3ntApp</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={manejarEnvio} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!en_linea && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 p-3 text-sm text-yellow-600 dark:text-yellow-400 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Sin conexión con el servidor</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="correo" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="tu@email.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  disabled={cargando}
                  autoComplete="email"
                  className="h-11 bg-secondary/50 border-secondary hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrasena" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Input
                  id="contrasena"
                  type="password"
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  disabled={cargando}
                  autoComplete="current-password"
                  className="h-11 bg-secondary/50 border-secondary hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200" 
                disabled={cargando || !en_linea}
              >
                {cargando && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-border pt-6">
            <div className="text-sm text-muted-foreground text-center">
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                Regístrate aquí
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}