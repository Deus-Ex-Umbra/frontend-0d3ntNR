import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utilidades"
import { Button } from "@/componentes/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/componentes/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentes/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog"
import { Input } from "@/componentes/ui/input"
import { Label } from "@/componentes/ui/label"

export interface OpcionSelectConAgregar {
  valor: string
  etiqueta: string
}

interface SelectConAgregarProps {
  opciones: OpcionSelectConAgregar[]
  valor?: string
  onChange: (valor: string) => void
  onAgregarNuevo?: (nombre: string) => Promise<void> | void
  tamanoConfig?: { onCrear: (datos: { nombre: string; anchoCm: number; altoCm: number; descripcion?: string }) => Promise<void> | void }
  placeholder?: string
  textoVacio?: string
  textoAgregar?: string
  className?: string
  disabled?: boolean
  tituloModal?: string
  descripcionModal?: string
  placeholderInput?: string
}

export function SelectConAgregar({
  opciones,
  valor,
  onChange,
  onAgregarNuevo,
  tamanoConfig,
  placeholder = "Seleccionar...",
  textoVacio = "No se encontraron resultados",
  textoAgregar = "Agregar nuevo...",
  className,
  disabled = false,
  tituloModal = "Agregar Nueva Opción",
  descripcionModal = "Ingresa el nombre de la nueva opción",
  placeholderInput = "Nombre",
}: SelectConAgregarProps) {
  const [abierto, setAbierto] = React.useState(false)
  const [modal_abierto, setModalAbierto] = React.useState(false)
  const [nuevo_valor, setNuevoValor] = React.useState("")
  const [guardando, setGuardando] = React.useState(false)
  const [formTamano, setFormTamano] = React.useState({ nombre: '', ancho: '', alto: '', descripcion: '' })
  const opcion_seleccionada = opciones.find((opcion) => opcion.valor === valor)
  const manejarAgregar = async () => {
    if (tamanoConfig) {
      if (!formTamano.nombre.trim()) return
      const nAncho = Number((formTamano.ancho || '').toString().replace(',', '.'))
      const nAlto = Number((formTamano.alto || '').toString().replace(',', '.'))
      if (!Number.isFinite(nAncho) || !Number.isFinite(nAlto) || nAncho <= 0 || nAlto <= 0) return
      setGuardando(true)
      try {
        const descripcion = formTamano.descripcion?.trim() || `${Math.round(nAncho)} × ${Math.round(nAlto)} mm`
        await tamanoConfig.onCrear({ nombre: formTamano.nombre.trim(), anchoCm: nAncho, altoCm: nAlto, descripcion })
        setModalAbierto(false)
        setFormTamano({ nombre:'', ancho:'', alto:'', descripcion:'' })
      } catch (e) {
        console.error('Error al agregar tamaño:', e)
      } finally {
        setGuardando(false)
      }
      return
    }
    if (!nuevo_valor.trim() || !onAgregarNuevo) return
    
    setGuardando(true)
    try {
      await onAgregarNuevo(nuevo_valor.trim())
      setModalAbierto(false)
      setNuevoValor("")
    } catch (error) {
      console.error('Error al agregar:', error)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={abierto}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {opcion_seleccionada ? opcion_seleccionada.etiqueta : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>
                {textoVacio}
              </CommandEmpty>
              <CommandGroup>
                {opciones.map((opcion) => (
                  <CommandItem
                    key={opcion.valor}
                    value={opcion.etiqueta}
                    onSelect={() => {
                      onChange(opcion.valor === valor ? "" : opcion.valor)
                      setAbierto(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        valor === opcion.valor ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opcion.etiqueta}
                  </CommandItem>
                ))}
                {onAgregarNuevo && (
                  <CommandItem
                    onSelect={() => {
                      setAbierto(false)
                      setModalAbierto(true)
                    }}
                    className="text-primary font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {textoAgregar}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={modal_abierto} onOpenChange={(open)=>{ setModalAbierto(open); if(!open){ setFormTamano({nombre:'', ancho:'', alto:'', descripcion:''}); setNuevoValor('') } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tituloModal}</DialogTitle>
            <DialogDescription>
              {descripcionModal}
            </DialogDescription>
          </DialogHeader>
          {tamanoConfig ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input value={formTamano.nombre} onChange={(e)=>setFormTamano({...formTamano, nombre:e.target.value})} placeholder="Ej: Oficio personal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Ancho (mm)</Label>
                  <Input value={formTamano.ancho} onChange={(e)=>setFormTamano({...formTamano, ancho:e.target.value})} placeholder={'210'} />
                </div>
                <div className="grid gap-2">
                  <Label>Alto (mm)</Label>
                  <Input value={formTamano.alto} onChange={(e)=>setFormTamano({...formTamano, alto:e.target.value})} placeholder={'297'} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Descripción (opcional)</Label>
                <Input value={formTamano.descripcion} onChange={(e)=>setFormTamano({...formTamano, descripcion:e.target.value})} placeholder="Se autogenera si se deja vacío" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nuevo_valor}
                  onChange={(e) => setNuevoValor(e.target.value)}
                  placeholder={placeholderInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); manejarAgregar() }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalAbierto(false)
                setNuevoValor(""); setFormTamano({ nombre:'', ancho:'', alto:'', descripcion:'' })
              }}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={manejarAgregar}
              disabled={guardando || (tamanoConfig ? !formTamano.nombre.trim() : !nuevo_valor.trim())}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
