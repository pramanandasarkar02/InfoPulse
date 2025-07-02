import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';
import { UserTopic } from '../entities/user-topic.entity';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserTopic)
    private userTopicRepository: Repository<UserTopic>,
  ) {}

  async addTopicToUser(userId: number, topicName: string): Promise<void> {
    // Find or create topic
    let topic = await this.topicRepository.findOne({ where: { name: topicName } });
    if (!topic) {
      topic = this.topicRepository.create({ name: topicName });
      topic = await this.topicRepository.save(topic);
    }

    // Find user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has this topic
    const existingUserTopic = await this.userTopicRepository.findOne({
      where: { user: { id: userId }, topic: { id: topic.id } },
    });

    if (!existingUserTopic) {
      // Add topic to user
      const userTopic = this.userTopicRepository.create({ user, topic });
      await this.userTopicRepository.save(userTopic);
    }
  }

  async removeTopicFromUser(userId: number, topicName: string): Promise<void> {
    const topic = await this.topicRepository.findOne({ where: { name: topicName } });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    await this.userTopicRepository.delete({
      user: { id: userId },
      topic: { id: topic.id },
    });
  }

  async setupDefaultTopicsForUser(userId: number): Promise<void> {
    const defaultTopics = ['Technology', 'Science', 'Sports'];
    
    for (const topicName of defaultTopics) {
      await this.addTopicToUser(userId, topicName);
    }
  }

  async getUserTopics(userId: number): Promise<string[]> {
    const userTopics = await this.userTopicRepository.find({
      where: { user: { id: userId } },
      relations: ['topic'],
    });

    return userTopics.map(ut => ut.topic.name);
  }

  async getAllTopics(): Promise<Topic[]> {
    return this.topicRepository.find();
  }
}