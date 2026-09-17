import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones',
    minLength: 2,
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'Premium noise-cancelling over-ear headphones with 30h battery life',
    minLength: 10,
    maxLength: 1000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description!: string;

  @ApiProperty({
    description: 'Product price (max 2 decimal places)',
    example: 199.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must have at most 2 decimal places' })
  @IsPositive({ message: 'Price must be greater than 0' })
  price!: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 42,
    minimum: 0,
  })
  @IsInt()
  @Min(0, { message: 'Stock cannot be negative' })
  stock!: number;

  @ApiProperty({
    description: 'Category ID this product belongs to',
    example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
  })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}