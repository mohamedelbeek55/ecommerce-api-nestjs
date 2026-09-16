import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'up' | 'down';
}

/**
 * GET /api/v1/health
 *
 * Returns a JSON payload with the overall API status and DB reachability.
 * No auth required — designed to be called by load balancers and uptime monitors.
 */
@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and database health' })
  @ApiResponse({ status: 200, description: 'Health status returned' })
  async check(): Promise<HealthResponse> {
    const dbHealthy = await this.prisma.isHealthy();

    return {
      status: dbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'up' : 'down',
    };
  }
}
