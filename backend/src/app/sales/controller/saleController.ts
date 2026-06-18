import { Request, Response, NextFunction } from "express";
import { SaleService } from "../services/SaleService.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

const saleService = new SaleService();

export const getAllSales = catchAsync(async (req: Request, res: Response) => {
  const serialNumber = req.query["serialNumber"] as string | undefined;
  const sales = await saleService.getAll({ serialNumber });
  res.status(200).json({ status: "success", data: sales });
});

export const getSaleById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sale = await saleService.getById(req.params.id);
    if (!sale) return next(new AppError("Sale not found", 404));
    res.status(200).json({ status: "success", data: sale });
  },
);

export const createSale = catchAsync(async (req: Request, res: Response) => {
  const sale = await saleService.create(req.body);
  res.status(201).json({ status: "success", data: sale });
});

export const updateSaleStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { paymentStatus } = req.body;
    const allowed = ["pending", "paid", "returned"];
    if (!paymentStatus || !allowed.includes(paymentStatus)) {
      return next(new AppError("paymentStatus must be one of: pending, paid, returned", 400));
    }
    const sale = await saleService.updateStatus(req.params.id, paymentStatus);
    if (!sale) return next(new AppError("Sale not found", 404));
    res.status(200).json({ status: "success", data: sale });
  },
);

export const deleteSale = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sale = await saleService.delete(req.params.id);
    if (!sale) return next(new AppError("Sale not found", 404));
    res.status(204).json({ status: "success", data: null });
  },
);
