import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Loader2, AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { usarConexion } from '@/hooks/usar-conexion';

export default function Registro() {
  const { registrar } = useAutenticacion();
  const navegar = useNavigate();
  const { en_linea } = usarConexion();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar_contrasena, setConfirmarContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const validarFormulario = (): string | null => {
    if (nombre.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }

    if (!correo.includes('@')) {
      return 'Ingresa un correo electrónico válido';
    }

    if (contrasena.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (contrasena !== confirmar_contrasena) {
      return 'Las contraseñas no coinciden';
    }

    return null;
  };

  const manejarEnvio = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const error_validacion = validarFormulario();
    if (error_validacion) {
      setError(error_validacion);
      return;
    }

    if (!en_linea) {
      setError('No hay conexión con el servidor. Verifica tu conexión a internet.');
      return;
    }

    setCargando(true);

    try {
      await registrar(nombre, correo, contrasena);
      navegar('/inicio');
    } catch (err: any) {
      console.error('Error en registro:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté funcionando.');
      } else if (err.response?.status === 409) {
        setError('Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Datos inválidos. Verifica la información ingresada.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
      }
      
      setCargando(false);
    }
  };

  const obtenerFuerzaContrasena = (): { texto: string; color: string; porcentaje: number } => {
    if (contrasena.length === 0) return { texto: '', color: '', porcentaje: 0 };
    if (contrasena.length < 6) return { texto: 'Débil', color: 'text-red-500', porcentaje: 33 };
    if (contrasena.length < 10) return { texto: 'Media', color: 'text-yellow-500', porcentaje: 66 };
    return { texto: 'Fuerte', color: 'text-green-500', porcentaje: 100 };
  };

  const fuerza_contrasena = obtenerFuerzaContrasena();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-border shadow-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg hover:scale-110 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300">
              <UserPlus className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight hover:text-primary transition-colors">
              Crear cuenta
            </CardTitle>
            <CardDescription className="text-base">Únete a 0d3ntApp</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={manejarEnvio} className="space-y-4">
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
                <Label htmlFor="nombre" className="text-sm font-medium">
                  Nombre completo
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Dr. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={cargando}
                  autoComplete="name"
                  className="h-11 bg-secondary/50 border-secondary hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

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
                  autoComplete="new-password"
                  className="h-11 bg-secondary/50 border-secondary hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
                {contrasena.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          fuerza_contrasena.porcentaje === 33 ? 'bg-red-500' :
                          fuerza_contrasena.porcentaje === 66 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${fuerza_contrasena.porcentaje}%` }}
                      />
                    </div>
                    <p className={`text-xs ${fuerza_contrasena.color}`}>
                      Seguridad: {fuerza_contrasena.texto}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar_contrasena" className="text-sm font-medium">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmar_contrasena"
                  type="password"
                  placeholder="••••••••"
                  value={confirmar_contrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                  disabled={cargando}
                  autoComplete="new-password"
                  className="h-11 bg-secondary/50 border-secondary hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
                {confirmar_contrasena.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {contrasena === confirmar_contrasena ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <p className="text-xs text-green-500">Las contraseñas coinciden</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200" 
                disabled={cargando || !en_linea}
              >
                {cargando && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Crear Cuenta
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-border pt-6">
            <div className="text-sm text-muted-foreground text-center">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/inicio-sesion" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                Inicia sesión aquí
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}