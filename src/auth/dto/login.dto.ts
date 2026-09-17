import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address',
    example: 'ahmed@example.com',
    format: 'email',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password',
    example: 'P@ssw0rd123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}