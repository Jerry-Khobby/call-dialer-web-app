import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { apiJson } from '../../../common/mongo';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, toJSON: apiJson('password', 'phoneDigits') })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string; // bcrypt hash, never returned by the API

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string; // As the user typed it, for display

  @Prop({ required: true, unique: true })
  phoneDigits: string; // Digits of phoneNumber: how callers reach this user
}

export const UserSchema = SchemaFactory.createForClass(User);
