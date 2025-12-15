import { useState } from 'react';
import { ChevronRight, Search, Wrench, ArrowLeft, Check, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Inventario, Producto, Activo, TipoProducto, EstadoActivo } from '@/tipos';

interface ActivoSeleccionado {
    inventario_id: number;
    inventario_nombre: string;
    producto_id: number;
    producto_nombre: string;
    activo_id: number;
    codigo_interno?: string;
    nro_serie?: string;
    nombre_asignado?: string;
    estado: string;
    material_cita_id?: number; // ID de la reserva si ya existe
}

interface WizardActivosFijosProps {
    inventarios: Inventario[];
    productos_por_inventario: Record<number, Producto[]>;
    cargarProductos: (inventario_id: number) => Promise<void>;
    activosSeleccionados: ActivoSeleccionado[];
    onAgregarActivo: (activo: ActivoSeleccionado) => void;
    onEliminarActivo: (index: number) => void;
    fecha_cita?: Date;
    readOnly?: boolean;
}

type PasoWizard = 'lista' | 'inventario' | 'producto' | 'activo';

interface EstadoWizard {
    paso: PasoWizard;
    inventario?: Inventario;
    producto?: Producto;
}

export default function WizardActivosFijos({
    inventarios,
    productos_por_inventario,
    cargarProductos,
    activosSeleccionados,
    onAgregarActivo,
    onEliminarActivo,
    fecha_cita,
    readOnly = false,
}: WizardActivosFijosProps) {
    const [estado, setEstado] = useState<EstadoWizard>({ paso: 'lista' });
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(false);
    const inventarios_activos = inventarios.filter(inv => {
        const productos = productos_por_inventario[inv.id] || [];
        return productos.some(p => p.tipo === TipoProducto.ACTIVO_FIJO) || productos.length === 0;
    });
    const productos_filtrados = estado.inventario
        ? (productos_por_inventario[estado.inventario.id] || [])
            .filter(p => p.tipo === TipoProducto.ACTIVO_FIJO)
            .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        : [];
    const activos_filtrados = estado.producto?.activos?.filter(a =>
    (a.codigo_interno?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.nro_serie?.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.nombre_asignado?.toLowerCase().includes(busqueda.toLowerCase()))
    ) || [];

    const seleccionarInventario = async (inv: Inventario) => {
        setCargando(true);
        await cargarProductos(inv.id);
        setCargando(false);
        setEstado({ paso: 'producto', inventario: inv });
        setBusqueda('');
    };

    const seleccionarProducto = (prod: Producto) => {
        setEstado({ ...estado, paso: 'activo', producto: prod });
        setBusqueda('');
    };

    const seleccionarActivo = (activo: Activo) => {
        if (!estado.inventario || !estado.producto) return;
        if (activo.estado !== EstadoActivo.DISPONIBLE && activo.estado !== 'disponible') return;

        onAgregarActivo({
            inventario_id: estado.inventario.id,
            inventario_nombre: estado.inventario.nombre,
            producto_id: estado.producto.id,
            producto_nombre: estado.producto.nombre,
            activo_id: activo.id,
            codigo_interno: activo.codigo_interno,
            nro_serie: activo.nro_serie,
            nombre_asignado: activo.nombre_asignado,
            estado: activo.estado as string,
        });
        setEstado({ paso: 'lista' });
        setBusqueda('');
    };

    const retroceder = () => {
        switch (estado.paso) {
            case 'producto':
                setEstado({ paso: 'inventario' });
                break;
            case 'activo':
                setEstado({ ...estado, paso: 'producto' });
                break;
            default:
                setEstado({ paso: 'lista' });
        }
        setBusqueda('');
    };

    const obtenerColorEstado = (estadoActivo: string) => {
        switch (estadoActivo) {
            case EstadoActivo.DISPONIBLE:
            case 'disponible':
                return 'bg-green-500';
            case EstadoActivo.EN_USO:
            case 'en_uso':
                return 'bg-blue-500';
            case EstadoActivo.EN_MANTENIMIENTO:
            case 'en_mantenimiento':
                return 'bg-yellow-500';
            case EstadoActivo.DESECHADO:
            case 'desechado':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const obtenerEtiquetaEstado = (estadoActivo: string) => {
        switch (estadoActivo) {
            case EstadoActivo.DISPONIBLE:
            case 'disponible':
                return 'Disponible';
            case EstadoActivo.EN_USO:
            case 'en_uso':
                return 'En Uso';
            case EstadoActivo.EN_MANTENIMIENTO:
            case 'en_mantenimiento':
                return 'En Mantenimiento';
            case EstadoActivo.DESECHADO:
            case 'desechado':
                return 'Desechado';
            default:
                return estadoActivo;
        }
    };
    const Breadcrumb = () => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
            <button
                onClick={() => setEstado({ paso: 'lista' })}
                className="hover:text-primary transition-colors"
            >
                Activos Fijos
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
            {estado.paso === 'activo' && (
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
                    <h4 className="font-medium text-foreground">Activos Reservados</h4>
                    {!readOnly && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEstado({ paso: 'inventario' })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Activo
                        </Button>
                    )}
                </div>

                {activosSeleccionados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay activos reservados</p>
                        {!readOnly && <p className="text-xs">Haz clic en "Agregar Activo" para reservar instrumental</p>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activosSeleccionados.map((activo, idx) => (
                            <Card key={idx} className="p-3 flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{activo.inventario_nombre}</Badge>
                                        <span className="font-medium">{activo.producto_nombre}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                        {activo.nro_serie && <span>Serie: {activo.nro_serie}</span>}
                                        {activo.codigo_interno && <span>• Código: {activo.codigo_interno}</span>}
                                        {activo.nombre_asignado && <span>• {activo.nombre_asignado}</span>}
                                    </div>
                                </div>
                                {!readOnly && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEliminarActivo(idx)}
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {fecha_cita && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Los activos se reservarán para la fecha y hora de esta cita.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
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
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={
                        estado.paso === 'inventario' ? 'Buscar inventario...' :
                            estado.paso === 'producto' ? 'Buscar producto...' :
                                'Buscar por serie, código o nombre...'
                    }
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                />
            </div>
            {estado.paso === 'inventario' && (
                <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-1 gap-2">
                        {inventarios_activos
                            .filter(inv => inv.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                            .map(inv => (
                                <Card
                                    key={inv.id}
                                    className="p-4 cursor-pointer hover:bg-accent hover:border-primary transition-all"
                                    onClick={() => seleccionarInventario(inv)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <Wrench className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{inv.nombre}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {inv.resumen?.total_activos || 0} activos
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                            Cargando productos...
                        </div>
                    ) : productos_filtrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay productos de tipo activo fijo en este inventario
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {productos_filtrados.map(prod => {
                                const activos_disponibles = prod.activos?.filter(
                                    a => a.estado === EstadoActivo.DISPONIBLE || a.estado === 'disponible'
                                ).length || 0;

                                return (
                                    <Card
                                        key={prod.id}
                                        className={`p-4 cursor-pointer transition-all ${activos_disponibles > 0
                                            ? 'hover:bg-accent hover:border-primary'
                                            : 'opacity-50 cursor-not-allowed'
                                            }`}
                                        onClick={() => activos_disponibles > 0 && seleccionarProducto(prod)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">{prod.nombre}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant={activos_disponibles > 0 ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {activos_disponibles} disponibles
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        de {prod.activos?.length || 0} total
                                                    </span>
                                                </div>
                                            </div>
                                            {activos_disponibles > 0 && (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            )}
            {estado.paso === 'activo' && (
                <ScrollArea className="h-[300px]">
                    {activos_filtrados.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay activos disponibles para este producto
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {activos_filtrados.map(activo => {
                                const esDisponible = activo.estado === EstadoActivo.DISPONIBLE || activo.estado === 'disponible';
                                const yaSeleccionado = activosSeleccionados.some(a => a.activo_id === activo.id);

                                return (
                                    <Card
                                        key={activo.id}
                                        className={`p-4 cursor-pointer transition-all ${yaSeleccionado
                                            ? 'bg-green-500/10 border-green-500/50'
                                            : !esDisponible
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-accent hover:border-primary'
                                            }`}
                                        onClick={() => !yaSeleccionado && esDisponible && seleccionarActivo(activo)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">
                                                        {activo.nombre_asignado || activo.nro_serie || activo.codigo_interno || `Activo #${activo.id}`}
                                                    </h4>
                                                    <Badge className={`${obtenerColorEstado(activo.estado as string)} text-white text-xs`}>
                                                        {obtenerEtiquetaEstado(activo.estado as string)}
                                                    </Badge>
                                                    {yaSeleccionado && (
                                                        <Badge className="bg-green-500">
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Agregado
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    {activo.nro_serie && <span>Serie: {activo.nro_serie}</span>}
                                                    {activo.codigo_interno && <span>• Código: {activo.codigo_interno}</span>}
                                                    {activo.ubicacion && <span>• {activo.ubicacion}</span>}
                                                </div>
                                            </div>
                                            {!yaSeleccionado && esDisponible && (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            )}
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
