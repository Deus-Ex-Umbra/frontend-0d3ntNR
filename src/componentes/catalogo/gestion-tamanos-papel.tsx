import { useEffect, useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/componentes/ui/accordion'
import { Edit, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { catalogoApi } from '@/lib/api'

interface TamanoPapelItem { id:number; nombre:string; ancho:number; alto:number; descripcion?:string; protegido:boolean }

export function GestionTamanosPapel() {
  const [items, setItems] = useState<TamanoPapelItem[]>([])
  const [cargando, setCargando] = useState(false)
  const cargar = async () => {
    setCargando(true)
    try {
      const lista = await (catalogoApi as any).obtenerTamanosHoja?.()
      if (Array.isArray(lista)) setItems(lista)
    } catch (e:any) {
      toast({ title:'Error', description: e.response?.data?.message || 'No se pudieron cargar los tamaños', variant:'destructive' })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [editarAbierto, setEditarAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editItem, setEditItem] = useState<TamanoPapelItem | null>(null)

  const [form, setForm] = useState({ nombre:'', ancho:'', alto:'', descripcion:'' })

  const abrirCrear = () => { setForm({ nombre:'', ancho:'', alto:'', descripcion:'' }); setCrearAbierto(true) }
  const abrirEditar = (it: TamanoPapelItem) => {
    if (it.protegido) { toast({ title:'Protegido', description:'Este tamaño no se puede editar', variant:'destructive' }); return }
    setEditItem(it)
    setForm({ nombre: it.nombre, ancho: String(it.ancho), alto: String(it.alto), descripcion: it.descripcion || '' })
    setEditarAbierto(true)
  }

  const convertirANum = (v:string) => Number((v || '').toString().replace(',', '.'))

  const crear = async () => {
    if (!form.nombre.trim()) { toast({ title:'Error', description:'El nombre es obligatorio', variant:'destructive' }); return }
    const nAncho = convertirANum(form.ancho)
    const nAlto = convertirANum(form.alto)
    if (!Number.isFinite(nAncho) || !Number.isFinite(nAlto) || nAncho <= 0 || nAlto <= 0) {
      toast({ title:'Error', description:'Ancho y alto deben ser números positivos', variant:'destructive' }); return
    }
    setGuardando(true)
    try {
      const payload = { nombre: form.nombre.trim(), ancho: Math.round(nAncho), alto: Math.round(nAlto), descripcion: form.descripcion.trim() || `${Math.round(nAncho)} × ${Math.round(nAlto)} mm` }
      await (catalogoApi as any).crearTamanoHoja?.(payload)
      toast({ title:'Éxito', description:'Tamaño creado' })
      setCrearAbierto(false)
      await cargar()
    } catch (e:any) {
      toast({ title:'Error', description: e.response?.data?.message || 'No se pudo crear', variant:'destructive' })
    } finally { setGuardando(false) }
  }

  const actualizar = async () => {
    if (!editItem) return
    const item = editItem
    if (item.protegido) { toast({ title:'Protegido', description:'Este tamaño no se puede editar', variant:'destructive' }); return }
    if (!form.nombre.trim()) { toast({ title:'Error', description:'El nombre es obligatorio', variant:'destructive' }); return }
    const nAncho = convertirANum(form.ancho)
    const nAlto = convertirANum(form.alto)
    if (!Number.isFinite(nAncho) || !Number.isFinite(nAlto) || nAncho <= 0 || nAlto <= 0) {
      toast({ title:'Error', description:'Ancho y alto deben ser números positivos', variant:'destructive' }); return
    }
    setGuardando(true)
    try {
      const payload:any = { nombre: form.nombre.trim(), ancho: Math.round(nAncho), alto: Math.round(nAlto), descripcion: form.descripcion.trim() }
      await (catalogoApi as any).actualizarTamanoHoja?.(item.id, payload)
      toast({ title:'Éxito', description:'Tamaño actualizado' })
      setEditarAbierto(false)
      setEditItem(null)
      await cargar()
    } catch (e:any) {
      toast({ title:'Error', description: e.response?.data?.message || 'No se pudo actualizar', variant:'destructive' })
    } finally { setGuardando(false) }
  }

  const eliminar = async (it: TamanoPapelItem) => {
    if (it.protegido) { toast({ title:'Protegido', description:'Este tamaño no se puede eliminar', variant:'destructive' }); return }
    try {
      await (catalogoApi as any).eliminarTamanoHoja?.(it.id)
      toast({ title:'Éxito', description:'Tamaño eliminado' })
      await cargar()
    } catch (e:any) {
      toast({ title:'Error', description: e.response?.data?.message || 'No se pudo eliminar', variant:'destructive' })
    }
  }

  const tituloUnidad = 'mm'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tamaños de Hoja</h3>
          <p className="text-sm text-muted-foreground">Gestiona tamaños exclusivamente en milímetros (mm)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={abrirCrear} size="sm" className="ml-2"><Plus className="h-4 w-4 mr-2"/>Agregar</Button>
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/>Cargando…</div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {items.map(it => (
            <AccordionItem key={it.id} value={`tp-${it.id}`}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{it.nombre}</span>
                  <span className="text-xs text-muted-foreground">{it.descripcion || `${it.ancho} × ${it.alto} mm`}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirEditar(it)} disabled={it.protegido}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => eliminar(it)} disabled={it.protegido}><Trash2 className="h-4 w-4 mr-2"/>Eliminar</Button>
                  {it.protegido && <span className="text-xs text-muted-foreground">Protegido</span>}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Agregar tamaño de hoja</DialogTitle>
            <DialogDescription>Las medidas se guardan en mm</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Oficio personal"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ancho ({tituloUnidad})</Label>
                <Input value={form.ancho} onChange={(e) => setForm({ ...form, ancho: e.target.value })} placeholder={'210'}/>
              </div>
              <div className="space-y-1">
                <Label>Alto ({tituloUnidad})</Label>
                <Input value={form.alto} onChange={(e) => setForm({ ...form, alto: e.target.value })} placeholder={'297'}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Se autogenera si se deja vacío"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrearAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={crear} disabled={guardando}>{guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editarAbierto} onOpenChange={setEditarAbierto}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar tamaño de hoja</DialogTitle>
            <DialogDescription>Las medidas se guardan en mm</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ancho ({tituloUnidad})</Label>
                <Input value={form.ancho} onChange={(e) => setForm({ ...form, ancho: e.target.value })}/>
              </div>
              <div className="space-y-1">
                <Label>Alto ({tituloUnidad})</Label>
                <Input value={form.alto} onChange={(e) => setForm({ ...form, alto: e.target.value })}/>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={actualizar} disabled={guardando}>{guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
