import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
    @ApiProperty({
        description: 'Product ID',
        example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
    })
    productId!: string;

    @ApiProperty({
        description: 'Product name (denormalized for convenience)',
        example: 'Wireless Bluetooth Headphones',
    })
    name!: string;

    @ApiProperty({
        description: 'Unit price as a string (Decimal serialized)',
        example: '199.99',
    })
    price!: string;

    @ApiProperty({
        description: 'Quantity in cart',
        example: 2,
        minimum: 1,
        maximum: 999,
    })
    quantity!: number;

    @ApiProperty({
        description: 'Subtotal for this item (price × quantity)',
        example: '399.98',
    })
    subtotal!: string;
}

export class CartResponseDto {
    @ApiProperty({
        description: 'Unique cart identifier (CUID)',
        example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
    })
    id!: string;

    @ApiProperty({
        description: 'Items currently in the cart',
        type: [CartItemResponseDto],
    })
    items!: CartItemResponseDto[];

    @ApiProperty({
        description: 'Total cart value (sum of all subtotals)',
        example: '499.97',
    })
    total!: string;
}