import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService, STRIPE_CLIENT } from './payments.service';
import Stripe from 'stripe';
import type { Env } from '../config/env.validation';

@Module({
  imports: [OrdersModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new Stripe(config.get('STRIPE_SECRET_KEY', { infer: true })),
    },
    PaymentsService,
  ],
})
export class PaymentsModule {}
