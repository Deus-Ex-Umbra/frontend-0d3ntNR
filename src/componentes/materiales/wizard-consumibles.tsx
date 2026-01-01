import { useState } from 'react';
import { ChevronRight, Search, Package, ArrowLeft, Check, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Inventario, Producto, Material, TipoProducto } from '@/tipos';

interface MaterialSeleccionado {
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    material_id: number;
    nro_lote?: string;
    cantidad: number;
    stock_disponible: number;
    unidad_medida?: string;
    permite_decimales?: boolean;
    material_cita_id?: number;
}

interface WizardConsumiblesProps {
    inventarios: Inventario[];
    productos_por_inventario: Record<number, Producto[]>;
    cargarProductos: (inventario_id: number) => Promise<void>;
    materialesSeleccionados: MaterialSeleccionado[];
    onAgregarMaterial: (material: MaterialSeleccionado) => void;
    onEliminarMaterial: (index: number) => void;
    onActualizarCantidad: (index: number, cantidad: number) => void;
    readOnly?: boolean;
}

type PasoWizard = 'lista' | 'inventario' | 'producto' | 'material';

interface EstadoWizard {
    paso: PasoWizard;
    inventario?: Inventario;
    producto?: Producto;
    material?: Material;
}

const formatearFechaCorta = (fecha: Date | string): string => {
    const f = new Date(fecha);
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();
    return `${dia}/${mes}/${anio}`;
};

export default function WizardConsumibles({
    inventarios,
    productos_por_inventario,
    cargarProductos,
    materialesSeleccionados,
    onAgregarMaterial,
    onEliminarMaterial,
    onActualizarCantidad,
    readOnly = false,
}: WizardConsumiblesProps) {
    const [estado, setEstado] = useState<EstadoWizard>({ paso: 'lista' });
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(false);
    const [cargandoInventario, setCargandoInventario] = useState(false);
    const [cargandoMaterial, setCargandoMaterial] = useState(false);
    const inventarios_consumibles = inventarios.filter(inv => {
        const productos = productos_por_inventario[inv.id] || [];
        return productos.some(p => p.tipo === TipoProducto.MATERIAL) || productos.length === 0;
    });
    const productos_filtrados = estado.inventario
        ? (productos_por_inventario[estado.inventario.id] || [])
            .filter(p => p.tipo === TipoProducto.MATERIAL)
            .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        : [];
    const materiales_filtrados = estado.producto?.materiales?.filter(m =>
    (m.nro_lote?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.nro_serie?.toLowerCase().includes(busqueda.toLowerCase()))
    ) || [];

    const seleccionarInventario = async (inv: Inventario) => {
        setCargandoInventario(true);
        setCargando(true);
        await cargarProductos(inv.id);
        setCargando(false);
        setCargandoInventario(false);
        setEstado({ paso: 'producto', inventario: inv });
        setBusqueda('');
    };

    const seleccionarProducto = (prod: Producto) => {
        setEstado({ ...estado, paso: 'material', producto: prod });
        setBusqueda('');
    };

    const seleccionarMaterial = (mat: Material) => {
        setCargandoMaterial(true);
        setEstado({ ...estado, material: mat });
        setTimeout(() => setCargandoMaterial(false), 300);
    };

    const agregarMaterialSeleccionado = () => {
        if (!estado.inventario || !estado.producto || !estado.material) return;

        const stock = Number(estado.material.cantidad_actual);
        const cant = 1;

        onAgregarMaterial({
            inventario_id: estado.inventario.id,
            inventario_nombre: estado.inventario.nombre,
            producto_id: estado.producto.id,
            producto_nombre: estado.producto.nombre,
            material_id: estado.material.id,
            nro_lote: estado.material.nro_lote,
            cantidad: cant,
            stock_disponible: stock,
            unidad_medida: estado.producto.unidad_medida,
            permite_decimales: estado.producto.permite_decimales,
        });
        setEstado({ paso: 'lista' });
        setBusqueda('');
    };

    const retroceder = () => {
        switch (estado.paso) {
            case 'producto':
                setEstado({ paso: 'inventario' });
                break;
            case 'material':
                setEstado({ ...estado, paso: 'producto', material: undefined });
                break;
            default:
                setEstado({ paso: 'lista' });
        }
        setBusqueda('');
    };
    const Breadcrumb = () => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 flex-wrap">
            <button
                onClick={() => setEstado({ paso: 'lista' })}
                className="hover:text-primary transition-colors"
            >
                Consumibles
            </button>
            {estado.paso !== 'lista' && estado.paso !== 'inventario' && (
                <>
                    <ChevronRight className="h-4 w-4" />
                    <button
                        onClick={() => setEstado({ paso: 'producto', inventario: estado.inventario })}
                        className="hover:text-primary transition-colors"
                    >
                        {estado.inventario?.nombre}
                    </button>
                </>
            )}
            {estado.paso === 'material' && (
                <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium">
                        {estado.producto?.nombre}
                    </span>
                </>
            )}
        </div>
    );
    if (estado.paso === 'lista') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Materiales Seleccionados</h4>
                    {!readOnly && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEstado({ paso: 'inventario' })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Material
                        </Button>
                    )}
                </div>

                {materialesSeleccionados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay materiales seleccionados</p>
                        {!readOnly && <p className="text-xs">Haz clic en "Agregar Material" para comenzar</p>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {materialesSeleccionados.map((mat, idx) => {
                            const excedeStock = mat.cantidad > mat.stock_disponible;
                            return (
                                <Card key={idx} className={`p-3 flex items-center justify-between ${excedeStock ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{mat.inventario_nombre}</Badge>
                                            <span className="font-medium">{mat.producto_nombre}</span>
                                            {excedeStock && (
                                                <Badge variant="outline" className="text-amber-600 border-amber-500">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Excede stock
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {mat.nro_lote && <span>Lote: {mat.nro_lote} • </span>}
                                            <span className={excedeStock ? 'text-amber-600' : ''}>Stock: {mat.stock_disponible} {mat.unidad_medida}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={mat.permite_decimales ? "0.01" : "1"}
                                            step={mat.permite_decimales ? "0.01" : "1"}
                                            value={mat.permite_decimales ? mat.cantidad : Math.floor(mat.cantidad)}
                                            onChange={(e) => onActualizarCantidad(idx, parseFloat(e.target.value) || 0)}
                                            className={`w-20 h-8 text-center ${excedeStock ? 'border-amber-500' : ''}`}
                                            disabled={readOnly}
                                        />
                                        <span className="text-sm text-muted-foreground">{mat.unidad_medida}</span>
                                        {!readOnly && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEliminarMaterial(idx)}
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={retroceder}
                    className="h-8 w-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Breadcrumb />
                {estado.paso === 'material' && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={agregarMaterialSeleccionado}
                        disabled={!estado.material || cargandoMaterial}
                        className="ml-auto"
                    >
                        {cargandoMaterial ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        Agregar a la lista
                    </Button>
                )}
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={
                        estado.paso === 'inventario' ? 'Buscar inventario...' :
                            estado.paso === 'producto' ? 'Buscar producto...' :
                                'Buscar por lote o serie...'
                    }
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                />
            </div>
            {estado.paso === 'inventario' && (
                <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 gap-2">
                        {inventarios_consumibles
                            .filter(inv => inv.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                            .map(inv => (
                                <Card
                                    key={inv.id}
                                    className={`p-4 cursor-pointer hover:bg-accent hover:border-primary transition-all ${cargandoInventario ? 'opacity-50 pointer-events-none' : ''}`}
                                    onClick={() => seleccionarInventario(inv)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                {cargandoInventario ? (
                                                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{inv.nombre}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {inv.resumen?.total_productos || 0} productos
                                                </p>
                                            </div>
                                        </div>
                                        {cargandoInventario ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </Card>
                            ))}
                    </div>
                </ScrollArea>
            )}
            {estado.paso === 'producto' && (
                <ScrollArea className="h-[300px]">
                    {cargando ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                            <p>Cargando productos...</p>
                        </div>
                    ) : productos_filtrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay productos de tipo consumible en este inventario
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {productos_filtrados.map(prod => (
                                <Card
                                    key={prod.id}
                                    className="p-4 cursor-pointer hover:bg-accent hover:border-primary transition-all"
                                    onClick={() => seleccionarProducto(prod)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">{prod.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {prod.materiales?.length || 0} materiales
                                                </Badge>
                                                {prod.unidad_medida && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {prod.unidad_medida}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            )}
            {estado.paso === 'material' && (
                <ScrollArea className="h-[300px]">
                    {materiales_filtrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay materiales disponibles para este producto
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {materiales_filtrados.map(mat => {
                                const stock = Number(mat.cantidad_actual) - Number(mat.cantidad_reservada);
                                const yaSeleccionado = materialesSeleccionados.some(m => m.material_id === mat.id);
                                const esSeleccionadoActual = estado.material?.id === mat.id;

                                return (
                                    <Card
                                        key={mat.id}
                                        className={`p-4 transition-all ${yaSeleccionado
                                            ? 'bg-green-500/10 border-green-500/50'
                                            : stock <= 0
                                                ? 'opacity-50 cursor-not-allowed'
                                                : esSeleccionadoActual
                                                    ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                                    : 'cursor-pointer hover:bg-accent hover:border-primary'
                                            } ${cargandoMaterial ? 'pointer-events-none opacity-70' : ''}`}
                                        onClick={() => !yaSeleccionado && stock > 0 && !cargandoMaterial && seleccionarMaterial(mat)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">
                                                        {mat.nro_lote || mat.nro_serie || `Material #${mat.id}`}
                                                    </h4>
                                                    {yaSeleccionado && (
                                                        <Badge className="bg-green-500">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Agregado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <span className={stock <= 0 ? 'text-destructive' : ''}>
                                                        Stock disponible: {stock} {estado.producto?.unidad_medida}
                                                    </span>
                                                    {mat.fecha_vencimiento && (
                                                        <span>• Vence: {formatearFechaCorta(mat.fecha_vencimiento)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {cargandoMaterial && esSeleccionadoActual ? (
                                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                            ) : !yaSeleccionado && stock > 0 && !esSeleccionadoActual ? (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            ) : esSeleccionadoActual ? (
                                                <Check className="h-5 w-5 text-primary" />
                                            ) : null}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            )}
        </div>
    );
}
