import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoneDigits } from '../../common/phone';
import { CreateCallDto, ListCallsQuery } from './dto/call.dto';
import { Call, CallDocument } from './schemas/call.schema';

const DEFAULT_LIMIT = 100;

@Injectable()
export class CallsService {
  constructor(@InjectModel(Call.name) private readonly calls: Model<Call>) {}

  /** Newest first, optionally only one type (e.g. missed) and/or one number. */
  list(
    userId: string,
    { type, phone, limit = DEFAULT_LIMIT }: ListCallsQuery = {},
  ): Promise<CallDocument[]> {
    return this.calls
      .find({
        userId,
        ...(type && { callType: type }),
        ...(phone && { phoneDigits: phoneDigits(phone) }),
      })
      .sort({ calledAt: -1 })
      .limit(limit)
      .exec();
  }

  record(userId: string, dto: CreateCallDto): Promise<CallDocument> {
    return this.calls.create({
      ...dto,
      userId,
      phoneDigits: phoneDigits(dto.phoneNumber),
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const { deletedCount } = await this.calls
      .deleteOne({ _id: id, userId })
      .exec();
    if (deletedCount === 0) throw new NotFoundException('Call not found');
  }

  /** Deletes the given calls (ids that aren't the user's are ignored); returns how many went. */
  async removeMany(userId: string, ids: string[]): Promise<number> {
    const { deletedCount } = await this.calls
      .deleteMany({ userId, _id: { $in: ids } })
      .exec();
    return deletedCount;
  }

  async clear(userId: string): Promise<void> {
    await this.calls.deleteMany({ userId }).exec();
  }
}
