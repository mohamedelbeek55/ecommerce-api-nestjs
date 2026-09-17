import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

interface AuthenticatedUser {
  userId: string;
}

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout — create an order from cart',
    description:
      'Creates a new order from the current cart contents, decrements product stock, and clears the cart. ' +
      'Fails if the cart is empty or if any product has insufficient stock.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cart is empty or insufficient stock',
    schema: {
      examples: {
        cartEmpty: {
          summary: 'Cart is empty',
          value: {
            statusCode: 400,
            message: 'Cart is empty',
            error: 'Bad Request',
          },
        },
        insufficientStock: {
          summary: 'Insufficient stock',
          value: {
            statusCode: 400,
            message: 'Insufficient stock',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  checkout(@CurrentUser() user: AuthenticatedUser): Promise<OrderResponseDto> {
    return this.ordersService.checkout(user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List current user orders',
    description:
      'Returns all orders placed by the authenticated user, most recent first.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description:
      'Returns a single order by ID. Only the owner of the order can access it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID (CUID)',
    example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found or does not belong to the current user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findById(user.userId, orderId);
  }
}