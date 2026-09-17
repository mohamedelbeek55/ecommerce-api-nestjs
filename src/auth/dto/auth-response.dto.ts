import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty({
        description: 'JWT access token — use it in the Authorization header',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbT...',
    })
    accessToken!: string;

    @ApiProperty({
        description: 'JWT refresh token — use it to get a new access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbT...',
    })
    refreshToken!: string;
}