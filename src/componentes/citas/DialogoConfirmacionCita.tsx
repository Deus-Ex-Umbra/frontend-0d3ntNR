import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { Loader2, Package, Wrench, AlertTriangle, DollarSign, AlertCircle } from 'lucide-react';
import WizardConsumibles from '../materiales/wizard-consumibles';
import WizardActivosFijos from '../materiales/wizard-activos-fijos';
import { Inventario, Producto } from '@/tipos';

interface DialogoConfirmacionCitaProps {
  abierto: boolean;
  onCerrar: () => void;
  estadoPago: string;
  setEstadoPago: (estado: string) => void;
  monto: string;
  setMonto: (monto: string) => void;
  consumibles: any[];
  setConsumibles: (consumibles: any[]) => void;
  activos: any[];
  setActivos: (activos: any[]) => void;
  inventarios: Inventario[];
  productosPorInventario: Record<number, Producto[]>;
  cargarProductosInventario: (id: number) => Promise<void>;
  cargandoMateriales: boolean;
  guardando: boolean;
  manejarConfirmar: () => void;
  fechaCita: Date;
  opcionesEstadosPago: { valor: string; etiqueta: string }[];
}

export default function DialogoConfirmacionCita({
  abierto,
  onCerrar,
  estadoPago,
  setEstadoPago,
  monto,
  setMonto,
  consumibles,
  setConsumibles,
  activos,
  setActivos,
  inventarios,
  productosPorInventario,
  cargarProductosInventario,
  cargandoMateriales,
  guardando,
  manejarConfirmar,
  fechaCita,
  opcionesEstadosPago
}: DialogoConfirmacionCitaProps) {

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirmar Cita Realizada</DialogTitle>
          <DialogDescription>
            Confirma el estado de pago, monto y materiales realmente utilizados en esta cita
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Esta acción registrará el estado final de la cita, consumo de materiales y actualizará el inventario
          </p>
        </div>

        <Tabs defaultValue="datos" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="datos" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Datos de Cierre
            </TabsTrigger>
            <TabsTrigger value="recursos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Recursos Utilizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="flex-1 overflow-y-auto">
            <div className="border rounded-lg p-4 space-y-3 bg-blue-500/5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estado de Pago y Monto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Pago</Label>
                  <Combobox
                    opciones={opcionesEstadosPago.map(e => ({ valor: e.valor, etiqueta: e.etiqueta }))}
                    valor={estadoPago}
                    onChange={setEstadoPago}
                    placeholder="Selecciona estado"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto Final (Bs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recursos" className="flex-1 overflow-y-auto flex flex-col">
            {cargandoMateriales ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="consumibles" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="consumibles" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Consumibles
                    {consumibles.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {consumibles.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activos" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Activos Fijos
                    {activos.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activos.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="consumibles" className="space-y-4">
                  <WizardConsumibles
                    inventarios={inventarios}
                    productos_por_inventario={productosPorInventario}
                    cargarProductos={cargarProductosInventario}
                    materialesSeleccionados={consumibles}
                    onAgregarMaterial={(material) => setConsumibles([...consumibles, material])}
                    onEliminarMaterial={(idx) => setConsumibles(consumibles.filter((_, i) => i !== idx))}
                    onActualizarCantidad={(idx, cantidad) => {
                      const nuevos = [...consumibles];
                      nuevos[idx] = { ...nuevos[idx], cantidad };
                      setConsumibles(nuevos);
                    }}
                    readOnly={false}
                  />
                </TabsContent>

                <TabsContent value="activos" className="space-y-4">
                  <WizardActivosFijos
                    inventarios={inventarios}
                    productos_por_inventario={productosPorInventario}
                    cargarProductos={cargarProductosInventario}
                    activosSeleccionados={activos}
                    onAgregarActivo={(activo) => setActivos([...activos, activo])}
                    onEliminarActivo={(idx) => setActivos(activos.filter((_, i) => i !== idx))}
                    fecha_cita={fechaCita}
                    readOnly={true}
                  />
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      Los activos fijos se liberarán automáticamente al confirmar la cita.
                    </p>
                  </div>
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
          >
            Cancelar
          </Button>
          <Button
            onClick={manejarConfirmar}
            disabled={guardando}
            className="bg-green-600 hover:bg-green-700"
          >
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cita y Materiales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
