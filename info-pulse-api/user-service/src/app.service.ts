import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getTopics(): string[] {
    return [
      'Technology',
      'Science',
      'Sports',
      'Entertainment',
      'Politics',
      'Health',
      'Education',
      'Travel'
    ];
  }
}
