import { PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

/** Update review (rating/content). Only author or admin can. */
export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
