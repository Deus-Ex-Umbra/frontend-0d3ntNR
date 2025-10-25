import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react"

import { cn } from "@/lib/utilidades"
import { Button } from "@/componentes/ui/button"
import { Calendar } from "@/componentes/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/componentes/ui/popover"
import { Input } from "@/componentes/ui/input"
import { Label } from "@/componentes/ui/label"

interface DateTimePickerProps {
  valor?: Date
  onChange: (fecha: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  valor,
  onChange,
  placeholder = "Selecciona fecha y hora",
  className,
}: DateTimePickerProps) {
  const [abierto, setAbierto] = React.useState(false)
  const [hora, setHora] = React.useState<string>(
    valor ? format(valor, "HH:mm") : "09:00"
  )

  React.useEffect(() => {
    if (valor) {
      setHora(format(valor, "HH:mm"))
    }
  }, [valor])

  const manejarCambioFecha = (nueva_fecha: Date | undefined) => {
    if (nueva_fecha) {
      const [horas, minutos] = hora.split(':').map(Number)
      const fecha_actualizada = new Date(nueva_fecha)
      fecha_actualizada.setHours(horas, minutos, 0, 0)
      onChange(fecha_actualizada)
      setAbierto(false)
    }
  }

  const manejarCambioHora = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nueva_hora = e.target.value
    setHora(nueva_hora)
    
    if (valor && nueva_hora) {
      const [horas, minutos] = nueva_hora.split(':').map(Number)
      const fecha_actualizada = new Date(valor)
      fecha_actualizada.setHours(horas, minutos, 0, 0)
      onChange(fecha_actualizada)
    }
  }

  return (
    <div className="flex gap-2">
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "flex-1 justify-between text-left font-normal hover:border-primary/50 transition-all duration-200",
              !valor && "text-muted-foreground",
              className
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {valor ? format(valor, "PPP", { locale: es }) : <span>{placeholder}</span>}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={valor}
            onSelect={manejarCambioFecha}
            initialFocus
            locale={es}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center gap-2 min-w-[120px]">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={hora}
          onChange={manejarCambioHora}
          className="w-full"
        />
      </div>
    </div>
  )
}