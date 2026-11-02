import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCallDto, ListCallsQuery } from './dto/call.dto';
import { Call, CallDocument } from './schemas/call.schema';

const DEFAULT_LIMIT = 100;

@Injectable()
export class CallsService {
  constructor(@InjectModel(Call.name) private readonly calls: Model<Call>) {}

  /** Newest first, optionally only missed (or another type). */
  list(
    userId: string,
    { type, limit = DEFAULT_LIMIT }: ListCallsQuery = {},
  ): Promise<CallDocument[]> {
    return this.calls
      .find(type ? { userId, callType: type } : { userId })
      .sort({ calledAt: -1 })
      .limit(limit)
      .exec();
  }

  record(userId: string, dto: CreateCallDto): Promise<CallDocument> {
    return this.calls.create({ ...dto, userId });
  }

  async remove(userId: string, id: string): Promise<void> {
    const { deletedCount } = await this.calls
      .deleteOne({ _id: id, userId })
      .exec();
    if (deletedCount === 0) throw new NotFoundException('Call not found');
  }

  async clear(userId: string): Promise<void> {
    await this.calls.deleteMany({ userId }).exec();
  }
}
