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
      const { password } = req.body;
      if (!password) return next(new AppError("Please provide a password!", 400));

      const adminPassword = process.env.APP_PASSWORD || "Nonnytech2026";
      const warehousePassword = process.env.WAREHOUSE_PASSWORD || "Diamond2026";
      const shopPassword = process.env.SHOP_PASSWORD || "aridex2026";

      let role: "admin" | "warehouse" | "shop" | null = null;
      if (adminPassword && password === adminPassword) {
        role = "admin";
      } else if (password === warehousePassword) {
        role = "warehouse";
      } else if (password === shopPassword) {
        role = "shop";
      }

      if (!role) {
        return next(new AppError("Incorrect password", 401));
      }

      // Find or create a user for this role
      const email = `${role}@nonnytech.com`;
      let user = await User.findOne({ email });
      if (user) {
        // Ensure the role is up to date
        if (user.role !== role) {
          user.role = role;
          await user.save();
        }
      } else {
        user = await User.create({
          email,
          password: password,
          passwordConfirm: password,
          firstName: role.charAt(0).toUpperCase() + role.slice(1),
          lastName: "User",
          role,
          isVerified: true,
        });
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
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
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
      const user = await User.findById(decoded.id).select("email firstName lastName role");

      if (!user) {
        return next(new AppError("User no longer exists", 401));
      }

      res.status(200).json({
        status: "success",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
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
