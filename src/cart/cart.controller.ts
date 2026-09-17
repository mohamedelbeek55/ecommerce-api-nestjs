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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

interface AuthenticatedUser {
  userId: string;
}

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  @ApiOperation({
    summary: 'Get current user cart',
    description:
      'Returns the authenticated user\'s cart. Creates an empty cart if none exists.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  getCart(@CurrentUser() user: AuthenticatedUser): Promise<CartResponseDto> {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'Adds a product to the cart. If the product already exists in the cart, the quantity is incremented.',
  })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added successfully, returns updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Product not found or invalid quantity',
    schema: {
      example: {
        statusCode: 400,
        message: 'Product not found',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Sets a new quantity for a product already in the cart.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to update',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quantity updated, returns updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid quantity',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not in cart',
    schema: {
      example: {
        statusCode: 404,
        message: 'Item not in cart',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  updateItemQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItemQuantity(user.userId, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Removes a single product from the cart.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove',
    example: 'cm1a2b3c4d5e6f7g8h9i0j1k',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed, returns updated cart',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not in cart',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.userId, productId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Clear cart',
    description: 'Removes all items from the cart, leaving it empty.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart cleared, returns empty cart',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  clearCart(@CurrentUser() user: AuthenticatedUser): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.userId);
  }
}