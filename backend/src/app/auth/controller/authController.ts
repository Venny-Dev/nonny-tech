import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.js";
import User from "../models/User.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      if (!email || !password) return next(new AppError("Please provide email and password!", 400));

      const user = await this.authService.getUserByEmailWithPassword(email);
      // console.log(user);
      if (!user || !(await user.confirmPassword(password, user.password!))) {
        return next(new AppError("Incorrect email or password", 401));
      }

      const token = this.authService.signToken(user._id.toString());
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        token,
        user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
    },
  );

  /**
   * Verify the current auth cookie is still valid.
   * Called by the frontend on app load and periodically.
   */
  verify = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      let token: string | undefined;

      if (req.cookies?.authToken) {
        token = req.cookies.authToken;
      } else if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return next(new AppError("Not authenticated", 401));
      }

      const decoded = this.authService.verifyToken(token);
      const user = await User.findById(decoded.id).select("email firstName lastName");

      if (!user) {
        return next(new AppError("User no longer exists", 401));
      }

      res.status(200).json({
        status: "success",
        user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
    },
  );

  logout = (_req: Request, res: Response) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("authToken", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({ status: "success" });
  };
}
