// import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
// import { TopicService } from './topic.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @Controller('topics')
// @UseGuards(JwtAuthGuard)
// export class TopicController {
//   constructor(private topicService: TopicService) {}

//   @Get()
//   async getAllTopics() {
//     return this.topicService.getAllTopics();
//   }

//   @Get('my-topics')
//   async getMyTopics(@Request() req) {
//     return this.topicService.getUserTopics(req.user.sub);
//   }

//   @Post('add')
//   async addTopic(@Request() req, @Body('topicName') topicName: string) {
//     await this.topicService.addTopicToUser(req.user.sub, topicName);
//     return { message: 'Topic added successfully' };
//   }

//   @Delete('remove/:topicName')
//   async removeTopic(@Request() req, @Param('topicName') topicName: string) {
//     await this.topicService.removeTopicFromUser(req.user.sub, topicName);
//     return { message: 'Topic removed successfully' };
//   }

//   @Post('setup-defaults')
//   async setupDefaultTopics(@Request() req) {
//     await this.topicService.setupDefaultTopicsForUser(req.user.sub);
//     return { message: 'Default topics setup successfully' };
//   }
// }