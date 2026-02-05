export interface User {
  id?: number;       // El ? es porque al crear uno nuevo, el ID lo pone MySQL
  email: string;
  userName: string;
  avatarUrl?: string; // Opcional
  bio?: string;       // Opcional
}