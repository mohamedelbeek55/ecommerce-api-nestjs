import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({
        description: 'Email verification token received via email',
        example: '4f3a8b2c1d9e5f7a6b3c8d2e1f9a4b7c5d8e2f6a3b9c1d4e7f2a5b8c3d6e9f1a',
    })
    @IsString()
    @IsNotEmpty()
    token!: string;
}