import React from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { MenuLateral } from './MenuLateral';
import { MenuLateralMovil } from './MenuLateral_movil';
import { cn } from '@/lib/utilidades';

interface LayoutBaseProps {
  children: React.ReactNode;
}

export function LayoutBase({ children }: LayoutBaseProps) {
  const { es_escritorio } = useResponsive();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      {es_escritorio ? <MenuLateral /> : <MenuLateralMovil />}
      <main className={cn(
        "flex-1 overflow-y-auto",
        !es_escritorio && "pt-16"
      )}>
        {children}
      </main>
    </div>
  );
}