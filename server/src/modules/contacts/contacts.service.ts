import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isDuplicateKeyError } from '../../common/mongo';
import { phoneDigits } from '../../common/phone';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { Contact, ContactDocument } from './schemas/contact.schema';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
  ) {}

  /** Alphabetical, case-insensitive, like a phone's contact list. */
  list(userId: string): Promise<ContactDocument[]> {
    return this.contacts
      .find({ userId })
      .sort({ firstName: 1, lastName: 1 })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async get(userId: string, id: string): Promise<ContactDocument> {
    const contact = await this.contacts.findOne({ _id: id, userId }).exec();
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(
    userId: string,
    dto: CreateContactDto,
  ): Promise<ContactDocument> {
    try {
      return await this.contacts.create({
        ...dto,
        userId,
        phoneDigits: phoneDigits(dto.phoneNumber),
      });
    } catch (error) {
      throw await this.duplicateOr(error, userId, dto.phoneNumber);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateContactDto,
  ): Promise<ContactDocument> {
    const changes = dto.phoneNumber
      ? { ...dto, phoneDigits: phoneDigits(dto.phoneNumber) }
      : dto;
    let contact: ContactDocument | null;
    try {
      contact = await this.contacts
        .findOneAndUpdate({ _id: id, userId }, changes, {
          new: true,
          runValidators: true,
        })
        .exec();
    } catch (error) {
      throw await this.duplicateOr(error, userId, dto.phoneNumber ?? '');
    }
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async remove(userId: string, id: string): Promise<void> {
    const { deletedCount } = await this.contacts
      .deleteOne({ _id: id, userId })
      .exec();
    if (deletedCount === 0) throw new NotFoundException('Contact not found');
  }

  /** Turns a duplicate-number error into a 409 naming the contact that already has it. */
  private async duplicateOr(
    error: unknown,
    userId: string,
    phoneNumber: string,
  ): Promise<unknown> {
    if (!isDuplicateKeyError(error)) return error;
    const existing = await this.contacts
      .findOne({ userId, phoneDigits: phoneDigits(phoneNumber) })
      .exec();
    const name = existing
      ? `${existing.firstName} ${existing.lastName}`.trim()
      : 'another contact';
    return new ConflictException(`This number is already saved as ${name}`);
  }
}
