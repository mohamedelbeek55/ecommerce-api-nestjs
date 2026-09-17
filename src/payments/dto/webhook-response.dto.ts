import { ApiProperty } from '@nestjs/swagger';

export class WebhookResponseDto {
    @ApiProperty({
        description:
            'Always true. Tells Stripe the event was received successfully.',
        example: true,
    })
    received!: boolean;
}