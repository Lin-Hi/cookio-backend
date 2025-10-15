import { IsArray, IsUUID } from 'class-validator';

export class MoveToCookedDto {
    @IsArray()
    @IsUUID('all', { each: true })
    recipeIds!: string[];
}
