import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../../common/parse-object-id.pipe';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@CurrentUser() { userId }: AuthUser) {
    return this.contacts.list(userId);
  }

  @Post()
  create(@CurrentUser() { userId }: AuthUser, @Body() dto: CreateContactDto) {
    return this.contacts.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() { userId }: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() { userId }: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.contacts.remove(userId, id);
  }
}
