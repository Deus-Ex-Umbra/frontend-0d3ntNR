/**
 * Utilidades para generación de PDF
 * 
 * Este archivo centraliza la generación de PDF. Ahora usa Puppeteer en el backend
 * para garantizar fidelidad visual idéntica a RenderizadorHtml.
 */
import { pdfApi } from './api';

export interface ConfiguracionPdf {
  widthMm: number;
  heightMm: number;
  margenes: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Genera un PDF a partir de contenido HTML usando Puppeteer en el backend.
 * Los estilos aplicados son idénticos a los del componente RenderizadorHtml,
 * garantizando fidelidad visual entre la vista previa y el PDF final.
 * 
 * @param contenidoHtml - El contenido HTML a convertir en PDF
 * @param config - Configuración del documento (tamaño de página y márgenes en mm)
 * @returns Promise<string> - El PDF en formato base64
 */
export async function generarPdfDesdeHtml(
  contenidoHtml: string,
  config: ConfiguracionPdf
): Promise<string> {
  return await pdfApi.generarDesdeHtml({
    contenido_html: contenidoHtml,
    config: config,
  });
}

/**
 * Configuraciones predefinidas para tamaños de papel comunes
 */
export const TAMANOS_PAPEL = {
  carta: { widthMm: 216, heightMm: 279 },
  legal: { widthMm: 216, heightMm: 356 },
  a4: { widthMm: 210, heightMm: 297 },
} as const;

export const MARGENES_DEFECTO = { top: 20, right: 20, bottom: 20, left: 20 };
