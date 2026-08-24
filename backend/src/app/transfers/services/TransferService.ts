import mongoose from "mongoose";
import TransferRequest, {
  ITransferEntry,
  ITransferRequest,
  TransferDirection,
} from "../models/TransferRequest.js";
import WarehouseIncoming from "../../warehouseIncoming/models/WarehouseIncoming.js";
import ShopIncoming from "../../shopIncoming/models/ShopIncoming.js";
import AppError from "../../../utils/AppError.js";

interface CreateTransferData {
  warehouseRecordId?: string;
  shopRecordId?: string;
  serialNumbers: string[];
  note?: string;
  reason?: string;
  direction?: TransferDirection;
}

export class TransferService {
  async create(data: CreateTransferData, userId: string) {
    const { warehouseRecordId, shopRecordId, serialNumbers, note, reason } = data;
    const direction: TransferDirection = data.direction ?? "warehouse_to_shop";

    if (serialNumbers.length === 0) {
      throw new AppError("At least one serialNumber is required", 400);
    }

    if (direction === "shop_to_warehouse") {
      return this.createShopToWarehouse({ shopRecordId, serialNumbers, note, reason }, userId);
    }

    // --- warehouse → shop (original flow) ---
    if (!warehouseRecordId) {
      throw new AppError("warehouseRecordId is required for warehouse-to-shop transfers", 400);
    }

    const record = await WarehouseIncoming.findById(warehouseRecordId);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);

    // De-duplicate serials so a caller cannot request the same unit twice
    const uniqueSerials = Array.from(new Set(serialNumbers));

    // Resolve the requested serials against the warehouse record
    const entries: ITransferEntry[] = [];
    for (const serialNumber of uniqueSerials) {
      const entry = record.serialNumberEntries.find((e) => e.serialNumber === serialNumber);
      if (!entry) {
        throw new AppError(`Serial ${serialNumber} not found in warehouse record`, 400);
      }
      if (entry.status !== "available") {
        throw new AppError(
          `Serial ${serialNumber} is not available (status: ${entry.status})`,
          409,
        );
      }
      entries.push({
        serialNumber: entry.serialNumber,
        condition: entry.condition,
        modelNumber: record.modelNumber,
        processor: record.processor,
        ram: record.ram,
        storage: record.storage,
        chargerQuantity: record.chargerQuantity,
        warehouseEntryId: entry._id as mongoose.Types.ObjectId,
      });
    }

    // Block if any of these serials are already part of a pending transfer
    const pending = await TransferRequest.findOne({
      status: "pending",
      "entries.serialNumber": { $in: uniqueSerials },
    });
    if (pending) {
      throw new AppError(
        `One or more serials already have a pending transfer request`,
        409,
      );
    }

    const transfer = await TransferRequest.create({
      warehouseRecordId,
      direction: "warehouse_to_shop",
      entries,
      status: "pending",
      requestedBy: userId,
      note,
    });

    return this.populateTransfer(transfer);
  }

  private async createShopToWarehouse(
    data: { shopRecordId?: string; serialNumbers: string[]; note?: string; reason?: string },
    userId: string,
  ) {
    const { shopRecordId, serialNumbers, note, reason } = data;

    if (!shopRecordId) {
      throw new AppError("shopRecordId is required for shop-to-warehouse transfers", 400);
    }

    if (!reason || !reason.trim()) {
      throw new AppError("A reason is required when returning goods to the warehouse", 400);
    }

    const record = await ShopIncoming.findById(shopRecordId);
    if (!record) throw new AppError("Shop incoming record not found", 404);

    const uniqueSerials = Array.from(new Set(serialNumbers));
    const entries: ITransferEntry[] = [];

    for (const serialNumber of uniqueSerials) {
      const entry = record.serialNumberEntries.find((e) => e.serialNumber === serialNumber);
      if (!entry) {
        throw new AppError(`Serial ${serialNumber} not found in shop record`, 400);
      }
      if (entry.status !== "available") {
        throw new AppError(
          `Serial ${serialNumber} is not available (status: ${entry.status})`,
          409,
        );
      }
      entries.push({
        serialNumber: entry.serialNumber,
        condition: entry.condition,
        modelNumber: record.modelNumber,
        processor: record.processor,
        ram: record.ram,
        storage: record.storage,
        chargerQuantity: record.chargerQuantity,
        shopEntryId: entry._id as mongoose.Types.ObjectId,
      });
    }

    // Block if any serials are already part of a pending transfer
    const pending = await TransferRequest.findOne({
      status: "pending",
      "entries.serialNumber": { $in: uniqueSerials },
    });
    if (pending) {
      throw new AppError(
        `One or more serials already have a pending transfer request`,
        409,
      );
    }

    // Mark shop units as "transferred" so they can't be sold while pending
    await ShopIncoming.findOneAndUpdate(
      { _id: shopRecordId },
      {
        $set: {
          "serialNumberEntries.$[u].status": "transferred",
        },
      },
      { arrayFilters: [{ "u.serialNumber": { $in: uniqueSerials } }] },
    );

    const transfer = await TransferRequest.create({
      shopRecordId,
      direction: "shop_to_warehouse",
      entries,
      status: "pending",
      requestedBy: userId,
      note,
      reason: reason.trim(),
    });

    return this.populateTransfer(transfer);
  }

  async getAll(
    viewerRole: string,
    viewerId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    let query: Record<string, unknown> = {};
    if (viewerRole === "warehouse") {
      // Warehouse sees their own outgoing requests + incoming returns from shop
      query = { $or: [{ requestedBy: viewerId }, { direction: "shop_to_warehouse" }] };
    } else if (viewerRole === "shop") {
      // Shop sees incoming requests from warehouse + their own outgoing returns
      query = { $or: [{ direction: "warehouse_to_shop" }, { requestedBy: viewerId }] };
    }
    // admin: all

    // Date range filter
    if (dateFrom || dateTo) {
      const createdAt: Record<string, unknown> = {};
      if (dateFrom) createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setUTCHours(23, 59, 59, 999);
        createdAt.$lte = end;
      }
      query.createdAt = createdAt;
    }

    const transfers = await TransferRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("requestedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("warehouseRecordId", "modelNumber processor ram storage")
      .populate("shopRecordId", "modelNumber processor ram storage")
      .lean();

    return transfers.map((t) => ({
      ...t,
      count: t.entries.length,
      requestedByName: (t.requestedBy as any)?.firstName
        ? `${(t.requestedBy as any).firstName} ${(t.requestedBy as any).lastName ?? ""}`.trim()
        : (t.requestedBy as any)?.email,
      approvedByName: (t.approvedBy as any)?.firstName
        ? `${(t.approvedBy as any).firstName} ${(t.approvedBy as any).lastName ?? ""}`.trim()
        : (t.approvedBy as any)?.email,
    }));
  }

  async getById(id: string) {
    const transfer = await TransferRequest.findById(id)
      .populate("requestedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("warehouseRecordId")
      .populate("shopRecordId");
    if (!transfer) throw new AppError("Transfer request not found", 404);
    return transfer;
  }

  async approve(id: string, approvedBy: string) {
    // Claim the transfer atomically to prevent double-approval races
    const claim = async (session?: mongoose.ClientSession) =>
      TransferRequest.findOneAndUpdate(
        { _id: id, status: "pending" },
        { $set: { status: "approved", approvedBy, respondedAt: new Date() } },
        { new: true, session },
      );

    const moveStockToShop = async (transfer: ITransferRequest, session?: mongoose.ClientSession) => {
      // Group transferred entries by modelNumber so entries for the same laptop
      // model are consolidated into a single ShopIncoming record.
      const groups = new Map<string, ITransferEntry[]>();
      for (const entry of transfer.entries) {
        const key = entry.modelNumber;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(entry);
      }

      // Serial conflict check against shop stock
      for (const entry of transfer.entries) {
        const conflict = await ShopIncoming.findOne({
          "serialNumberEntries.serialNumber": entry.serialNumber,
        }).session(session ?? null);
        if (conflict) {
          throw new AppError(`Serial ${entry.serialNumber} already exists in shop stock`, 409);
        }
      }

      for (const [modelNumber, groupEntries] of groups) {
        // Find an existing shop record with the same model number
        const shopRecord = await ShopIncoming.findOne({ modelNumber }).session(session ?? null);

        if (shopRecord) {
          // Merge into the existing record: increase quantity and append entries
          shopRecord.quantity += groupEntries.length;
          shopRecord.serialNumberEntries.push(
            ...(groupEntries.map((e) => ({
              serialNumber: e.serialNumber,
              condition: e.condition,
              status: "available" as const,
              dateSold: null,
            })) as any),
          );
          await shopRecord.save({ session });
        } else {
          // No matching record — create a new one using the first entry's specs
          const first = groupEntries[0];
          await ShopIncoming.create(
            [
              {
                modelNumber: first.modelNumber,
                processor: first.processor,
                ram: first.ram,
                storage: first.storage,
                quantity: groupEntries.length,
                chargerQuantity: first.chargerQuantity,
                serialNumberEntries: groupEntries.map((e) => ({
                  serialNumber: e.serialNumber,
                  condition: e.condition,
                  status: "available" as const,
                  dateSold: null,
                })),
              },
            ],
            { session, ordered: true },
          );
        }
      }

      // Mark warehouse units as transferred
      const entryIds = transfer.entries.map((e) => e.warehouseEntryId);
      await WarehouseIncoming.updateOne(
        { _id: transfer.warehouseRecordId },
        {
          $set: {
            "serialNumberEntries.$[u].status": "transferred",
          },
        },
        { session, arrayFilters: [{ "u._id": { $in: entryIds } }] },
      );
    };

    const moveStockToWarehouse = async (transfer: ITransferRequest, session?: mongoose.ClientSession) => {
      // When returning from shop to warehouse, the warehouse entries already exist
      // with status "transferred". We flip them back to "available" and record
      // the return history (reason + who requested it + when).
      const serialNumbers = transfer.entries.map((e) => e.serialNumber);

      // Find the warehouse records that contain these transferred serials
      const warehouseRecords = await WarehouseIncoming.find({
        "serialNumberEntries.serialNumber": { $in: serialNumbers },
        "serialNumberEntries.status": "transferred",
      }).session(session ?? null);

      if (warehouseRecords.length === 0) {
        throw new AppError(
          "No matching transferred entries found in warehouse stock",
          404,
        );
      }

      const returnHistoryEntry = {
        reason: transfer.reason!,
        returnedAt: new Date(),
        returnedBy: transfer.requestedBy,
      };

      // Restore each matched entry back to "available" and append return history
      for (const whRecord of warehouseRecords) {
        const matchingSerials = whRecord.serialNumberEntries
          .filter((e) => serialNumbers.includes(e.serialNumber) && e.status === "transferred")
          .map((e) => e.serialNumber);

        if (matchingSerials.length > 0) {
          await WarehouseIncoming.findOneAndUpdate(
            { _id: whRecord._id },
            {
              $set: {
                "serialNumberEntries.$[u].status": "available",
              },
              $push: {
                "serialNumberEntries.$[u].returnHistory": returnHistoryEntry,
              },
            },
            {
              session,
              arrayFilters: [{ "u.serialNumber": { $in: matchingSerials } }],
            },
          );
        }
      }

      // Remove returned units from the shop record (delete the entries and reduce quantity)
      await ShopIncoming.findOneAndUpdate(
        { _id: transfer.shopRecordId },
        {
          $pull: {
            serialNumberEntries: { serialNumber: { $in: serialNumbers } },
          },
          $inc: { quantity: -serialNumbers.length },
        },
        { session },
      );
    };

    let session: mongoose.ClientSession | null = null;
    try {
      session = await mongoose.startSession();
    } catch {
      // Replica set not available — claim + move without a transaction.
      const claimed = await claim();
      if (!claimed) {
        throw new AppError("Transfer request not found or already processed", 409);
      }
      if (claimed.entries.length === 0) {
        throw new AppError("Transfer request has no entries", 400);
      }
      try {
        if (claimed.direction === "shop_to_warehouse") {
          await moveStockToWarehouse(claimed);
        } else {
          await moveStockToShop(claimed);
        }
      } catch (err) {
        await TransferRequest.updateOne(
          { _id: id },
          { $set: { status: "pending", approvedBy: null, respondedAt: null } },
        );
        throw err;
      }
      return this.getById(id);
    }

    try {
      session.startTransaction();
      const txnSession = session as mongoose.ClientSession;

      const transfer = await claim(txnSession);
      if (!transfer) {
        throw new AppError("Transfer request not found or already processed", 409);
      }
      if (transfer.entries.length === 0) {
        throw new AppError("Transfer request has no entries", 400);
      }

      if (transfer.direction === "shop_to_warehouse") {
        await moveStockToWarehouse(transfer, txnSession);
      } else {
        // Validate the warehouse units are still available before moving anything
        const warehouseRecord = await WarehouseIncoming.findById(transfer.warehouseRecordId).session(txnSession);
        if (!warehouseRecord) throw new AppError("Warehouse record not found", 404);

        for (const entry of transfer.entries) {
          const unit = warehouseRecord.serialNumberEntries.find(
            (e) => e._id.toString() === entry.warehouseEntryId?.toString(),
          );
          if (!unit || unit.status !== "available") {
            throw new AppError(
              `Unit ${entry.serialNumber} is no longer available in the warehouse`,
              409,
            );
          }
        }

        await moveStockToShop(transfer, txnSession);
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }

    return this.getById(id);
  }

  async reject(id: string, approvedBy: string) {
    const transfer = await TransferRequest.findById(id);
    if (!transfer) throw new AppError("Transfer request not found", 404);
    if (transfer.status !== "pending") {
      throw new AppError(`Cannot reject a transfer that is already ${transfer.status}`, 409);
    }

    // For shop→warehouse returns, restore the shop units back to "available"
    if (transfer.direction === "shop_to_warehouse") {
      const serialNumbers = transfer.entries.map((e) => e.serialNumber);
      await ShopIncoming.findOneAndUpdate(
        { _id: transfer.shopRecordId },
        {
          $set: {
            "serialNumberEntries.$[u].status": "available",
          },
        },
        { arrayFilters: [{ "u.serialNumber": { $in: serialNumbers } }] },
      );
    }

    transfer.status = "rejected";
    transfer.approvedBy = new mongoose.Types.ObjectId(approvedBy);
    transfer.respondedAt = new Date();
    await transfer.save();

    return this.getById(id);
  }

  async cancel(id: string, userId: string) {
    const transfer = await TransferRequest.findById(id);
    if (!transfer) throw new AppError("Transfer request not found", 404);
    if (transfer.status !== "pending") {
      throw new AppError(`Cannot cancel a transfer that is already ${transfer.status}`, 409);
    }
    if (transfer.requestedBy.toString() !== userId) {
      throw new AppError("Only the requester can cancel this transfer", 403);
    }

    // For shop→warehouse returns, restore the shop units back to "available"
    if (transfer.direction === "shop_to_warehouse") {
      const serialNumbers = transfer.entries.map((e) => e.serialNumber);
      await ShopIncoming.findOneAndUpdate(
        { _id: transfer.shopRecordId },
        {
          $set: {
            "serialNumberEntries.$[u].status": "available",
          },
        },
        { arrayFilters: [{ "u.serialNumber": { $in: serialNumbers } }] },
      );
    }

    transfer.status = "cancelled";
    transfer.respondedAt = new Date();
    await transfer.save();

    return this.getById(id);
  }

  private async populateTransfer(transfer: ITransferRequest) {
    return await TransferRequest.findById(transfer._id)
      .populate("requestedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("warehouseRecordId", "modelNumber processor ram storage")
      .populate("shopRecordId", "modelNumber processor ram storage");
  }
}

