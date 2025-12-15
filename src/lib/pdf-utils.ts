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


export async function generarPdfDesdeHtml(
  contenidoHtml: string,
  config: ConfiguracionPdf
): Promise<string> {
  return await pdfApi.generarDesdeHtml({
    contenido_html: contenidoHtml,
    config: config,
  });
}


export const TAMANOS_PAPEL = {
  carta: { widthMm: 216, heightMm: 279 },
  legal: { widthMm: 216, heightMm: 356 },
  a4: { widthMm: 210, heightMm: 297 },
} as const;

export const MARGENES_DEFECTO = { top: 20, right: 20, bottom: 20, left: 20 };
