import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    MaxLength,
} from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token received via email',
        example: '4f3a8b2c1d9e5f7a6b3c8d2e1f9a4b7c5d8e2f6a3b9c1d4e7f2a5b8c3d6e9f1a',
    })
    @IsString()
    @IsNotEmpty()
    token!: string;

    @ApiProperty({
        description:
            'New password — 8 to 72 characters with uppercase, lowercase, number, and special character',
        example: 'NewP@ssw0rd456',
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
    newPassword!: string;
}