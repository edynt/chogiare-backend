export class Address {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  city: string;
  state: string;
  district?: string;
  ward?: string;
  zipCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}

