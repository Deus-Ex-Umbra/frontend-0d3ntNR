import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

export interface OpcionCombobox {
  valor: string
  etiqueta: string
}

interface ComboboxProps {
  opciones: OpcionCombobox[]
  valor?: string
  onChange: (valor: string) => void
  placeholder?: string
  textoVacio?: string
  textoAgregar?: string
  onAgregarNuevo?: () => void
  className?: string
  disabled?: boolean
}

export function Combobox({
  opciones,
  valor,
  onChange,
  placeholder = "Seleccionar...",
  textoVacio = "No se encontraron resultados",
  textoAgregar,
  onAgregarNuevo,
  className,
  disabled = false,
}: ComboboxProps) {
  const [abierto, setAbierto] = React.useState(false)

  const opcion_seleccionada = opciones.find((opcion) => opcion.valor === valor)

  return (
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
              {textoAgregar && onAgregarNuevo && (
                <CommandItem
                  onSelect={() => {
                    setAbierto(false)
                    onAgregarNuevo()
                  }}
                  className="text-primary font-medium"
                >
                  <ChevronsUpDown className="mr-2 h-4 w-4" />
                  {textoAgregar}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}