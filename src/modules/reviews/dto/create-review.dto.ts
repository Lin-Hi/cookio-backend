import { IsInt, IsOptional, IsString, Max, Min, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'reviewContent', async: false })
export class ReviewContentValidator implements ValidatorConstraintInterface {
    validate(_value: any, args: ValidationArguments) {
        const obj = args.object as CreateReviewDto;

        // 如果有评分但没有内容，验证失败
        if (obj.rating && (!obj.content || obj.content.trim() === '')) {
            return false;
        }

        // 如果没有评分，必须有内容
        if (!obj.rating && (!obj.content || obj.content.trim() === '')) {
            return false;
        }

        return true;
    }

    defaultMessage(args: ValidationArguments) {
        const obj = args.object as CreateReviewDto;
        if (obj.rating && (!obj.content || obj.content.trim() === '')) {
            return 'Content is required when rating is provided';
        }
        if (!obj.rating && (!obj.content || obj.content.trim() === '')) {
            return 'Either rating with content or content alone is required';
        }
        return 'Invalid review data';
    }
}

/** Create a review for a recipe */
export class CreateReviewDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsString()
    @Validate(ReviewContentValidator)
    content?: string;
}
