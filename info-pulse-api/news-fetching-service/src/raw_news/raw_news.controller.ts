import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RawNewsService } from './raw_news.service';
import { CreateRawNewDto } from './dto/create-raw_new.dto';
import { UpdateRawNewDto } from './dto/update-raw_new.dto';

@Controller()
export class RawNewsController {
  constructor(private readonly rawNewsService: RawNewsService) {}

  @MessagePattern('createRawNew')
  create(@Payload() createRawNewDto: CreateRawNewDto) {
    return this.rawNewsService.create(createRawNewDto);
  }

  @MessagePattern('findAllRawNews')
  findAll() {
    return this.rawNewsService.findAll();
  }

  @MessagePattern('findOneRawNew')
  findOne(@Payload() id: number) {
    return this.rawNewsService.findOne(id);
  }

  @MessagePattern('updateRawNew')
  update(@Payload() updateRawNewDto: UpdateRawNewDto) {
    return this.rawNewsService.update(updateRawNewDto.id, updateRawNewDto);
  }

  @MessagePattern('removeRawNew')
  remove(@Payload() id: number) {
    return this.rawNewsService.remove(id);
  }
}
