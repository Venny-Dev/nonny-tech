import mongoose from "mongoose";
import Sale, { ISale, SaleSource } from "../models/Sale.js";
import ShopIncoming from "../../shopIncoming/models/ShopIncoming.js";
import WarehouseIncoming from "../../warehouseIncoming/models/WarehouseIncoming.js";
import TransferRequest from "../../transfers/models/TransferRequest.js";
import PartsLog from "../../partsLog/models/PartsLog.js";
import AppError from "../../../utils/AppError.js";

interface CreateSaleData {
  customerName: string;
  serialNumber: string;
  modelNumber: string;
  processor: string;
  ram: string;
  storage: string;
  chargerQuantity?: number;
  condition: string[];
  price: number;
  paymentStatus: "pending" | "paid" | "returned";
  inventoryItem?: string;
  warehouseRecord?: string;
  source?: SaleSource;
}

export class SaleService {
  async getAll(filters?: { serialNumber?: string; source?: SaleSource }): Promise<ISale[]> {
    const query: Record<string, unknown> = {};
    if (filters?.serialNumber) query.serialNumber = filters.serialNumber;
    if (filters?.source) query.source = filters.source;
    return await Sale.find(query)
      .populate("inventoryItem")
      .populate("warehouseRecord")
      .sort({ createdAt: -1 });
  }

  async getBySaleSerialNumber(serialNumber: string): Promise<ISale[]> {
    return await Sale.find({ serialNumber }).populate("inventoryItem").populate("warehouseRecord").sort({ createdAt: -1 });
  }

  async getById(id: string): Promise<ISale | null> {
    return await Sale.findById(id).populate("inventoryItem").populate("warehouseRecord");
  }

  async create(data: CreateSaleData): Promise<ISale> {
    // Validate RAM is provided
    if (!data.ram || !data.ram.trim()) {
      throw new AppError("RAM is required and cannot be empty", 400);
    }
    if (!data.storage || !data.storage.trim()) {
      throw new AppError("Storage is required and cannot be empty", 400);
    }

    // Auto-detect source when not explicitly provided
    let source: SaleSource = data.source ?? "shop";
    let inventoryItem = data.inventoryItem;
    let warehouseRecord = data.warehouseRecord;

    if (!data.source) {
      // Prefer shop stock, and only consider *available* units so a unit that
      // has been transferred to the shop is not mis-tagged as a warehouse sale.
      const inShop = await ShopIncoming.findOne({
        "serialNumberEntries.serialNumber": data.serialNumber,
        "serialNumberEntries.status": "available",
      });
      const inWarehouse = await WarehouseIncoming.findOne({
        "serialNumberEntries.serialNumber": data.serialNumber,
        "serialNumberEntries.status": "available",
      });

      if (inShop) {
        source = "shop";
        inventoryItem = inShop._id.toString();
      } else if (inWarehouse) {
        source = "warehouse";
        warehouseRecord = inWarehouse._id.toString();
      }
    }

    let entryUpdate: Record<string, unknown> = {};
    let arrayFilters: Record<string, unknown>[] = [];

    if (source === "warehouse") {
      if (!warehouseRecord) {
        throw new AppError("warehouseRecord is required for a warehouse sale", 400);
      }
      const record = await WarehouseIncoming.findById(warehouseRecord);
      if (!record) throw new AppError("Warehouse record not found", 404);

      const entry = record.serialNumberEntries.find(
        (e) => e.serialNumber === data.serialNumber,
      );
      if (!entry) {
        throw new AppError(
          `Unit ${data.serialNumber} not found in the specified warehouse record`,
          400,
        );
      }
      if (entry.status === "sold") {
        throw new AppError(`Unit ${data.serialNumber} is already sold`, 409);
      }
      if (entry.status === "transferred") {
        throw new AppError(
          `Unit ${data.serialNumber} has been transferred to the shop and cannot be sold from the warehouse`,
          409,
        );
      }

      entryUpdate = {
        $set: {
          "serialNumberEntries.$[entry].status": "sold",
          "serialNumberEntries.$[entry].dateSold": new Date(),
        },
      };
      arrayFilters = [{ "entry.serialNumber": data.serialNumber }];
    } else {
      if (!inventoryItem) {
        throw new AppError("inventoryItem is required for a shop sale", 400);
      }
      const record = await ShopIncoming.findById(inventoryItem);
      if (!record) throw new AppError("Shop incoming record not found", 404);

      const entry = record.serialNumberEntries.find(
        (e) => e.serialNumber === data.serialNumber,
      );
      if (!entry) {
        throw new AppError(
          `Unit ${data.serialNumber} not found in the specified record`,
          400,
        );
      }
      if (entry.status === "sold") {
        throw new AppError(`Unit ${data.serialNumber} is already sold`, 409);
      }

      entryUpdate = {
        $set: {
          "serialNumberEntries.$[entry].status": "sold",
          "serialNumberEntries.$[entry].dateSold": new Date(),
        },
      };
      arrayFilters = [{ "entry.serialNumber": data.serialNumber }];
    }

    const saleDoc = {
      customerName: data.customerName,
      serialNumber: data.serialNumber,
      modelNumber: data.modelNumber,
      processor: data.processor,
      ram: data.ram,
      storage: data.storage,
      chargerQuantity: data.chargerQuantity ?? 0,
      condition: data.condition,
      price: data.price,
      paymentStatus: data.paymentStatus,
      source,
      inventoryItem: source === "shop" ? inventoryItem : undefined,
      warehouseRecord: source === "warehouse" ? warehouseRecord : undefined,
    };

    // Build PartsLog docs for RAM/storage differences (works for both shop and warehouse)
    const partsLogDocs: {
      serialNumber: string;
      shopIncomingId: mongoose.Types.ObjectId;
      partType: "ram" | "storage";
      originalValue: string;
      soldValue: string;
      removedValue: string;
    }[] = [];

    // For shop sales, use the ShopIncoming record
    if (source === "shop" && inventoryItem) {
      const record = await ShopIncoming.findById(inventoryItem);
      if (record) {
        if (data.ram !== record.ram) {
          partsLogDocs.push({
            serialNumber: data.serialNumber,
            shopIncomingId: record._id as mongoose.Types.ObjectId,
            partType: "ram",
            originalValue: record.ram,
            soldValue: data.ram,
            removedValue: `${record.ram} removed`,
          });
        }
        if (data.storage !== record.storage) {
          partsLogDocs.push({
            serialNumber: data.serialNumber,
            shopIncomingId: record._id as mongoose.Types.ObjectId,
            partType: "storage",
            originalValue: record.storage,
            soldValue: data.storage,
            removedValue: `${record.storage} removed`,
          });
        }
      }
    }

    // For warehouse sales, also track RAM/storage changes against the warehouse record
    if (source === "warehouse" && warehouseRecord) {
      const record = await WarehouseIncoming.findById(warehouseRecord);
      if (record) {
        if (data.ram !== record.ram) {
          partsLogDocs.push({
            serialNumber: data.serialNumber,
            shopIncomingId: record._id as mongoose.Types.ObjectId,
            partType: "ram",
            originalValue: record.ram,
            soldValue: data.ram,
            removedValue: `${record.ram} removed`,
          });
        }
        if (data.storage !== record.storage) {
          partsLogDocs.push({
            serialNumber: data.serialNumber,
            shopIncomingId: record._id as mongoose.Types.ObjectId,
            partType: "storage",
            originalValue: record.storage,
            soldValue: data.storage,
            removedValue: `${record.storage} removed`,
          });
        }
      }
    }

    const stockId = source === "warehouse" ? warehouseRecord : inventoryItem;
    const applyStockUpdate = (session?: mongoose.ClientSession) => {
      if (source === "warehouse") {
        return WarehouseIncoming.findOneAndUpdate(
          { _id: stockId },
          entryUpdate,
          { arrayFilters, session },
        );
      }
      return ShopIncoming.findOneAndUpdate(
        { _id: stockId },
        entryUpdate,
        { arrayFilters, session },
      );
    };

    let session: mongoose.ClientSession | null = null;

    try {
      session = await mongoose.startSession();
    } catch {
      // Replica set not available — fall back to non-transactional writes
      const sale = await Sale.create(saleDoc);
      await applyStockUpdate();
      if (partsLogDocs.length > 0) {
        await PartsLog.create(partsLogDocs);
      }
      return sale;
    }

    try {
      session.startTransaction();

      const [sale] = await Sale.create([saleDoc], { session, ordered: true });

      await applyStockUpdate(session);

      if (partsLogDocs.length > 0) {
        await PartsLog.create(partsLogDocs, { session, ordered: true });
      }

      await session.commitTransaction();
      return sale;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async updateStatus(id: string, paymentStatus: "pending" | "paid" | "returned"): Promise<ISale | null> {
    const sale = await Sale.findById(id)
      .populate("inventoryItem")
      .populate("warehouseRecord");
    if (!sale) throw new AppError("Sale not found", 404);

    // When a sale is marked as returned, restore the unit back to "available"
    // in the source inventory.
    if (paymentStatus === "returned" && sale.paymentStatus !== "returned") {
      const entryUpdate = {
        $set: {
          "serialNumberEntries.$[entry].status": "available",
          "serialNumberEntries.$[entry].dateSold": null,
        },
      };
      const arrayFilters = [{ "entry.serialNumber": sale.serialNumber }];

      if (sale.source === "warehouse" && sale.warehouseRecord) {
        await WarehouseIncoming.findOneAndUpdate(
          { _id: sale.warehouseRecord },
          entryUpdate,
          { arrayFilters },
        );
      } else if (sale.source === "shop" && sale.inventoryItem) {
        await ShopIncoming.findOneAndUpdate(
          { _id: sale.inventoryItem },
          entryUpdate,
          { arrayFilters },
        );
      }
    }

    sale.paymentStatus = paymentStatus;
    await sale.save();

    return await Sale.findById(id)
      .populate("inventoryItem")
      .populate("warehouseRecord");
  }

  async delete(id: string): Promise<ISale | null> {
    return await Sale.findByIdAndDelete(id);
  }

  async getDailyReport(date: string) {
    // The app operates on Nigeria time (UTC+1), so a Lagos calendar day runs
    // from 23:00 UTC the previous day to 22:59:59.999 UTC. Align the report
    // boundaries to that so it matches how sales are grouped on the frontend.
    const start = new Date(`${date}T00:00:00.000`);
    start.setUTCHours(start.getUTCHours() - 1);
    const end = new Date(`${date}T23:59:59.999`);
    end.setUTCHours(end.getUTCHours() - 1);

    const [sales, transfers] = await Promise.all([
      Sale.find({ soldAt: { $gte: start, $lte: end } })
        .sort({ soldAt: 1 })
        .populate("inventoryItem")
        .populate("warehouseRecord"),
      TransferRequest.find({ respondedAt: { $gte: start, $lte: end }, status: "approved" })
        .sort({ respondedAt: 1 })
        .populate("requestedBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email"),
    ]);

    const shop = sales.filter((s) => s.source === "shop");
    const warehouse = sales.filter((s) => s.source === "warehouse");

    const summarize = (list: ISale[]) => ({
      count: list.length,
      revenue: list.reduce((sum, s) => sum + (s.price ?? 0), 0),
      pendingCount: list.filter((s) => s.paymentStatus === "pending").length,
      paidCount: list.filter((s) => s.paymentStatus === "paid").length,
      returnedCount: list.filter((s) => s.paymentStatus === "returned").length,
    });

    // Summarise transfers: total requests approved and total units moved
    const transferSummary = {
      count: transfers.length,
      unitsMoved: transfers.reduce((sum, t) => sum + t.entries.length, 0),
    };

    return {
      date,
      shop: summarize(shop),
      warehouse: summarize(warehouse),
      total: summarize(sales),
      sales,
      transfers,
      transferSummary,
    };
  }
}
