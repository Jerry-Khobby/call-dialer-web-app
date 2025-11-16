import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Who owns this contact

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  phoneNumber: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// Index for fast lookup
ContactSchema.index({ userId: 1 });
ContactSchema.index({ phoneNumber: 1 });