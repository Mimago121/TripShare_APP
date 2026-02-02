export interface MemberMini {
  id: number;
  name: string;
  avatarUrl?: string | null;
  status?: 'pending' | 'accepted';
}
