import { Module } from '@nestjs/common';
import { PublicRecipeController } from './publicRecipe.controller';
import { PublicRecipeService } from './publicRecipe.service';

@Module({
    controllers: [PublicRecipeController],
    providers: [PublicRecipeService],
    exports: [PublicRecipeService],
})
export class PublicRecipeModule {}

