export type { Usuario, UsuarioInventario } from './usuario';

export type { Paciente, PacienteBasico } from './paciente';

export type { Cita, HoraLibre, ElementoAgenda } from './cita';

export type { 
  Inventario, 
  Producto, 
  Lote, 
  Activo, 
  ReporteValor, 
  MovimientoInventario 
} from './inventario';

export type { 
  MaterialCita, 
  MaterialCitaConfirmacion, 
  MaterialGeneral 
} from './material';

export type { Tratamiento, PlanTratamiento } from './tratamiento';

export type { Movimiento, ReporteFinanzas, DatosGrafico } from './finanzas';

export type { ItemCatalogo } from './catalogo';

export type { ArchivoAdjunto, EdicionVersion } from './archivo';

export type { Reporte, ReporteGenerado } from './reporte';
export { AreaReporte } from './reporte';

export type { PlantillaConsentimiento, EtiquetaReemplazable } from './plantilla-consentimiento';
export { ETIQUETAS_PREDEFINIDAS } from './plantilla-consentimiento';
