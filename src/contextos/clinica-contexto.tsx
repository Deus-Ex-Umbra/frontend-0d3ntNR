import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { catalogoApi } from '@/lib/api';

interface ConfiguracionClinica {
    logo: string;
    logo_enlace?: string;
    nombre_clinica?: string;
    mensaje_bienvenida_antes?: string;
    mensaje_bienvenida_despues?: string;
}

interface ClinicaContexto {
    config_clinica: ConfiguracionClinica;
    cargando: boolean;
    actualizarLogo: (logo: string) => void;
    actualizarConfigClinica: (config: Partial<ConfiguracionClinica>) => void;
    recargarConfigClinica: () => Promise<void>;
}

const CACHE_KEY = 'clinica-config-cache';

const ClinicaContext = createContext<ClinicaContexto | undefined>(undefined);

function obtenerCacheLocal(): ConfiguracionClinica | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error al leer caché de configuración de clínica:', error);
    }
    return null;
}

function guardarCacheLocal(config: ConfiguracionClinica): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    } catch (error) {
        console.error('Error al guardar caché de configuración de clínica:', error);
    }
}

export function ProveedorClinica({ children }: { children: ReactNode }) {
    // Inicializar con el caché local para evitar el "flash" del logo por defecto
    const [config_clinica, setConfigClinica] = useState<ConfiguracionClinica>(() => {
        const cached = obtenerCacheLocal();
        return cached || {
            logo: '',
            logo_enlace: '',
            nombre_clinica: '',
            mensaje_bienvenida_antes: 'Bienvenido,',
            mensaje_bienvenida_despues: '¿qué haremos hoy?',
        };
    });
    const [cargando, setCargando] = useState(true);

    const cargarConfiguracionClinica = async () => {
        try {
            const config = await catalogoApi.obtenerConfiguracionClinica();
            const nueva_config: ConfiguracionClinica = {
                logo: config.logo || '',
                logo_enlace: config.logo_enlace || '',
                nombre_clinica: config.nombre_clinica || '',
                mensaje_bienvenida_antes: config.mensaje_bienvenida_antes || 'Bienvenido,',
                mensaje_bienvenida_despues: config.mensaje_bienvenida_despues || '¿qué haremos hoy?',
            };
            setConfigClinica(nueva_config);
            guardarCacheLocal(nueva_config);
        } catch (error) {
            console.error('Error al cargar configuración de clínica:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarConfiguracionClinica();
    }, []);

    const actualizarLogo = (logo: string) => {
        setConfigClinica(prev => {
            const nueva_config = { ...prev, logo };
            guardarCacheLocal(nueva_config);
            return nueva_config;
        });
    };

    const actualizarConfigClinica = (config: Partial<ConfiguracionClinica>) => {
        setConfigClinica(prev => {
            const nueva_config = { ...prev, ...config };
            guardarCacheLocal(nueva_config);
            return nueva_config;
        });
    };

    const recargarConfigClinica = async () => {
        await cargarConfiguracionClinica();
    };

    return (
        <ClinicaContext.Provider
            value={{
                config_clinica,
                cargando,
                actualizarLogo,
                actualizarConfigClinica,
                recargarConfigClinica,
            }}
        >
            {children}
        </ClinicaContext.Provider>
    );
}

export function useClinica() {
    const contexto = useContext(ClinicaContext);
    if (contexto === undefined) {
        throw new Error('useClinica debe usarse dentro de un ProveedorClinica');
    }
    return contexto;
}
