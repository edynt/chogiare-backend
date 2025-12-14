import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { APP_NAME } from '@common/constants/app.constants';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const mailConfig = this.configService.get('mail');

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
    });
  }

  async sendOTPEmail(email: string, fullName: string, otpCode: string): Promise<void> {
    const mailConfig = this.configService.get('mail');
    const appConfig = this.configService.get('app');

    const html = this.getOTPEmailTemplate(fullName, otpCode, appConfig?.name || APP_NAME);

    try {
      await this.transporter.sendMail({
        from: `"${mailConfig.from.name}" <${mailConfig.from.email}>`,
        to: email,
        subject: `Xác minh email của bạn - ${APP_NAME}`,
        html,
      });

      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, fullName: string, resetToken: string): Promise<void> {
    const mailConfig = this.configService.get('mail');
    const appConfig = this.configService.get('app');
    const frontendUrl = appConfig?.frontendUrl || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    const html = this.getPasswordResetEmailTemplate(
      fullName,
      resetUrl,
      appConfig?.name || APP_NAME,
    );

    try {
      await this.transporter.sendMail({
        from: `"${mailConfig.from.name}" <${mailConfig.from.email}>`,
        to: email,
        subject: `Đặt lại mật khẩu - ${APP_NAME}`,
        html,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private getOTPEmailTemplate(fullName: string, otpCode: string, appName: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác minh email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${appName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Chào mừng ${fullName}!
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Để hoàn tất quá trình đăng ký và kích hoạt tài khoản, vui lòng sử dụng mã OTP bên dưới để xác minh email của bạn.
              </p>
              
              <!-- OTP Code Box -->
              <table role="presentation" style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center;">
                      <p style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                        Mã xác minh của bạn
                      </p>
                      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; display: inline-block; margin: 10px 0;">
                        <span style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otpCode}
                        </span>
                      </div>
                      <p style="margin: 15px 0 0; color: #ffffff; font-size: 12px; opacity: 0.9;">
                        Mã này có hiệu lực trong 24 giờ
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                <strong>Lưu ý:</strong> Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này. Mã OTP sẽ tự động hết hạn sau 24 giờ.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px; text-align: center; line-height: 1.6;">
                Email này được gửi tự động từ hệ thống ${appName}. Vui lòng không trả lời email này.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${appName}. Tất cả quyền được bảo lưu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getPasswordResetEmailTemplate(
    fullName: string,
    resetUrl: string,
    appName: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${appName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Xin chào ${fullName}!
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3); color: #1a1a1a">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:
              </p>
              <p style="margin: 10px 0 0; color: #667eea; font-size: 12px; word-break: break-all; line-height: 1.6; font-family: 'Courier New', monospace; background-color: #f7fafc; padding: 12px; border-radius: 6px;">
                ${resetUrl}
              </p>
              
              <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px; text-align: center; line-height: 1.6;">
                Email này được gửi tự động từ hệ thống ${appName}. Vui lòng không trả lời email này.
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${appName}. Tất cả quyền được bảo lưu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
