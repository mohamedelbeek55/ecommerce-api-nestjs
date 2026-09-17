import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address (will be lowercased automatically)',
    example: 'ahmed@example.com',
    format: 'email',
    maxLength: 255,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description:
      'Account password — 8 to 72 characters, must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    example: 'P@ssw0rd123',
    minLength: 8,
    maxLength: 72,
    format: 'password',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  password!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Ahmed Mohamed',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name!: string;
}