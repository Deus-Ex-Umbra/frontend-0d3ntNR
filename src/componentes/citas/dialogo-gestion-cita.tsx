import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { DateTimePicker } from '../ui/date-time-picker';
import { Loader2, Calendar, Package2, Package, Wrench, AlertTriangle } from 'lucide-react';
import WizardConsumibles from '../materiales/wizard-consumibles';
import WizardActivosFijos from '../materiales/wizard-activos-fijos';
import { Inventario, Producto, Paciente } from '@/tipos';

interface DialogoGestionCitaProps {
  abierto: boolean;
  onCerrar: () => void;
  modoEdicion: boolean;
  esCitaPasadaEdicion: boolean;
  formulario: {
    paciente_id: string;
    fecha: Date | undefined;
    descripcion: string;
    estado_pago: string;
    monto_esperado: string;
    horas_aproximadas: string;
    minutos_aproximados: string;
  };
  setFormulario: (formulario: any) => void;
  pacientes: Paciente[];
  inventarios: Inventario[];
  productosPorInventario: Record<number, Producto[]>;
  cargarInventarios: () => Promise<void>;
  cargarProductosInventario: (id: number) => Promise<void>;
  consumiblesSeleccionados: any[];
  setConsumiblesSeleccionados: (consumibles: any[]) => void;
  activosSeleccionados: any[];
  setActivosSeleccionados: (activos: any[]) => void;
  guardando: boolean;
  hayCambios: boolean;
  manejarGuardar: () => void;
  opcionesEstadosPago: { valor: string; etiqueta: string }[];
  pacienteDeshabilitado?: boolean;
}

export default function DialogoGestionCita({
  abierto,
  onCerrar,
  modoEdicion,
  esCitaPasadaEdicion,
  formulario,
  setFormulario,
  pacientes,
  inventarios,
  productosPorInventario,
  cargarInventarios,
  cargarProductosInventario,
  consumiblesSeleccionados,
  setConsumiblesSeleccionados,
  activosSeleccionados,
  setActivosSeleccionados,
  guardando,
  hayCambios,
  manejarGuardar,
  opcionesEstadosPago,
  pacienteDeshabilitado = false
}: DialogoGestionCitaProps) {

  const opciones_pacientes = [
    { valor: '', etiqueta: 'Evento general (sin paciente)' },
    ...pacientes.map(p => ({
      valor: p.id.toString(),
      etiqueta: `${p.nombre} ${p.apellidos}`
    }))
  ];

  const tiene_paciente = formulario.paciente_id !== '';

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {modoEdicion ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
          <DialogDescription>
            {modoEdicion
              ? (esCitaPasadaEdicion
                ? 'Editando cita pasada o confirmada: solo puedes modificar monto y estado de pago'
                : 'Modifica los detalles de la cita')
              : 'Programa una nueva cita o evento'}
          </DialogDescription>
        </DialogHeader>

        {esCitaPasadaEdicion && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Esta cita está ocurriendo, ya finalizó o fue confirmada. Los recursos están en modo lectura.
            </p>
          </div>
        )}

        <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="datos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Datos de la Cita
            </TabsTrigger>
            <TabsTrigger
              value="recursos"
              disabled={!formulario.paciente_id}
              className="flex items-center gap-2"
            >
              <Package2 className="h-4 w-4" />
              Recursos
              {(consumiblesSeleccionados.length + activosSeleccionados.length) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {consumiblesSeleccionados.length + activosSeleccionados.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="flex-1 overflow-y-auto px-1 space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="paciente">Paciente (opcional)</Label>
              <Combobox
                opciones={opciones_pacientes}
                valor={formulario.paciente_id}
                onChange={(valor) => setFormulario({ ...formulario, paciente_id: valor })}
                placeholder="Selecciona un paciente"
                disabled={esCitaPasadaEdicion || pacienteDeshabilitado}
              />
              <p className="text-xs text-muted-foreground">
                Si no seleccionas un paciente, será un evento general sin estado ni monto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha y Hora *</Label>
              {esCitaPasadaEdicion ? (
                <Input
                  value={formulario.fecha ? formulario.fecha.toLocaleString('es-BO') : ''}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <DateTimePicker
                  valor={formulario.fecha}
                  onChange={(fecha) => setFormulario({ ...formulario, fecha })}
                  placeholder="Selecciona fecha y hora"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                placeholder="Ej: Consulta general, Limpieza dental, Reunión..."
                rows={3}
                className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                disabled={esCitaPasadaEdicion}
              />
            </div>

            <div className="space-y-2">
              <Label>Duración Aproximada</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horas_aproximadas" className="text-xs text-muted-foreground">
                    Horas
                  </Label>
                  <Input
                    id="horas_aproximadas"
                    type="number"
                    min="0"
                    value={formulario.horas_aproximadas}
                    onChange={(e) => setFormulario({ ...formulario, horas_aproximadas: e.target.value })}
                    placeholder="0"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    disabled={esCitaPasadaEdicion}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minutos_aproximados" className="text-xs text-muted-foreground">
                    Minutos
                  </Label>
                  <Input
                    id="minutos_aproximados"
                    type="number"
                    min="1"
                    value={formulario.minutos_aproximados}
                    onChange={(e) => setFormulario({ ...formulario, minutos_aproximados: e.target.value })}
                    placeholder="30"
                    className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    disabled={esCitaPasadaEdicion}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo estimado de la cita (para validación de conflictos de horario)
              </p>
            </div>

            {tiene_paciente && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado_pago">Estado de Pago</Label>
                    <Combobox
                      opciones={opcionesEstadosPago.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))}
                      valor={formulario.estado_pago}
                      onChange={(valor) => setFormulario({ ...formulario, estado_pago: valor })}
                      placeholder="Estado"
                      disabled={!modoEdicion}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monto_esperado">Monto Esperado (Bs.)</Label>
                    <Input
                      id="monto_esperado"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formulario.monto_esperado}
                      onChange={(e) => setFormulario({ ...formulario, monto_esperado: e.target.value })}
                      onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                      placeholder="0.00"
                      className="hover:border-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent
            value="recursos"
            className="flex-1 overflow-y-auto px-1 space-y-4 mt-4"
            onFocus={async () => {
              if (inventarios.length === 0) {
                await cargarInventarios();
              }
            }}
          >
            {!formulario.paciente_id ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Paciente requerido
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Debes seleccionar un paciente en la pestaña "Datos" para poder asignar recursos a esta cita.
                  </p>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="consumibles" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="consumibles" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Consumibles
                    {consumiblesSeleccionados.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {consumiblesSeleccionados.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activos" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Activos Fijos
                    {activosSeleccionados.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activosSeleccionados.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="consumibles" className="flex-1 overflow-y-auto mt-4">
                  <WizardConsumibles
                    inventarios={inventarios}
                    productos_por_inventario={productosPorInventario}
                    cargarProductos={cargarProductosInventario}
                    materialesSeleccionados={consumiblesSeleccionados}
                    onAgregarMaterial={(material) => setConsumiblesSeleccionados([...consumiblesSeleccionados, material])}
                    onEliminarMaterial={(idx) => setConsumiblesSeleccionados(consumiblesSeleccionados.filter((_, i) => i !== idx))}
                    onActualizarCantidad={(idx, cantidad) => {
                      const nuevos = [...consumiblesSeleccionados];
                      nuevos[idx] = { ...nuevos[idx], cantidad };
                      setConsumiblesSeleccionados(nuevos);
                    }}
                    readOnly={esCitaPasadaEdicion}
                  />
                </TabsContent>

                <TabsContent value="activos" className="flex-1 overflow-y-auto mt-4">
                  <WizardActivosFijos
                    inventarios={inventarios}
                    productos_por_inventario={productosPorInventario}
                    cargarProductos={cargarProductosInventario}
                    activosSeleccionados={activosSeleccionados}
                    onAgregarActivo={(activo) => setActivosSeleccionados([...activosSeleccionados, activo])}
                    onEliminarActivo={(idx) => setActivosSeleccionados(activosSeleccionados.filter((_, i) => i !== idx))}
                    fecha_cita={formulario.fecha}
                    readOnly={esCitaPasadaEdicion}
                  />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCerrar}
            disabled={guardando}
            className="hover:scale-105 transition-all duration-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={manejarGuardar}
            disabled={guardando || (modoEdicion && !hayCambios)}
            className="hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
          >
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modoEdicion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
