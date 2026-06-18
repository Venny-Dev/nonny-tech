import PartsLog, { IPartsLog } from "../models/PartsLog.js";

export class PartsLogService {
  async getAll(filters?: {
    shopIncomingId?: string;
    serialNumber?: string;
  }): Promise<IPartsLog[]> {
    const query: Record<string, unknown> = {};

    if (filters?.shopIncomingId) {
      query.shopIncomingId = filters.shopIncomingId;
    }

    if (filters?.serialNumber) {
      query.serialNumber = filters.serialNumber;
    }

    return PartsLog.find(query).sort({ removedAt: -1 });
  }
}
