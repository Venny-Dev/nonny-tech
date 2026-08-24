import WarehouseIncoming, {
  IWarehouseSerialNumberEntry,
  IWarehouseIncomingRecord,
} from "../models/WarehouseIncoming.js";
import AppError from "../../../utils/AppError.js";

interface WithCounts {
  filledCount: number;
  pendingSlots: number;
  availableCount: number;
  transferredCount: number;
  soldCount: number;
}

function withCounts(
  record: IWarehouseIncomingRecord,
): IWarehouseIncomingRecord & WithCounts {
  const obj = record.toObject() as IWarehouseIncomingRecord & WithCounts;
  const filledCount = record.serialNumberEntries.length;
  obj.filledCount = filledCount;
  obj.pendingSlots = record.quantity - filledCount;
  obj.availableCount = record.serialNumberEntries.filter(
    (e) => e.status === "available",
  ).length;
  obj.transferredCount = record.serialNumberEntries.filter(
    (e) => e.status === "transferred",
  ).length;
  obj.soldCount = record.serialNumberEntries.filter(
    (e) => e.status === "sold",
  ).length;
  return obj;
}

export class WarehouseIncomingService {
  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      WarehouseIncoming.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      WarehouseIncoming.countDocuments(),
    ]);
    return {
      records: records.map(withCounts),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const record = await WarehouseIncoming.findById(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);
    return withCounts(record);
  }

  async create(data: {
    modelNumber: string;
    processor: string;
    ram: string;
    storage: string;
    quantity: number;
    chargerQuantity?: number;
    serialNumberEntries?: Partial<IWarehouseSerialNumberEntry>[];
  }) {
    if (data.serialNumberEntries?.length) {
      await this.assertNoSerialConflicts(data.serialNumberEntries);
    }
    const record = await WarehouseIncoming.create(data);
    return withCounts(record);
  }

  async addEntries(id: string, entries: Partial<IWarehouseSerialNumberEntry>[]) {
    const record = await WarehouseIncoming.findById(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);

    const remaining = record.quantity - record.serialNumberEntries.length;
    if (entries.length > remaining) {
      throw new AppError(
        `Cannot add ${entries.length} entries: only ${remaining} slot(s) remaining`,
        400,
      );
    }

    await this.assertNoSerialConflicts(entries);

    record.serialNumberEntries.push(...(entries as IWarehouseSerialNumberEntry[]));
    await record.save();
    return withCounts(record);
  }

  async restock(
    id: string,
    additionalQuantity: number,
    entries: Partial<IWarehouseSerialNumberEntry>[] = [],
  ) {
    if (!Number.isInteger(additionalQuantity) || additionalQuantity < 1) {
      throw new AppError(
        `additionalQuantity must be a positive integer, received: ${additionalQuantity}`,
        400,
      );
    }

    const record = await WarehouseIncoming.findById(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);

    if (entries.length > additionalQuantity) {
      throw new AppError(
        `Cannot add ${entries.length} entries: additionalQuantity is ${additionalQuantity}`,
        400,
      );
    }

    await this.assertNoSerialConflicts(entries);

    record.quantity += additionalQuantity;
    record.serialNumberEntries.push(...(entries as IWarehouseSerialNumberEntry[]));
    await record.save();

    return withCounts(record);
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        IWarehouseIncomingRecord,
        "modelNumber" | "processor" | "ram" | "storage" | "chargerQuantity" | "quantity"
      >
    >,
  ) {
    const record = await WarehouseIncoming.findById(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);

    if (
      data.quantity !== undefined &&
      data.quantity < record.serialNumberEntries.length
    ) {
      throw new AppError(
        `Cannot set quantity to ${data.quantity}: ${record.serialNumberEntries.length} entries already filled`,
        400,
      );
    }

    const mutableFields = [
      "modelNumber",
      "processor",
      "ram",
      "storage",
      "chargerQuantity",
      "quantity",
    ] as const;

    for (const field of mutableFields) {
      if (data[field] !== undefined) {
        (record as any)[field] = data[field];
      }
    }

    await record.save();
    return withCounts(record);
  }

  async deleteRecord(id: string) {
    const record = await WarehouseIncoming.findByIdAndDelete(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);
  }

  async updateEntry(
    id: string,
    serialNumber: string,
    data: Partial<
      Pick<IWarehouseSerialNumberEntry, "condition" | "serialNumber">
    >,
  ) {
    // Guard: only "available" entries can be edited
    const record = await WarehouseIncoming.findById(id);
    if (!record) throw new AppError("Warehouse incoming record not found", 404);

    const entry = record.serialNumberEntries.find(
      (e) => e.serialNumber === serialNumber,
    );
    if (!entry) throw new AppError("Serial number entry not found", 404);
    if (entry.status !== "available") {
      throw new AppError(
        `Cannot edit entry ${serialNumber}: status is "${entry.status}". Only available entries can be edited.`,
        400,
      );
    }

    // If changing the serial number, check for conflicts
    if (data.serialNumber && data.serialNumber !== serialNumber) {
      const conflict = await WarehouseIncoming.findOne({
        "serialNumberEntries.serialNumber": data.serialNumber,
      });
      if (conflict) {
        throw new AppError(
          `Serial number ${data.serialNumber} already exists`,
          409,
        );
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (data.condition !== undefined)
      updateFields["serialNumberEntries.$[entry].condition"] = data.condition;
    if (data.serialNumber !== undefined)
      updateFields["serialNumberEntries.$[entry].serialNumber"] = data.serialNumber;

    const updated = await WarehouseIncoming.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      {
        new: true,
        arrayFilters: [{ "entry.serialNumber": serialNumber }],
      },
    );

    if (!updated) throw new AppError("Warehouse incoming record not found", 404);

    return withCounts(updated);
  }

  async deleteEntry(id: string, serialNumber: string) {
    const before = await WarehouseIncoming.findById(id);
    if (!before) throw new AppError("Warehouse incoming record not found", 404);

    const entry = before.serialNumberEntries.find(
      (e) => e.serialNumber === serialNumber,
    );
    if (!entry) throw new AppError("Serial number entry not found", 404);

    // Guard: only "available" entries can be deleted
    if (entry.status !== "available") {
      throw new AppError(
        `Cannot delete entry ${serialNumber}: status is "${entry.status}". Only available entries can be deleted.`,
        400,
      );
    }

    before.quantity -= 1;
    before.serialNumberEntries = before.serialNumberEntries.filter(
      (e) => e.serialNumber !== serialNumber,
    ) as any;
    await before.save();
  }

  async search(q: string) {
    const results = await WarehouseIncoming.aggregate([
      { $unwind: "$serialNumberEntries" },
      {
        $match: {
          "serialNumberEntries.serialNumber": {
            $regex: q,
            $options: "i",
          },
          "serialNumberEntries.status": "available",
        },
      },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          serialNumber: "$serialNumberEntries.serialNumber",
          entryId: "$serialNumberEntries._id",
          parentId: "$_id",
          modelNumber: 1,
          processor: 1,
          ram: 1,
          storage: 1,
          chargerQuantity: 1,
          condition: "$serialNumberEntries.condition",
        },
      },
    ]);
    return results;
  }

  async getAvailable() {
    const records = await WarehouseIncoming.find({
      "serialNumberEntries.status": "available",
    }).sort({ createdAt: -1 });
    return records.map(withCounts);
  }

  private async assertNoSerialConflicts(
    entries: Partial<IWarehouseSerialNumberEntry>[],
  ) {
    for (const entry of entries) {
      if (!entry.serialNumber) continue;
      const conflict = await WarehouseIncoming.findOne({
        "serialNumberEntries.serialNumber": entry.serialNumber,
      });
      if (conflict) {
        throw new AppError(
          `Serial number ${entry.serialNumber} already exists`,
          409,
        );
      }
    }
  }

  /**
   * Legacy migration: copy existing Shop Incoming records into the warehouse
   * so all stock starts from the warehouse going forward. Only runs when no
   * warehouse records exist yet to avoid accidental duplicates.
   *
   * After a successful copy, each migrated Shop Incoming record is deleted.
   * Records that fail to migrate are left untouched in Shop Incoming.
   */
  async migrateFromShop() {
    const existing = await WarehouseIncoming.countDocuments();
    if (existing > 0) {
      throw new AppError(
        "Warehouse records already exist — migration skipped to avoid duplicates",
        409,
      );
    }

    const ShopIncoming = (await import("../../shopIncoming/models/ShopIncoming.js"))
      .default as any;
    const shopRecords = await ShopIncoming.find();

    let migrated = 0;
    let deleted = 0;
    const failed: string[] = [];

    for (const record of shopRecords) {
      try {
        const entries = record.serialNumberEntries.map((e: any) => ({
          serialNumber: e.serialNumber,
          condition: e.condition,
          status: e.status === "sold" ? "sold" : "available",
          dateSold: e.dateSold ?? null,
        }));

        await WarehouseIncoming.create({
          modelNumber: record.modelNumber,
          processor: record.processor,
          ram: record.ram,
          storage: record.storage,
          quantity: record.quantity,
          chargerQuantity: record.chargerQuantity,
          serialNumberEntries: entries,
        });

        migrated++;

        // Only delete the shop record once it has been successfully migrated
        await ShopIncoming.findByIdAndDelete(record._id);
        deleted++;
      } catch {
        // Leave the shop record intact if migration failed for this entry
        failed.push(String(record._id));
      }
    }

    return { migrated, deleted, failed };
  }
}
