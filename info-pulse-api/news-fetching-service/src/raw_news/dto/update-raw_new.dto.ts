import { PartialType } from '@nestjs/mapped-types';
import { CreateRawNewDto } from './create-raw_new.dto';

export class UpdateRawNewDto extends PartialType(CreateRawNewDto) {
  id: number;
}
