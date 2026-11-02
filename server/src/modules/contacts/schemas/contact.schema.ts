import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { apiJson } from '../../../common/mongo';

export type ContactDocument = HydratedDocument<Contact>;

// Same shape as the client's Contact type: { id, firstName, lastName, phoneNumber, favorite }.
@Schema({ timestamps: true, toJSON: apiJson('userId', 'phoneDigits') })
export class Contact {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // Who owns this contact

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ default: '', trim: true })
  lastName: string; // Optional, like on a phone

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true })
  phoneDigits: string; // Digits of phoneNumber, so "024 123 4567" and "0241234567" match

  @Prop({ default: false })
  favorite: boolean;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// One contact per number per user; also serves "list my contacts" lookups.
ContactSchema.index({ userId: 1, phoneDigits: 1 }, { unique: true });
