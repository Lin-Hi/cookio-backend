import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import {ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CookflowService } from './cookflow.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { Request } from 'express';
import {MoveToCookedDto} from "./dto/move-to-cooked.dto";

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
    @ApiOkResponse({ description: 'Queued recipes loaded successfully.' })
    listQueue(@Req() req: Request) {
        return this.service.listQueue(this.getUserId(req));
    }

    @Post('queue')
    @ApiOperation({ summary: 'Add a recipe to queue (idempotent)' })
    @ApiCreatedResponse({ description: 'Recipe added to queue or already existed (idempotent).' })
    addToQueue(@Req() req: Request, @Body() dto: AddToQueueDto) {
        return this.service.addToQueue(this.getUserId(req), dto.recipeId);
    }

    @Delete('queue/:recipeId')
    @ApiOperation({ summary: 'Remove a recipe from queue' })
    @ApiOkResponse({ description: 'Recipe removed or already not in queue (idempotent).' })
    removeFromQueue(@Req() req: Request, @Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.removeFromQueue(this.getUserId(req), recipeId);
    }

    @Post('queue/move-to-cooked')
    @ApiOperation({ summary: 'Move selected queued recipes to cooked (batch)' })
    @ApiOkResponse({ description: 'Queued recipes moved to cooked. Returns { success, moved }.' })
    moveToCooked(@Req() req: Request, @Body() dto: MoveToCookedDto) {
        return this.service.moveToCooked(this.getUserId(req), dto.recipeIds);
    }

    @Get('cooked')
    @ApiOperation({ summary: 'List cooked recipes (recent first)' })
    @ApiOkResponse({ description: 'Cooked recipes loaded successfully.' })
    listCooked(@Req() req: Request) {
        return this.service.listCooked(this.getUserId(req));
    }

    @Post('cooked/:recipeId/requeue')
    @ApiOperation({ summary: 'Re-queue a cooked recipe' })
    @ApiCreatedResponse({ description: 'Recipe re-queued or already in queue (idempotent).' })
    requeue(@Req() req: Request, @Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.addToQueue(this.getUserId(req), recipeId);
    }
}