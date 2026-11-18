import nodemailer from 'nodemailer';

export class EmailService {
  /**
   * Initializes Nodemailer transport using Gmail SMTP or custom configuration
   */
  private static getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Sends the 6-digit password reset OTP email
   */
  public static async sendPasswordResetOtp(
    toEmail: string,
    otp: string,
    recipientName?: string
  ): Promise<{ success: boolean; sent: boolean }> {
    const transporter = this.getTransporter();

    const subject = `🔐 YatraLekha Password Reset OTP: ${otp}`;
    const text = `Namaste ${recipientName || 'Transporter'},\n\nYour 6-digit verification OTP to reset your YatraLekha password is:\n\n${otp}\n\nThis OTP is valid for 15 minutes. If you did not request this password reset, please ignore this email.\n\nRegards,\nYatraLekha Security Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">YatraLekha <span style="color: #f59e0b; font-size: 14px;">v2.0</span></h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Commercial Fleet OS & Heavy-Haul Transport Network</p>
        </div>
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #475569; text-align: center;">
          <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">Password Reset Verification Code</p>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; padding: 12px; background: #0f172a; border-radius: 8px; margin: 16px 0; border: 1px dashed #64748b;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #fbbf24; margin-bottom: 0;">⏳ Valid for 15 minutes</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px; text-align: center;">
          If you didn't request a password reset for your YatraLekha account, you can safely ignore this email.
        </p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"YatraLekha Security" <${process.env.SMTP_USER}>`,
          to: toEmail,
          subject,
          text,
          html,
        });
        console.log(`[EmailService] ✓ Successfully dispatched OTP email to ${toEmail}`);
        return { success: true, sent: true };
      } catch (err: any) {
        console.error(`[EmailService] ✕ SMTP Dispatch error for ${toEmail}:`, err.message);
        return { success: false, sent: false };
      }
    } else {
      console.log(`[EmailService] SMTP credentials not yet injected. OTP for ${toEmail} is: ${otp}`);
      return { success: true, sent: false };
    }
  }
}
