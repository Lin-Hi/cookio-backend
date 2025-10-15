import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CookflowService } from './cookflow.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { Request } from 'express';

@ApiTags('cookflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CookflowController {
    constructor(private readonly service: CookflowService) {}

    private getUserId(req: Request): string {
        const id = (req as any)?.user?.id;
        if (!id) throw new ForbiddenException('Unauthenticated');
        return id;
    }

    @Get('queue')
    @ApiOperation({ summary: 'List queued recipes (with ingredients)' })
    listQueue(@Req() req: Request) {
        return this.service.listQueue(this.getUserId(req));
    }

    @Post('queue')
    @ApiOperation({ summary: 'Add a recipe to queue (idempotent)' })
    addToQueue(@Req() req: Request, @Body() dto: AddToQueueDto) {
        return this.service.addToQueue(this.getUserId(req), dto.recipeId);
    }

    @Delete('queue/:recipeId')
    @ApiOperation({ summary: 'Remove a recipe from queue' })
    removeFromQueue(@Req() req: Request, @Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.removeFromQueue(this.getUserId(req), recipeId);
    }
}
