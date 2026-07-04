import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Henok Mekonnen' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'henok@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'I would like to learn more about the Enterprise plan.' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @ApiProperty({ required: false, example: 'enterprise' })
  @IsOptional()
  @IsString()
  plan?: string;
}
