import { Body, Controller, Get, Post } from '@nestjs/common';
import { NewsService } from './news.service';
import { News } from './news.schema';
import { CreateNewsDto } from './create-news.dto';


@Controller('news')
export class NewsController {
    constructor(private readonly newsService: NewsService){}

    @Post()
    async create(@Body() createNewsDto: CreateNewsDto): Promise<News>{
        return this.newsService.createNews(createNewsDto)
    }

    
}
