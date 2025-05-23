import { Injectable } from '@nestjs/common';
import { CreateRawNewDto } from './dto/create-raw_new.dto';
import { UpdateRawNewDto } from './dto/update-raw_new.dto';

@Injectable()
export class RawNewsService {
  create(createRawNewDto: CreateRawNewDto) {
    return 'This action adds a new rawNew';
  }

  findAll() {
    return `This action returns all rawNews`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rawNew`;
  }

  update(id: number, updateRawNewDto: UpdateRawNewDto) {
    return `This action updates a #${id} rawNew`;
  }

  remove(id: number) {
    return `This action removes a #${id} rawNew`;
  }
}
