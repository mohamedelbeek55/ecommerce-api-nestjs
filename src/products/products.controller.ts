import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List products',
    description:
      'Returns a paginated list of products with optional search, filtering, and sorting.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: PaginatedProductsResponseDto,
  })
  findAll(
    @Query() query: QueryProductDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'List products by category',
    description: 'Returns all products that belong to the specified category.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID (CUID)',
    example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  findByCategoryId(
    @Param('categoryId') categoryId: string,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.findByCategoryId(categoryId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Returns a single product by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID (CUID)',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new Error('Only image files are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a product (Admin only)',
    description:
      'Creates a new product with 1 to 5 product images.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Modern Wooden Chair',
        },
        description: {
          type: 'string',
          example: 'A comfortable modern wooden chair.',
        },
        price: {
          type: 'number',
          example: 149.99,
        },
        stock: {
          type: 'integer',
          example: 20,
        },
        categoryId: {
          type: 'string',
          example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: [
        'name',
        'description',
        'price',
        'stock',
        'categoryId',
        'images',
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or category not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files: Array<{
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    }>,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(dto, files);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new Error('Only image files are allowed'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update a product (Admin only)',
    description:
      'Updates product data. If images are provided, all existing product images are replaced.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID (CUID)',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Modern Wooden Chair',
        },
        description: {
          type: 'string',
          example: 'A comfortable modern wooden chair.',
        },
        price: {
          type: 'number',
          example: 149.99,
        },
        stock: {
          type: 'integer',
          example: 20,
        },
        categoryId: {
          type: 'string',
          example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional. Providing images replaces all existing product images.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or category not found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files?: Array<{
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    }>,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto, files);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product (Admin only)',
    description:
      'Permanently removes a product and its Cloudinary images.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID (CUID)',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  delete(@Param('id') id: string): Promise<void> {
    return this.productsService.delete(id);
  }
}