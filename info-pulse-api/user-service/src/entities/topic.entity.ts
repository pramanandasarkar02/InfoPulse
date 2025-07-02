import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserTopic } from './user-topic.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => UserTopic, userTopic => userTopic.topic)
  userTopics: UserTopic[];
}
