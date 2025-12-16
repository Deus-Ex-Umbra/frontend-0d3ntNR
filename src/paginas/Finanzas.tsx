import { useState } from 'react';
import { MenuLateral } from '@/componentes/MenuLateral';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/componentes/ui/tabs';
import { FinanzasMovimientos } from '@/componentes/finanzas/finanzas-movimientos';
import { FinanzasAnalisis } from '@/componentes/finanzas/finanzas-analisis';
import { Toaster } from '@/componentes/ui/toaster';

export default function Finanzas() {
  const [seccion_activa, setSeccionActiva] = useState('movimientos');

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      <MenuLateral />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight hover:text-primary transition-colors duration-200">
              Finanzas
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestión financiera de tu consultorio
            </p>
          </div>

          <Tabs value={seccion_activa} onValueChange={setSeccionActiva} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="analisis">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="movimientos" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
              <FinanzasMovimientos />
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
              <FinanzasAnalisis />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
