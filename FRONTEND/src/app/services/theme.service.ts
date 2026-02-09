import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Usamos señales (signals) de Angular 17+ para reactividad instantánea
  currentTheme = signal<'light' | 'dark'>('light');

  constructor() {
    // Al iniciar, leemos la preferencia guardada o el sistema operativo
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Detectar preferencia del sistema operativo
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
    localStorage.setItem('theme', theme);
    
    // Aplicamos la clase al <html> o <body>
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}