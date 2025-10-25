import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Settings, User, Bell, Palette, Camera, Loader2, Save, Sparkles, Sun, Moon, Monitor, Droplet, Database, Lock, Eye, EyeOff, FileText, Calendar, Leaf, Heart, Coffee, Layers, Grape, Flame, Stethoscope, Pill } from 'lucide-react';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { useTema } from '@/contextos/tema-contexto';
import { usuariosApi, notasApi, asistenteApi, catalogoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { GestionCatalogo } from '@/componentes/catalogo/gestion-catalogo';
import { MarkdownRenderer } from '@/componentes/markdown-rendered';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ItemCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
}

interface Nota {
  id: number;
  contenido: string;
  fecha_creacion: string;
}

export default function Configuracion() {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const { tema, cambiarTema, tema_efectivo } = useTema();
  const [guardando, setGuardando] = useState(false);
  const [cargando_frase, setCargandoFrase] = useState(false);
  const [frase_motivacional, setFraseMotivacional] = useState('');
  const [notas_anteriores, setNotasAnteriores] = useState<Nota[]>([]);
  const [cargando_notas, setCargandoNotas] = useState(true);
  const [dias_mostrar, setDiasMostrar] = useState(30);
  
  const [formulario_perfil, setFormularioPerfil] = useState({
    nombre: usuario?.nombre || '',
  });

  const [formulario_contrasena, setFormularioContrasena] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: '',
  });

  const [mostrar_contrasenas, setMostrarContrasenas] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const [cambiando_contrasena, setCambiandoContrasena] = useState(false);

  const [nota_diaria, setNotaDiaria] = useState('');
  const [guardando_nota, setGuardandoNota] = useState(false);

  const [alergias, setAlergias] = useState<ItemCatalogo[]>([]);
  const [enfermedades, setEnfermedades] = useState<ItemCatalogo[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [colores, setColores] = useState<ItemCatalogo[]>([]);
  const [cargando_catalogos, setCargandoCatalogos] = useState(false);

  const temas_disponibles = [
    { valor: 'sistema', nombre: 'Sistema', icono: Monitor, descripcion: 'Usar tema del sistema', categoria: 'General' },
    { valor: 'claro', nombre: 'Claro', icono: Sun, descripcion: 'Tema claro tradicional', categoria: 'General' },
    { valor: 'oscuro', nombre: 'Oscuro', icono: Moon, descripcion: 'Tema oscuro clásico', categoria: 'General' },
    { valor: 'clinico', nombre: 'Clínico Blanco', icono: Stethoscope, descripcion: 'Limpio y profesional', categoria: 'Médico' },
    { valor: 'menta', nombre: 'Menta Dental', icono: Pill, descripcion: 'Verde menta relajante', categoria: 'Médico' },
    { valor: 'azul', nombre: 'Azul Océano', icono: Droplet, descripcion: 'Tonos azules profundos', categoria: 'Colores' },
    { valor: 'verde', nombre: 'Verde Bosque', icono: Leaf, descripcion: 'Tonos verdes naturales', categoria: 'Colores' },
    { valor: 'rosa', nombre: 'Rosa Elegante', icono: Heart, descripcion: 'Tonos rosa suaves', categoria: 'Colores' },
    { valor: 'beige', nombre: 'Beige Cálido', icono: Coffee, descripcion: 'Tonos beige y hueso', categoria: 'Colores' },
    { valor: 'gris', nombre: 'Gris Neutro', icono: Layers, descripcion: 'Escala de grises pura', categoria: 'Colores' },
    { valor: 'morado', nombre: 'Morado Real', icono: Grape, descripcion: 'Tonos morados elegantes', categoria: 'Colores' },
    { valor: 'naranja', nombre: 'Naranja Fuego', icono: Flame, descripcion: 'Tonos naranjas cálidos', categoria: 'Colores' },
  ];

  const temas_por_categoria = temas_disponibles.reduce((acc, tema) => {
    if (!acc[tema.categoria]) {
      acc[tema.categoria] = [];
    }
    acc[tema.categoria].push(tema);
    return acc;
  }, {} as Record<string, typeof temas_disponibles>);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarNotasAnteriores();
  }, [dias_mostrar]);

  const cargarNotasAnteriores = async () => {
    setCargandoNotas(true);
    try {
      const notas = await notasApi.obtenerUltimas(dias_mostrar);
      setNotasAnteriores(notas);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notas anteriores',
        variant: 'destructive',
      });
    } finally {
      setCargandoNotas(false);
    }
  };

  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    try {
      const [alergias_data, enfermedades_data, medicamentos_data, colores_data] = await Promise.all([
        catalogoApi.obtenerAlergias(),
        catalogoApi.obtenerEnfermedades(),
        catalogoApi.obtenerMedicamentos(),
        catalogoApi.obtenerColores(),
      ]);
      setAlergias(alergias_data);
      setEnfermedades(enfermedades_data);
      setMedicamentos(medicamentos_data);
      setColores(colores_data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los catálogos',
        variant: 'destructive',
      });
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const manejarActualizarPerfil = async () => {
    if (!formulario_perfil.nombre) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      await usuariosApi.actualizarPerfil({ nombre: formulario_perfil.nombre });
      actualizarUsuario({ nombre: formulario_perfil.nombre });
      toast({
        title: 'Éxito',
        description: 'Perfil actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarContrasena = async () => {
    if (!formulario_contrasena.contrasena_actual || !formulario_contrasena.nueva_contrasena || !formulario_contrasena.confirmar_contrasena) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.nueva_contrasena.length < 6) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.nueva_contrasena !== formulario_contrasena.confirmar_contrasena) {
      toast({
        title: 'Error',
        description: 'Las contraseñas nuevas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (formulario_contrasena.contrasena_actual === formulario_contrasena.nueva_contrasena) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe ser diferente a la actual',
        variant: 'destructive',
      });
      return;
    }

    setCambiandoContrasena(true);
    try {
      await usuariosApi.cambiarContrasena({
        contrasena_actual: formulario_contrasena.contrasena_actual,
        nueva_contrasena: formulario_contrasena.nueva_contrasena,
      });
      
      toast({
        title: 'Éxito',
        description: 'Contraseña actualizada correctamente',
      });

      setFormularioContrasena({
        contrasena_actual: '',
        nueva_contrasena: '',
        confirmar_contrasena: '',
      });
      setMostrarContrasenas({
        actual: false,
        nueva: false,
        confirmar: false,
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setCambiandoContrasena(false);
    }
  };

  const manejarSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
        variant: 'destructive',
      });
      return;
    }

    const lector = new FileReader();
    lector.onload = async () => {
      const base64 = lector.result as string;
      
      setGuardando(true);
      try {
        await usuariosApi.actualizarPerfil({ avatar: base64 });
        actualizarUsuario({ avatar: base64 });
        toast({
          title: 'Éxito',
          description: 'Avatar actualizado correctamente',
        });
      } catch (error: any) {
        console.error('Error al actualizar avatar:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'No se pudo actualizar el avatar',
          variant: 'destructive',
        });
      } finally {
        setGuardando(false);
      }
    };
    lector.readAsDataURL(archivo);
  };

  const manejarGuardarNota = async () => {
    if (!nota_diaria.trim()) {
      toast({
        title: 'Error',
        description: 'La nota no puede estar vacía',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoNota(true);
    try {
      await notasApi.crear(nota_diaria);
      toast({
        title: 'Éxito',
        description: 'Nota guardada correctamente',
      });
      setNotaDiaria('');
      await cargarNotasAnteriores();
    } catch (error: any) {
      console.error('Error al guardar nota:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la nota',
        variant: 'destructive',
      });
    } finally {
      setGuardandoNota(false);
    }
  };

  const obtenerFraseMotivacional = async () => {
    setCargandoFrase(true);
    try {
      const respuesta = await asistenteApi.obtenerFraseMotivacional(7);
      setFraseMotivacional(respuesta);
      toast({
        title: 'Frase generada',
        description: 'Tu mensaje motivacional está listo',
      });
    } catch (error: any) {
      console.error('Error al obtener frase:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo generar la frase',
        variant: 'destructive',
      });
    } finally {
      setCargandoFrase(false);
    }
  };

  const formatearFecha = (fecha_string: string): string => {
    try {
      const fecha = new Date(fecha_string);
      return format(fecha, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return fecha_string;
    }
  };

  const obtenerNombreTemaEfectivo = (): string => {
    const nombres: Record<string, string> = {
      'claro': 'Claro',
      'oscuro': 'Oscuro',
      'azul': 'Azul Océano',
      'verde': 'Verde Bosque',
      'rosa': 'Rosa Elegante',
      'beige': 'Beige Cálido',
      'gris': 'Gris Neutro',
      'morado': 'Morado Real',
      'naranja': 'Naranja Fuego',
      'clinico': 'Clínico Blanco',
      'menta': 'Menta Dental',
    };
    return nombres[tema_efectivo] || tema_efectivo;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
              Configuración
            </h1>
            <p className="text-lg text-muted-foreground">
              Personaliza tu experiencia en 0d3ntApp
            </p>
          </div>

          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-11">
              <TabsTrigger value="perfil" className="text-base">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="notas" className="text-base">
                <Bell className="h-4 w-4 mr-2" />
                Notas Diarias
              </TabsTrigger>
              <TabsTrigger value="apariencia" className="text-base">
                <Palette className="h-4 w-4 mr-2" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger value="catalogos" className="text-base">
                <Database className="h-4 w-4 mr-2" />
                Catálogos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Información Personal</CardTitle>
                      <CardDescription>Actualiza tus datos personales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {usuario?.avatar ? (
                          <img src={usuario.avatar} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
                        ) : (
                          usuario?.nombre.charAt(0).toUpperCase()
                        )}
                      </div>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-200"
                      >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={manejarSubirAvatar}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Haz clic en el ícono de cámara para cambiar tu avatar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos permitidos: JPG, PNG, GIF (máx. 2MB)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      value={formulario_perfil.nombre}
                      onChange={(e) => setFormularioPerfil({ ...formulario_perfil, nombre: e.target.value })}
                      placeholder="Dr. Juan Pérez"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico</Label>
                    <Input
                      id="correo"
                      value={usuario?.correo}
                      disabled
                      className="bg-secondary/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      El correo no se puede modificar
                    </p>
                  </div>

                  <Button 
                    onClick={manejarActualizarPerfil} 
                    disabled={guardando}
                    className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
                      <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contrasena_actual">Contraseña Actual</Label>
                    <div className="relative">
                      <Input
                        id="contrasena_actual"
                        type={mostrar_contrasenas.actual ? 'text' : 'password'}
                        value={formulario_contrasena.contrasena_actual}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, contrasena_actual: e.target.value })}
                        placeholder="Ingresa tu contraseña actual"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, actual: !mostrar_contrasenas.actual })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.actual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nueva_contrasena">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="nueva_contrasena"
                        type={mostrar_contrasenas.nueva ? 'text' : 'password'}
                        value={formulario_contrasena.nueva_contrasena}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, nueva_contrasena: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, nueva: !mostrar_contrasenas.nueva })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.nueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena.length < 6 && (
                      <p className="text-xs text-destructive">
                        La contraseña debe tener al menos 6 caracteres
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmar_contrasena">Confirmar Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmar_contrasena"
                        type={mostrar_contrasenas.confirmar ? 'text' : 'password'}
                        value={formulario_contrasena.confirmar_contrasena}
                        onChange={(e) => setFormularioContrasena({ ...formulario_contrasena, confirmar_contrasena: e.target.value })}
                        placeholder="Repite la nueva contraseña"
                        className="hover:border-primary/50 focus:border-primary transition-all duration-200 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasenas({ ...mostrar_contrasenas, confirmar: !mostrar_contrasenas.confirmar })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {mostrar_contrasenas.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formulario_contrasena.confirmar_contrasena && 
                     formulario_contrasena.nueva_contrasena !== formulario_contrasena.confirmar_contrasena && (
                      <p className="text-xs text-destructive">
                        Las contraseñas no coinciden
                      </p>
                    )}
                    {formulario_contrasena.confirmar_contrasena && 
                     formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena && (
                      <p className="text-xs text-green-500">
                        ✓ Las contraseñas coinciden
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Requisitos de la contraseña:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.nueva_contrasena.length >= 6 ? 'text-green-500' : ''}>
                          {formulario_contrasena.nueva_contrasena.length >= 6 ? '✓' : '○'}
                        </span>
                        Mínimo 6 caracteres
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena !== formulario_contrasena.contrasena_actual ? 'text-green-500' : ''}>
                          {formulario_contrasena.nueva_contrasena && formulario_contrasena.nueva_contrasena !== formulario_contrasena.contrasena_actual ? '✓' : '○'}
                        </span>
                        Diferente a la contraseña actual
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={formulario_contrasena.confirmar_contrasena && formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena ? 'text-green-500' : ''}>
                          {formulario_contrasena.confirmar_contrasena && formulario_contrasena.nueva_contrasena === formulario_contrasena.confirmar_contrasena ? '✓' : '○'}
                        </span>
                        Las contraseñas deben coincidir
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={manejarCambiarContrasena} 
                    disabled={cambiando_contrasena}
                    className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    {cambiando_contrasena ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Cambiar Contraseña
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notas" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Nueva Nota</CardTitle>
                      <CardDescription>Registra tus pensamientos y reflexiones del día</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nota">Escribe tu nota del día</Label>
                    <Textarea
                      id="nota"
                      value={nota_diaria}
                      onChange={(e) => setNotaDiaria(e.target.value)}
                      placeholder="Hoy fue un día productivo..."
                      rows={5}
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>

                  <Button 
                    onClick={manejarGuardarNota} 
                    disabled={guardando_nota}
                    className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                  >
                    {guardando_nota ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Nota
                      </>
                    )}
                  </Button>

                  <div className="border-t-2 border-border pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-yellow-500" />
                          Frase Motivacional
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Genera una frase basada en tus últimas 7 notas
                        </p>
                      </div>
                      <Button
                        onClick={obtenerFraseMotivacional}
                        disabled={cargando_frase}
                        variant="outline"
                        className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
                      >
                        {cargando_frase ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar Frase
                          </>
                        )}
                      </Button>
                    </div>

                    {frase_motivacional && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                        <MarkdownRenderer contenido={frase_motivacional} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Notas Anteriores</CardTitle>
                        <CardDescription>
                          Visualiza tus notas de los últimos {dias_mostrar} días
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dias-mostrar" className="text-sm text-muted-foreground">
                        Días:
                      </Label>
                      <Input
                        id="dias-mostrar"
                        type="number"
                        min="1"
                        max="365"
                        value={dias_mostrar}
                        onChange={(e) => setDiasMostrar(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                        className="w-20 h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cargando_notas ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground">Cargando notas...</p>
                      </div>
                    </div>
                  ) : notas_anteriores.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No hay notas registradas
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Las notas que crees aparecerán aquí para que puedas consultarlas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {notas_anteriores.map((nota) => (
                          <Card key={nota.id} className="border hover:border-primary/50 transition-all duration-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground font-medium">
                                      {formatearFecha(nota.fecha_creacion)}
                                    </p>
                                  </div>
                                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                    {nota.contenido}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apariencia" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Tema de la Aplicación</CardTitle>
                      <CardDescription>
                        Selecciona el tema de colores que prefieras
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {Object.entries(temas_por_categoria).map(([categoria, temas]) => (
                    <div key={categoria} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border"></div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-3">
                          {categoria}
                        </h3>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {temas.map((tema_opcion) => {
                          const Icono = tema_opcion.icono;
                          const esta_activo = tema === tema_opcion.valor;
                          
                          return (
                            <button
                              key={tema_opcion.valor}
                              onClick={() => cambiarTema(tema_opcion.valor as any)}
                              className={`p-5 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                                esta_activo
                                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${
                                  esta_activo ? 'bg-primary/20' : 'bg-secondary'
                                }`}>
                                  <Icono className={`h-5 w-5 ${
                                    esta_activo ? 'text-primary' : 'text-muted-foreground'
                                  }`} />
                                </div>
                                <div className="text-left flex-1">
                                  <h4 className={`font-semibold text-base ${
                                    esta_activo ? 'text-primary' : 'text-foreground'
                                  }`}>
                                    {tema_opcion.nombre}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {tema_opcion.descripcion}
                                  </p>
                                </div>
                                {esta_activo && (
                                  <div className="bg-primary text-primary-foreground rounded-full p-1 flex-shrink-0">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg mt-1">
                        <Palette className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground mb-1">
                          Tema Actual: {temas_disponibles.find(t => t.valor === tema)?.nombre}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tema efectivo: {obtenerNombreTemaEfectivo()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Los cambios de tema se aplican inmediatamente y se guardan automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalogos" className="space-y-6 mt-6">
              <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Gestión de Catálogos</CardTitle>
                      <CardDescription>
                        Administra las opciones predefinidas para tus pacientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <GestionCatalogo
                    titulo="Alergias"
                    items={alergias}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearAlergia(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarAlergia(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarAlergia(id)}
                    onRecargar={cargarCatalogos}
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    titulo="Enfermedades"
                    items={enfermedades}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearEnfermedad(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarEnfermedad(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarEnfermedad(id)}
                    onRecargar={cargarCatalogos}
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    titulo="Medicamentos"
                    items={medicamentos}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearMedicamento(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarMedicamento(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarMedicamento(id)}
                    onRecargar={cargarCatalogos}
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    titulo="Colores de Categoría"
                    items={colores}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearColor(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarColor(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarColor(id)}
                    onRecargar={cargarCatalogos}
                    permitirColor={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </div>
  );
}