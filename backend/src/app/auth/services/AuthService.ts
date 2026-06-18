import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import AppError from "../../../utils/AppError.js";

export class AuthService {
  signToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");
    return jwt.sign({ id: userId }, secret as jwt.Secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions);
  }

  verifyToken(token: string): { id: string } {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");
    return jwt.verify(token, secret) as { id: string };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  async getUserByEmailWithPassword(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select("+password");
  }

  async getUserByResetToken(hashedToken: string): Promise<IUser | null> {
    return await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: new Date() },
    });
  }
}
