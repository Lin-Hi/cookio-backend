import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsIn, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPantryQueryDto {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @Type(() => Number) @IsInt() @Min(1)
    page = 1;

    @ApiPropertyOptional({ default: 10, minimum: 1 })
    @Type(() => Number) @IsInt() @Min(1)
    limit = 10;

    @ApiPropertyOptional()
    @IsOptional() @IsString()
    q?: string;

    @ApiPropertyOptional({ enum: ['createdAt','name','expiresAt'] })
    @IsOptional() @IsIn(['createdAt','name','expiresAt'])
    sortBy?: 'createdAt'|'name'|'expiresAt';

    @ApiPropertyOptional({ enum: ['ASC','DESC'] })
    @IsOptional() @IsIn(['ASC','DESC'])
    order?: 'ASC'|'DESC';

    @ApiPropertyOptional({ description: 'days to expire' })
    @IsOptional() @Type(() => Number) @IsInt() @Min(0)
    expiringWithin?: number;

    @ApiPropertyOptional({ description: 'filter by category' })
    @IsOptional() @IsString()
    category?: string;
}
