import { useState, useEffect, useRef } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { User, Palette, Camera, Loader2, Save, Sun, Moon, Droplet, Database, Lock, Eye, EyeOff, Leaf, Heart, Coffee, Layers, Grape, Flame, Stethoscope, Pill, Building2, ImageIcon, X, Settings2, Clock } from 'lucide-react';
import { useAutenticacion } from '@/contextos/autenticacion-contexto';
import { useTema, TemaPersonalizado } from '@/contextos/tema-contexto';
import { useClinica } from '@/contextos/clinica-contexto';
import { usuariosApi, catalogoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { GestionCatalogo } from '@/componentes/catalogo/gestion-catalogo';
import { ItemCatalogo } from '@/tipos';
import { GestionTamanosPapel } from '@/componentes/catalogo/gestion-tamanos-papel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/componentes/ui/dialog';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';

export default function Configuracion() {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const { tema, cambiarTema, tema_efectivo, tema_personalizado, actualizarTemaPersonalizado, aplicarColoresPersonalizados } = useTema();
  const { actualizarConfigClinica } = useClinica();
  const [colores_personalizados, setColoresPersonalizados] = useState<TemaPersonalizado>({
    background: '#ffffff',
    foreground: '#0a0a0a',
    primary: '#3b82f6',
    secondary: '#f1f5f9',
    accent: '#e0f2fe',
    muted: '#f1f5f9',
    border: '#e2e8f0',
  });
  const [guardando_tema, setGuardandoTema] = useState(false);
  const [dialogo_personalizado_abierto, setDialogoPersonalizadoAbierto] = useState(false);
  const [dialogo_confirmar_salir, setDialogoConfirmarSalir] = useState(false);
  const [colores_temporales, setColoresTemporales] = useState<TemaPersonalizado | null>(null);
  const [tema_modificado, setTemaModificado] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
  const [alergias, setAlergias] = useState<ItemCatalogo[]>([]);
  const [enfermedades, setEnfermedades] = useState<ItemCatalogo[]>([]);
  const [medicamentos, setMedicamentos] = useState<ItemCatalogo[]>([]);
  const [colores, setColores] = useState<ItemCatalogo[]>([]);
  const [etiquetas_plantillas, setEtiquetasPlantillas] = useState<ItemCatalogo[]>([]);
  const [cargando_catalogos, setCargandoCatalogos] = useState(false);

  const [config_clinica, setConfigClinica] = useState({
    logo: '',
    nombre_clinica: '',
    mensaje_bienvenida_antes: 'Bienvenido,',
    mensaje_bienvenida_despues: '¿qué haremos hoy?',
  });
  const [cargando_clinica, setCargandoClinica] = useState(true);
  const [guardando_clinica, setGuardandoClinica] = useState(false);

  // Estado para la fecha y hora actual
  const [fecha_hora_actual, setFechaHoraActual] = useState(new Date());
  const [desfase_tiempo, setDesfaseTiempo] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  // Refs para los inputs de archivo
  const logo_clinica_input_ref = useRef<HTMLInputElement>(null);

  const temas_disponibles = [
    { valor: 'claro', nombre: 'Claro', icono: Sun, descripcion: 'Tema claro tradicional', categoria: 'Base' },
    { valor: 'oscuro', nombre: 'Oscuro', icono: Moon, descripcion: 'Tema oscuro clásico', categoria: 'Base' },
    { valor: 'azul', nombre: 'Azul Océano', icono: Droplet, descripcion: 'Tonos azules profundos', categoria: 'Base' },
    { valor: 'clinico', nombre: 'Clínico Blanco', icono: Stethoscope, descripcion: 'Limpio y profesional', categoria: 'Médico' },
    { valor: 'menta', nombre: 'Menta Dental', icono: Pill, descripcion: 'Verde menta relajante', categoria: 'Médico' },
    { valor: 'menta-claro', nombre: 'Menta Claro', icono: Pill, descripcion: 'Menta dental refrescante', categoria: 'Médico' },
    { valor: 'azul-claro', nombre: 'Azul Claro', icono: Droplet, descripcion: 'Azul suave y luminoso', categoria: 'Colores Claros' },
    { valor: 'verde-claro', nombre: 'Verde Claro', icono: Leaf, descripcion: 'Verde natural y fresco', categoria: 'Colores Claros' },
    { valor: 'rosa-claro', nombre: 'Rosa Claro', icono: Heart, descripcion: 'Rosa suave y elegante', categoria: 'Colores Claros' },
    { valor: 'beige-claro', nombre: 'Beige Claro', icono: Coffee, descripcion: 'Beige cálido y acogedor', categoria: 'Colores Claros' },
    { valor: 'gris-claro', nombre: 'Gris Claro', icono: Layers, descripcion: 'Gris neutro y minimalista', categoria: 'Colores Claros' },
    { valor: 'morado-claro', nombre: 'Morado Claro', icono: Grape, descripcion: 'Morado suave y delicado', categoria: 'Colores Claros' },
    { valor: 'naranja-claro', nombre: 'Naranja Claro', icono: Flame, descripcion: 'Naranja cálido y energético', categoria: 'Colores Claros' },
    { valor: 'verde', nombre: 'Verde Bosque', icono: Leaf, descripcion: 'Tonos verdes naturales', categoria: 'Colores Oscuros' },
    { valor: 'rosa', nombre: 'Rosa Elegante', icono: Heart, descripcion: 'Tonos rosa intensos', categoria: 'Colores Oscuros' },
    { valor: 'beige', nombre: 'Beige Cálido', icono: Coffee, descripcion: 'Tonos beige y hueso', categoria: 'Colores Oscuros' },
    { valor: 'gris', nombre: 'Gris Neutro', icono: Layers, descripcion: 'Escala de grises pura', categoria: 'Colores Oscuros' },
    { valor: 'morado', nombre: 'Morado Real', icono: Grape, descripcion: 'Tonos morados elegantes', categoria: 'Colores Oscuros' },
    { valor: 'naranja', nombre: 'Naranja Fuego', icono: Flame, descripcion: 'Tonos naranjas cálidos', categoria: 'Colores Oscuros' },
    { valor: 'cielo-abierto', nombre: 'Cielo Abierto', icono: Sun, descripcion: 'Azul cielo luminoso', categoria: 'Especiales' },
    { valor: 'esmeralda', nombre: 'Esmeralda', icono: Leaf, descripcion: 'Verde esmeralda vibrante', categoria: 'Especiales' },
    { valor: 'atardecer', nombre: 'Atardecer', icono: Moon, descripcion: 'Tonos cálidos nocturnos', categoria: 'Especiales' },
    { valor: 'cafe-leche', nombre: 'Café con Leche', icono: Coffee, descripcion: 'Tonos café acogedores', categoria: 'Especiales' },
    { valor: 'artico', nombre: 'Ártico', icono: Layers, descripcion: 'Blanco y gris helado', categoria: 'Especiales' },
    { valor: 'neon-cyber', nombre: 'Neón Cyber', icono: Flame, descripcion: 'Verde neón futurista', categoria: 'Especiales' },
    { valor: 'vintage-sepia', nombre: 'Vintage Sepia', icono: Coffee, descripcion: 'Estilo retro cálido', categoria: 'Especiales' },
    { valor: 'azul-hielo', nombre: 'Azul Hielo', icono: Droplet, descripcion: 'Azul cristalino', categoria: 'Especiales' },
    { valor: 'mono-claro', nombre: 'Monocromático Claro', icono: Layers, descripcion: 'Blanco puro, serio y minimalista', categoria: 'Monocromáticos' },
    { valor: 'mono-oscuro', nombre: 'Monocromático Oscuro', icono: Layers, descripcion: 'Negro puro, elegante y sobrio', categoria: 'Monocromáticos' },
    { valor: 'personalizado', nombre: 'Personalizado', icono: Settings2, descripcion: 'Crea tu propio tema', categoria: 'Personalizado' },
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
    cargarConfiguracionClinica();
  }, []);

  const sincronizarHora = async () => {
    setSincronizando(true);
    try {
      const hora_servidor = await catalogoApi.obtenerHoraServidor();
      const desfase = hora_servidor.getTime() - Date.now();
      setDesfaseTiempo(desfase);

      toast({
        title: 'Hora sincronizada',
        description: 'El reloj se ha sincronizado con el servidor exitosamente',
      });
    } catch (error) {
      console.error('Error al sincronizar hora:', error);
      toast({
        title: 'Error',
        description: 'No se pudo sincronizar la hora del servidor',
        variant: 'destructive',
      });
    } finally {
      setSincronizando(false);
    }
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFechaHoraActual(new Date(Date.now() + desfase_tiempo));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [desfase_tiempo]);


  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    try {
      const [alergias_data, enfermedades_data, medicamentos_data, colores_data, etiquetas_plantillas_data] = await Promise.all([
        catalogoApi.obtenerAlergias(),
        catalogoApi.obtenerEnfermedades(),
        catalogoApi.obtenerMedicamentos(),
        catalogoApi.obtenerColores(),
        catalogoApi.obtenerEtiquetasPlantilla(),
      ]);
      setAlergias(alergias_data);
      setEnfermedades(enfermedades_data);
      setMedicamentos(medicamentos_data);
      setColores(colores_data);
      setEtiquetasPlantillas(etiquetas_plantillas_data);
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

  const cargarConfiguracionClinica = async () => {
    setCargandoClinica(true);
    try {
      const config = await catalogoApi.obtenerConfiguracionClinica();
      setConfigClinica({
        logo: config.logo || '',
        nombre_clinica: config.nombre_clinica || '',
        mensaje_bienvenida_antes: config.mensaje_bienvenida_antes || 'Bienvenido,',
        mensaje_bienvenida_despues: config.mensaje_bienvenida_despues || '¿qué haremos hoy?',
      });
    } catch (error) {
      console.error('Error al cargar configuración de clínica:', error);
    } finally {
      setCargandoClinica(false);
    }
  };

  const manejarGuardarConfiguracionClinica = async () => {
    setGuardandoClinica(true);
    try {
      await catalogoApi.actualizarConfiguracionClinica(config_clinica);
      actualizarConfigClinica({
        logo: config_clinica.logo,
        nombre_clinica: config_clinica.nombre_clinica,
        mensaje_bienvenida_antes: config_clinica.mensaje_bienvenida_antes,
        mensaje_bienvenida_despues: config_clinica.mensaje_bienvenida_despues,
      });
      toast({
        title: 'Éxito',
        description: 'Configuración de clínica guardada correctamente',
      });
    } catch (error: any) {
      console.error('Error al guardar configuración de clínica:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setGuardandoClinica(false);
    }
  };

  const manejarSubirLogoClinica = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    lector.onload = () => {
      const base64 = lector.result as string;
      setConfigClinica({ ...config_clinica, logo: base64 });
    };
    lector.readAsDataURL(archivo);
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

  const obtenerNombreTemaEfectivo = (): string => {
    const nombres: Record<string, string> = {
      'claro': 'Claro',
      'oscuro': 'Oscuro',
      'clinico': 'Clínico Blanco',
      'azul': 'Azul Océano',
      'azul-claro': 'Azul Claro',
      'verde': 'Verde Bosque',
      'verde-claro': 'Verde Claro',
      'rosa': 'Rosa Elegante',
      'rosa-claro': 'Rosa Claro',
      'beige': 'Beige Cálido',
      'beige-claro': 'Beige Claro',
      'gris': 'Gris Neutro',
      'gris-claro': 'Gris Claro',
      'morado': 'Morado Real',
      'morado-claro': 'Morado Claro',
      'naranja': 'Naranja Fuego',
      'naranja-claro': 'Naranja Claro',
      'menta': 'Menta Dental',
      'menta-claro': 'Menta Claro',
      'personalizado': 'Personalizado',
    };
    return nombres[tema_efectivo] || tema_efectivo;
  };
  useEffect(() => {
    if (tema_personalizado) {
      setColoresPersonalizados(tema_personalizado);
    }
  }, [tema_personalizado]);

  const guardarTemaPersonalizado = async (colores?: TemaPersonalizado) => {
    const coloresAGuardar = colores || colores_temporales || colores_personalizados;
    setGuardandoTema(true);
    try {
      await catalogoApi.actualizarConfiguracionClinica({
        tema_personalizado: JSON.stringify(coloresAGuardar),
      });
      setColoresPersonalizados(coloresAGuardar);
      actualizarTemaPersonalizado(coloresAGuardar);
      aplicarColoresPersonalizados(coloresAGuardar);
      toast({
        title: 'Éxito',
        description: 'Tu tema personalizado ha sido guardado',
      });
    } catch (error: any) {
      console.error('Error al guardar tema:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el tema personalizado',
        variant: 'destructive',
      });
    } finally {
      setGuardandoTema(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                Configuración
              </h1>
              <p className="text-lg text-muted-foreground">
                Personaliza tu experiencia en 0d3ntApp
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-semibold text-foreground">
                {fecha_hora_actual.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {fecha_hora_actual.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={sincronizarHora}
                disabled={sincronizando}
                className="mt-2"
              >
                {sincronizando ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-3 w-3" />
                    Sincronizar Hora
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-11">
              <TabsTrigger value="perfil" className="text-base">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="clinica" className="text-base">
                <Building2 className="h-4 w-4 mr-2" />
                Clínica
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

            <TabsContent value="clinica" className="space-y-6 mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Configuración de Clínica</CardTitle>
                        <CardDescription>Personaliza la identidad de tu consultorio</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cargando_clinica ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                          <p className="text-muted-foreground">Cargando configuración...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <Label>Logo de la Clínica</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative group">
                              <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 overflow-hidden border-2 border-border">
                                {config_clinica.logo ? (
                                  <img src={config_clinica.logo} alt="Logo" className="h-full w-full object-contain" />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <label
                                htmlFor="logo-clinica-upload"
                                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-200"
                              >
                                <Camera className="h-4 w-4 text-primary-foreground" />
                              </label>
                              <input
                                ref={logo_clinica_input_ref}
                                id="logo-clinica-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={manejarSubirLogoClinica}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground mb-2">
                                Haz clic en el ícono de cámara para cambiar el logo
                              </p>
                              {config_clinica.logo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setConfigClinica({ ...config_clinica, logo: '' });
                                    // Resetear el input de archivo para permitir volver a subir logos
                                    if (logo_clinica_input_ref.current) {
                                      logo_clinica_input_ref.current.value = '';
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Quitar logo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nombre_clinica">Nombre de la Clínica</Label>
                          <Input
                            id="nombre_clinica"
                            value={config_clinica.nombre_clinica}
                            onChange={(e) => setConfigClinica({ ...config_clinica, nombre_clinica: e.target.value })}
                            placeholder="Ej: Consultorio Dental Sonrisa"
                            className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                          />
                          <p className="text-xs text-muted-foreground">
                            Si está vacío, el mensaje de bienvenida no incluirá el nombre de la clínica
                          </p>
                        </div>
                        <div className="space-y-4">
                          <Label>Mensaje de Bienvenida</Label>
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mensaje_antes" className="text-xs text-muted-foreground">Antes del nombre</Label>
                              <Input
                                id="mensaje_antes"
                                value={config_clinica.mensaje_bienvenida_antes}
                                onChange={(e) => setConfigClinica({ ...config_clinica, mensaje_bienvenida_antes: e.target.value })}
                                placeholder="Bienvenido,"
                                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mensaje_despues" className="text-xs text-muted-foreground">Después del nombre</Label>
                              <Input
                                id="mensaje_despues"
                                value={config_clinica.mensaje_bienvenida_despues}
                                onChange={(e) => setConfigClinica({ ...config_clinica, mensaje_bienvenida_despues: e.target.value })}
                                placeholder="¿qué haremos hoy?"
                                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={manejarGuardarConfiguracionClinica}
                          disabled={guardando_clinica}
                          className="w-full hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
                        >
                          {guardando_clinica ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Guardar Configuración
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Vista Previa</CardTitle>
                        <CardDescription>Así se verá la página de inicio</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-background via-background to-secondary/20 border-2 border-border">
                      <div className="space-y-4">
                        {config_clinica.logo && (
                          <div className="flex justify-center mb-4">
                            <div className="h-16 w-auto max-w-[200px] overflow-hidden">
                              <img
                                src={config_clinica.logo}
                                alt="Logo Preview"
                                className="h-full w-auto object-contain"
                              />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            {config_clinica.mensaje_bienvenida_antes}
                            <span className="text-primary">{usuario?.nombre}</span>
                            {config_clinica.mensaje_bienvenida_despues}
                          </h1>
                          <p className="text-lg text-muted-foreground">
                            Panel de control de tu consultorio dental
                            {config_clinica.nombre_clinica && (
                              <>
                                {' - '}
                                <span className="text-primary hover:text-yellow-500 transition-colors duration-200 cursor-default">
                                  {config_clinica.nombre_clinica}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <p className="text-xs text-muted-foreground">Pacientes</p>
                            <p className="text-lg font-bold text-foreground">--</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <p className="text-xs text-muted-foreground">Citas Hoy</p>
                            <p className="text-lg font-bold text-foreground">--</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Los cambios se reflejarán en la página de inicio después de guardar
                    </p>
                  </CardContent>
                </Card>
              </div>
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
                              className={`p-5 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${esta_activo
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${esta_activo ? 'bg-primary/20' : 'bg-secondary'
                                  }`}>
                                  <Icono className={`h-5 w-5 ${esta_activo ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                </div>
                                <div className="text-left flex-1">
                                  <h4 className={`font-semibold text-base ${esta_activo ? 'text-primary' : 'text-foreground'
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
                  {tema === 'personalizado' && (
                    <div className="p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 p-2 rounded-lg">
                            <Settings2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Tema Personalizado Activo</h3>
                            <p className="text-sm text-muted-foreground">Haz clic para personalizar los colores</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setColoresTemporales({ ...colores_personalizados });
                            setTemaModificado(false);
                            setDialogoPersonalizadoAbierto(true);
                          }}
                          variant="outline"
                          className="hover:shadow-lg transition-all"
                        >
                          <Palette className="mr-2 h-4 w-4" />
                          Personalizar Colores
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {[
                          { color: colores_personalizados.background, tooltip: 'Fondo' },
                          { color: colores_personalizados.primary, tooltip: 'Primario' },
                          { color: colores_personalizados.secondary, tooltip: 'Secundario' },
                          { color: colores_personalizados.accent, tooltip: 'Acento' },
                          { color: colores_personalizados.muted, tooltip: 'Atenuado' },
                          { color: colores_personalizados.border, tooltip: 'Bordes' },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-md border border-border/50 shadow-sm"
                            style={{ backgroundColor: item.color }}
                            title={item.tooltip}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <Dialog
                    open={dialogo_personalizado_abierto}
                    onOpenChange={(open) => {
                      if (!open && tema_modificado) {
                        setDialogoConfirmarSalir(true);
                      } else {
                        setDialogoPersonalizadoAbierto(open);
                      }
                    }}
                  >
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Settings2 className="h-5 w-5" />
                          Editor de Tema Personalizado
                        </DialogTitle>
                        <DialogDescription>
                          Los colores se aplican en tiempo real a la interfaz. Si cancelas, se revertirán automáticamente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                          💡 Paletas de Inspiración
                        </h4>
                        <Tabs defaultValue="base" className="w-full">
                          <TabsList className="w-full grid grid-cols-6 mb-3">
                            <TabsTrigger value="base" className="text-xs">Base</TabsTrigger>
                            <TabsTrigger value="medico" className="text-xs">Médico</TabsTrigger>
                            <TabsTrigger value="claros" className="text-xs">Claros</TabsTrigger>
                            <TabsTrigger value="oscuros" className="text-xs">Oscuros</TabsTrigger>
                            <TabsTrigger value="especiales" className="text-xs">Especiales</TabsTrigger>
                            <TabsTrigger value="mono" className="text-xs">Mono</TabsTrigger>
                          </TabsList>

                          <TabsContent value="base" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Claro', colores: {
                                    background: '#ffffff', foreground: '#0a0a0a', primary: '#3b82f6', secondary: '#f1f5f9',
                                    accent: '#f1f5f9', muted: '#f1f5f9', border: '#e2e8f0',
                                    card: '#ffffff', cardForeground: '#0a0a0a', popover: '#ffffff', popoverForeground: '#0a0a0a',
                                    primaryForeground: '#f8fafc', secondaryForeground: '#1e293b', mutedForeground: '#64748b',
                                    accentForeground: '#1e293b', destructive: '#ef4444', destructiveForeground: '#f8fafc',
                                    input: '#e2e8f0', ring: '#3b82f6'
                                  }
                                },
                                {
                                  nombre: 'Oscuro', colores: {
                                    background: '#020817', foreground: '#e1e7ef', primary: '#f8fafc', secondary: '#1e293b',
                                    accent: '#1e3a5f', muted: '#1c1f26', border: '#1e3a5f',
                                    card: '#020817', cardForeground: '#e1e7ef', popover: '#020817', popoverForeground: '#e1e7ef',
                                    primaryForeground: '#1e293b', secondaryForeground: '#f8fafc', mutedForeground: '#8291a5',
                                    accentForeground: '#f8fafc', destructive: '#7f1d1d', destructiveForeground: '#f8fafc',
                                    input: '#1e3a5f', ring: '#1e3a5f'
                                  }
                                },
                                {
                                  nombre: 'Azul Océano', colores: {
                                    background: '#001a33', foreground: '#f5f9fc', primary: '#00bfff', secondary: '#0d2b47',
                                    accent: '#0f3354', muted: '#0d2b47', border: '#0f3354',
                                    card: '#002040', cardForeground: '#f5f9fc', popover: '#001a33', popoverForeground: '#f5f9fc',
                                    primaryForeground: '#001a33', secondaryForeground: '#f5f9fc', mutedForeground: '#8ab8d9',
                                    accentForeground: '#f5f9fc', destructive: '#e53e3e', destructiveForeground: '#f5f9fc',
                                    input: '#0d2b47', ring: '#00bfff'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="medico" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Clínico Blanco', colores: {
                                    background: '#f7f9fb', foreground: '#1f2d3d', primary: '#0d8ccf', secondary: '#edf2f7',
                                    accent: '#c3e0f5', muted: '#edf2f7', border: '#d4dfe8',
                                    card: '#ffffff', cardForeground: '#1f2d3d', popover: '#ffffff', popoverForeground: '#1f2d3d',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1f2d3d', mutedForeground: '#5c7185',
                                    accentForeground: '#1f2d3d', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e6ecf2', ring: '#0d8ccf'
                                  }
                                },
                                {
                                  nombre: 'Menta Dental', colores: {
                                    background: '#0a1f1a', foreground: '#f2f7f5', primary: '#22c9a6', secondary: '#19332b',
                                    accent: '#1b3d32', muted: '#19332b', border: '#1b3d32',
                                    card: '#0d261f', cardForeground: '#f2f7f5', popover: '#0a1f1a', popoverForeground: '#f2f7f5',
                                    primaryForeground: '#0a1f1a', secondaryForeground: '#f2f7f5', mutedForeground: '#8ab3a5',
                                    accentForeground: '#f2f7f5', destructive: '#e53e3e', destructiveForeground: '#f2f7f5',
                                    input: '#19332b', ring: '#22c9a6'
                                  }
                                },
                                {
                                  nombre: 'Menta Claro', colores: {
                                    background: '#f5fbf9', foreground: '#133d31', primary: '#1b9e7d', secondary: '#e6f4f0',
                                    accent: '#d1ede4', muted: '#e6f4f0', border: '#c6e3da',
                                    card: '#ffffff', cardForeground: '#133d31', popover: '#ffffff', popoverForeground: '#133d31',
                                    primaryForeground: '#ffffff', secondaryForeground: '#133d31', mutedForeground: '#5c8576',
                                    accentForeground: '#133d31', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#d6ece5', ring: '#1b9e7d'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="claros" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Azul Claro', colores: {
                                    background: '#f5faff', foreground: '#0a3a66', primary: '#0091e6', secondary: '#e6f4fc',
                                    accent: '#c2e5fa', muted: '#e6f4fc', border: '#c7e3f7',
                                    card: '#ffffff', cardForeground: '#0a3a66', popover: '#ffffff', popoverForeground: '#0a3a66',
                                    primaryForeground: '#ffffff', secondaryForeground: '#0a3a66', mutedForeground: '#5c7a94',
                                    accentForeground: '#0a3a66', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e0f0fa', ring: '#0091e6'
                                  }
                                },
                                {
                                  nombre: 'Verde Claro', colores: {
                                    background: '#f5fcf7', foreground: '#133d1f', primary: '#22a352', secondary: '#e5f6eb',
                                    accent: '#c2ebd1', muted: '#e5f6eb', border: '#bce6cb',
                                    card: '#ffffff', cardForeground: '#133d1f', popover: '#ffffff', popoverForeground: '#133d1f',
                                    primaryForeground: '#ffffff', secondaryForeground: '#133d1f', mutedForeground: '#5c8568',
                                    accentForeground: '#133d1f', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#daf2e3', ring: '#22a352'
                                  }
                                },
                                {
                                  nombre: 'Rosa Claro', colores: {
                                    background: '#fdf5f8', foreground: '#3d1328', primary: '#db2778', secondary: '#fae6ed',
                                    accent: '#f5c7db', muted: '#fae6ed', border: '#f2bdd4',
                                    card: '#ffffff', cardForeground: '#3d1328', popover: '#ffffff', popoverForeground: '#3d1328',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d1328', mutedForeground: '#855c6e',
                                    accentForeground: '#3d1328', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#f5d9e5', ring: '#db2778'
                                  }
                                },
                                {
                                  nombre: 'Beige Claro', colores: {
                                    background: '#faf8f5', foreground: '#3d2914', primary: '#a36b2b', secondary: '#f2ebe2',
                                    accent: '#e0d1be', muted: '#f2ebe2', border: '#d9cab5',
                                    card: '#fcfaf8', cardForeground: '#3d2914', popover: '#fcfaf8', popoverForeground: '#3d2914',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d2914', mutedForeground: '#7a6652',
                                    accentForeground: '#3d2914', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ede4d9', ring: '#a36b2b'
                                  }
                                },
                                {
                                  nombre: 'Morado Claro', colores: {
                                    background: '#faf5ff', foreground: '#3d1366', primary: '#9333ea', secondary: '#f0e6fa',
                                    accent: '#e0c7f5', muted: '#f0e6fa', border: '#d4b8f0',
                                    card: '#ffffff', cardForeground: '#3d1366', popover: '#ffffff', popoverForeground: '#3d1366',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d1366', mutedForeground: '#7a5c94',
                                    accentForeground: '#3d1366', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e8d9f5', ring: '#9333ea'
                                  }
                                },
                                {
                                  nombre: 'Naranja Claro', colores: {
                                    background: '#fffbf5', foreground: '#662200', primary: '#ea580c', secondary: '#faeade',
                                    accent: '#f5d1b8', muted: '#faeade', border: '#f0c4a6',
                                    card: '#ffffff', cardForeground: '#662200', popover: '#ffffff', popoverForeground: '#662200',
                                    primaryForeground: '#ffffff', secondaryForeground: '#662200', mutedForeground: '#946652',
                                    accentForeground: '#662200', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#f5e0cc', ring: '#ea580c'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="oscuros" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Verde Bosque', colores: {
                                    background: '#0f1a14', foreground: '#f0f5f2', primary: '#22c55e', secondary: '#152618',
                                    accent: '#1a321f', muted: '#152618', border: '#1a321f',
                                    card: '#142117', cardForeground: '#f0f5f2', popover: '#0f1a14', popoverForeground: '#f0f5f2',
                                    primaryForeground: '#0f1a14', secondaryForeground: '#f0f5f2', mutedForeground: '#8aab95',
                                    accentForeground: '#f0f5f2', destructive: '#e53e3e', destructiveForeground: '#f0f5f2',
                                    input: '#152618', ring: '#22c55e'
                                  }
                                },
                                {
                                  nombre: 'Rosa Elegante', colores: {
                                    background: '#1f0a14', foreground: '#f6e4ed', primary: '#e5619e', secondary: '#2e1220',
                                    accent: '#3a1629', muted: '#2e1220', border: '#3a1629',
                                    card: '#261019', cardForeground: '#f6e4ed', popover: '#1f0a14', popoverForeground: '#f6e4ed',
                                    primaryForeground: '#1f0a14', secondaryForeground: '#f6e4ed', mutedForeground: '#b38a9f',
                                    accentForeground: '#f6e4ed', destructive: '#e53e3e', destructiveForeground: '#f6e4ed',
                                    input: '#2e1220', ring: '#e5619e'
                                  }
                                },
                                {
                                  nombre: 'Morado Real', colores: {
                                    background: '#170a1f', foreground: '#f0e4f6', primary: '#a855f7', secondary: '#221231',
                                    accent: '#2c173f', muted: '#221231', border: '#2c173f',
                                    card: '#1c0e28', cardForeground: '#f0e4f6', popover: '#170a1f', popoverForeground: '#f0e4f6',
                                    primaryForeground: '#170a1f', secondaryForeground: '#f0e4f6', mutedForeground: '#a08ab3',
                                    accentForeground: '#f0e4f6', destructive: '#e53e3e', destructiveForeground: '#f0e4f6',
                                    input: '#221231', ring: '#a855f7'
                                  }
                                },
                                {
                                  nombre: 'Naranja Fuego', colores: {
                                    background: '#211108', foreground: '#f7ede4', primary: '#f97316', secondary: '#332011',
                                    accent: '#402715', muted: '#332011', border: '#402715',
                                    card: '#29160b', cardForeground: '#f7ede4', popover: '#211108', popoverForeground: '#f7ede4',
                                    primaryForeground: '#211108', secondaryForeground: '#f7ede4', mutedForeground: '#b3988a',
                                    accentForeground: '#f7ede4', destructive: '#e53e3e', destructiveForeground: '#f7ede4',
                                    input: '#332011', ring: '#f97316'
                                  }
                                },
                                {
                                  nombre: 'Gris Neutro', colores: {
                                    background: '#1a1a1a', foreground: '#f2f2f2', primary: '#bfbfbf', secondary: '#2e2e2e',
                                    accent: '#383838', muted: '#2e2e2e', border: '#383838',
                                    card: '#1f1f1f', cardForeground: '#f2f2f2', popover: '#1a1a1a', popoverForeground: '#f2f2f2',
                                    primaryForeground: '#1a1a1a', secondaryForeground: '#f2f2f2', mutedForeground: '#a6a6a6',
                                    accentForeground: '#f2f2f2', destructive: '#e53e3e', destructiveForeground: '#f2f2f2',
                                    input: '#2e2e2e', ring: '#bfbfbf'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="especiales" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Cielo Abierto', colores: {
                                    background: '#f0fbff', foreground: '#0a3a52', primary: '#0099cc', secondary: '#d9f4fc',
                                    accent: '#a8e4f5', muted: '#f0fbff', border: '#66c9e6',
                                    card: '#ffffff', cardForeground: '#0a3a52', popover: '#ffffff', popoverForeground: '#0a3a52',
                                    primaryForeground: '#ffffff', secondaryForeground: '#0a3a52', mutedForeground: '#5c8a9e',
                                    accentForeground: '#0a3a52', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#d6f0fa', ring: '#0099cc'
                                  }
                                },
                                {
                                  nombre: 'Esmeralda', colores: {
                                    background: '#ecfdf5', foreground: '#064e3b', primary: '#10b981', secondary: '#d1fae5',
                                    accent: '#a7f3d0', muted: '#ecfdf5', border: '#6ee7b7',
                                    card: '#ffffff', cardForeground: '#064e3b', popover: '#ffffff', popoverForeground: '#064e3b',
                                    primaryForeground: '#ffffff', secondaryForeground: '#064e3b', mutedForeground: '#4d7c6b',
                                    accentForeground: '#064e3b', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ccf5e7', ring: '#10b981'
                                  }
                                },
                                {
                                  nombre: 'Atardecer', colores: {
                                    background: '#1a1a2e', foreground: '#ebebeb', primary: '#e94560', secondary: '#16213e',
                                    accent: '#0f3460', muted: '#16213e', border: '#0f3460',
                                    card: '#1a1a2e', cardForeground: '#ebebeb', popover: '#1a1a2e', popoverForeground: '#ebebeb',
                                    primaryForeground: '#ffffff', secondaryForeground: '#ebebeb', mutedForeground: '#b3b3b3',
                                    accentForeground: '#ebebeb', destructive: '#7f1d1d', destructiveForeground: '#ffffff',
                                    input: '#0f3460', ring: '#e94560'
                                  }
                                },
                                {
                                  nombre: 'Café con Leche', colores: {
                                    background: '#faf6f1', foreground: '#3d2914', primary: '#8b5a2b', secondary: '#f5ebe0',
                                    accent: '#e6d5c3', muted: '#faf6f1', border: '#d4c4b0',
                                    card: '#fcfaf8', cardForeground: '#3d2914', popover: '#fcfaf8', popoverForeground: '#3d2914',
                                    primaryForeground: '#ffffff', secondaryForeground: '#3d2914', mutedForeground: '#7a6652',
                                    accentForeground: '#3d2914', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#ede4d9', ring: '#8b5a2b'
                                  }
                                },
                                {
                                  nombre: 'Ártico', colores: {
                                    background: '#f8fafc', foreground: '#1e293b', primary: '#0f172a', secondary: '#e2e8f0',
                                    accent: '#cbd5e1', muted: '#f1f5f9', border: '#94a3b8',
                                    card: '#f8fafc', cardForeground: '#1e293b', popover: '#f8fafc', popoverForeground: '#1e293b',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1e293b', mutedForeground: '#64748b',
                                    accentForeground: '#1e293b', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#cbd5e1', ring: '#0f172a'
                                  }
                                },
                                {
                                  nombre: 'Neón Cyber', colores: {
                                    background: '#0d0d0d', foreground: '#00ff88', primary: '#00ff88', secondary: '#1a1a1a',
                                    accent: '#262626', muted: '#1a1a1a', border: '#333333',
                                    card: '#0d0d0d', cardForeground: '#00ff88', popover: '#0d0d0d', popoverForeground: '#00ff88',
                                    primaryForeground: '#000000', secondaryForeground: '#00ff88', mutedForeground: '#00b362',
                                    accentForeground: '#00ff88', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#262626', ring: '#00ff88'
                                  }
                                },
                                {
                                  nombre: 'Vintage Sepia', colores: {
                                    background: '#f5f0e8', foreground: '#4a3728', primary: '#8b4513', secondary: '#ebe5db',
                                    accent: '#ddd5c7', muted: '#f5f0e8', border: '#c9bfae',
                                    card: '#f5f0e8', cardForeground: '#4a3728', popover: '#f5f0e8', popoverForeground: '#4a3728',
                                    primaryForeground: '#ffffff', secondaryForeground: '#4a3728', mutedForeground: '#7a6b5c',
                                    accentForeground: '#4a3728', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#e0d8cc', ring: '#8b4513'
                                  }
                                },
                                {
                                  nombre: 'Azul Hielo', colores: {
                                    background: '#f0f8ff', foreground: '#1a365d', primary: '#1e90ff', secondary: '#e6f3ff',
                                    accent: '#b8dcff', muted: '#f0f8ff', border: '#87ceeb',
                                    card: '#ffffff', cardForeground: '#1a365d', popover: '#ffffff', popoverForeground: '#1a365d',
                                    primaryForeground: '#ffffff', secondaryForeground: '#1a365d', mutedForeground: '#5c7a99',
                                    accentForeground: '#1a365d', destructive: '#e53e3e', destructiveForeground: '#ffffff',
                                    input: '#cce8ff', ring: '#1e90ff'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="mono" className="mt-0">
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  nombre: 'Monocromático Claro', colores: {
                                    background: '#ffffff', foreground: '#141414', primary: '#262626', secondary: '#f5f5f5',
                                    accent: '#ebebeb', muted: '#f5f5f5', border: '#e0e0e0',
                                    card: '#ffffff', cardForeground: '#141414', popover: '#ffffff', popoverForeground: '#141414',
                                    primaryForeground: '#ffffff', secondaryForeground: '#262626', mutedForeground: '#737373',
                                    accentForeground: '#262626', destructive: '#595959', destructiveForeground: '#ffffff',
                                    input: '#ebebeb', ring: '#404040'
                                  }
                                },
                                {
                                  nombre: 'Monocromático Oscuro', colores: {
                                    background: '#0a0a0a', foreground: '#f5f5f5', primary: '#e6e6e6', secondary: '#1f1f1f',
                                    accent: '#292929', muted: '#1f1f1f', border: '#333333',
                                    card: '#0f0f0f', cardForeground: '#f5f5f5', popover: '#0a0a0a', popoverForeground: '#f5f5f5',
                                    primaryForeground: '#0a0a0a', secondaryForeground: '#e6e6e6', mutedForeground: '#999999',
                                    accentForeground: '#e6e6e6', destructive: '#b3b3b3', destructiveForeground: '#0a0a0a',
                                    input: '#262626', ring: '#cccccc'
                                  }
                                },
                              ].map((paleta) => (
                                <button key={paleta.nombre} onClick={() => { setColoresTemporales(paleta.colores); aplicarColoresPersonalizados(paleta.colores); setTemaModificado(true); }} className="p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left">
                                  <div className="flex gap-1 mb-1">{[paleta.colores.background, paleta.colores.primary, paleta.colores.secondary, paleta.colores.accent].map((c, i) => (<div key={i} className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: c }} />))}</div>
                                  <span className="text-xs font-medium">{paleta.nombre}</span>
                                </button>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ajustar Colores</h4>
                          {colores_temporales && [
                            { campo: 'background' as const, nombre: 'Fondo', descripcion: 'Fondo principal de toda la app' },
                            { campo: 'foreground' as const, nombre: 'Texto', descripcion: 'Color del texto e iconos' },
                            { campo: 'primary' as const, nombre: 'Primario', descripcion: 'Botones principales, enlaces activos' },
                            { campo: 'secondary' as const, nombre: 'Secundario', descripcion: 'Tarjetas, áreas destacadas' },
                            { campo: 'accent' as const, nombre: 'Acento', descripcion: 'Hover, elementos seleccionados' },
                            { campo: 'muted' as const, nombre: 'Atenuado', descripcion: 'Fondos sutiles, placeholders' },
                            { campo: 'border' as const, nombre: 'Bordes', descripcion: 'Líneas divisorias, contornos' },
                          ].map(({ campo, nombre, descripcion }) => (
                            <div key={campo} className="flex items-start gap-3">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    className="h-10 w-10 rounded-lg border-2 border-border shadow-md cursor-pointer flex-shrink-0 hover:scale-105 transition-transform"
                                    style={{ backgroundColor: colores_temporales[campo] }}
                                  />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                  <HexColorPicker
                                    color={colores_temporales[campo]}
                                    onChange={(color) => {
                                      const nuevos = { ...colores_temporales, [campo]: color };
                                      setColoresTemporales(nuevos);
                                      aplicarColoresPersonalizados(nuevos);
                                      setTemaModificado(true);
                                    }}
                                  />
                                  <Input
                                    value={colores_temporales[campo]}
                                    onChange={(e) => {
                                      const nuevos = { ...colores_temporales, [campo]: e.target.value };
                                      setColoresTemporales(nuevos);
                                      aplicarColoresPersonalizados(nuevos);
                                      setTemaModificado(true);
                                    }}
                                    className="mt-2 font-mono text-xs"
                                    placeholder="#000000"
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{nombre}</span>
                                  <span className="text-xs font-mono text-muted-foreground">{colores_temporales[campo]}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{descripcion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Vista Previa (También mira la interfaz real)
                          </h4>
                          {colores_temporales && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.background, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.background, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Fondo</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.primary }}>
                                  <div className="w-3 h-3 rounded bg-white/30" />
                                  <span className="text-white">Primario</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.secondary, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.secondary, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Secundario</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: colores_temporales.accent, border: `1px solid ${colores_temporales.border}` }}>
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: colores_temporales.accent, border: '1px solid #888' }} />
                                  <span style={{ color: colores_temporales.foreground || '#000' }}>Acento</span>
                                </div>
                              </div>
                              <div
                                className="rounded-xl border-2 overflow-hidden shadow-lg"
                                style={{
                                  backgroundColor: colores_temporales.background,
                                  borderColor: colores_temporales.border
                                }}
                              >
                                <div className="flex">
                                  <div
                                    className="w-12 p-2 flex flex-col gap-2 border-r"
                                    style={{ backgroundColor: colores_temporales.secondary, borderColor: colores_temporales.border }}
                                  >
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.primary }} />
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.muted }} />
                                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colores_temporales.accent }} />
                                  </div>
                                  <div className="flex-1 p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-semibold text-sm" style={{ color: colores_temporales.foreground || (colores_temporales.background === '#ffffff' ? '#0a0a0a' : '#fafafa') }}>
                                        Panel Principal
                                      </span>
                                      <button
                                        className="px-2 py-1 text-xs rounded"
                                        style={{ backgroundColor: colores_temporales.primary, color: '#fff' }}
                                      >
                                        Acción
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <div
                                        className="p-2 rounded-lg border"
                                        style={{ backgroundColor: colores_temporales.secondary, borderColor: colores_temporales.border }}
                                      >
                                        <div className="text-xs font-medium mb-1" style={{ color: colores_temporales.foreground || '#000' }}>Tarjeta</div>
                                        <div className="text-[10px]" style={{ color: colores_temporales.foreground ? `${colores_temporales.foreground}99` : '#666' }}>Contenido</div>
                                      </div>
                                      <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: colores_temporales.accent }}
                                      >
                                        <div className="text-xs font-medium mb-1" style={{ color: colores_temporales.foreground || '#000' }}>Activo</div>
                                        <div className="text-[10px]" style={{ color: colores_temporales.foreground ? `${colores_temporales.foreground}99` : '#666' }}>Seleccionado</div>
                                      </div>
                                    </div>
                                    <div
                                      className="p-2 rounded border text-xs"
                                      style={{
                                        backgroundColor: colores_temporales.muted,
                                        borderColor: colores_temporales.border,
                                        color: colores_temporales.foreground ? `${colores_temporales.foreground}66` : '#999'
                                      }}
                                    >
                                      Campo de texto...
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground text-center">
                                👆 Mira también la interfaz real detrás de este diálogo
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-6 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (tema_modificado) {
                              setDialogoConfirmarSalir(true);
                            } else {
                              setDialogoPersonalizadoAbierto(false);
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={async () => {
                            if (colores_temporales) {
                              await guardarTemaPersonalizado(colores_temporales);
                              setTemaModificado(false);
                              setDialogoPersonalizadoAbierto(false);
                            }
                          }}
                          disabled={guardando_tema}
                        >
                          {guardando_tema ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Guardar y Aplicar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={dialogo_confirmar_salir} onOpenChange={setDialogoConfirmarSalir}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>¿Descartar cambios?</DialogTitle>
                        <DialogDescription>
                          Tienes cambios sin guardar en tu tema personalizado. ¿Estás seguro de que quieres salir?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogoConfirmarSalir(false)}
                        >
                          Volver al editor
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            aplicarColoresPersonalizados(colores_personalizados);
                            setDialogoConfirmarSalir(false);
                            setDialogoPersonalizadoAbierto(false);
                            setTemaModificado(false);
                          }}
                        >
                          Descartar cambios
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

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
                  <GestionTamanosPapel />
                  <div className="border-t border-border" />
                  <GestionCatalogo
                    titulo="Alergias"
                    items={alergias}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearAlergia(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarAlergia(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarAlergia(id)}
                    onRecargar={cargarCatalogos}
                    placeholderNombre="Ej: Penicilina, Polen, Mariscos"
                    placeholderDescripcion="Describe los síntomas o severidad de la alergia..."
                    ayudaNombre="Ingresa el nombre de la alergia del paciente"
                    ayudaDescripcion="Opcional: Agrega información adicional como reacciones o nivel de gravedad"
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
                    placeholderNombre="Ej: Diabetes, Hipertensión, Asma"
                    placeholderDescripcion="Describe el tipo o características de la enfermedad..."
                    ayudaNombre="Ingresa el nombre de la enfermedad o condición médica"
                    ayudaDescripcion="Opcional: Agrega información sobre tipo, grado o control de la enfermedad"
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
                    placeholderNombre="Ej: Ibuprofeno, Amoxicilina, Losartán"
                    placeholderDescripcion="Describe la dosis, frecuencia o indicaciones..."
                    ayudaNombre="Ingresa el nombre del medicamento"
                    ayudaDescripcion="Opcional: Agrega información sobre presentación, dosis típica o uso común"
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
                    placeholderNombre="Ej: Urgente, Seguimiento, Revisión"
                    placeholderDescripcion="Describe cuándo usar esta categoría..."
                    ayudaNombre="Ingresa el nombre de la categoría o estado"
                    ayudaDescripcion="Opcional: Explica el propósito o cuándo aplicar este color"
                  />

                  <div className="border-t border-border" />

                  <GestionCatalogo
                    titulo="Etiquetas de Plantillas"
                    items={etiquetas_plantillas}
                    cargando={cargando_catalogos}
                    onCrear={(datos) => catalogoApi.crearEtiquetaPlantilla(datos)}
                    onActualizar={(id, datos) => catalogoApi.actualizarEtiquetaPlantilla(id, datos)}
                    onEliminar={(id) => catalogoApi.eliminarEtiquetaPlantilla(id)}
                    onRecargar={cargarCatalogos}
                    permitirCodigo={true}
                    placeholderNombre="Ej: Nombre del Paciente, Fecha de Nacimiento"
                    placeholderDescripcion="Describe qué información reemplazará esta etiqueta..."
                    placeholderCodigo="Ej: [PACIENTE_NOMBRE], [FECHA_NAC]"
                    ayudaNombre="Ingresa un nombre descriptivo para esta etiqueta"
                    ayudaDescripcion="Opcional: Explica qué tipo de información dinámica representa esta etiqueta"
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
