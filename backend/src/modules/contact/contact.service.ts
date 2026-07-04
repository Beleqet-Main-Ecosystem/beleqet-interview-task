import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateContactDto) {
    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.toLowerCase().trim(),
        message: dto.message.trim(),
        plan: dto.plan?.trim() || null,
      },
    });

    this.logger.log(`Contact inquiry ${inquiry.id} from ${inquiry.email}`);
    return {
      id: inquiry.id,
      message: 'Your message has been received. Our team will get back to you shortly.',
    };
  }
}
