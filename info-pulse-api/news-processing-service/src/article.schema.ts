// article.schema.ts (Update your schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArticleDocument = Article & Document;

@Schema()
export class Article {
  @Prop()
  id?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  url?: string;

  @Prop()
  author?: string;

  @Prop()
  source?: string;

  @Prop({ default: Date.now })
  insertionDate: Date;

  @Prop()
  summaryLarge?: string;

  @Prop()
  summarySmall?: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ type: [String], default: [] })
  images: string[];
}

export const ArticleSchema = SchemaFactory.createForClass(Article);