import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
    @ApiProperty({
        description: 'Google ID token returned by Google Sign-In',
        example: 'eyJhbGciOiJSUzI1NiIs...',
    })
    @IsString()
    @MinLength(1)
    idToken: string;
}