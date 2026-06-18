import { Request, Response, NextFunction } from "express";
import { AuthService } from "../app/auth/services/AuthService.js";
import User from "../app/auth/models/User.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.cookies?.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please log in to access this route.", 401));
    }

    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    req.user = user;
    next();
  },
);
