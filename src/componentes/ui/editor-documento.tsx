import { useCallback, useEffect, useMemo, useState } from 'react'
import { EditorConEtiquetasPersonalizado } from '@/componentes/ui/editor-con-etiquetas-personalizado'
import { Label } from '@/componentes/ui/label'
import { Input } from '@/componentes/ui/input'
import { SelectConAgregar, OpcionSelectConAgregar } from '@/componentes/ui/select-with-add'
import { catalogoApi } from '@/lib/api'
import { cn } from '@/lib/utilidades'

export interface DocumentoConfig {
  tamano_hoja_id?: number | null
  nombre_tamano?: string | null
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
  soloLectura?: boolean
}

interface TamanoHojaItem {
  id: number
  nombre: string
  ancho: number
  alto: number
  descripcion?: string
  protegido: boolean
}

export function EditorDocumento({ valorHtml, onChangeHtml, config, onChangeConfig, className, minHeight = '200px', soloLectura = false }: EditorDocumentoProps) {
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

  useEffect(() => {
    if (!config.tamano_hoja_id && tamanos.length > 0) {
      const carta = buscarCartaPorDefecto(tamanos)
      if (carta) {
        onChangeConfig({
          ...config,
          tamano_hoja_id: carta.id,
          nombre_tamano: carta.nombre,
          widthMm: Math.round(carta.ancho),
          heightMm: Math.round(carta.alto),
        })
      }
    }
  }, [tamanos, config, onChangeConfig])

  const cargarTamanos = async () => {
    try {
      const res = await (catalogoApi as any).obtenerTamanosHoja?.()
      if (Array.isArray(res)) setTamanos(res)
    } catch (e) {
      console.error('Error cargando tamaños de hoja', e)
    }
  }

  const buscarCartaPorDefecto = (lista: TamanoHojaItem[]) => {
    const porNombre = lista.find(t => t.nombre?.toLowerCase().includes('carta'))
    if (porNombre) return porNombre
    return lista.find(t => Math.round(t.ancho) === 216 && Math.round(t.alto) === 279)
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
  const limiteVerticalMm = Math.max(0, Math.floor(pageMm.height * 0.25))
  const limiteHorizontalMm = Math.max(0, Math.floor(pageMm.width * 0.30))
  const toNonNegative = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0)
  const clampPair = (primero: number, segundo: number, limite: number): [number, number] => {
    const limpioPrimero = toNonNegative(primero)
    const limpioSegundo = toNonNegative(segundo)
    const cappedPrimero = Math.min(limpioPrimero, Math.max(0, limite - limpioSegundo))
    const cappedSegundo = Math.min(limpioSegundo, Math.max(0, limite - cappedPrimero))
    return [cappedPrimero, cappedSegundo]
  }
  const ajustarMargenes = useCallback((valores: DocumentoConfig['margenes']) => {
    const [top, bottom] = clampPair(valores.top, valores.bottom, limiteVerticalMm)
    const [left, right] = clampPair(valores.left, valores.right, limiteHorizontalMm)
    return { top, bottom, left, right }
  }, [limiteHorizontalMm, limiteVerticalMm])
  const margenesAjustados = useMemo(() => ajustarMargenes(config.margenes), [ajustarMargenes, config.margenes])
  useEffect(() => {
    const iguales = config.margenes.top === margenesAjustados.top
      && config.margenes.bottom === margenesAjustados.bottom
      && config.margenes.left === margenesAjustados.left
      && config.margenes.right === margenesAjustados.right
    if (!iguales) {
      onChangeConfig({ ...config, margenes: margenesAjustados })
    }
  }, [config, margenesAjustados, onChangeConfig])
  const anchoEscritura = Math.max(0, pageInfo.widthMm - margenesAjustados.left - margenesAjustados.right)
  const altoEscritura = Math.max(0, pageInfo.heightMm - margenesAjustados.top - margenesAjustados.bottom)

  const maxLeft = Math.max(0, limiteHorizontalMm - margenesAjustados.right)
  const maxRight = Math.max(0, limiteHorizontalMm - margenesAjustados.left)
  const maxTop = Math.max(0, limiteVerticalMm - margenesAjustados.bottom)
  const maxBottom = Math.max(0, limiteVerticalMm - margenesAjustados.top)
  const horizontalLimitReached = margenesAjustados.left + margenesAjustados.right >= limiteHorizontalMm
  const verticalLimitReached = margenesAjustados.top + margenesAjustados.bottom >= limiteVerticalMm

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid gap-3 md:grid-cols-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Tamaño de hoja</Label>
          <SelectConAgregar
            opciones={opciones}
            valor={config.tamano_hoja_id ? String(config.tamano_hoja_id) : ''}
            onChange={onSelectTamano}
            tamanoConfig={{ onCrear: onCrearTamano, ocultarDescripcion: true }}
            placeholder="Seleccionar tamaño"
            tituloModal="Agregar tamaño de hoja"
            descripcionModal="Ingresa nombre y medidas; se guardan en mm"
            placeholderInput="Nombre"
            textoAgregar='Agregar nuevo tamaño'
            disabled={soloLectura}
          />
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="text-foreground text-sm font-medium">
            Área escribible: {anchoEscritura} × {altoEscritura} mm (según márgenes actuales)
          </div>
          {seleccionado && (
            <div className="text-xs text-muted-foreground">
              Hoja seleccionada: {seleccionado.nombre} • {seleccionado.descripcion || `${seleccionado.ancho} × ${seleccionado.alto} mm`}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Los márgenes definen el área donde se puede escribir dentro de la página.</p>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Superior (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxTop}
            value={margenesAjustados.top}
            onChange={(e) => {
              const top = toNonNegative(parseInt(e.target.value, 10))
              const nuevos = ajustarMargenes({ ...config.margenes, top })
              onChangeConfig({ ...config, margenes: nuevos })
            }}
            className={cn('h-8', (margenesAjustados.top > 999 || verticalLimitReached) && 'border-yellow-400')}
            disabled={soloLectura}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Inferior (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxBottom}
            value={margenesAjustados.bottom}
            onChange={(e) => {
              const bottom = toNonNegative(parseInt(e.target.value, 10))
              const nuevos = ajustarMargenes({ ...config.margenes, bottom })
              onChangeConfig({ ...config, margenes: nuevos })
            }}
            className={cn('h-8', (margenesAjustados.bottom > 999 || verticalLimitReached) && 'border-yellow-400')}
            disabled={soloLectura}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Izquierdo (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxLeft}
            value={margenesAjustados.left}
            onChange={(e) => {
              const left = toNonNegative(parseInt(e.target.value, 10))
              const nuevos = ajustarMargenes({ ...config.margenes, left })
              onChangeConfig({ ...config, margenes: nuevos })
            }}
            className={cn('h-8', (margenesAjustados.left > 999 || horizontalLimitReached) && 'border-yellow-400')}
            disabled={soloLectura}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Derecho (mm)</Label>
          <Input
            type="number"
            min={0}
            max={maxRight}
            value={margenesAjustados.right}
            onChange={(e) => {
              const right = toNonNegative(parseInt(e.target.value, 10))
              const nuevos = ajustarMargenes({ ...config.margenes, right })
              onChangeConfig({ ...config, margenes: nuevos })
            }}
            className={cn('h-8', (margenesAjustados.right > 999 || horizontalLimitReached) && 'border-yellow-400')}
            disabled={soloLectura}
          />
        </div>
      </div>

      <EditorConEtiquetasPersonalizado
        contenido={valorHtml}
        onChange={onChangeHtml}
        minHeight={minHeight}
        tamanoPapel={undefined as any}
        tamanoPersonalizado={{ widthMm: pageInfo.widthMm, heightMm: pageInfo.heightMm }}
        margenes={margenesAjustados}
        habilitarEtiquetas={false}
        soloLectura={soloLectura}
      />
    </div>
  )
}