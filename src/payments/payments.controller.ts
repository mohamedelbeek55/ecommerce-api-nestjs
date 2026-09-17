import {
  BadRequestException,
  Controller,
  Headers,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePaymentIntentResponseDto } from './dto/create-payment-intent-response.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { PaymentsService } from './payments.service';

interface AuthenticatedUser {
  userId: string;
}

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('orders/:orderId/intent')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a Stripe payment intent for an order',
    description:
      'Creates (or retrieves an existing) Stripe PaymentIntent for the given order. ' +
      'Returns a client secret that the frontend uses with Stripe.js to complete payment.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID (CUID)',
    example: 'cm9x8y7z6w5v4u3t2s1r0q9p',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment intent created (or retrieved) successfully',
    type: CreatePaymentIntentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Order not found, not in PENDING state, or total is invalid',
    schema: {
      examples: {
        orderNotFound: {
          summary: 'Order not found',
          value: {
            statusCode: 400,
            message: 'Order not found',
            error: 'Bad Request',
          },
        },
        notPending: {
          summary: 'Order is not pending payment',
          value: {
            statusCode: 400,
            message: 'Order is not pending payment',
            error: 'Bad Request',
          },
        },
        invalidTotal: {
          summary: 'Order total must be greater than zero',
          value: {
            statusCode: 400,
            message: 'Order total must be greater than zero',
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
  createPaymentIntent(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatePaymentIntentResponseDto> {
    return this.paymentsService.createPaymentIntent(orderId, user.userId);
  }

  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  handleWebhook(
    @Req() request: RawBodyRequest,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<WebhookResponseDto> {
    if (!request.rawBody) {
      throw new BadRequestException('Raw request body is not available');
    }
    return this.paymentsService.handleWebhookEvent(request.rawBody, signature);
  }
}