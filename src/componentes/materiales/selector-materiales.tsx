import { Package, Trash2, Plus } from 'lucide-react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
import { Inventario, Producto } from '@/tipos';
import { MaterialCita, MaterialGeneral } from '@/tipos/material';

interface SelectorMaterialesProps {
  inventarios: Inventario[];
  productos_por_inventario: Record<number, Producto[]>;
  materiales: (MaterialCita | MaterialGeneral)[];
  cargarProductos: (inventario_id: number) => Promise<void>;
  onAgregarMaterial: () => void;
  onEliminarMaterial: (material_index: number) => void;
  onActualizarMaterial: (material_index: number, campo: string, valor: any) => void;
  onAgregarItem: (material_index: number) => void;
  onEliminarItem: (material_index: number, item_index: number) => void;
  onActualizarItem: (material_index: number, item_index: number, campo: string, valor: any) => void;
  texto_boton_agregar?: string;
  cargando?: boolean;
}

interface MaterialesAgrupadosPorInventario {
  inventario_id: number;
  inventario_nombre: string;
  materiales_indices: number[];
}

export default function SelectorMateriales({
  inventarios,
  productos_por_inventario,
  materiales,
  cargarProductos,
  onAgregarMaterial,
  onEliminarMaterial,
  onActualizarMaterial,
  onAgregarItem,
  onEliminarItem,
  onActualizarItem,
  texto_boton_agregar = 'Agregar Material',
  cargando = false,
}: SelectorMaterialesProps) {
  
  const agregarProductoAlInventario = (inventario_id: number) => {
    onAgregarMaterial();
    setTimeout(() => {
      const nuevo_indice = materiales.length;
      onActualizarMaterial(nuevo_indice, 'inventario_id', inventario_id);
      cargarProductos(inventario_id);
    }, 0);
  };
  
  const inventarios_seleccionados = new Set(
    materiales
      .map(m => m.inventario_id)
      .filter(id => id && id > 0)
  );
  const inventarios_disponibles = inventarios.filter(
    inv => !inventarios_seleccionados.has(inv.id)
  );
  
  const agruparMaterialesPorInventario = (): MaterialesAgrupadosPorInventario[] => {
    const grupos: Record<number, MaterialesAgrupadosPorInventario> = {};
    
    materiales.forEach((material, index) => {
      const inv_id = material.inventario_id || 0;
      
      if (!grupos[inv_id]) {
        grupos[inv_id] = {
          inventario_id: inv_id,
          inventario_nombre: material.inventario_nombre || 'Sin inventario',
          materiales_indices: [],
        };
      }
      
      grupos[inv_id].materiales_indices.push(index);
    });
    
    return Object.values(grupos).sort((a, b) => {
      if (a.inventario_id === 0) return 1;
      if (b.inventario_id === 0) return -1;
      return a.inventario_nombre.localeCompare(b.inventario_nombre);
    });
  };
  
  const obtenerProductosSeleccionados = (inventario_id: number): Set<number> => {
    return new Set(
      materiales
        .filter(m => m.inventario_id === inventario_id)
        .map(m => m.producto_id)
        .filter(id => id && id > 0)
    );
  };
  
  const obtenerItemsSeleccionados = (material_idx: number): Set<number> => {
    const material = materiales[material_idx];
    const ids = new Set<number>();
    
    material.items.forEach(item => {
      if (item.lote_id) ids.add(item.lote_id);
      if (item.activo_id) ids.add(item.activo_id);
    });
    
    return ids;
  };

  const materiales_agrupados = agruparMaterialesPorInventario();

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={onAgregarMaterial}
        disabled={cargando || inventarios_disponibles.length === 0}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {inventarios_disponibles.length === 0 ? 'Todos los inventarios seleccionados' : 'Agregar Inventario'}
      </Button>
      {materiales_agrupados.map((grupo) => {
        const productos_seleccionados = obtenerProductosSeleccionados(grupo.inventario_id);
        const productos = productos_por_inventario[grupo.inventario_id] || [];
        const productos_disponibles = productos.filter(p => !productos_seleccionados.has(p.id));
        
        return (
          <Card key={grupo.inventario_id} className="p-4 space-y-4 border-2 border-primary/20">
            {}
            <div className="space-y-3">
              {}
              {grupo.inventario_id === 0 && grupo.materiales_indices.length === 1 && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-primary">Inventario *</Label>
                  <div className="flex gap-2">
                    <Combobox
                      opciones={inventarios_disponibles.map(inv => ({
                        valor: inv.id.toString(),
                        etiqueta: inv.nombre
                      }))}
                      valor=""
                      onChange={async (valor) => {
                        const nuevo_inventario_id = parseInt(valor);
                        const material_idx = grupo.materiales_indices[0];
                        onActualizarMaterial(material_idx, 'inventario_id', nuevo_inventario_id);
                        if (nuevo_inventario_id > 0) {
                          await cargarProductos(nuevo_inventario_id);
                        }
                      }}
                      placeholder="Selecciona un inventario"
                      disabled={cargando}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onEliminarMaterial(grupo.materiales_indices[0])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {}
              {grupo.inventario_id !== 0 && (
                <div className="flex items-center justify-between pb-3 border-b-2 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg text-primary">
                      {grupo.inventario_nombre}
                    </span>
                    <Badge variant="secondary" className="font-semibold">
                      {grupo.materiales_indices.length} {grupo.materiales_indices.length === 1 ? 'producto' : 'productos'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => agregarProductoAlInventario(grupo.inventario_id)}
                      disabled={cargando || productos_disponibles.length === 0}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {productos_disponibles.length === 0 ? 'Sin productos disponibles' : 'Agregar Producto'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        grupo.materiales_indices.forEach(idx => onEliminarMaterial(idx));
                      }}
                      className="h-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {}
            {grupo.inventario_id !== 0 && (
              <div className="space-y-3 ml-6 border-l-2 border-primary/30 pl-4">
                {grupo.materiales_indices.map((material_idx) => {
                  const material = materiales[material_idx];
                  const producto = productos.find(p => p.id === material.producto_id);
                  const items_seleccionados = obtenerItemsSeleccionados(material_idx);

                  return (
                    <Card key={material_idx} className="p-3 space-y-3 bg-muted/50 border-l-4 border-l-primary/40">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className="text-sm font-semibold">Producto *</Label>
                          <Combobox
                            opciones={productos_disponibles
                              .concat(producto ? [producto] : [])
                              .map(prod => ({
                                valor: prod.id.toString(),
                                etiqueta: `${prod.nombre} (${prod.tipo_gestion === 'consumible' ? 'Consumible' : prod.tipo_gestion === 'activo_serializado' ? 'Serializado' : 'General'})`
                              }))}
                            valor={material.producto_id > 0 ? material.producto_id.toString() : undefined}
                            onChange={(valor) => onActualizarMaterial(material_idx, 'producto_id', parseInt(valor))}
                            placeholder="Selecciona un producto"
                            disabled={cargando}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onEliminarMaterial(material_idx)}
                          className="mt-7"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {material.producto_id > 0 && producto && (
                        <div className="space-y-2 ml-6 border-l-2 border-muted-foreground/30 pl-4">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            {producto.tipo_gestion === 'consumible' ? '📦 Lotes' : 
                             producto.tipo_gestion === 'activo_serializado' ? '🔧 Activos Serializados' : 
                             '⚙️ Activos Generales'}
                          </Label>

                          {material.items.map((item, item_idx) => {
                            const item_actual_id = item.lote_id || item.activo_id;
                            
                            return (
                              <div key={item_idx} className="flex items-start gap-2 p-2 bg-background rounded border">
                                {producto.tipo_gestion === 'consumible' && (
                                  <>
                                    <div className="flex-1 space-y-1">
                                      <Label className="text-xs">Lote</Label>
                                      <Combobox
                                        opciones={(producto.lotes || [])
                                          .filter(lote => !items_seleccionados.has(lote.id) || lote.id === item_actual_id)
                                          .map(lote => ({
                                            valor: lote.id.toString(),
                                            etiqueta: `${lote.nro_lote} (Stock: ${lote.cantidad_actual} ${producto.unidad_medida})`
                                          }))}
                                        valor={item.lote_id?.toString() || ""}
                                        onChange={(valor) => onActualizarItem(material_idx, item_idx, 'lote_id', parseInt(valor))}
                                        placeholder="Selecciona lote"
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div className="w-24 space-y-1">
                                      <Label className="text-xs">Cantidad de {producto.unidad_medida || 'unidades'}</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={'cantidad_planeada' in item ? item.cantidad_planeada : ('cantidad_por_cita' in item ? item.cantidad_por_cita : 1)}
                                        onChange={(e) => {
                                          const campo = 'cantidad_planeada' in item ? 'cantidad_planeada' : 'cantidad_por_cita';
                                          onActualizarItem(material_idx, item_idx, campo, parseInt(e.target.value) || 1);
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </>
                                )}

                                {producto.tipo_gestion === 'activo_serializado' && (
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Activo Serializado (Reserva)</Label>
                                    <Combobox
                                      opciones={(producto.activos || [])
                                        .filter(a => a.estado === 'disponible')
                                        .filter(activo => !items_seleccionados.has(activo.id) || activo.id === item_actual_id)
                                        .map(activo => ({
                                          valor: activo.id.toString(),
                                          etiqueta: `N° ${activo.nro_serie}`
                                        }))}
                                      valor={item.activo_id?.toString() || ""}
                                      onChange={(valor) => onActualizarItem(material_idx, item_idx, 'activo_id', parseInt(valor))}
                                      placeholder="Selecciona activo"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}

                                {producto.tipo_gestion === 'activo_general' && (
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Activo General (Reserva)</Label>
                                    <Combobox
                                      opciones={(producto.activos || [])
                                        .filter(a => a.estado === 'disponible')
                                        .filter(activo => !items_seleccionados.has(activo.id) || activo.id === item_actual_id)
                                        .map(activo => ({
                                          valor: activo.id.toString(),
                                          etiqueta: activo.nombre_asignado || `Activo ${activo.id}`
                                        }))}
                                      valor={item.activo_id?.toString() || ""}
                                      onChange={(valor) => onActualizarItem(material_idx, item_idx, 'activo_id', parseInt(valor))}
                                      placeholder="Selecciona activo"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                )}
                                
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEliminarItem(material_idx, item_idx)}
                                  className="h-8 w-8 p-0 mt-5"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onAgregarItem(material_idx)}
                            className="w-full h-8 text-xs"
                            disabled={
                              producto.tipo_gestion === 'consumible' 
                                ? (producto.lotes?.filter(l => !items_seleccionados.has(l.id)).length || 0) === 0
                                : (producto.activos?.filter(a => a.estado === 'disponible' && !items_seleccionados.has(a.id)).length || 0) === 0
                            }
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar {producto.tipo_gestion === 'consumible' ? 'Lote' : 'Activo'}
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {materiales.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay materiales agregados</p>
          <p className="text-xs">Haz clic en "{texto_boton_agregar}" para comenzar</p>
        </div>
      )}
    </div>
  );
}