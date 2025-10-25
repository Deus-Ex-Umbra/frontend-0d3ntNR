import { useState, useEffect } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import { Badge } from '@/componentes/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/componentes/ui/table';
import { Users, Plus, Search, Edit, Trash2, Eye, Loader2, AlertCircle, UserCircle, MessageCircle, Palette } from 'lucide-react';
import { pacientesApi, catalogoApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/componentes/ui/toaster';
import { SelectConAgregar } from '@/componentes/ui/select-with-add';
import { GestorArchivos } from '@/componentes/archivos/gestor-archivos';
import { PhoneInput, formatearTelefonoCompleto, separarTelefono } from '@/componentes/ui/phone-input';

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  notas_generales?: string;
  alergias?: number[];
  enfermedades?: number[];
  medicamentos?: number[];
  notas_medicas?: string;
  color_categoria?: string;
}

interface ItemCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [dialogo_abierto, setDialogoAbierto] = useState(false);
  const [dialogo_ver_abierto, setDialogoVerAbierto] = useState(false);
  const [dialogo_color_abierto, setDialogoColorAbierto] = useState(false);
  const [dialogo_whatsapp_abierto, setDialogoWhatsappAbierto] = useState(false);
  const [telefono_whatsapp, setTelefonoWhatsapp] = useState('');
  const [nombre_paciente_whatsapp, setNombrePacienteWhatsapp] = useState('');
  const [paciente_seleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [modo_edicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardando_color, setGuardandoColor] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [paciente_a_eliminar, setPacienteAEliminar] = useState<number | null>(null);

  const abrirDialogoConfirmarEliminar = (id: number) => {
    setPacienteAEliminar(id);
    setDialogoConfirmarEliminarAbierto(true);
  };

  const [catalogos, setCatalogos] = useState({
    alergias: [] as ItemCatalogo[],
    enfermedades: [] as ItemCatalogo[],
    medicamentos: [] as ItemCatalogo[],
    colores: [] as ItemCatalogo[],
  });

  const [formulario, setFormulario] = useState({
    nombre: '',
    apellidos: '',
    codigo_pais: '+591',
    numero_telefono: '',
    correo: '',
    direccion: '',
    notas_generales: '',
    alergias_ids: [] as number[],
    enfermedades_ids: [] as number[],
    medicamentos_ids: [] as number[],
    notas_medicas: '',
    color_categoria: '',
  });

  const [formulario_color, setFormularioColor] = useState({
    nombre: '',
    descripcion: '',
    color: '#808080',
  });

  useEffect(() => {
    cargarDatos();
    cargarCatalogos();
  }, [busqueda]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const datos = await pacientesApi.obtenerTodos(busqueda);
      setPacientes(datos);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pacientes',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [alergias, enfermedades, medicamentos, colores] = await Promise.all([
        catalogoApi.obtenerAlergias(),
        catalogoApi.obtenerEnfermedades(),
        catalogoApi.obtenerMedicamentos(),
        catalogoApi.obtenerColores(),
      ]);
      setCatalogos({ alergias, enfermedades, medicamentos, colores });
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const abrirDialogoNuevo = () => {
    setFormulario({
      nombre: '',
      apellidos: '',
      codigo_pais: '+591',
      numero_telefono: '',
      correo: '',
      direccion: '',
      notas_generales: '',
      alergias_ids: [],
      enfermedades_ids: [],
      medicamentos_ids: [],
      notas_medicas: '',
      color_categoria: '',
    });
    setModoEdicion(false);
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = async (paciente: Paciente) => {
    try {
      const datos_completos = await pacientesApi.obtenerPorId(paciente.id);
      
      const { codigo_pais, numero } = datos_completos.telefono 
        ? separarTelefono(datos_completos.telefono)
        : { codigo_pais: '+591', numero: '' };

      setFormulario({
        nombre: datos_completos.nombre,
        apellidos: datos_completos.apellidos,
        codigo_pais,
        numero_telefono: numero,
        correo: datos_completos.correo || '',
        direccion: datos_completos.direccion || '',
        notas_generales: datos_completos.notas_generales || '',
        alergias_ids: Array.isArray(datos_completos.alergias) ? datos_completos.alergias : [],
        enfermedades_ids: Array.isArray(datos_completos.enfermedades) ? datos_completos.enfermedades : [],
        medicamentos_ids: Array.isArray(datos_completos.medicamentos) ? datos_completos.medicamentos : [],
        notas_medicas: datos_completos.notas_medicas || '',
        color_categoria: datos_completos.color_categoria || '',
      });
      setPacienteSeleccionado(datos_completos);
      setModoEdicion(true);
      setDialogoAbierto(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del paciente',
        variant: 'destructive',
      });
    }
  };

  const manejarGuardar = async () => {
    if (!formulario.nombre || !formulario.apellidos) {
      toast({
        title: 'Error',
        description: 'Nombre y apellidos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const telefono_completo = formulario.numero_telefono 
        ? formatearTelefonoCompleto(formulario.codigo_pais, formulario.numero_telefono)
        : undefined;

      const datos: any = {
        nombre: formulario.nombre,
        apellidos: formulario.apellidos,
        telefono: telefono_completo,
        correo: formulario.correo || undefined,
        direccion: formulario.direccion || undefined,
        notas_generales: formulario.notas_generales || undefined,
        alergias_ids: formulario.alergias_ids,
        enfermedades_ids: formulario.enfermedades_ids,
        medicamentos_ids: formulario.medicamentos_ids,
        notas_medicas: formulario.notas_medicas || undefined,
        color_categoria: formulario.color_categoria || undefined,
      };

      if (modo_edicion && paciente_seleccionado) {
        await pacientesApi.actualizar(paciente_seleccionado.id, datos);
        toast({
          title: 'Éxito',
          description: 'Paciente actualizado correctamente',
        });
      } else {
        await pacientesApi.crear(datos);
        toast({
          title: 'Éxito',
          description: 'Paciente creado correctamente',
        });
      }
      setDialogoAbierto(false);
      cargarDatos();
    } catch (error: any) {
      console.error('Error al guardar paciente:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo guardar el paciente',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEliminar = async () => {
    if (!paciente_a_eliminar) return;

    try {
      await pacientesApi.eliminar(paciente_a_eliminar);
      toast({
        title: 'Éxito',
        description: 'Paciente eliminado correctamente',
      });
      setDialogoConfirmarEliminarAbierto(false);
      setPacienteAEliminar(null);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el paciente',
        variant: 'destructive',
      });
    }
  };

  const verDetallePaciente = async (id: number) => {
    try {
      const datos = await pacientesApi.obtenerPorId(id);
      setPacienteSeleccionado(datos);
      setDialogoVerAbierto(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el paciente',
        variant: 'destructive',
      });
    }
  };

  const obtenerColorPorId = (color_value: string) => {
    return catalogos.colores.find(c => c.color === color_value);
  };

  const prepararWhatsApp = (telefono: string, nombre: string, apellidos: string) => {
    setTelefonoWhatsapp(telefono);
    setNombrePacienteWhatsapp(`${nombre} ${apellidos}`);
    setDialogoWhatsappAbierto(true);
  };

  const confirmarAbrirWhatsApp = () => {
    const numero_limpio = telefono_whatsapp.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${numero_limpio}`, '_blank');
    setDialogoWhatsappAbierto(false);
  };

  const abrirDialogoNuevoColor = () => {
    setFormularioColor({
      nombre: '',
      descripcion: '',
      color: '#808080',
    });
    setDialogoColorAbierto(true);
  };

  const manejarCrearColor = async () => {
    if (!formulario_color.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del color es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardandoColor(true);
    try {
      const nuevo_color = await catalogoApi.crearColor({
        nombre: formulario_color.nombre.trim(),
        color: formulario_color.color,
        descripcion: formulario_color.descripcion.trim() || undefined,
      });

      await cargarCatalogos();

      setFormulario({
        ...formulario,
        color_categoria: nuevo_color.color,
      });

      toast({
        title: 'Éxito',
        description: 'Color agregado al catálogo',
      });

      setDialogoColorAbierto(false);
      setFormularioColor({
        nombre: '',
        descripcion: '',
        color: '#808080',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo agregar el color',
        variant: 'destructive',
      });
    } finally {
      setGuardandoColor(false);
    }
  };

  const agregarAlergia = async (nombre: string) => {
    try {
      const nueva_alergia = await catalogoApi.crearAlergia({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        alergias_ids: [...formulario.alergias_ids, nueva_alergia.id]
      });
      toast({
        title: 'Éxito',
        description: 'Alergia agregada al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la alergia',
        variant: 'destructive',
      });
    }
  };

  const agregarEnfermedad = async (nombre: string) => {
    try {
      const nueva_enfermedad = await catalogoApi.crearEnfermedad({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        enfermedades_ids: [...formulario.enfermedades_ids, nueva_enfermedad.id]
      });
      toast({
        title: 'Éxito',
        description: 'Enfermedad agregada al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la enfermedad',
        variant: 'destructive',
      });
    }
  };

  const agregarMedicamento = async (nombre: string) => {
    try {
      const nuevo_medicamento = await catalogoApi.crearMedicamento({ nombre });
      await cargarCatalogos();
      setFormulario({
        ...formulario,
        medicamentos_ids: [...formulario.medicamentos_ids, nuevo_medicamento.id]
      });
      toast({
        title: 'Éxito',
        description: 'Medicamento agregado al catálogo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el medicamento',
        variant: 'destructive',
      });
    }
  };

  const toggleAlergia = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      alergias_ids: prev.alergias_ids.includes(id)
        ? prev.alergias_ids.filter(a => a !== id)
        : [...prev.alergias_ids, id]
    }));
  };

  const toggleEnfermedad = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      enfermedades_ids: prev.enfermedades_ids.includes(id)
        ? prev.enfermedades_ids.filter(e => e !== id)
        : [...prev.enfermedades_ids, id]
    }));
  };

  const toggleMedicamento = (id: number) => {
    setFormulario(prev => ({
      ...prev,
      medicamentos_ids: prev.medicamentos_ids.includes(id)
        ? prev.medicamentos_ids.filter(m => m !== id)
        : [...prev.medicamentos_ids, id]
    }));
  };

  const obtenerAlergiasPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.alergias.find(a => a.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  const obtenerEnfermedadesPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.enfermedades.find(e => e.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  const obtenerMedicamentosPorIds = (ids: number[]) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(id => catalogos.medicamentos.find(m => m.id === id)).filter(Boolean) as ItemCatalogo[];
  };

  if (cargando && pacientes.length === 0) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <MenuLateral />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
                Pacientes
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestiona la información de tus pacientes
              </p>
            </div>

            <Button size="lg" className="shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200" onClick={abrirDialogoNuevo}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Paciente
            </Button>
          </div>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Búsqueda de Pacientes</CardTitle>
                  <CardDescription>Busca por nombre, apellidos o ID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-11 hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Lista de Pacientes</CardTitle>
                  <CardDescription>{pacientes.length} pacientes registrados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pacientes.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      No hay pacientes registrados
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Comienza creando tu primer paciente usando el botón "Nuevo Paciente"
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientes.map((paciente) => (
                      <TableRow key={paciente.id} className="hover:bg-secondary/50 transition-colors duration-200">
                        <TableCell>
                          {paciente.color_categoria && (
                            <div
                              className="w-4 h-4 rounded-full hover:scale-125 transition-transform duration-200 cursor-help"
                              style={{ backgroundColor: paciente.color_categoria }}
                              title={obtenerColorPorId(paciente.color_categoria)?.nombre || 'Color de categoría'}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {paciente.nombre} {paciente.apellidos}
                        </TableCell>
                        <TableCell>
                          {paciente.telefono ? (
                            <div className="flex items-center gap-2">
                              <span>{paciente.telefono}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  prepararWhatsApp(paciente.telefono!, paciente.nombre, paciente.apellidos);
                                }}
                                className="h-7 w-7 hover:bg-green-500/20 hover:text-green-500 transition-all duration-200"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{paciente.correo || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => verDetallePaciente(paciente.id)}
                            className="hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all duration-200"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoEditar(paciente)}
                            className="hover:bg-blue-500/20 hover:text-blue-500 hover:scale-110 transition-all duration-200"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirDialogoConfirmarEliminar(paciente.id)}
                            className="hover:bg-destructive/20 hover:text-destructive hover:scale-110 transition-all duration-200"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este paciente?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción eliminará permanentemente el paciente y toda su información asociada.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarAbierto(false);
                setPacienteAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={manejarEliminar}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_abierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modo_edicion ? 'Editar Paciente' : 'Nuevo Paciente'}
            </DialogTitle>
            <DialogDescription>
              {modo_edicion 
                ? 'Modifica la información del paciente' 
                : 'Completa los datos del nuevo paciente'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="datos-generales" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="datos-generales">Datos Generales</TabsTrigger>
              <TabsTrigger value="anamnesis">Anamnesis</TabsTrigger>
            </TabsList>

            <TabsContent value="datos-generales" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    placeholder="Juan"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formulario.apellidos}
                    onChange={(e) => setFormulario({ ...formulario, apellidos: e.target.value })}
                    placeholder="Pérez López"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PhoneInput
                  codigo_pais={formulario.codigo_pais}
                  numero={formulario.numero_telefono}
                  onCodigoPaisChange={(codigo) => setFormulario({ ...formulario, codigo_pais: codigo })}
                  onNumeroChange={(numero) => setFormulario({ ...formulario, numero_telefono: numero })}
                  label="Teléfono"
                  placeholder="70123456"
                />

                <div className="space-y-2">
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formulario.correo}
                    onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                    placeholder="paciente@email.com"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formulario.direccion}
                  onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                  placeholder="Calle Principal #123"
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas_generales">Notas Generales</Label>
                <Textarea
                  id="notas_generales"
                  value={formulario.notas_generales}
                  onChange={(e) => setFormulario({ ...formulario, notas_generales: e.target.value })}
                  placeholder="Notas adicionales sobre el paciente..."
                  rows={3}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Color de Categoría</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={abrirDialogoNuevoColor}
                    className="hover:bg-primary/20 hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Color
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona un color del catálogo para identificar al paciente
                </p>
                <div className="flex gap-2 flex-wrap">
                  {catalogos.colores.filter(c => c.color).map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`group relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                        formulario.color_categoria === color.color
                          ? 'border-foreground scale-110 shadow-lg'
                          : 'border-transparent hover:border-border'
                      }`}
                      style={{ backgroundColor: color.color! }}
                      onClick={() => setFormulario({ ...formulario, color_categoria: color.color! })}
                      title={color.nombre}
                    >
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg border border-border">
                        {color.nombre}
                      </span>
                    </button>
                  ))}
                  {formulario.color_categoria && (
                    <button
                      type="button"
                      className="w-12 h-12 rounded-lg border-2 border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center hover:scale-110 transition-all duration-200"
                      onClick={() => setFormulario({ ...formulario, color_categoria: '' })}
                      title="Limpiar color"
                    >
                      ×
                    </button>
                  )}
                </div>
                {formulario.color_categoria && (
                  <div className="p-3 mt-2 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {obtenerColorPorId(formulario.color_categoria)?.nombre || 'Color seleccionado'}
                      </span>
                    </p>
                    {obtenerColorPorId(formulario.color_categoria)?.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {obtenerColorPorId(formulario.color_categoria)?.descripcion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="anamnesis" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Alergias</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formulario.alergias_ids.map((id) => {
                    const alergia = catalogos.alergias.find(a => a.id === id);
                    return alergia ? (
                      <Badge
                        key={id}
                        variant="destructive"
                        className="cursor-pointer hover:bg-destructive/80 transition-all duration-200"
                        onClick={() => toggleAlergia(id)}
                      >
                        {alergia.nombre} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                <SelectConAgregar
                  opciones={catalogos.alergias.map(a => ({ valor: a.id.toString(), etiqueta: a.nombre }))}
                  valor=""
                  onChange={(valor) => {
                    if (valor) toggleAlergia(parseInt(valor));
                  }}
                  onAgregarNuevo={agregarAlergia}
                  placeholder="Seleccionar alergia"
                  textoAgregar="+ Agregar nueva alergia"
                  tituloModal="Agregar Nueva Alergia"
                  descripcionModal="Ingresa el nombre de la alergia"
                  placeholderInput="Ej: Penicilina"
                />
              </div>

              <div className="space-y-2">
                <Label>Enfermedades Preexistentes</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formulario.enfermedades_ids.map((id) => {
                    const enfermedad = catalogos.enfermedades.find(e => e.id === id);
                    return enfermedad ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 hover:text-destructive transition-all duration-200"
                        onClick={() => toggleEnfermedad(id)}
                      >
                        {enfermedad.nombre} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                <SelectConAgregar
                  opciones={catalogos.enfermedades.map(e => ({ valor: e.id.toString(), etiqueta: e.nombre }))}
                  valor=""
                  onChange={(valor) => {
                    if (valor) toggleEnfermedad(parseInt(valor));
                  }}
                  onAgregarNuevo={agregarEnfermedad}
                  placeholder="Seleccionar enfermedad"
                  textoAgregar="+ Agregar nueva enfermedad"
                  tituloModal="Agregar Nueva Enfermedad"
                  descripcionModal="Ingresa el nombre de la enfermedad"
                  placeholderInput="Ej: Diabetes"
                />
              </div>

              <div className="space-y-2">
                <Label>Medicamentos Actuales</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formulario.medicamentos_ids.map((id) => {
                    const medicamento = catalogos.medicamentos.find(m => m.id === id);
                    return medicamento ? (
                      <Badge
                        key={id}
                        className="cursor-pointer hover:bg-primary/80 transition-all duration-200"
                        onClick={() => toggleMedicamento(id)}
                      >
                        {medicamento.nombre} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
                <SelectConAgregar
                  opciones={catalogos.medicamentos.map(m => ({ valor: m.id.toString(), etiqueta: m.nombre }))}
                  valor=""
                  onChange={(valor) => {
                    if (valor) toggleMedicamento(parseInt(valor));
                  }}
                  onAgregarNuevo={agregarMedicamento}
                  placeholder="Seleccionar medicamento"
                  textoAgregar="+ Agregar nuevo medicamento"
                  tituloModal="Agregar Nuevo Medicamento"
                  descripcionModal="Ingresa el nombre del medicamento"
                  placeholderInput="Ej: Aspirina"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas_medicas">Notas Médicas Importantes</Label>
                <Textarea
                  id="notas_medicas"
                  value={formulario.notas_medicas}
                  onChange={(e) => setFormulario({ ...formulario, notas_medicas: e.target.value })}
                  placeholder="Otras notas médicas relevantes..."
                  rows={3}
                  className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarGuardar} 
              disabled={guardando}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modo_edicion ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_whatsapp_abierto} onOpenChange={setDialogoWhatsappAbierto}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Confirmar Apertura de WhatsApp
            </DialogTitle>
            <DialogDescription>
              Verifica que la información sea correcta antes de continuar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Paciente</Label>
                <p className="text-sm font-semibold text-foreground">{nombre_paciente_whatsapp}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Número de Teléfono</Label>
                <p className="text-base font-bold text-foreground">{telefono_whatsapp}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground">
                Se abrirá WhatsApp en una nueva pestaña con este número. Asegúrate de que el número sea correcto.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoWhatsappAbierto(false)}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmarAbrirWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-all duration-200"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_color_abierto} onOpenChange={setDialogoColorAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Color</DialogTitle>
            <DialogDescription>
              Crea un nuevo color para categorizar pacientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-color">Nombre *</Label>
              <Input
                id="nombre-color"
                value={formulario_color.nombre}
                onChange={(e) => setFormularioColor({ ...formulario_color, nombre: e.target.value })}
                placeholder="Ej: Urgente, VIP, Regular..."
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-color">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-color"
                value={formulario_color.descripcion}
                onChange={(e) => setFormularioColor({ ...formulario_color, descripcion: e.target.value })}
                placeholder="Describe el propósito de esta categoría..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-picker">Color *</Label>
              <div className="flex gap-3">
                <Input
                  id="color-picker"
                  type="color"
                  value={formulario_color.color}
                  onChange={(e) => setFormularioColor({ ...formulario_color, color: e.target.value })}
                  className="h-12 w-24 cursor-pointer hover:scale-105 transition-all duration-200"
                />
                <Input
                  type="text"
                  value={formulario_color.color}
                  onChange={(e) => setFormularioColor({ ...formulario_color, color: e.target.value })}
                  placeholder="#808080"
                  className="flex-1 hover:border-primary/50 focus:border-primary transition-all duration-200"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Selecciona un color representativo para esta categoría
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-border bg-secondary/20">
              <p className="text-sm font-semibold mb-2">Vista Previa:</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-border"
                  style={{ backgroundColor: formulario_color.color }}
                />
                <div>
                  <p className="font-medium">{formulario_color.nombre || 'Nombre del color'}</p>
                  {formulario_color.descripcion && (
                    <p className="text-xs text-muted-foreground">{formulario_color.descripcion}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoColorAbierto(false);
                setFormularioColor({
                  nombre: '',
                  descripcion: '',
                  color: '#808080',
                });
              }}
              disabled={guardando_color}
            >
              Cancelar
            </Button>
            <Button 
              onClick={manejarCrearColor} 
              disabled={guardando_color || !formulario_color.nombre.trim()}
              className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
            >
              {guardando_color && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Palette className="mr-2 h-4 w-4" />
              Crear Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_ver_abierto} onOpenChange={setDialogoVerAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-6 w-6" />
              Detalle del Paciente
            </DialogTitle>
          </DialogHeader>

          {paciente_seleccionado && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors duration-200">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {paciente_seleccionado.nombre.charAt(0)}{paciente_seleccionado.apellidos.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground">
                    {paciente_seleccionado.nombre} {paciente_seleccionado.apellidos}
                  </h3>
                  {paciente_seleccionado.color_categoria && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: paciente_seleccionado.color_categoria }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {obtenerColorPorId(paciente_seleccionado.color_categoria)?.nombre || 'Color de categoría'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Tabs defaultValue="contacto" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="contacto">Contacto</TabsTrigger>
                  <TabsTrigger value="medico">Información Médica</TabsTrigger>
                  <TabsTrigger value="archivos">Archivos</TabsTrigger>
                </TabsList>

                <TabsContent value="contacto" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Teléfono</Label>
                      {paciente_seleccionado.telefono ? (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-foreground font-medium">
                            {paciente_seleccionado.telefono}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => prepararWhatsApp(
                              paciente_seleccionado.telefono!, 
                              paciente_seleccionado.nombre, 
                              paciente_seleccionado.apellidos
                            )}
                            className="hover:bg-green-500/20 hover:text-green-500 hover:border-green-500 transition-all duration-200"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      ) : (
                        <p className="text-foreground font-medium">No registrado</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Correo</Label>
                      <p className="text-foreground font-medium">
                        {paciente_seleccionado.correo || 'No registrado'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Dirección</Label>
                      <p className="text-foreground font-medium">
                        {paciente_seleccionado.direccion || 'No registrada'}
                      </p>
                    </div>
                    {paciente_seleccionado.notas_generales && (
                      <div>
                        <Label className="text-muted-foreground">Notas Generales</Label>
                        <p className="text-foreground font-medium whitespace-pre-wrap">
                          {paciente_seleccionado.notas_generales}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="medico" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {paciente_seleccionado.alergias && paciente_seleccionado.alergias.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Alergias</Label>
                        <div className="flex flex-wrap gap-2">
                          {obtenerAlergiasPorIds(paciente_seleccionado.alergias).map((alergia) => (
                            <Badge key={alergia.id} variant="destructive">
                              {alergia.nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {paciente_seleccionado.enfermedades && paciente_seleccionado.enfermedades.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Enfermedades Preexistentes</Label>
                        <div className="flex flex-wrap gap-2">
                          {obtenerEnfermedadesPorIds(paciente_seleccionado.enfermedades).map((enfermedad) => (
                            <Badge key={enfermedad.id} variant="secondary">
                              {enfermedad.nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {paciente_seleccionado.medicamentos && paciente_seleccionado.medicamentos.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Medicamentos Actuales</Label>
                        <div className="flex flex-wrap gap-2">
                          {obtenerMedicamentosPorIds(paciente_seleccionado.medicamentos).map((medicamento) => (
                            <Badge key={medicamento.id}>
                              {medicamento.nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {paciente_seleccionado.notas_medicas && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Notas Médicas</Label>
                        <div className="p-3 rounded-lg bg-secondary/30">
                          <p className="text-foreground font-medium whitespace-pre-wrap">
                            {paciente_seleccionado.notas_medicas}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {(!paciente_seleccionado.alergias || paciente_seleccionado.alergias.length === 0) &&
                     (!paciente_seleccionado.enfermedades || paciente_seleccionado.enfermedades.length === 0) &&
                     (!paciente_seleccionado.medicamentos || paciente_seleccionado.medicamentos.length === 0) &&
                     !paciente_seleccionado.notas_medicas && (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mb-3">
                          <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          No hay información médica registrada
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="archivos" className="space-y-4 mt-4">
                  <GestorArchivos 
                    paciente_id={paciente_seleccionado.id} 
                    modo="paciente"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}