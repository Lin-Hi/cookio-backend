import {Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UseGuards,} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // reuse your existing guard

@ApiTags('reviews')
@Controller()
export class ReviewsController {
    constructor(private readonly service: ReviewsService) {}

    // Mount on /recipes/:recipeId/reviews
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('recipes/:recipeId/reviews')
    create(
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
        @Body() dto: CreateReviewDto,
        @Req() req: any,
    ) {
        // req.user injected by JWT strategy
        return this.service.create(req.user.id, recipeId, dto);
    }

    @Get('recipes/:recipeId/reviews')
    list(
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
        @Query() q: QueryReviewsDto,
    ) {
        return this.service.list(recipeId, q);
    }

    // Generic endpoints on /reviews/:id
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put('reviews/:id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateReviewDto,
        @Req() req: any,
    ) {
        return this.service.update(id, req.user, dto);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete('reviews/:id')
    remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
        return this.service.remove(id, req.user);
    }
}
