export class User {
  id: string;
  email: string;
  username?: string;
  hashedPassword: string;
  isVerified: boolean;
  status: boolean;
  language: string;
  createdAt: bigint;
  updatedAt: bigint;
}

