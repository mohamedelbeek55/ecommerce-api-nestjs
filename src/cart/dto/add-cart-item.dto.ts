import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'Product ID to add to the cart',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Quantity to add (1-999)',
    example: 2,
    minimum: 1,
    maximum: 999,
  })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(999, { message: 'Quantity must not exceed 999' })
  quantity!: number;
}