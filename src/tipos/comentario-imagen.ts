export interface ComentarioImagen {
    id: number;
    x: number;
    y: number;
    titulo: string;
    contenido: string;
    color: string;
    fecha_creacion: string;
    usuario?: {
        id: number;
        nombre: string;
    };
}

export interface CrearComentario {
    x: number;
    y: number;
    titulo: string;
    contenido: string;
    color?: string;
}

export interface ActualizarComentario {
    x?: number;
    y?: number;
    titulo?: string;
    contenido?: string;
    color?: string;
}
