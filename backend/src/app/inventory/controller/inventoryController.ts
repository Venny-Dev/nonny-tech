import { Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/InventoryService.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

const inventoryService = new InventoryService();

export const getAllInventory = catchAsync(
  async (_req: Request, res: Response) => {
    const items = await inventoryService.getAll();
    res.status(200).json({ status: "success", data: items });
  },
);

export const getInventoryById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await inventoryService.getById(req.params["id"] as string);
    if (!item) return next(new AppError("Inventory item not found", 404));
    res.status(200).json({ status: "success", data: item });
  },
);

export const getInventoryBySerialNumber = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await inventoryService.getBySerialNumber(
      req.params["serialNumber"] as string,
    );
    if (!item) return next(new AppError("Inventory item not found", 404));
    res.status(200).json({ status: "success", data: item });
  },
);

export const getAvailableInventory = catchAsync(
  async (_req: Request, res: Response) => {
    const items = await inventoryService.getAvailable();
    res.status(200).json({ status: "success", data: items });
  },
);

export const createInventory = catchAsync(
  async (req: Request, res: Response) => {
    const item = await inventoryService.create(req.body);
    res.status(201).json({ status: "success", data: item });
  },
);

export const updateInventory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await inventoryService.update(
      req.params["id"] as string,
      req.body,
    );
    if (!item) return next(new AppError("Inventory item not found", 404));
    res.status(200).json({ status: "success", data: item });
  },
);

export const deleteInventory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const item = await inventoryService.delete(req.params["id"] as string);
    if (!item) return next(new AppError("Inventory item not found", 404));
    res.status(204).json({ status: "success", data: null });
  },
);
