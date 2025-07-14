// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // Esta página es invisible para el usuario.
  // Su único trabajo es redirigir a la pantalla de inicio real.
  // Cambia el 'href' a la ruta que quieres que sea la inicial.
  
  // Por ejemplo, si la primera pantalla es la lista de trámites del inspector,
  // la ruta podría ser '/(inspector)/lista-tramites' o similar.
  // Usaré '/(inspector)' como ejemplo para que cargue la pantalla
  // 'index.tsx' que debería estar dentro de la carpeta '(inspector)'.
  
  return <Redirect href="/login" />;
}