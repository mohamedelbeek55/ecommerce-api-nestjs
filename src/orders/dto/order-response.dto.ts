import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderItemResponseDto {
    @ApiProperty({
        description: 'Product ID',
        example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
    })
    productId!: string;

    @ApiProperty({
        description: 'Product name at the time of order (denormalized)',
        example: 'Wireless Bluetooth Headphones',
    })
    productName!: string;

    @ApiProperty({
        description: 'Unit price at the time of order (Decimal serialized)',
        example: '199.99',
    })
    unitPrice!: string;

    @ApiProperty({
        description: 'Quantity ordered',
        example: 2,
        minimum: 1,
    })
    quantity!: number;

    @ApiProperty({
        description: 'Subtotal for this item (unitPrice × quantity)',
        example: '399.98',
    })
    subtotal!: string;
}

export class OrderResponseDto {
    @ApiProperty({
        description: 'Unique order identifier (CUID)',
        example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
    })
    id!: string;

    @ApiProperty({
        description: 'Current order status',
        enum: OrderStatus,
        example: OrderStatus.PENDING,
    })
    status!: OrderStatus;

    @ApiProperty({
        description: 'Total order value (sum of all subtotals)',
        example: '499.97',
    })
    total!: string;

    @ApiProperty({
        description: 'Items included in this order',
        type: [OrderItemResponseDto],
    })
    items!: OrderItemResponseDto[];

    @ApiProperty({
        description: 'Order creation timestamp',
        example: '2026-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    createdAt!: Date;

    @ApiProperty({
        description: 'Last order update timestamp',
        example: '2026-01-15T10:35:00.000Z',
        format: 'date-time',
    })
    updatedAt!: Date;
}