export interface DepositPackage {
  id: number;
  name: string;
  amount: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
}
