import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Image as KonvaImage, Group, Rect, Text } from "react-konva";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import { Label } from "@/componentes/ui/label";
import { Textarea } from "@/componentes/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/componentes/ui/card";
import { ScrollArea } from "@/componentes/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/componentes/ui/tabs";
import { Badge } from "@/componentes/ui/badge";
import {
  Pencil,
  Download,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  Trash2,
  Copy,
  X,
  Plus,
  Sparkles,
  Eraser,
  Eye,
  Check,
  Move
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { edicionesImagenesApi } from "@/lib/api";
import { HexColorPicker } from "react-colorful";
import "@/componentes/ui/color-picker.css";
import { ComentarioImagen } from "@/tipos/comentario-imagen";

interface Herramienta {
  tipo:
    | "pencil"
    | "line"
    | "rect"
    | "circle"
    | "text"
    | "eraser-magic"
    | "eraser-normal"
    | "move"
    | "symbol";
  color: string;
  grosor: number;
  opacidad: number;
}

interface ObjetoCanvas {
  tipo: string;
  puntos?: number[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  radio?: number;
  texto?: string;
  color: string;
  grosor: number;
  opacidad: number;
  simbolo_id?: number;
  imagen_base64?: string;
}

interface EditorImagenesProps {
  archivo_id: number;
  archivo_nombre: string;
  archivo_base64: string;
  tipo_mime: string;
  abierto: boolean;
  onCerrar: () => void;
  onGuardar?: () => void;
  version_editar?: {
    id: number;
    nombre?: string;
    descripcion?: string;
    version: number;
    datos_canvas?: { objetos: ObjetoCanvas[] };
  };
}

interface EdicionVersion {
  id: number;
  nombre?: string;
  descripcion?: string;
  version: number;
  fecha_creacion: string;
  usuario: {
    nombre: string;
  };
}

export function EditorImagenes({
  archivo_id,
  archivo_nombre,
  archivo_base64,
  tipo_mime,
  abierto,
  onCerrar,
  onGuardar,
  version_editar,
}: EditorImagenesProps) {
  const [herramienta_actual, setHerramientaActual] = useState<Herramienta>({
    tipo: "pencil",
    color: "#FF0000",
    grosor: 5,
    opacidad: 1,
  });

  const [objetos, setObjetos] = useState<ObjetoCanvas[]>([]);
  const [historial_deshacer, setHistorialDeshacer] = useState<ObjetoCanvas[][]>(
    []
  );
  const [historial_rehacer, setHistorialRehacer] = useState<ObjetoCanvas[][]>(
    []
  );
  const [dibujando, setDibujando] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotacion, setRotacion] = useState(0);

  const [imagen_cargada, setImagenCargada] = useState<HTMLImageElement | null>(
    null
  );
  const [dimensiones_imagen, setDimensionesImagen] = useState({
    ancho: 800,
    alto: 600,
  });

  const [guardando, setGuardando] = useState(false);
  const [dialogo_guardar_abierto, setDialogoGuardarAbierto] = useState(false);
  const [nombre_version, setNombreVersion] = useState("");
  const [descripcion_version, setDescripcionVersion] = useState("");

  const [versiones, setVersiones] = useState<EdicionVersion[]>([]);
  const [cargando_versiones, setCargandoVersiones] = useState(false);
  const [dialogo_versiones_abierto, setDialogoVersionesAbierto] =
    useState(false);

  const stage_ref = useRef<any>(null);
  const layer_dibujo_ref = useRef<any>(null);

  const [dialogo_confirmar_limpiar_abierto, setDialogoConfirmarLimpiarAbierto] =
    useState(false);

  const [
    dialogo_confirmar_eliminar_version_abierto,
    setDialogoConfirmarEliminarVersionAbierto,
  ] = useState(false);
  const [version_a_eliminar, setVersionAEliminar] =
    useState<EdicionVersion | null>(null);

  const [tiene_cambios, setTieneCambios] = useState(false);
  const [dialogo_cambios_sin_guardar_abierto, setDialogoCambiosSinGuardarAbierto] = useState(false);
  const [cursor_pos, setCursorPos] = useState({ x: -100, y: -100 });
  const [mostrar_cursor, setMostrarCursor] = useState(false);
  const [comentarios, setComentarios] = useState<ComentarioImagen[]>([]);
  const [cargando_comentarios, setCargandoComentarios] = useState(false);
  const [modo_comentario, setModoComentario] = useState(false);
  const [modo_reubicacion, setModoReubicacion] = useState(false);
  
  const [dialogo_comentario_abierto, setDialogoComentarioAbierto] = useState(false);
  const [posicion_nuevo_comentario, setPosicionNuevoComentario] = useState<{x: number, y: number} | null>(null);
  const [comentario_editando, setComentarioEditando] = useState<ComentarioImagen | null>(null);
  const [form_comentario, setFormComentario] = useState({ titulo: "", contenido: "", color: "#FF0000" });
  
  const [comentario_seleccionado, setComentarioSeleccionado] = useState<ComentarioImagen | null>(null);
  const [hover_info, setHoverInfo] = useState<{ visible: boolean, x: number, y: number, comentario: ComentarioImagen | null }>({ 
      visible: false, x: 0, y: 0, comentario: null 
  });

  const [dialogo_confirmar_eliminar_comentario, setDialogoConfirmarEliminarComentario] = useState(false);
  const [comentario_a_eliminar, setComentarioAEliminar] = useState<number | null>(null);

  const abrirDialogoConfirmarLimpiar = () => {
    if (objetos.length === 0) return;
    setDialogoConfirmarLimpiarAbierto(true);
  };

  const abrirDialogoConfirmarEliminarVersion = (version: EdicionVersion) => {
    setVersionAEliminar(version);
    setDialogoConfirmarEliminarVersionAbierto(true);
  };

  useEffect(() => {
    if (abierto) {
      cargarImagen();
      cargarVersiones();

      if (version_editar) {
        if (
          version_editar.datos_canvas &&
          (version_editar.datos_canvas as any).objetos
        ) {
          setObjetos((version_editar.datos_canvas as any).objetos);
          setHistorialDeshacer([]);
          setHistorialRehacer([]);
        }
        setNombreVersion(
          version_editar.nombre || `Versión ${version_editar.version}`
        );
        setDescripcionVersion(version_editar.descripcion || "");
        cargarComentarios(version_editar.id);
      } else {
        setObjetos([]);
        setHistorialDeshacer([]);
        setHistorialRehacer([]);
        setNombreVersion("");
        setDescripcionVersion("");
        setComentarios([]);
      }
      setRotacion(0);
      setZoom(1);
      setTieneCambios(false);
      setModoComentario(false);
      setModoReubicacion(false);
    }
  }, [abierto, archivo_base64, version_editar]);

  const cargarImagen = () => {
    const img = new window.Image();
    img.src = `data:${tipo_mime};base64,${archivo_base64}`;
    img.onload = () => {
      setImagenCargada(img);
      setDimensionesImagen({ ancho: img.width, alto: img.height });
    };
  };

  const cargarVersiones = async () => {
    setCargandoVersiones(true);
    try {
      const datos = await edicionesImagenesApi.obtenerPorArchivo(archivo_id);
      setVersiones(datos);
    } catch (error) {
      console.error("Error al cargar versiones:", error);
    } finally {
      setCargandoVersiones(false);
    }
  };

  const cargarComentarios = async (edicion_id: number) => {
    setCargandoComentarios(true);
    try {
      const datos = await edicionesImagenesApi.obtenerComentarios(edicion_id);
      setComentarios(datos);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      });
    } finally {
      setCargandoComentarios(false);
    }
  };

  const guardarEstadoHistorial = () => {
    setHistorialDeshacer([...historial_deshacer, [...objetos]]);
    setHistorialRehacer([]);
    setTieneCambios(true);
  };

  const deshacer = () => {
    if (historial_deshacer.length === 0) return;

    const nuevo_historial_deshacer = [...historial_deshacer];
    const estado_anterior = nuevo_historial_deshacer.pop()!;

    setHistorialRehacer([...historial_rehacer, [...objetos]]);
    setHistorialDeshacer(nuevo_historial_deshacer);
    setObjetos(estado_anterior);
  };

  const rehacer = () => {
    if (historial_rehacer.length === 0) return;

    const nuevo_historial_rehacer = [...historial_rehacer];
    const estado_siguiente = nuevo_historial_rehacer.pop()!;

    setHistorialDeshacer([...historial_deshacer, [...objetos]]);
    setHistorialRehacer(nuevo_historial_rehacer);
    setObjetos(estado_siguiente);
  };

  const handleMouseDown = (e: any) => {
    if (herramienta_actual.tipo === "move") return;

    const pos = e.target.getStage().getPointerPosition();
    const punto_ajustado = {
      x: (pos.x - offset.x) / zoom,
      y: (pos.y - offset.y) / zoom,
    };

    if (modo_comentario) {
        setPosicionNuevoComentario(punto_ajustado);
        setComentarioEditando(null);
        setFormComentario({ titulo: "", contenido: "", color: "#FF0000" });
        setDialogoComentarioAbierto(true);
        setModoComentario(false);
        return;
    }

    if (modo_reubicacion) {
        setPosicionNuevoComentario(punto_ajustado);
        setModoReubicacion(false);
        setDialogoComentarioAbierto(true); 
        return;
    }

    if (herramienta_actual.tipo === "eraser-magic") {
      guardarEstadoHistorial();
      setDibujando(true);

      const objetos_filtrados = objetos.filter((obj) => {
        if (obj.tipo === "pencil" || obj.tipo === "eraser-normal") {
          if (!obj.puntos) return true;

          for (let i = 0; i < obj.puntos.length; i += 2) {
            const px = obj.puntos[i];
            const py = obj.puntos[i + 1];
            const distancia = Math.sqrt(
              Math.pow(px - punto_ajustado.x, 2) +
                Math.pow(py - punto_ajustado.y, 2)
            );

            if (distancia < herramienta_actual.grosor * 2) {
              return false;
            }
          }
        }
        return true;
      });

      setObjetos(objetos_filtrados);
    } else if (herramienta_actual.tipo === "pencil" || herramienta_actual.tipo === "eraser-normal") {
      guardarEstadoHistorial();
      setDibujando(true);

      const nuevo_objeto: ObjetoCanvas = {
        tipo: herramienta_actual.tipo,
        puntos: [punto_ajustado.x, punto_ajustado.y, punto_ajustado.x, punto_ajustado.y],
        color: herramienta_actual.color,
        grosor: herramienta_actual.grosor,
        opacidad: herramienta_actual.opacidad,
      };
      setObjetos([...objetos, nuevo_objeto]);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (pointerPos) {
        const punto_ajustado = {
             x: (pointerPos.x - offset.x) / zoom,
             y: (pointerPos.y - offset.y) / zoom,
        };
        setCursorPos(punto_ajustado);
    }

    if (!dibujando) return;

    const punto_ajustado = {
      x: (pointerPos.x - offset.x) / zoom,
      y: (pointerPos.y - offset.y) / zoom,
    };

    if (herramienta_actual.tipo === "eraser-magic") {
      const objetos_filtrados = objetos.filter((obj) => {
        if (obj.tipo === "pencil" || obj.tipo === "eraser-normal") {
          if (!obj.puntos) return true;

          for (let i = 0; i < obj.puntos.length; i += 2) {
            const px = obj.puntos[i];
            const py = obj.puntos[i + 1];
            const distancia = Math.sqrt(
              Math.pow(px - punto_ajustado.x, 2) +
                Math.pow(py - punto_ajustado.y, 2)
            );

            if (distancia < herramienta_actual.grosor * 2) {
              return false;
            }
          }
        }
        return true;
      });

      setObjetos(objetos_filtrados);
    } else if (herramienta_actual.tipo === "pencil" || herramienta_actual.tipo === "eraser-normal") {
      const ultimo_objeto = objetos[objetos.length - 1];
      if (ultimo_objeto && (ultimo_objeto.tipo === "pencil" || ultimo_objeto.tipo === "eraser-normal")) {
        const nuevos_puntos = ultimo_objeto.puntos!.concat([
          punto_ajustado.x,
          punto_ajustado.y,
        ]);
        const objetos_actualizados = objetos.slice(0, -1);
        setObjetos([
          ...objetos_actualizados,
          { ...ultimo_objeto, puntos: nuevos_puntos },
        ]);
      }
    }
  };

  const handleMouseUp = () => {
    setDibujando(false);
  };

  const limpiarCanvas = () => {
    guardarEstadoHistorial();
    setObjetos([]);
    setDialogoConfirmarLimpiarAbierto(false);
    toast({
      title: "Canvas limpiado",
      description: "Todos los objetos fueron eliminados",
    });
  };

  const exportarImagen = () => {
    if (!stage_ref.current) return;
    setMostrarCursor(false);
    setTimeout(() => {
        const uri = stage_ref.current.toDataURL();
        const link = document.createElement("a");
        link.download = `${archivo_nombre}_editado.png`;
        link.href = uri;
        link.click();

        toast({
        title: "Imagen exportada",
        description: "La imagen se descargó correctamente",
        });
        setMostrarCursor(true);
    }, 50);
  };

  const abrirDialogoGuardar = () => {
    if (!version_editar) {
      setNombreVersion(`Edición ${versiones.length + 1}`);
      setDescripcionVersion("");
    }
    setDialogoGuardarAbierto(true);
  };

  const guardarVersion = async () => {
    if (!stage_ref.current) return;
    setGuardando(true);
    setMostrarCursor(false);

    setTimeout(async () => {
        try {
            const uri = stage_ref.current.toDataURL();
            const imagen_resultado = uri.split(",")[1];
      
            if (version_editar) {
              await edicionesImagenesApi.actualizar(version_editar.id, {
                nombre: nombre_version.trim() || undefined,
                descripcion: descripcion_version.trim() || undefined,
                datos_canvas: { objetos },
                imagen_resultado_base64: imagen_resultado,
              });
      
              toast({
                title: "Versión actualizada",
                description: "Los cambios se guardaron correctamente",
              });
            } else {
              await edicionesImagenesApi.crear({
                archivo_original_id: archivo_id,
                nombre: nombre_version.trim() || undefined,
                descripcion: descripcion_version.trim() || undefined,
                datos_canvas: { objetos },
                imagen_resultado_base64: imagen_resultado,
              });
      
              toast({
                title: "Versión guardada",
                description: "La edición se guardó correctamente",
              });
            }
      
            setDialogoGuardarAbierto(false);
            setTieneCambios(false);
            await cargarVersiones();
            onGuardar?.();
          } catch (error: any) {
            toast({
              title: "Error",
              description:
                error.response?.data?.message || "No se pudo guardar la versión",
              variant: "destructive",
            });
          } finally {
            setGuardando(false);
            setMostrarCursor(true);
          }
    }, 50);
  };

  const cargarVersion = async (version: EdicionVersion) => {
    try {
      const datos = await edicionesImagenesApi.obtenerPorId(version.id);

      if (datos.datos_canvas && (datos.datos_canvas as any).objetos) {
        setObjetos((datos.datos_canvas as any).objetos);
        toast({
            title: "Versión cargada",
            description: `Se cargó la versión ${version.version}`,
        });
        setDialogoVersionesAbierto(false);
        cargarComentarios(version.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la versión",
        variant: "destructive",
      });
    }
  };

  const duplicarVersion = async (version: EdicionVersion) => {
    try {
      await edicionesImagenesApi.duplicar(version.id);
      toast({
        title: "Versión duplicada",
        description: "Se creó una copia de la versión",
      });
      await cargarVersiones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar la versión",
        variant: "destructive",
      });
    }
  };

  const eliminarVersion = async () => {
    if (!version_a_eliminar) return;

    try {
      await edicionesImagenesApi.eliminar(version_a_eliminar.id);
      toast({
        title: "Versión eliminada",
        description: "La versión se eliminó correctamente",
      });
      setDialogoConfirmarEliminarVersionAbierto(false);
      setVersionAEliminar(null);
      await cargarVersiones();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la versión",
        variant: "destructive",
      });
    }
  };

  const handleCerrar = () => {
      if (tiene_cambios) {
          setDialogoCambiosSinGuardarAbierto(true);
      } else {
          onCerrar();
      }
  };

  const guardarComentario = async () => {
    if (!version_editar) {
        toast({ title: "Error", description: "Debes guardar una versión antes de comentar", variant: "destructive" });
        return;
    }
    
    try {
        if (comentario_editando) {
            const datosActualizar = { ...form_comentario };
            if (posicion_nuevo_comentario) {
                (datosActualizar as any).x = posicion_nuevo_comentario.x;
                (datosActualizar as any).y = posicion_nuevo_comentario.y;
            }

            await edicionesImagenesApi.actualizarComentario(comentario_editando.id, datosActualizar);
            toast({ title: "Comentario actualizado" });
        } else if (posicion_nuevo_comentario) {
            await edicionesImagenesApi.crearComentario(version_editar.id, {
                ...form_comentario,
                x: posicion_nuevo_comentario.x,
                y: posicion_nuevo_comentario.y
            });
            toast({ title: "Comentario agregado" });
        }
        setDialogoComentarioAbierto(false);
        setPosicionNuevoComentario(null);
        setComentarioEditando(null);
        cargarComentarios(version_editar.id);
    } catch (error) {
        toast({ title: "Error", description: "No se pudo guardar el comentario", variant: "destructive" });
    }
  };

  const confirmarEliminarComentario = (id: number) => {
      setComentarioAEliminar(id);
      setDialogoConfirmarEliminarComentario(true);
  }

  const eliminarComentario = async () => {
    if (!comentario_a_eliminar) return;
    try {
        await edicionesImagenesApi.eliminarComentario(comentario_a_eliminar);
        toast({ title: "Comentario eliminado" });
        if (version_editar) cargarComentarios(version_editar.id);
        setComentarioSeleccionado(null);
        setDialogoConfirmarEliminarComentario(false);
        setComentarioAEliminar(null);
    } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el comentario", variant: "destructive" });
    }
  };

  const prepararEdicionComentario = (comentario: ComentarioImagen) => {
      setComentarioEditando(comentario);
      setFormComentario({
          titulo: comentario.titulo,
          contenido: comentario.contenido,
          color: comentario.color
      });
      setPosicionNuevoComentario(null); 
      setDialogoComentarioAbierto(true);
  };

  const iniciarReubicacion = () => {
      setDialogoComentarioAbierto(false);
      setModoReubicacion(true);
      toast({ title: "Modo Reubicación", description: "Haz clic en el nuevo lugar para el comentario." });
  };

  const renderizarObjeto = (obj: ObjetoCanvas, index: number) => {
    if (obj.tipo === "pencil") {
      return (
        <Line
          key={index}
          points={obj.puntos}
          stroke={obj.color}
          strokeWidth={obj.grosor}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          opacity={obj.opacidad}
        />
      );
    }
    if (obj.tipo === "eraser-normal") {
        return (
          <Line
            key={index}
            points={obj.puntos}
            stroke={obj.color}
            strokeWidth={obj.grosor}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="destination-out"
          />
        );
      }

    return null;
  };

  const toggleRotacion = () => {
    setRotacion((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && handleCerrar()}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] h-[90vh] w-[95vw] overflow-hidden flex flex-col p-0 [&>button]:hidden"
        aria-describedby="editor-descripcion"
      >
        <DialogDescription id="editor-descripcion" className="sr-only">
          Editor de imágenes médicas para realizar anotaciones y medidas.
        </DialogDescription>
        <DialogHeader className="p-6 pb-4 border-b bg-background z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-12">
              <DialogTitle className="text-xl">
                {version_editar ? "Editar Versión" : "Editor de Imágenes"}
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {archivo_nombre}
                {version_editar && (
                  <Badge variant="outline">v{version_editar.version}</Badge>
                )}
                {tiene_cambios && (
                    <Badge variant="secondary" className="text-xs">Sin guardar</Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCerrar}
              className="hover:bg-destructive/20 hover:text-destructive flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="w-96 border-r p-4 overflow-y-auto flex-shrink-0 bg-background z-10">
            <Tabs defaultValue="herramientas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="herramientas">Herramientas</TabsTrigger>
                <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
              </TabsList>

              <TabsContent value="herramientas" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Herramientas de Dibujo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        herramienta_actual.tipo === "pencil"
                          ? "default"
                          : "outline"
                      }
                      className="h-10 flex flex-row gap-2 justify-start px-3"
                      onClick={() =>
                        setHerramientaActual({
                          ...herramienta_actual,
                          tipo: "pencil",
                        })
                      }
                      disabled={modo_comentario || modo_reubicacion}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="text-xs">Pincel</span>
                    </Button>
                    <Button
                      variant={(modo_comentario || modo_reubicacion) ? "destructive" : "outline"}
                      className="h-10 flex flex-row gap-2 justify-start px-3"
                      onClick={() => {
                          if (modo_reubicacion) {
                              setModoReubicacion(false);
                              setDialogoComentarioAbierto(true);
                          } else {
                              setModoComentario(!modo_comentario);
                          }
                      }}
                      title={modo_reubicacion ? "Cancelar Reubicación" : "Agregar Comentario"}
                    >
                        {(modo_comentario || modo_reubicacion) ? (
                            <>
                                <X className="h-4 w-4" />
                                <span className="text-xs">Cancelar</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span className="text-xs">Comentario</span>
                            </>
                        )}
                    </Button>
                    <Button
                       variant={
                        herramienta_actual.tipo === "eraser-normal"
                          ? "default"
                          : "outline"
                      }
                      className="h-10 flex flex-row gap-2 justify-start px-3"
                      onClick={() =>
                        setHerramientaActual({
                          ...herramienta_actual,
                          tipo: "eraser-normal",
                        })
                      }
                      disabled={modo_comentario || modo_reubicacion}
                    >
                      <Eraser className="h-4 w-4" />
                      <span className="text-xs">Borrador</span>
                    </Button>
                    <Button
                       variant={
                        herramienta_actual.tipo === "eraser-magic"
                          ? "default"
                          : "outline"
                      }
                      className="h-10 flex flex-row gap-2 justify-start px-3 relative overflow-visible"
                      onClick={() =>
                        setHerramientaActual({
                          ...herramienta_actual,
                          tipo: "eraser-magic",
                        })
                      }
                      disabled={modo_comentario || modo_reubicacion}
                    >
                      <div className="relative">
                        <Eraser className="h-4 w-4" />
                        <Sparkles className="h-3 w-3 absolute -top-1 -right-2 text-yellow-500 fill-yellow-500 animate-pulse" />
                      </div>
                      <span className="text-xs">Mágico</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color del Pincel</Label>
                  <div className="w-full flex justify-center">
                    <HexColorPicker 
                        color={herramienta_actual.color} 
                        onChange={(newColor) =>
                            setHerramientaActual({
                              ...herramienta_actual,
                              color: newColor,
                            })
                          }
                        style={{ width: '100%', height: '160px' }}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                     <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: herramienta_actual.color }} />
                     <Input 
                        value={herramienta_actual.color}
                        onChange={(e) => setHerramientaActual({...herramienta_actual, color: e.target.value})}
                        className="font-mono text-xs"
                     />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="grosor">Grosor</Label>
                        <span className="text-xs text-muted-foreground">{herramienta_actual.grosor}px</span>
                    </div>
                    <Input
                      id="grosor"
                      type="range"
                      min="1"
                      max="50"
                      value={herramienta_actual.grosor}
                      onChange={(e) =>
                        setHerramientaActual({
                          ...herramienta_actual,
                          grosor: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                        <Label htmlFor="opacidad">Opacidad</Label>
                        <span className="text-xs text-muted-foreground">{Math.round(herramienta_actual.opacidad * 100)}%</span>
                    </div>
                    <Input
                      id="opacidad"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={herramienta_actual.opacidad}
                      onChange={(e) =>
                        setHerramientaActual({
                          ...herramienta_actual,
                          opacidad: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comentarios" className="space-y-2">
                 <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Gestiona los comentarios y notas de esta versión.</p>
                 </div>
                {cargando_comentarios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : comentarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay comentarios aún
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-4">
                      {comentarios.map((comentario) => (
                        <div
                          key={comentario.id}
                          className="p-3 border rounded-lg hover:bg-secondary/50 transition-colors space-y-2 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comentario.color }} />
                                    <h4 className="font-semibold text-sm truncate max-w-[120px]" title={comentario.titulo}>{comentario.titulo}</h4>
                                </div>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 hover:text-blue-500"
                                        onClick={() => setComentarioSeleccionado(comentario)}
                                        title="Ver detalle"
                                    >
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 hover:text-primary"
                                        onClick={() => prepararEdicionComentario(comentario)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 hover:text-destructive"
                                        onClick={() => confirmarEliminarComentario(comentario.id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {comentario.contenido}
                            </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b flex items-center justify-between gap-2 bg-background z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deshacer}
                  disabled={historial_deshacer.length === 0 || modo_comentario || modo_reubicacion}
                  title="Deshacer"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rehacer}
                  disabled={historial_rehacer.length === 0 || modo_comentario || modo_reubicacion}
                  title="Rehacer"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  title="Alejar"
                  disabled={zoom <= 0.1}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  title="Acercar"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRotacion}
                  title="Rotar 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={abrirDialogoConfirmarLimpiar}
                  disabled={objetos.length === 0 || modo_comentario || modo_reubicacion}
                  title="Limpiar canvas"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarImagen}
                  title="Exportar imagen"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={abrirDialogoGuardar}
                  title={version_editar ? "Guardar cambios" : "Guardar versión"}
                  disabled={modo_comentario || modo_reubicacion}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-secondary/10 p-4 relative">
              <div className="min-w-full min-h-full flex items-center justify-center">
                <Stage
                  ref={stage_ref}
                  width={
                    (rotacion % 180 === 0
                      ? dimensiones_imagen.ancho
                      : dimensiones_imagen.alto) * zoom
                  }
                  height={
                    (rotacion % 180 === 0
                      ? dimensiones_imagen.alto
                      : dimensiones_imagen.ancho) * zoom
                  }
                  onMouseDown={handleMouseDown}
                  onMousemove={handleMouseMove}
                  onMouseup={handleMouseUp}
                  onMouseEnter={() => setMostrarCursor(true)}
                  onMouseLeave={() => setMostrarCursor(false)}
                  scaleX={zoom}
                  scaleY={zoom}
                  style={{ cursor: 'none' }} 
                  className="border-2 border-border shadow-lg bg-white"
                >
                  <Layer>
                    {imagen_cargada && (
                      <KonvaImage
                        image={imagen_cargada}
                        width={dimensiones_imagen.ancho}
                        height={dimensiones_imagen.alto}
                        rotation={rotacion}
                        x={
                          rotacion === 90
                            ? dimensiones_imagen.alto
                            : rotacion === 180
                              ? dimensiones_imagen.ancho
                              : rotacion === 270
                                ? 0
                                : 0
                        }
                        y={
                          rotacion === 90
                            ? 0
                            : rotacion === 180
                              ? dimensiones_imagen.alto
                              : rotacion === 270
                                ? dimensiones_imagen.ancho
                                : 0
                        }
                      />
                    )}
                  </Layer>
                  <Layer ref={layer_dibujo_ref}>
                    {objetos.map((obj, i) => renderizarObjeto(obj, i))}
                  </Layer>
                  
                  {(modo_comentario || modo_reubicacion || comentarios.length > 0) && (
                      <Layer>
                        {(modo_comentario || modo_reubicacion) && (
                             <Rect
                                x={0}
                                y={0}
                                width={dimensiones_imagen.ancho}
                                height={dimensiones_imagen.alto}
                                fill="black"
                                opacity={0.3}
                                listening={false}
                             />
                        )}
                        {comentarios.map((comentario) => (
                            <Group 
                                key={comentario.id}
                                x={comentario.x} 
                                y={comentario.y}
                                onClick={(e) => {
                                    e.cancelBubble = true;
                                    setComentarioSeleccionado(comentario);
                                }}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) {
                                        stage.container().style.cursor = "pointer";
                                        const pointerPos = stage.getPointerPosition();
                                        if (pointerPos) {
                                            const containerRect = stage.container().getBoundingClientRect();
                                            setHoverInfo({
                                                visible: true,
                                                x: containerRect.left + pointerPos.x,
                                                y: containerRect.top + pointerPos.y,
                                                comentario: comentario
                                            });
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) {
                                        stage.container().style.cursor = "default";
                                    }
                                    setHoverInfo({ ...hover_info, visible: false, comentario: null });
                                }}
                            >
                                <Circle 
                                    radius={12} 
                                    fill={comentario.color} 
                                    shadowColor="black"
                                    shadowBlur={5}
                                    shadowOpacity={0.3}
                                />
                                <Circle radius={10} fill="white" opacity={0.2} />
                                <Text
                                    text="!"
                                    fontSize={14}
                                    fontStyle="bold"
                                    fill="white"
                                    align="center"
                                    verticalAlign="middle"
                                    x={-4}
                                    y={-7}
                                    listening={false}
                                />
                            </Group>
                        ))}
                      </Layer>
                  )}

                  {mostrar_cursor && (
                      <Layer>
                          {(modo_comentario || modo_reubicacion) ? (
                               <Group x={cursor_pos.x} y={cursor_pos.y}>
                                   <Rect 
                                      width={24} height={18} 
                                      cornerRadius={4} 
                                      fill={herramienta_actual.color} 
                                      offsetY={18}
                                      shadowBlur={4} shadowColor="black" shadowOpacity={0.3}
                                   />
                                   <Group y={0} x={4}>
                                        <Line 
                                            points={[0, 0, 8, 8, 16, 0]} 
                                            fill={herramienta_actual.color} 
                                            closed 
                                            offsetY={2}
                                        />
                                   </Group>
                                    <Text text={modo_reubicacion ? "M" : "+"} fontSize={16} fontStyle="bold" fill="white" x={5} y={-16} />
                               </Group>
                          ) : (
                              <Group x={cursor_pos.x} y={cursor_pos.y}>
                                    <Circle 
                                        radius={herramienta_actual.grosor / 2}
                                        stroke="black"
                                        strokeWidth={1}
                                        fill="rgba(255, 255, 255, 0.3)"
                                        listening={false}
                                    />
                                    <Line points={[-5, 0, 5, 0]} stroke="black" strokeWidth={1} />
                                    <Line points={[0, -5, 0, 5]} stroke="black" strokeWidth={1} />
                                </Group>
                          )}
                      </Layer>
                  )}
                </Stage>
              </div>
              
              {hover_info.visible && hover_info.comentario && (
                  <div 
                    style={{ 
                        position: 'fixed', 
                        top: (window.innerHeight - hover_info.y < 200) ? undefined : hover_info.y + 20,
                        bottom: (window.innerHeight - hover_info.y < 200) ? window.innerHeight - hover_info.y + 20 : undefined,
                        left: hover_info.x - 100, 
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                  >
                      <Card className="w-64 shadow-xl border-2 animate-in fade-in zoom-in duration-200">
                          <CardHeader className="p-3 pb-1">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: hover_info.comentario.color }} />
                                  <CardTitle className="text-sm font-bold truncate">{hover_info.comentario.titulo}</CardTitle>
                              </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                              <p className="text-xs text-muted-foreground line-clamp-3">{hover_info.comentario.contenido}</p>
                          </CardContent>
                      </Card>
                  </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <Dialog
        open={dialogo_confirmar_limpiar_abierto}
        onOpenChange={setDialogoConfirmarLimpiarAbierto}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Limpiar Canvas</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas limpiar todo el canvas?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-foreground">
              Se eliminarán todos los objetos dibujados en el canvas. Esta
              acción se puede deshacer usando el botón de "Deshacer".
            </p>
          </div>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Todos los dibujos, líneas y símbolos serán eliminados.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoConfirmarLimpiarAbierto(false)}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={limpiarCanvas}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Limpiar Todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_guardar_abierto}
        onOpenChange={setDialogoGuardarAbierto}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {version_editar ? "Actualizar Versión" : "Guardar Nueva Versión"}
            </DialogTitle>
            <DialogDescription>
              {version_editar
                ? "Actualiza los cambios realizados en esta versión"
                : "Guarda esta edición como una nueva versión"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-version">Nombre (opcional)</Label>
              <Input
                id="nombre-version"
                value={nombre_version}
                onChange={(e) => setNombreVersion(e.target.value)}
                placeholder="Edición 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-version">
                Descripción (opcional)
              </Label>
              <Textarea
                id="descripcion-version"
                value={descripcion_version}
                onChange={(e) => setDescripcionVersion(e.target.value)}
                placeholder="Describe los cambios realizados..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoGuardarAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={guardarVersion} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {version_editar ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogo_cambios_sin_guardar_abierto} onOpenChange={setDialogoCambiosSinGuardarAbierto}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>¿Salir sin guardar?</DialogTitle>
                <DialogDescription>
                    Tienes cambios pendientes que no se han guardado. Si sales ahora, perderás el progreso realizado desde el último guardado.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDialogoCambiosSinGuardarAbierto(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => {
                    setDialogoCambiosSinGuardarAbierto(false);
                    onCerrar();
                }}>Salir sin guardar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_confirmar_eliminar_version_abierto}
        onOpenChange={setDialogoConfirmarEliminarVersionAbierto}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación de Versión</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta versión de edición?
            </DialogDescription>
          </DialogHeader>

          {version_a_eliminar && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">v{version_a_eliminar.version}</Badge>
                <p className="font-semibold text-foreground">
                  {version_a_eliminar.nombre ||
                    `Versión ${version_a_eliminar.version}`}
                </p>
              </div>
              {version_a_eliminar.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {version_a_eliminar.descripcion}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Por {version_a_eliminar.usuario.nombre} •{" "}
                {new Date(version_a_eliminar.fecha_creacion).toLocaleString(
                  "es-BO"
                )}
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoConfirmarEliminarVersionAbierto(false);
                setVersionAEliminar(null);
              }}
              className="hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarVersion}
              className="hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 transition-all duration-200"
            >
              Eliminar Versión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_confirmar_eliminar_comentario}
        onOpenChange={setDialogoConfirmarEliminarComentario}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Comentario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoConfirmarEliminarComentario(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminarComentario}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo_versiones_abierto}
        onOpenChange={setDialogoVersionesAbierto}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Versiones Guardadas</DialogTitle>
            <DialogDescription>
              Gestiona las versiones de edición de esta imagen
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {cargando_versiones ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : versiones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No hay versiones guardadas
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {versiones.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{version.version}</Badge>
                          <h4 className="font-semibold">
                            {version.nombre || `Versión ${version.version}`}
                          </h4>
                        </div>
                        {version.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Por {version.usuario.nombre} •{" "}
                          {new Date(version.fecha_creacion).toLocaleString(
                            "es-BO"
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cargarVersion(version)}
                          title="Cargar versión"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicarVersion(version)}
                          title="Duplicar versión"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            abrirDialogoConfirmarEliminarVersion(version)
                          }
                          className="hover:bg-destructive/20 hover:text-destructive"
                          title="Eliminar versión"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogo_comentario_abierto} onOpenChange={setDialogoComentarioAbierto}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{comentario_editando ? "Editar Comentario" : "Nuevo Comentario"}</DialogTitle>
                  <DialogDescription>
                      Agrega notas y observaciones en este punto específico.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="space-y-2">
                      <Label htmlFor="titulo-comentario">Título</Label>
                      <Input 
                          id="titulo-comentario"
                          value={form_comentario.titulo}
                          onChange={(e) => setFormComentario({...form_comentario, titulo: e.target.value})}
                          placeholder="Ej. Caries visible"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="contenido-comentario">Contenido</Label>
                      <Textarea 
                          id="contenido-comentario"
                          value={form_comentario.contenido}
                          onChange={(e) => setFormComentario({...form_comentario, contenido: e.target.value})}
                          placeholder="Detalles adicionales..."
                      />
                  </div>
                  <div className="space-y-3">
                      <Label>Color del marcador</Label>
                      <div className="w-full flex justify-center">
                        <HexColorPicker 
                            color={form_comentario.color} 
                            onChange={(newColor) =>
                                setFormComentario({
                                  ...form_comentario,
                                  color: newColor,
                                })
                              }
                            style={{ width: '100%', height: '100px' }}
                        />
                      </div>
                      <div className="flex gap-2 items-center mt-2">
                         <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: form_comentario.color }} />
                         <Input 
                            value={form_comentario.color}
                            onChange={(e) => setFormComentario({...form_comentario, color: e.target.value})}
                            className="font-mono text-xs"
                         />
                      </div>
                  </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                  {comentario_editando && (
                      <Button 
                        variant="secondary" 
                        className="sm:mr-auto"
                        onClick={iniciarReubicacion}
                      >
                          <Move className="h-4 w-4 mr-2" />
                          Reubicar
                      </Button>
                  )}
                  <div className="flex gap-2 justify-end w-full sm:w-auto">
                      <Button variant="outline" onClick={() => setDialogoComentarioAbierto(false)}>Cancelar</Button>
                      <Button onClick={guardarComentario}>
                          {comentario_editando ? "Actualizar" : "Guardar Comentario"}
                      </Button>
                  </div>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {comentario_seleccionado && (
          <Dialog open={!!comentario_seleccionado} onOpenChange={(open) => !open && setComentarioSeleccionado(null)}>
              <DialogContent className="max-w-md">
                  <DialogHeader>
                      <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: comentario_seleccionado.color }} />
                          <DialogTitle>{comentario_seleccionado.titulo}</DialogTitle>
                      </div>
                      <DialogDescription>
                        Creado por {comentario_seleccionado.usuario?.nombre} • {new Date(comentario_seleccionado.fecha_creacion).toLocaleDateString()}
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                      <p className="text-foreground whitespace-pre-wrap">{comentario_seleccionado.contenido}</p>
                  </div>
                  <DialogFooter className="sm:justify-between">
                       <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => confirmarEliminarComentario(comentario_seleccionado.id)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                       <div className="flex gap-2">
                           <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    setComentarioSeleccionado(null);
                                    prepararEdicionComentario(comentario_seleccionado);
                                }}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </Button>
                           <Button onClick={() => setComentarioSeleccionado(null)}>
                                <Check className="h-4 w-4 mr-2" />
                                Entendido
                           </Button>
                       </div>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

    </Dialog>
  );
}