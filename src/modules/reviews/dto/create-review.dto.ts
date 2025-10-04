import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Create a review for a recipe */
export class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    content?: string;
}
