import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Señal principal
  currentTheme = signal<'light' | 'dark'>('light');

  // 👇 ESTO ES LO QUE FALTABA: Un "getter" para que el HTML entienda 'isDarkMode'
  // Devuelve true si el tema actual es 'dark'
  get isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    // Comprobamos que estamos en el navegador (evita errores si usas SSR)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme); // Actualiza la señal
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    
    if (typeof document !== 'undefined') {
      // 1. Método moderno (Atributo data-theme)
      document.documentElement.setAttribute('data-theme', theme);
      
      // 2. Método clásico (Clase en el body)
      // Añadimos esto para asegurar compatibilidad con el CSS que te pasé antes (.dark-theme)
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }
}