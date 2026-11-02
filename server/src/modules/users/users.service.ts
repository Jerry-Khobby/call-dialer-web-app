import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { phoneDigits } from '../../common/phone';
import { User, UserDocument } from './schemas/user.schema';

export type NewUser = Pick<
  User,
  'email' | 'password' | 'fullName' | 'phoneNumber'
>;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  create(data: NewUser): Promise<UserDocument> {
    return this.users.create({
      ...data,
      phoneDigits: phoneDigits(data.phoneNumber),
    });
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.users.findById(id).exec();
  }

  /** Includes the password hash, for checking a login. */
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.users
      .findOne({ email: email.trim().toLowerCase() })
      .select('+password')
      .exec();
  }

  /** The registered user who owns this number, regardless of how it is formatted. */
  findByPhone(phone: string): Promise<UserDocument | null> {
    return this.users.findOne({ phoneDigits: phoneDigits(phone) }).exec();
  }
}
