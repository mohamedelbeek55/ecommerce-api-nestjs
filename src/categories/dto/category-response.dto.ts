import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
    @ApiProperty({
        description: 'Unique category identifier (CUID)',
        example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
    })
    id!: string;

    @ApiProperty({
        description: 'Category name (unique across all categories)',
        example: 'Electronics',
    })
    name!: string;

    @ApiProperty({
        description: 'Category creation timestamp',
        example: '2026-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    createdAt!: Date;
}