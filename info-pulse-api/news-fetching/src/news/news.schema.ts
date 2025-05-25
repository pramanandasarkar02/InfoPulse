import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class News extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  insertionDate: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);