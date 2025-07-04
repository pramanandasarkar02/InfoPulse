// import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
// import { User } from './user.entity';
// import { Topic } from './topic.entity';

// @Entity('user_topics')
// export class UserTopic {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ManyToOne(() => User, user => user.userTopics)
//   user: User;

//   @ManyToOne(() => Topic, topic => topic.userTopics)
//   topic: Topic;

//   @CreateDateColumn()
//   createdAt: Date;
// }