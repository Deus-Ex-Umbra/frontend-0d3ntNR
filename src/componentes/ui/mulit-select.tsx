import * as React from "react"
import { Check, X, ChevronsUpDown, Plus } from "lucide-react"
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
import { Badge } from "@/componentes/ui/badge"
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
import { ScrollArea } from "@/componentes/ui/scroll-area"

export interface OpcionMultiSelect {
  valor: string
  etiqueta: string
}

interface MultiSelectProps {
  opciones: OpcionMultiSelect[]
  valores?: string[]
  onChange: (valores: string[]) => void
  onAgregarNuevo?: (nombre: string) => Promise<void> | void
  placeholder?: string
  textoVacio?: string
  textoAgregar?: string
  className?: string
  disabled?: boolean
  tituloModal?: string
  descripcionModal?: string
  placeholderInput?: string
  maxSeleccionados?: number
}

export function MultiSelect({
  opciones,
  valores = [],
  onChange,
  onAgregarNuevo,
  placeholder = "Seleccionar...",
  textoVacio = "No se encontraron resultados",
  textoAgregar = "Agregar nuevo...",
  className,
  disabled = false,
  tituloModal = "Agregar Nueva Opción",
  descripcionModal = "Ingresa el nombre de la nueva opción",
  placeholderInput = "Nombre",
  maxSeleccionados,
}: MultiSelectProps) {
  const [abierto, setAbierto] = React.useState(false)
  const [modal_abierto, setModalAbierto] = React.useState(false)
  const [nuevo_valor, setNuevoValor] = React.useState("")
  const [guardando, setGuardando] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState("")

  const opciones_seleccionadas = opciones.filter(o => valores.includes(o.valor))

  const manejarSeleccionar = (valor: string) => {
    if (valores.includes(valor)) {
      onChange(valores.filter(v => v !== valor))
    } else {
      if (maxSeleccionados && valores.length >= maxSeleccionados) {
        return
      }
      onChange([...valores, valor])
    }
  }

  const manejarRemover = (valor: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(valores.filter(v => v !== valor))
  }

  const manejarAgregar = async () => {
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

  const opciones_filtradas = opciones.filter(opcion =>
    opcion.etiqueta.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={abierto}
            className={cn("w-full justify-between min-h-[2.5rem] h-auto", className)}
            disabled={disabled}
          >
            <div className="flex gap-1 flex-wrap flex-1">
              {valores.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                opciones_seleccionadas.map((opcion) => (
                  <Badge
                    key={opcion.valor}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {opcion.etiqueta}
                    <button
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          manejarRemover(opcion.valor, e as any)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => manejarRemover(opcion.valor, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Buscar ${placeholder.toLowerCase()}...`} 
              value={busqueda}
              onValueChange={setBusqueda}
            />
            <CommandList>
              <CommandEmpty>
                {textoVacio}
              </CommandEmpty>
              <CommandGroup>
                <ScrollArea className="max-h-64">
                  {opciones_filtradas.map((opcion) => (
                    <CommandItem
                      key={opcion.valor}
                      value={opcion.valor}
                      onSelect={() => {
                        manejarSeleccionar(opcion.valor)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          valores.includes(opcion.valor) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {opcion.etiqueta}
                    </CommandItem>
                  ))}
                </ScrollArea>
                {onAgregarNuevo && (
                  <CommandItem
                    onSelect={() => {
                      setAbierto(false)
                      setModalAbierto(true)
                    }}
                    className="text-primary font-medium border-t"
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

      <Dialog open={modal_abierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tituloModal}</DialogTitle>
            <DialogDescription>
              {descripcionModal}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nuevo_valor}
                onChange={(e) => setNuevoValor(e.target.value)}
                placeholder={placeholderInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    manejarAgregar()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalAbierto(false)
                setNuevoValor("")
              }}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={manejarAgregar}
              disabled={guardando || !nuevo_valor.trim()}
            >
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}