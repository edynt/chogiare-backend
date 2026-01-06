export class User {
  id: number;
  email: string;
  hashedPassword: string;
  isVerified: boolean;
  status: boolean;
  language: string;
  fullName: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  address: string | null;
  country: string | null;
  profileMetadata: Record<string, unknown> | null;
  createdAt: bigint;
  updatedAt: bigint;
}
