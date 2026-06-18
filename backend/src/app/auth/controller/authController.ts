import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AuthService } from "../services/AuthService.js";
import User from "../models/User.js";
import {
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GetMeRequest,
} from "../inputs/AuthInputs.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";
import { emailService } from "../../email/services/emailService.js";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = catchAsync(
    async (req: SignupRequest, res: Response, next: NextFunction) => {
      const { email, password, passwordConfirm, firstName, lastName } = req.body;

      const newUser = await User.create({ email, password, passwordConfirm, firstName, lastName });
      const verificationToken = newUser.createVerificationToken();
      await newUser.save({ validateBeforeSave: false });

      try {
        const verificationURL = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;
        await emailService.sendVerificationEmail(newUser.email, verificationURL);

        const token = this.authService.signToken(newUser._id.toString());
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          status: "success",
          token,
          user: { id: newUser._id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName },
        });
      } catch (err) {
        newUser.verificationToken = undefined;
        newUser.verificationTokenExpires = undefined;
        await newUser.save({ validateBeforeSave: false });
        return next(new AppError("Error sending verification email. Try again later!", 500));
      }
    },
  );

  verifyEmail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const hashedToken = crypto.createHash("sha256").update(req.params.token as string).digest("hex");
      const user = await User.findOne({
        verificationToken: hashedToken,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) return next(new AppError("Token is invalid or has expired", 400));

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });

      const token = this.authService.signToken(user._id.toString());
      res.status(200).json({ status: "success", token, message: "Email verified successfully!" });
    },
  );

  login = catchAsync(
    async (req: LoginRequest, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      if (!email || !password) return next(new AppError("Please provide email and password!", 400));

      const user = await this.authService.getUserByEmailWithPassword(email);
      if (!user || !(await user.confirmPassword(password, user.password!))) {
        return next(new AppError("Incorrect email or password", 401));
      }

      const token = this.authService.signToken(user._id.toString());
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        token,
        user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
    },
  );

  forgotPassword = catchAsync(
    async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return next(new AppError("There is no user with that email address.", 404));

      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      try {
        const resetURL = `${process.env.CLIENT_URL || "http://localhost:3000"}/forgot-password?token=${resetToken}`;
        await emailService.sendPasswordResetEmail(user.email, resetURL);
        res.status(200).json({ status: "success", message: "Token sent to email!" });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Error sending email. Try again later!", 500));
      }
    },
  );

  resetPassword = catchAsync(
    async (req: ResetPasswordRequest, res: Response, next: NextFunction) => {
      const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
      const user = await this.authService.getUserByResetToken(hashedToken);

      if (!user) return next(new AppError("Token is invalid or has expired", 400));

      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();

      const token = this.authService.signToken(user._id.toString());
      res.status(200).json({ status: "success", token, message: "Password reset successful!" });
    },
  );

  getMe = catchAsync(
    async (req: GetMeRequest, res: Response, next: NextFunction) => {
      if (!req.user) return next(new AppError("You are not logged in!", 401));
      const user = await this.authService.getUserById(req.user.id);
      res.status(200).json({ status: "success", user });
    },
  );

  logout = (_req: Request, res: Response) => {
    res.cookie("authToken", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: "success" });
  };
}
