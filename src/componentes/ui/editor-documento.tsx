import { useEffect, useMemo, useState } from 'react'
import { EditorConEtiquetasPersonalizado } from '@/componentes/ui/editor-con-etiquetas-personalizado'
import { Label } from '@/componentes/ui/label'
import { Input } from '@/componentes/ui/input'
import { SelectConAgregar, OpcionSelectConAgregar } from '@/componentes/ui/select-with-add'
import { catalogoApi } from '@/lib/api'
import { cn } from '@/lib/utilidades'

export interface DocumentoConfig {
  tamano_hoja_id?: number | null
  nombre_tamano?: string
  widthMm: number
  heightMm: number
  margenes: { top: number; right: number; bottom: number; left: number }
}

interface EditorDocumentoProps {
  valorHtml: string
  onChangeHtml: (html: string) => void
  config: DocumentoConfig
  onChangeConfig: (cfg: DocumentoConfig) => void
  className?: string
  minHeight?: string
}

interface TamanoHojaItem {
  id: number
  nombre: string
  ancho: number
  alto: number
  descripcion?: string
  protegido: boolean
}

export function EditorDocumento({ valorHtml, onChangeHtml, config, onChangeConfig, className, minHeight = '200px' }: EditorDocumentoProps) {
  const [tamanos, setTamanos] = useState<TamanoHojaItem[]>([])

  const opciones: OpcionSelectConAgregar[] = useMemo(() => {
    return tamanos.map(t => {
      const etiquetaMedidas = `${Math.round(t.ancho)} × ${Math.round(t.alto)} mm`
      return ({ valor: String(t.id), etiqueta: `${t.nombre} (${t.descripcion || etiquetaMedidas})` })
    })
  }, [tamanos])

  const seleccionado = useMemo(() => {
    return config.tamano_hoja_id ? tamanos.find(t => t.id === config.tamano_hoja_id) : undefined
  }, [config.tamano_hoja_id, tamanos])

  useEffect(() => { cargarTamanos() }, [])

  const cargarTamanos = async () => {
    try {
      const res = await (catalogoApi as any).obtenerTamanosHoja?.()
      if (Array.isArray(res)) setTamanos(res)
    } catch (e) {
      console.error('Error cargando tamaños de hoja', e)
    }
  }

  const onSelectTamano = (valor: string) => {
    if (!valor) {
      onChangeConfig({ ...config, tamano_hoja_id: null })
      return
    }
    const id = Number(valor)
    const item = tamanos.find(t => t.id === id)
    if (item) {
      onChangeConfig({
        ...config,
        tamano_hoja_id: item.id,
        nombre_tamano: item.nombre,
        widthMm: Math.round(item.ancho),
        heightMm: Math.round(item.alto),
      })
    }
  }

  const onCrearTamano = async (datos: { nombre: string; anchoCm: number; altoCm: number; descripcion?: string }) => {
    const creado = await (catalogoApi as any).crearTamanoHoja?.({ nombre: datos.nombre, ancho: datos.anchoCm, alto: datos.altoCm, descripcion: datos.descripcion })
    await cargarTamanos()
    if (creado?.id) {
      onChangeConfig({ ...config, tamano_hoja_id: creado.id, nombre_tamano: creado.nombre, widthMm: Math.round(creado.ancho), heightMm: Math.round(creado.alto) })
    }
  }

  const pageInfo = seleccionado ? { widthMm: Math.round(seleccionado.ancho), heightMm: Math.round(seleccionado.alto) } : { widthMm: config.widthMm, heightMm: config.heightMm }

  const pageMm = { width: pageInfo.widthMm, height: pageInfo.heightMm }
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(Number.isFinite(v) ? v : min, min), max)
  const maxLeft = Math.max(0, pageMm.width - config.margenes.right)
  const maxRight = Math.max(0, pageMm.width - config.margenes.left)
  const maxTop = Math.max(0, pageMm.height - config.margenes.bottom)
  const maxBottom = Math.max(0, pageMm.height - config.margenes.top)
  const horizontalZero = config.margenes.left + config.margenes.right === pageMm.width
  const verticalZero = config.margenes.top + config.margenes.bottom === pageMm.height

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid gap-3 md:grid-cols-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Tamaño de hoja</Label>
          <SelectConAgregar
            opciones={opciones}
            valor={config.tamano_hoja_id ? String(config.tamano_hoja_id) : ''}
            onChange={onSelectTamano}
            tamanoConfig={{ onCrear: onCrearTamano }}
            placeholder="Seleccionar tamaño"
            tituloModal="Agregar tamaño de hoja"
            descripcionModal="Ingresa nombre y medidas; se guardan en mm"
            placeholderInput="Nombre"
          />
        </div>
        {seleccionado && (
          <div className="text-xs text-muted-foreground">
            {seleccionado.nombre} • {seleccionado.descripcion || `${seleccionado.ancho} × ${seleccionado.alto} mm`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Superior (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxTop}
            value={config.margenes.top}
            onChange={(e) => {
              const top = clamp(parseInt(e.target.value, 10), 0, maxTop)
              onChangeConfig({ ...config, margenes: { ...config.margenes, top } })
            }}
            className={cn('h-8', (config.margenes.top > 999 || verticalZero) && 'border-yellow-400')}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Inferior (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxBottom}
            value={config.margenes.bottom}
            onChange={(e) => {
              const bottom = clamp(parseInt(e.target.value, 10), 0, maxBottom)
              onChangeConfig({ ...config, margenes: { ...config.margenes, bottom } })
            }}
            className={cn('h-8', (config.margenes.bottom > 999 || verticalZero) && 'border-yellow-400')}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Izquierdo (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxLeft}
            value={config.margenes.left}
            onChange={(e) => {
              const left = clamp(parseInt(e.target.value, 10), 0, maxLeft)
              onChangeConfig({ ...config, margenes: { ...config.margenes, left } })
            }}
            className={cn('h-8', (config.margenes.left > 999 || horizontalZero) && 'border-yellow-400')}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Derecho (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxRight}
            value={config.margenes.right}
            onChange={(e) => {
              const right = clamp(parseInt(e.target.value, 10), 0, maxRight)
              onChangeConfig({ ...config, margenes: { ...config.margenes, right } })
            }}
            className={cn('h-8', (config.margenes.right > 999 || horizontalZero) && 'border-yellow-400')}
          />
        </div>
      </div>

      <EditorConEtiquetasPersonalizado
        contenido={valorHtml}
        onChange={onChangeHtml}
        minHeight={minHeight}
        tamanoPapel={undefined as any}
        tamanoPersonalizado={{ widthMm: pageInfo.widthMm, heightMm: pageInfo.heightMm }}
        margenes={config.margenes}
        habilitarEtiquetas={false}
      />
    </div>
  )
}
