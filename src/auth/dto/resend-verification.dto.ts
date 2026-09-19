import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationDto {
    @ApiProperty({
        description: 'Email address associated with the unverified account',
        example: 'ahmed@example.com',
        format: 'email',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(255)
    email!: string;
}