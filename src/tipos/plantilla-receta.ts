export interface PlantillaReceta {
  id: number;
  nombre: string;
  contenido: string;
  usuario_id: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  margen_superior: number;
  margen_inferior: number;
  margen_izquierdo: number;
  margen_derecho: number;
  tamano_papel?: 'carta' | 'legal' | 'a4';
  tamano_hoja_id?: number | null;
  ancho_mm?: number | null;
  alto_mm?: number | null;
}

export interface MedicamentoRecetaValor {
  id: number;
  nombre: string;
  indicaciones: string;
}
