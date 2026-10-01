import { ApiProperty } from '@nestjs/swagger';

class ProductImageResponseDto {
    @ApiProperty({
        description: 'Unique image identifier',
        example: 'cm1image123456789',
    })
    id!: string;

    @ApiProperty({
        description: 'Cloudinary secure image URL',
        example: 'https://res.cloudinary.com/example/image/upload/...',
    })
    url!: string;

    @ApiProperty({
        description: 'Cloudinary public ID',
        example: 'ecommerce/products/abc123',
    })
    publicId!: string;

    @ApiProperty({
        description: 'Image creation timestamp',
        format: 'date-time',
    })
    createdAt!: Date;
}

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
        example:
            'Premium noise-cancelling over-ear headphones with 30h battery',
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
        description: 'Product images',
        type: [ProductImageResponseDto],
    })
    images!: ProductImageResponseDto[];

    @ApiProperty({
        description: 'Product creation timestamp',
        format: 'date-time',
    })
    createdAt!: Date;

    @ApiProperty({
        description: 'Last product update timestamp',
        format: 'date-time',
    })
    updatedAt!: Date;
}