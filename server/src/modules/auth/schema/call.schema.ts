import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallDocument = Call & Document;

@Schema({ timestamps: true })
export class Call {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Who made/received the call

  @Prop({ required: true })
  phoneNumber: string; // The number that was called

  @Prop()
  contactName?: string; // If contact exists, store name for display

  @Prop({ required: true, enum: ['outgoing', 'incoming', 'missed'] })
  callType: string;

  @Prop({ default: 0 })
  duration: number; // Call duration in seconds

  @Prop({ type: Date, default: Date.now })
  calledAt: Date; // When the call happened
}

export const CallSchema = SchemaFactory.createForClass(Call);

// Index for fast recent calls lookup
CallSchema.index({ userId: 1, calledAt: -1 });
