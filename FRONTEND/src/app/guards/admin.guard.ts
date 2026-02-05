import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  console.log("🛡️ [GUARD] Modo Debug: Acceso Admin permitido automáticamente.");

  // Devolvemos true directamente. 
  // Esto salta cualquier comprobación de Firebase o Backend.
  return true; 
};