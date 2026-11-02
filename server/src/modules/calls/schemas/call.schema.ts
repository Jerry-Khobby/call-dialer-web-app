import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { apiJson } from '../../../common/mongo';

export const CALL_TYPES = ['outgoing', 'incoming', 'missed'] as const;
export type CallType = (typeof CALL_TYPES)[number];

export type CallDocument = HydratedDocument<Call>;

// Same shape as the client's CallRecord: { id, phoneNumber, callType, duration, calledAt }.
@Schema({ timestamps: true, toJSON: apiJson('userId') })
export class Call {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Whose call history this entry belongs to

  @Prop({ required: true, trim: true })
  phoneNumber: string; // The other party's number

  @Prop()
  contactName?: string; // Display name at the time of the call, if known

  @Prop({ type: String, required: true, enum: CALL_TYPES })
  callType: CallType;

  @Prop({ default: 0, min: 0 })
  duration: number; // Call duration in seconds

  @Prop({ type: Date, default: Date.now })
  calledAt: Date; // When the call started
}

export const CallSchema = SchemaFactory.createForClass(Call);

// Index for fast recent calls lookup
CallSchema.index({ userId: 1, calledAt: -1 });
