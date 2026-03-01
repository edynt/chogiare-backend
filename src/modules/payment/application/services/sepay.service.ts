import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SepayBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface SepayQrData {
  qrUrl: string;
  bankInfo: SepayBankInfo;
  transferContent: string;
}

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);
  private readonly apiKey: string;
  private readonly bankName: string;
  private readonly accountNumber: string;
  private readonly accountName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SEPAY_API_KEY', '');
    this.bankName = this.configService.get<string>('SEPAY_BANK_NAME', '');
    this.accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER', '');
    this.accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME', '');
  }

  /**
   * Generate unique transfer content to identify the transaction.
   * Format: CGA{transactionId} (e.g., CGA123)
   */
  generateTransferContent(transactionId: number): string {
    return `CGA${transactionId}`;
  }

  /**
   * Build SePay QR code image URL with pre-filled transfer details.
   * When scanned, the banking app auto-fills amount and description.
   */
  generateQrUrl(amount: number, transferContent: string): string {
    const params = new URLSearchParams({
      acc: this.accountNumber,
      bank: this.bankName,
      amount: Math.round(amount).toString(),
      des: transferContent,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Generate complete QR payment data for a deposit transaction.
   */
  generateQrData(transactionId: number, amount: number): SepayQrData {
    const transferContent = this.generateTransferContent(transactionId);
    return {
      qrUrl: this.generateQrUrl(amount, transferContent),
      bankInfo: this.getBankInfo(),
      transferContent,
    };
  }

  getBankInfo(): SepayBankInfo {
    return {
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
    };
  }

  /**
   * Verify webhook API key from Authorization header.
   */
  verifyApiKey(authHeader: string | undefined): boolean {
    if (!authHeader || !this.apiKey) return false;
    // SePay sends: "Apikey {API_KEY}"
    const expectedHeader = `Apikey ${this.apiKey}`;
    return authHeader === expectedHeader;
  }

  /**
   * Extract transaction ID from transfer content.
   * Returns null if content doesn't match expected format.
   */
  extractTransactionId(content: string): number | null {
    if (!content) return null;
    // Match CGA{digits} pattern anywhere in the content
    const match = content.match(/CGA(\d+)/);
    if (!match) return null;
    const id = parseInt(match[1], 10);
    return isNaN(id) ? null : id;
  }
}
