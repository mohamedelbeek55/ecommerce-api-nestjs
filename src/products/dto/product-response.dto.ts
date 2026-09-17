import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
    @ApiProperty({
        description: 'Unique product identifier (CUID)',
        example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
    })
    id!: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Wireless Bluetooth Headphones',
    })
    name!: string;

    @ApiProperty({
        description: 'Product description',
        example: 'Premium noise-cancelling over-ear headphones with 30h battery',
    })
    description!: string;

    @ApiProperty({
        description: 'Product price as a string (Decimal serialized for JSON)',
        example: '199.99',
    })
    price!: string;

    @ApiProperty({
        description: 'Available stock quantity',
        example: 42,
        minimum: 0,
    })
    stock!: number;

    @ApiProperty({
        description: 'Category ID this product belongs to',
        example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
    })
    categoryId!: string;

    @ApiProperty({
        description: 'Product creation timestamp',
        example: '2026-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    createdAt!: Date;

    @ApiProperty({
        description: 'Last product update timestamp',
        example: '2026-01-20T14:45:00.000Z',
        format: 'date-time',
    })
    updatedAt!: Date;
}