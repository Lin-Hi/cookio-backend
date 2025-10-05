import { PartialType } from '@nestjs/mapped-types';
import { CreatePantryItemDto } from './create-pantry-item.dto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class UpdatePantryItemDto extends PartialType(CreatePantryItemDto) {}
