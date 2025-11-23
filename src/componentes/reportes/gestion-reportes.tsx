import { useState, useEffect } from 'react';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/componentes/ui/dialog';
import { Label } from '@/componentes/ui/label';
import { Input } from '@/componentes/ui/input';
import { MultiSelect } from '@/componentes/ui/mulit-select';
import { Calendar } from '@/componentes/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover';
import { Switch } from '@/componentes/ui/switch';
import { reportesApi } from '@/lib/api';
import { AreaReporte } from '@/tipos';
import { FileText, Calendar as CalendarIcon, Download, Loader2, Trash2, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utilidades';
import { useToast } from '@/hooks/use-toast';
import { VisualizadorArchivos } from '@/componentes/archivos/visualizador-archivos';

interface ReporteGuardado {
  id: number;
  nombre: string;
  areas: AreaReporte[];
  fecha_inicio?: Date;
  fecha_fin?: Date;
  fecha_creacion: Date;
  analisis_gemini?: string;
}

export function GestionReportes() {
  const [abierto, setAbierto] = useState(false);
  const [areas_seleccionadas, setAreasSeleccionadas] = useState<AreaReporte[]>([]);
  const [fecha_inicio, setFechaInicio] = useState<Date>();
  const [fecha_fin, setFechaFin] = useState<Date>();
  const [usar_intervalo, setUsarIntervalo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargando_lista, setCargandoLista] = useState(true);
  const [reportes_guardados, setReportesGuardados] = useState<ReporteGuardado[]>([]);
  const [filtro_nombre, setFiltroNombre] = useState('');
  const [filtro_areas, setFiltroAreas] = useState<string[]>([]);

  const [reporte_visualizando, setReporteVisualizando] = useState<{
    id: number;
    nombre_archivo: string;
    tipo_mime: string;
    descripcion?: string;
    url?: string;
    fecha_subida: string;
  } | null>(null);
  const [visualizador_abierto, setVisualizadorAbierto] = useState(false);
  const [reporte_cargando_id, setReporteCargandoId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setCargandoLista(true);
    try {
      const reportes = await reportesApi.obtener();
      setReportesGuardados(reportes);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
        variant: 'destructive',
      });
    } finally {
      setCargandoLista(false);
    }
  };

  const areas_disponibles = [
    { valor: AreaReporte.FINANZAS, etiqueta: 'Finanzas', descripcion: 'Ingresos, egresos y balance' },
    { valor: AreaReporte.AGENDA, etiqueta: 'Agenda', descripcion: 'Citas y programación' },
    { valor: AreaReporte.TRATAMIENTOS, etiqueta: 'Tratamientos', descripcion: 'Planes de tratamiento' },
    { valor: AreaReporte.INVENTARIO, etiqueta: 'Inventario', descripcion: 'Stock y productos' },
  ];

  const toggleArea = (area: AreaReporte) => {
    setAreasSeleccionadas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const generarReporte = async () => {
    if (areas_seleccionadas.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un área',
        variant: 'destructive',
      });
      return;
    }

    if (usar_intervalo && (!fecha_inicio || !fecha_fin)) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar las fechas de inicio y fin para el intervalo',
        variant: 'destructive',
      });
      return;
    }

    setCargando(true);
    try {
      const datos = {
        areas: areas_seleccionadas,
        fecha_inicio: usar_intervalo && fecha_inicio ? format(fecha_inicio, 'yyyy-MM-dd') : undefined,
        fecha_fin: usar_intervalo && fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : undefined,
      };

      await reportesApi.generar(datos);

      toast({
        title: 'Reporte generado',
        description: 'El reporte se ha generado y guardado correctamente',
      });

      setAbierto(false);
      setAreasSeleccionadas([]);
      setFechaInicio(undefined);
      setFechaFin(undefined);
      setUsarIntervalo(false);
      await cargarReportes();
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  const descargarReporte = async (reporte: ReporteGuardado) => {
    try {
      const blob = await reportesApi.descargar(reporte.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reporte.nombre}-${format(new Date(reporte.fecha_creacion), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte',
        variant: 'destructive',
      });
    }
  };

  const eliminarReporte = async (id: number) => {
    try {
      await reportesApi.eliminar(id);
      toast({
        title: 'Éxito',
        description: 'Reporte eliminado correctamente',
      });
      await cargarReportes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
        variant: 'destructive',
      });
    }
  };

  const verReporte = async (reporte: ReporteGuardado) => {
    setReporteCargandoId(reporte.id);
    try {
      const blob = await reportesApi.descargar(reporte.id);
      const url = URL.createObjectURL(blob);

      setReporteVisualizando({
        id: reporte.id,
        nombre_archivo: `${reporte.nombre}-${format(new Date(reporte.fecha_creacion), 'yyyy-MM-dd')}.pdf`,
        tipo_mime: 'application/pdf',
        descripcion: `Áreas: ${reporte.areas.join(', ')}`,
        url: url,
        fecha_subida: new Date(reporte.fecha_creacion).toISOString(),
      });
      setVisualizadorAbierto(true);
    } catch (error) {
      console.error('Error al visualizar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reporte seleccionado',
        variant: 'destructive',
      });
    } finally {
      setReporteCargandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
          <p className="text-muted-foreground">
            Genera reportes con análisis de IA usando Gemini
          </p>
        </div>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <FileText className="h-5 w-5" />
              Generar Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generar Nuevo Reporte</DialogTitle>
              <DialogDescription>
                Selecciona las áreas y el período para generar tu reporte
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <Label>Áreas a incluir</Label>
                <div className="grid grid-cols-2 gap-3">
                  {areas_disponibles.map((area) => (
                    <Card
                      key={area.valor}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        areas_seleccionadas.includes(area.valor)
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                      onClick={() => toggleArea(area.valor)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{area.etiqueta}</CardTitle>
                        <CardDescription className="text-xs">
                          {area.descripcion}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="usar-intervalo">Filtrar por intervalo de fechas</Label>
                    <p className="text-xs text-muted-foreground">
                      Desactivado: Incluye todos los datos desde el inicio
                    </p>
                  </div>
                  <Switch
                    id="usar-intervalo"
                    checked={usar_intervalo}
                    onCheckedChange={setUsarIntervalo}
                  />
                </div>

                {usar_intervalo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de inicio *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !fecha_inicio && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fecha_inicio ? format(fecha_inicio, 'PPP', { locale: es }) : 'Seleccionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fecha_inicio}
                            onSelect={setFechaInicio}
                            locale={es}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de fin *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !fecha_fin && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fecha_fin ? format(fecha_fin, 'PPP', { locale: es }) : 'Seleccionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fecha_fin}
                            onSelect={setFechaFin}
                            locale={es}
                            disabled={(date) => fecha_inicio ? date < fecha_inicio : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={generarReporte} disabled={cargando}>
                {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="lg" onClick={cargarReportes} disabled={cargando_lista}>
          {cargando_lista ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Buscar por nombre</Label>
          <Input
            placeholder="Escribe el nombre del reporte..."
            value={filtro_nombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Áreas</Label>
          <MultiSelect
            opciones={areas_disponibles.map(a => ({ valor: String(a.valor), etiqueta: a.etiqueta }))}
            valores={filtro_areas}
            onChange={setFiltroAreas}
            placeholder="Filtrar por áreas (opcional)"
            textoVacio="Sin áreas"
          />
        </div>
      </div>

      {cargando_lista ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : reportes_guardados.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay reportes generados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Genera tu primer reporte para ver análisis con IA
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportes_guardados
            .filter((reporte) => {
              const termino = filtro_nombre.trim().toLowerCase();
              const coincideNombre = termino ? reporte.nombre.toLowerCase().includes(termino) : true;
              const coincideAreas = filtro_areas.length === 0 ||
                filtro_areas.every((a) => reporte.areas.map(String).includes(a));
              return coincideNombre && coincideAreas;
            })
            .map((reporte) => (
            <Card key={reporte.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {reporte.nombre}
                    </CardTitle>
                    <CardDescription>
                      <div>Generado: {format(new Date(reporte.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                      <div>Áreas: {reporte.areas.join(', ')}</div>
                      {reporte.fecha_inicio && reporte.fecha_fin && (
                        <div>Período: {format(new Date(reporte.fecha_inicio), 'dd/MM/yyyy', { locale: es })} - {format(new Date(reporte.fecha_fin), 'dd/MM/yyyy', { locale: es })}</div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => verReporte(reporte)}
                      disabled={reporte_cargando_id === reporte.id}
                      title="Visualizar PDF"
                    >
                      {reporte_cargando_id === reporte.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => descargarReporte(reporte)}
                      title="Descargar PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => eliminarReporte(reporte.id)}
                      title="Eliminar reporte"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {reporte_visualizando && visualizador_abierto && (
        <VisualizadorArchivos
          archivo={reporte_visualizando}
          abierto={visualizador_abierto}
          onCerrar={() => {
            setVisualizadorAbierto(false);
            setReporteVisualizando(null);
          }}
        />
      )}
    </div>
  );
}
