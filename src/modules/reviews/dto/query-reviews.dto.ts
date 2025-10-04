import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QueryReviewsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 10;

    @IsOptional()
    @IsIn(['latest', 'oldest', 'rating', 'rating_desc'])
    sort: 'latest' | 'oldest' | 'rating' | 'rating_desc' = 'latest';
}
