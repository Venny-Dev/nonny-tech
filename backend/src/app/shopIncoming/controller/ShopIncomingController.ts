import { Request, Response, NextFunction } from "express";
import { ShopIncomingService } from "../services/ShopIncomingService.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

const service = new ShopIncomingService();

export const getAllShopIncoming = catchAsync(
  async (_req: Request, res: Response) => {
    const records = await service.getAll();
    res.status(200).json({ status: "success", data: records });
  },
);

export const getShopIncomingById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const record = await service.getById(req.params["id"] as string);
    if (!record) return next(new AppError("Shop incoming record not found", 404));
    res.status(200).json({ status: "success", data: record });
  },
);

export const createShopIncoming = catchAsync(
  async (req: Request, res: Response) => {
    const record = await service.create(req.body);
    res.status(201).json({ status: "success", data: record });
  },
);

export const updateShopIncoming = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const record = await service.update(req.params["id"] as string, req.body);
    if (!record) return next(new AppError("Shop incoming record not found", 404));
    res.status(200).json({ status: "success", data: record });
  },
);

export const deleteShopIncoming = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await service.deleteRecord(req.params["id"] as string);
    res.status(204).json({ status: "success", data: null });
  },
);

export const addEntries = catchAsync(
  async (req: Request, res: Response) => {
    const record = await service.addEntries(
      req.params["id"] as string,
      req.body.entries,
    );
    res.status(200).json({ status: "success", data: record });
  },
);

export const updateEntry = catchAsync(
  async (req: Request, res: Response) => {
    const record = await service.updateEntry(
      req.params["id"] as string,
      req.params["serialNumber"] as string,
      req.body,
    );
    res.status(200).json({ status: "success", data: record });
  },
);

export const deleteEntry = catchAsync(
  async (req: Request, res: Response) => {
    await service.deleteEntry(
      req.params["id"] as string,
      req.params["serialNumber"] as string,
    );
    res.status(204).json({ status: "success", data: null });
  },
);

export const searchAvailable = catchAsync(
  async (req: Request, res: Response) => {
    const results = await service.search((req.query["q"] as string) || "");
    res.status(200).json({ status: "success", data: results });
  },
);

export const getAvailable = catchAsync(
  async (_req: Request, res: Response) => {
    const records = await service.getAvailable();
    res.status(200).json({ status: "success", data: records });
  },
);
