export interface MemberMini {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

export interface User extends MemberMini {
  email: string;
}
