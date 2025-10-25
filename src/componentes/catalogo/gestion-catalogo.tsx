import { useState } from 'react';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Textarea } from '@/componentes/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/componentes/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { Edit, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ItemCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
}

interface GestionCatalogoProps {
  titulo: string;
  items: ItemCatalogo[];
  cargando: boolean;
  onCrear: (datos: any) => Promise<void>;
  onActualizar?: (id: number, datos: any) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  onRecargar: () => Promise<void>;
  permitirColor?: boolean;
  icono?: React.ReactNode;
}

export function GestionCatalogo({
  titulo,
  items,
  cargando,
  onCrear,
  onActualizar,
  onEliminar,
  onRecargar,
  permitirColor = false,
  icono,
}: GestionCatalogoProps) {
  const [dialogo_crear_abierto, setDialogoCrearAbierto] = useState(false);
  const [dialogo_editar_abierto, setDialogoEditarAbierto] = useState(false);
  const [item_editar, setItemEditar] = useState<ItemCatalogo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dialogo_confirmar_eliminar_abierto, setDialogoConfirmarEliminarAbierto] = useState(false);
  const [item_a_eliminar, setItemAEliminar] = useState<{ id: number; nombre: string } | null>(null);

  const abrirDialogoConfirmarEliminar = (id: number, nombre: string) => {
    setItemAEliminar({ id, nombre });
    setDialogoConfirmarEliminarAbierto(true);
  };
  
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    color: '#808080',
  });

  const reiniciarFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      color: '#808080',
    });
  };

  const manejarCrear = async () => {
    if (!formulario.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = { nombre: formulario.nombre.trim() };
      
      if (formulario.descripcion.trim()) {
        datos.descripcion = formulario.descripcion.trim();
      }
      
      if (permitirColor) {
        datos.color = formulario.color;
      }

      await onCrear(datos);
      toast({
        title: 'Éxito',
        description: `${titulo} creado correctamente`,
      });
      setDialogoCrearAbierto(false);
      reiniciarFormulario();
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo crear el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const manejarEditar = async () => {
    if (!item_editar || !onActualizar) return;
    
    if (!formulario.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    setGuardando(true);
    try {
      const datos: any = { nombre: formulario.nombre.trim() };
      
      if (formulario.descripcion.trim()) {
        datos.descripcion = formulario.descripcion.trim();
      }
      
      if (permitirColor) {
        datos.color = formulario.color;
      }

      await onActualizar(item_editar.id, datos);
      toast({
        title: 'Éxito',
        description: `${titulo} actualizado correctamente`,
      });
      setDialogoEditarAbierto(false);
      setItemEditar(null);
      reiniciarFormulario();
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo actualizar el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirDialogoEditar = (item: ItemCatalogo) => {
    setItemEditar(item);
    setFormulario({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      color: item.color || '#808080',
    });
    setDialogoEditarAbierto(true);
  };

  const manejarEliminar = async () => {
    if (!item_a_eliminar) return;

    try {
      await onEliminar(item_a_eliminar.id);
      toast({
        title: 'Éxito',
        description: `${titulo} eliminado correctamente`,
      });
      setDialogoConfirmarEliminarAbierto(false);
      setItemAEliminar(null);
      await onRecargar();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || `No se pudo eliminar el ${titulo.toLowerCase()}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icono && (
            <div className="bg-primary/10 p-2 rounded-lg hover:scale-110 transition-transform duration-200">
              {icono}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground">{items.length} registros</p>
          </div>
        </div>
        <Button
          onClick={() => {
            reiniciarFormulario();
            setDialogoCrearAbierto(true);
          }}
          size="sm"
          className="hover:scale-105 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No hay registros</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {items.map((item) => (
            <AccordionItem key={item.id} value={`item-${item.id}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  {permitirColor && item.color && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="text-left font-medium">{item.nombre}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {item.descripcion && (
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {onActualizar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirDialogoEditar(item)}
                        className="hover:bg-primary/20 hover:text-primary transition-all duration-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirDialogoConfirmarEliminar(item.id, item.nombre)}
                      className="hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={dialogo_confirmar_eliminar_abierto} onOpenChange={setDialogoConfirmarEliminarAbierto}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogDescription>
        ¿Estás seguro de que deseas eliminar este elemento?
      </DialogDescription>
    </DialogHeader>
    
    {item_a_eliminar && (
      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
        <p className="font-semibold text-foreground">"{item_a_eliminar.nombre}"</p>
        <p className="text-sm text-muted-foreground mt-1">{titulo}</p>
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
          setDialogoConfirmarEliminarAbierto(false);
          setItemAEliminar(null);
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
        Eliminar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <Dialog open={dialogo_crear_abierto} onOpenChange={setDialogoCrearAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar {titulo}</DialogTitle>
            <DialogDescription>
              Completa la información para crear un nuevo registro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-crear">Nombre *</Label>
              <Input
                id="nombre-crear"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej: Penicilina, Diabetes, etc."
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-crear">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-crear"
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                placeholder="Agrega detalles adicionales..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {permitirColor && (
              <div className="space-y-2">
                <Label htmlFor="color-crear">Color *</Label>
                <div className="flex gap-3">
                  <Input
                    id="color-crear"
                    type="color"
                    value={formulario.color}
                    onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                    className="h-10 w-20 cursor-pointer hover:scale-105 transition-all duration-200"
                  />
                  <Input
                    type="text"
                    value={formulario.color}
                    onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                    placeholder="#808080"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoCrearAbierto(false);
                reiniciarFormulario();
              }}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={manejarCrear} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo_editar_abierto} onOpenChange={setDialogoEditarAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar {titulo}</DialogTitle>
            <DialogDescription>
              Modifica la información del registro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-editar">Nombre *</Label>
              <Input
                id="nombre-editar"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej: Penicilina, Diabetes, etc."
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion-editar">Descripción (opcional)</Label>
              <Textarea
                id="descripcion-editar"
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                placeholder="Agrega detalles adicionales..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            {permitirColor && (
              <div className="space-y-2">
                <Label htmlFor="color-editar">Color *</Label>
                <div className="flex gap-3">
                  <Input
                    id="color-editar"
                    type="color"
                    value={formulario.color}
                    onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                    className="h-10 w-20 cursor-pointer hover:scale-105 transition-all duration-200"
                  />
                  <Input
                    type="text"
                    value={formulario.color}
                    onChange={(e) => setFormulario({ ...formulario, color: e.target.value })}
                    placeholder="#808080"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoEditarAbierto(false);
                setItemEditar(null);
                reiniciarFormulario();
              }}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={manejarEditar} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}