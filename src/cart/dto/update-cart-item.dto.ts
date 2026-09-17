import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for the cart item (1-999)',
    example: 5,
    minimum: 1,
    maximum: 999,
  })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(999, { message: 'Quantity must not exceed 999' })
  quantity!: number;
}