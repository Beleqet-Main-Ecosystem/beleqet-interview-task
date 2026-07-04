import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertCvDto {
  @ApiProperty({ description: 'Full CV document (experience, education, etc.)' })
  @IsObject()
  cvData: Record<string, unknown>;
}
