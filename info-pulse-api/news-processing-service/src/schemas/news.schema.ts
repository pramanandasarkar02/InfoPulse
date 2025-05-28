import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProcessedNews extends Document {
  @Prop({ required: true })
  newsId: string;

  @Prop()
  summary: string;

  @Prop([String])
  keywords: string[];
}

export const ProcessedNewsSchema = SchemaFactory.createForClass(ProcessedNews);