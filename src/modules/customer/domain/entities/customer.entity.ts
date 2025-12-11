export class Customer {
  id: number;
  email: string;
  isVerified: boolean;
  status: boolean;
  language: string;
  createdAt: bigint;
  updatedAt: bigint;
  userInfo?: {
    fullName: string | null;
    avatarUrl: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    address: string | null;
    country: string | null;
  } | null;
  roles?: string[];
}
