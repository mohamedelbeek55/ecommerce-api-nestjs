import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentResponseDto {
    @ApiProperty({
        description:
            'Stripe PaymentIntent client secret — pass this to Stripe.js on the frontend to complete the payment.',
        example: 'pi_3QaBcDeFgHiJkLmN_secret_XyZ123AbC456DeF789GhI',
    })
    clientSecret!: string;
}