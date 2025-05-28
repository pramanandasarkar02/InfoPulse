import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class News extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  content: string;

  @Prop()
  source: string;

  @Prop()
  publishedAt: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);