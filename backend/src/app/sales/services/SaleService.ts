import mongoose from "mongoose";
import Sale, { ISale } from "../models/Sale.js";
import ShopIncoming from "../../shopIncoming/models/ShopIncoming.js";
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
  paymentStatus: "paid" | "returned";
  inventoryItem: string;
}

export class SaleService {
  async getAll(filters?: { serialNumber?: string }): Promise<ISale[]> {
    return await Sale.find(filters?.serialNumber ? { serialNumber: filters.serialNumber } : {})
      .populate("inventoryItem")
      .sort({ createdAt: -1 });
  }

  async getBySaleSerialNumber(serialNumber: string): Promise<ISale[]> {
    return await Sale.find({ serialNumber }).populate("inventoryItem").sort({ createdAt: -1 });
  }

  async getById(id: string): Promise<ISale | null> {
    return await Sale.findById(id).populate("inventoryItem");
  }

  async create(data: CreateSaleData): Promise<ISale> {
    const record = await ShopIncoming.findById(data.inventoryItem);
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
      inventoryItem: data.inventoryItem,
    };

    // Build PartsLog documents for any RAM or storage differences
    const partsLogDocs: {
      serialNumber: string;
      shopIncomingId: mongoose.Types.ObjectId;
      partType: "ram" | "storage";
      originalValue: string;
      soldValue: string;
      removedValue: string;
    }[] = [];

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

    const entryUpdate = {
      $set: {
        "serialNumberEntries.$[entry].status": "sold",
        "serialNumberEntries.$[entry].dateSold": new Date(),
      },
    };
    const arrayFilters = [{ "entry.serialNumber": data.serialNumber }];

    let session: mongoose.ClientSession | null = null;

    try {
      session = await mongoose.startSession();
    } catch {
      // Replica set not available — fall back to non-transactional writes
      const sale = await Sale.create(saleDoc);
      await ShopIncoming.findOneAndUpdate(
        { _id: data.inventoryItem },
        entryUpdate,
        { arrayFilters },
      );
      if (partsLogDocs.length > 0) {
        await PartsLog.create(partsLogDocs);
      }
      return sale;
    }

    try {
      session.startTransaction();

      const [sale] = await Sale.create([saleDoc], { session, ordered: true });

      await ShopIncoming.findOneAndUpdate(
        { _id: data.inventoryItem },
        entryUpdate,
        { session, arrayFilters },
      );

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
    return await Sale.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true, runValidators: true },
    ).populate("inventoryItem");
  }

  async delete(id: string): Promise<ISale | null> {
    return await Sale.findByIdAndDelete(id);
  }
}
