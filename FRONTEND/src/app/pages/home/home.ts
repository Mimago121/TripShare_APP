import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = 'Viajero';

  // DATOS PARA DASHBOARD (LOGUEADO)
  demoTrips = [
    {
      destination: 'Escapada a París',
      dates: '12 - 15 Oct',
      days: 4,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073',
      friends: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2']
    },
    {
      destination: 'Ruta por Japón',
      dates: 'Próximo Verano',
      days: 15,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070',
      friends: ['https://i.pravatar.cc/150?u=3']
    },
    {
      destination: 'Roadtrip USA',
      dates: 'Pendiente',
      days: 10,
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021',
      friends: []
    }
  ];

  popularDestinations = [
    { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000' },
    { name: 'Nueva York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070' },
    { name: 'Roma', country: 'Italia', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996' },
    { name: 'Santorini', country: 'Grecia', image: 'https://images.unsplash.com/photo-1613395877344-13d4c2ce5d4d?q=80&w=2070' }
  ];

  // DATOS PARA LANDING PAGE (NO LOGUEADO)
  testimonials = [
    {
      name: 'Lucia Gómez',
      comment: 'TripShare es la app que siempre soñé. Por fin dejamos de usar Excel para las cuentas del grupo.',
      avatar: 'https://i.pravatar.cc/150?u=marta'
    },
    {
      name: 'Pablo Ruiz',
      comment: 'La mejor forma de tener todos los billetes, reservas y la ruta en un solo sitio. Imprescindible.',
      avatar: 'https://i.pravatar.cc/150?u=pablo'
    },
    {
      name: 'Manolo Sánchez',
      comment: 'Organizamos nuestro viaje a Italia en una tarde. La función de gastos compartidos es magia.',
      avatar: 'https://i.pravatar.cc/150?u=iker'
    }
  ];

  constructor() {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.isLoggedIn = true;
      this.userName = user.userName;
    }
  }

  // Función para scroll suave en la Landing
  scrollToFeatures() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}