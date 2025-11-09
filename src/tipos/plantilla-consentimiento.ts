export interface PlantillaConsentimiento {
  id: number;
  nombre: string;
  contenido: string;
  usuario_id: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface EtiquetaReemplazable {
  etiqueta: string;
  descripcion: string;
  tipo: 'texto' | 'fecha' | 'numero' | 'catalogo';
  catalogo_id?: number;
}

export const ETIQUETAS_PREDEFINIDAS: EtiquetaReemplazable[] = [
  { etiqueta: '[PACIENTE_NOMBRE]', descripcion: 'Nombre del paciente', tipo: 'texto' },
  { etiqueta: '[PACIENTE_APELLIDOS]', descripcion: 'Apellidos del paciente', tipo: 'texto' },
  { etiqueta: '[PACIENTE_TELEFONO]', descripcion: 'Teléfono del paciente', tipo: 'texto' },
  { etiqueta: '[PACIENTE_CORREO]', descripcion: 'Correo del paciente', tipo: 'texto' },
  { etiqueta: '[PACIENTE_DIRECCION]', descripcion: 'Dirección del paciente', tipo: 'texto' },
  { etiqueta: '[FECHA_ACTUAL]', descripcion: 'Fecha actual', tipo: 'fecha' },
];
