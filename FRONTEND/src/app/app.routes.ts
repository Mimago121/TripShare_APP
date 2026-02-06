import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { ProfileComponent } from './pages/profile/profile';
import { ItineraryComponent } from './pages/itinerary/itinerary';
import { ExpensesComponent } from './pages/expenses/expenses';
import { MemoriesComponent } from './pages/memories/memories';
import { FriendsComponent } from './pages/friends/friends';
import { ChatsComponent } from './pages/chats/chats';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard';
import { ChatRoomComponent } from './pages/chat-room/chat-room';
import { adminGuard } from './guards/admin.guard';
import { TripDetailComponent } from './pages/trip-detail/trip-detail';
import { HomeComponent } from './pages/home/home'; 
import { RegisterComponent } from './pages/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'itinerary', component: ItineraryComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'memories', component: MemoriesComponent },
  { path: 'chats', component: ChatsComponent },
  { path: 'chat/:uid', component: ChatRoomComponent },
  { path: 'trips/:id', component: TripDetailComponent },
  { path: 'friends', component: FriendsComponent },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
  },
  // IMPORTANTE: El comodín '**' SIEMPRE debe ser la última ruta
  { path: '**', redirectTo: 'login' }
];