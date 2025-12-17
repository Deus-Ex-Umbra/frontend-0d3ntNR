import { MenuLateralMovil } from './MenuLateral_movil';
import { Monitor, Smartphone } from 'lucide-react';

export function VistaMovil() {
    return (
        <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
            <MenuLateralMovil />
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700 zoom-in-95">
                <div className="relative mb-8 p-6 rounded-full bg-primary/5 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <Monitor className="w-24 h-24 text-primary animate-pulse" strokeWidth={1.5} />
                    <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-full shadow-lg border-2 border-border">
                        <Smartphone className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-0.5 bg-destructive transform rotate-45 absolute" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-4 tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Versión de Escritorio Requerida
                </h2>

                <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
                    Para garantizar la mejor experiencia y acceder a todas las funcionalidades de <span className="font-semibold text-foreground">0d3ntApp</span>, por favor ingresa desde una computadora.
                </p>

                <div className="mt-8 flex gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
                </div>
            </div>
        </div>
    );
}
