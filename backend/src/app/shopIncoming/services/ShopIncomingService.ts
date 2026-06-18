import ShopIncoming, {
  ISerialNumberEntry,
  IShopIncomingRecord,
} from "../models/ShopIncoming.js";
import AppError from "../../../utils/AppError.js";

interface WithCounts {
  filledCount: number;
  pendingSlots: number;
  availableCount: number;
}

function withCounts(record: IShopIncomingRecord): IShopIncomingRecord & WithCounts {
  const obj = record.toObject() as IShopIncomingRecord & WithCounts;
  const filledCount = record.serialNumberEntries.length;
  obj.filledCount = filledCount;
  obj.pendingSlots = record.quantity - filledCount;
  obj.availableCount = record.serialNumberEntries.filter(
    (e) => e.status === "available",
  ).length;
  return obj;
}

export class ShopIncomingService {
  async getAll() {
    const records = await ShopIncoming.find().sort({ createdAt: -1 });
    return records.map(withCounts);
  }

  async getById(id: string) {
    const record = await ShopIncoming.findById(id);
    if (!record) throw new AppError("Shop incoming record not found", 404);
    return withCounts(record);
  }

  async create(data: {
    modelNumber: string;
    processor: string;
    ram: string;
    storage: string;
    quantity: number;
    chargerQuantity?: number;
    serialNumberEntries?: Partial<ISerialNumberEntry>[];
  }) {
    if (data.serialNumberEntries?.length) {
      for (const entry of data.serialNumberEntries) {
        if (!entry.serialNumber) continue;
        const conflict = await ShopIncoming.findOne({
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

    const record = await ShopIncoming.create(data);
    return withCounts(record);
  }

  async addEntries(id: string, entries: Partial<ISerialNumberEntry>[]) {
    const record = await ShopIncoming.findById(id);
    if (!record) throw new AppError("Shop incoming record not found", 404);

    const remaining = record.quantity - record.serialNumberEntries.length;
    if (entries.length > remaining) {
      throw new AppError(
        `Cannot add ${entries.length} entries: only ${remaining} slot(s) remaining`,
        400,
      );
    }

    for (const entry of entries) {
      if (!entry.serialNumber) continue;
      const conflict = await ShopIncoming.findOne({
        "serialNumberEntries.serialNumber": entry.serialNumber,
      });
      if (conflict) {
        throw new AppError(
          `Serial number ${entry.serialNumber} already exists`,
          409,
        );
      }
    }

    record.serialNumberEntries.push(...(entries as ISerialNumberEntry[]));
    await record.save();
    return withCounts(record);
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        IShopIncomingRecord,
        "modelNumber" | "processor" | "ram" | "storage" | "chargerQuantity" | "quantity"
      >
    >,
  ) {
    const record = await ShopIncoming.findById(id);
    if (!record) throw new AppError("Shop incoming record not found", 404);

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
    const record = await ShopIncoming.findByIdAndDelete(id);
    if (!record) throw new AppError("Shop incoming record not found", 404);
  }

  async updateEntry(
    id: string,
    serialNumber: string,
    data: Partial<Pick<ISerialNumberEntry, "condition" | "status" | "dateSold">>,
  ) {
    const updateFields: Record<string, unknown> = {};
    if (data.condition !== undefined)
      updateFields["serialNumberEntries.$[entry].condition"] = data.condition;
    if (data.status !== undefined)
      updateFields["serialNumberEntries.$[entry].status"] = data.status;
    if (data.dateSold !== undefined)
      updateFields["serialNumberEntries.$[entry].dateSold"] = data.dateSold;

    const record = await ShopIncoming.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      {
        new: true,
        arrayFilters: [{ "entry.serialNumber": serialNumber }],
      },
    );

    if (!record) throw new AppError("Shop incoming record not found", 404);

    const entryExists = record.serialNumberEntries.some(
      (e) => e.serialNumber === serialNumber,
    );
    if (!entryExists) throw new AppError("Serial number entry not found", 404);

    return withCounts(record);
  }

  async deleteEntry(id: string, serialNumber: string) {
    const before = await ShopIncoming.findById(id);
    if (!before) throw new AppError("Shop incoming record not found", 404);

    const entryExists = before.serialNumberEntries.some(
      (e) => e.serialNumber === serialNumber,
    );
    if (!entryExists) throw new AppError("Serial number entry not found", 404);

    await ShopIncoming.findOneAndUpdate(
      { _id: id },
      { $pull: { serialNumberEntries: { serialNumber } } },
    );
  }

  async search(q: string) {
    const results = await ShopIncoming.aggregate([
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
    const records = await ShopIncoming.find({
      "serialNumberEntries.status": "available",
    }).sort({ createdAt: -1 });
    return records.map(withCounts);
  }
}
