import cors from "cors";
import morgan from "morgan";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createMongooseConnection } from "./database/mongooseConnection.js";
import { registerAPIRoutes } from "./routes/index.js";
import globalErrorHandler from "./middleware/errorController.js";
import AppError from "./utils/AppError.js";

const main = async () => {
  await createMongooseConnection();

  const app = express();

  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed = (process.env.CLIENT_URL || "http://localhost:5173" || "https://nonnytech.vercel.app")
          .split(",")
          .map((o) => o.trim());
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin ${origin} not allowed`));
        }
      },
      credentials: true,
    }),
  );

  // Handle JSON parsing errors
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }
    return next();
  });

  registerAPIRoutes(app);

  app.get("/", (_req: Request, res: Response) => {
    res.json({ status: "success", message: "Nonnytech API is running" });
  });

  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  app.use(globalErrorHandler);

  const httpServer = createServer(app);
  const port = process.env.PORT || 5000;

  httpServer.listen({ port }, () => {
    console.log(`🚀 API server ready at => http://localhost:${port}`);
  });
};

main().catch(console.error);
