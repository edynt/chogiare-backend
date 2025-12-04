export class User {
  id: number;
  email: string;
  username?: string;
  hashedPassword: string;
  isVerified: boolean;
  status: boolean;
  language: string;
  createdAt: bigint;
  updatedAt: bigint;
}

