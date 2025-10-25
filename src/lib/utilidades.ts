import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ajustarFechaParaBackend(fecha: Date): Date {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const dia = fecha.getDate();
  const horas = fecha.getHours();
  const minutos = fecha.getMinutes();
  const segundos = fecha.getSeconds();
  
  return new Date(anio, mes, dia, horas, minutos, segundos);
}

export function formatearFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const segundos = String(fecha.getSeconds()).padStart(2, '0');
  
  return `${anio}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
}

export function formatearFechaSoloFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  
  return `${anio}-${mes}-${dia}`;
}

export function inicioDelDia(fecha: Date): Date {
  const nueva_fecha = new Date(fecha);
  nueva_fecha.setHours(0, 0, 0, 0);
  return nueva_fecha;
}

export function finDelDia(fecha: Date): Date {
  const nueva_fecha = new Date(fecha);
  nueva_fecha.setHours(23, 59, 59, 999);
  return nueva_fecha;
}