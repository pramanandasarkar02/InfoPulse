// news/news.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsDocument = News & Document;

@Schema({ timestamps: true })
export class News {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ required: true })
  summery: string; // Note: keeping the typo 'summery' as in your interface

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ default: Date.now })
  insertionDate: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);