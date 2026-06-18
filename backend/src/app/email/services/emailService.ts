import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/email.js";

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendPasswordResetEmail(email: string, resetURL: string) {
    await this.transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password. Valid for 10 minutes.</p>
        <a href="${resetURL}" target="_blank">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendVerificationEmail(email: string, verificationURL: string) {
    await this.transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: "Verify Your Nonnytech Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome to Nonnytech!</h2>
          <p style="color: #666; font-size: 16px; text-align: center;">
            Please verify your email address to get started.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationURL}" target="_blank" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 18px;">Verify My Email</a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            This link expires in 24 hours. If you did not create an account, ignore this email.
          </p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
