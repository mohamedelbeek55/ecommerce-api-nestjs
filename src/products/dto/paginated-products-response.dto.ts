import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';

class PaginationMetaDto {
    @ApiProperty({ description: 'Total number of items', example: 100 })
    total!: number;

    @ApiProperty({ description: 'Current page number', example: 1 })
    page!: number;

    @ApiProperty({ description: 'Items per page', example: 10 })
    limit!: number;

    @ApiProperty({ description: 'Total number of pages', example: 10 })
    totalPages!: number;
}

export class PaginatedProductsResponseDto {
    @ApiProperty({
        description: 'Array of products for the current page',
        type: [ProductResponseDto],
    })
    data!: ProductResponseDto[];

    @ApiProperty({
        description: 'Pagination metadata',
        type: PaginationMetaDto,
    })
    meta!: PaginationMetaDto;
}