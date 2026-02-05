export interface TripMember {
  id?: number;
  tripId: number;
  userId: number;
  role: 'admin' | 'member'; // Para saber quién puede borrar el viaje
}