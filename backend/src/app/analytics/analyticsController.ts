import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import ShopIncoming from "../shopIncoming/models/ShopIncoming.js";
import WarehouseIncoming from "../warehouseIncoming/models/WarehouseIncoming.js";
import Sale from "../sales/models/Sale.js";
import { SaleService } from "../sales/services/SaleService.js";

const saleService = new SaleService();

export const getDailyReport = catchAsync(
  async (req: Request, res: Response) => {
    const date = (req.query["date"] as string) || new Date().toISOString().slice(0, 10);
    const report = await saleService.getDailyReport(date);
    res.status(200).json({ status: "success", data: report });
  },
);

export const getWarehouseAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const records = await WarehouseIncoming.find();
    const units = records.flatMap((r) => r.serialNumberEntries);
    res.status(200).json({
      status: "success",
      data: {
        totalRecords: records.length,
        totalUnits: records.reduce((sum, r) => sum + r.quantity, 0),
        available: units.filter((u) => u.status === "available").length,
        transferred: units.filter((u) => u.status === "transferred").length,
        sold: units.filter((u) => u.status === "sold").length,
      },
    });
  },
);

export const getDashboardAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalSales,
      inStockResult,
      warehouseStockResult,
      lowStockResult,
      monthlySales,
      recentSales,
    ] = await Promise.all([
      // All sales for revenue + count
      Sale.find({}, { price: 1 }).lean(),

      // Count serial number entries with status "available"
      ShopIncoming.aggregate([
        { $unwind: "$serialNumberEntries" },
        { $match: { "serialNumberEntries.status": "available" } },
        { $count: "total" },
      ]),

      // Count warehouse units still available (not transferred/sold)
      WarehouseIncoming.aggregate([
        { $unwind: "$serialNumberEntries" },
        { $match: { "serialNumberEntries.status": "available" } },
        { $count: "total" },
      ]),

      // Count ShopIncoming records where availableCount <= 3 and > 0
      ShopIncoming.aggregate([
        { $unwind: "$serialNumberEntries" },
        { $match: { "serialNumberEntries.status": "available" } },
        {
          $group: {
            _id: "$_id",
            availableCount: { $sum: 1 },
          },
        },
        { $match: { availableCount: { $gt: 0, $lte: 3 } } },
        { $count: "total" },
      ]),

      // Sales grouped by month (last 6 months)
      Sale.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 5 most recent sales
      Sale.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("modelNumber serialNumber paymentStatus createdAt price")
        .lean(),
    ]);

    // Revenue: sum price directly from each sale
    const revenue = totalSales.reduce((sum, sale) => sum + (sale.price ?? 0), 0);

    const totalSalesCount = totalSales.length;

    const shopStock = inStockResult.length > 0 ? inStockResult[0].total : 0;
    const warehouseStock = warehouseStockResult.length > 0 ? warehouseStockResult[0].total : 0;
    const itemsInStock = shopStock + warehouseStock;
    const lowStockCount = lowStockResult.length > 0 ? lowStockResult[0].total : 0;

    // Build a full 6-month array, filling gaps with 0
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlySales.find(
        (m) => m._id.year === year && m._id.month === month,
      );
      months.push({
        month: d.toLocaleString("default", { month: "short" }),
        count: found ? found.count : 0,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        totalSales: totalSalesCount,
        revenue,
        itemsInStock,
        lowStockCount,
        monthlySales: months,
        recentSales,
      },
    });
  },
);
