import { Request, Response } from "express";
import { ShopIncomingService } from "../shopIncoming/services/ShopIncomingService.js";
import { WarehouseIncomingService } from "../warehouseIncoming/services/WarehouseIncomingService.js";
import catchAsync from "../../utils/catchAsync.js";

const shopService = new ShopIncomingService();
const warehouseService = new WarehouseIncomingService();

/**
 * Search both shop and warehouse available stock by serial number.
 * Results include a `source` field ("shop" | "warehouse") so the sale
 * can be auto-tagged by stock location.
 */
export const searchAllStock = catchAsync(async (req: Request, res: Response) => {
  const q = (req.query["q"] as string) || "";
  const source = req.query["source"] as "shop" | "warehouse" | undefined;

  if (!q.trim()) {
    return res.status(200).json({ status: "success", data: [] });
  }

  const searches: Promise<{ source: "shop" | "warehouse" }[]>[] = [];

  if (!source || source === "shop") {
    searches.push(
      shopService.search(q).then((results) => results.map((r) => ({ ...r, source: "shop" as const }))),
    );
  }
  if (!source || source === "warehouse") {
    searches.push(
      warehouseService.search(q).then((results) => results.map((r) => ({ ...r, source: "warehouse" as const }))),
    );
  }

  const resultSets = await Promise.all(searches);
  const data = resultSets.flat();

  res.status(200).json({ status: "success", data });
});
