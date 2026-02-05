//esto es para entender lo que el back devuelve

import { MemberMini } from "../models/user.model";

export interface TripResponse {
  id: number;
  name: string;
  origin: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  members: MemberMini[];
}
