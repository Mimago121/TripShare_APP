@Injectable({ providedIn: 'root' })
export class TripsService {
  constructor(private api: ApiService) {}

  //pedimos los viajes y lo mapeamos a carta(?)
  //falta
  getMyTrips() {
    return this.api
      .get<TripResponse[]>('/trips')
      .pipe(map((res) => res.map(this.mapTripResponseToCard)));
  }

  createTrip(dto: CreateTripRequest) {
    return this.api.post('/trips', dto);
  }
}
