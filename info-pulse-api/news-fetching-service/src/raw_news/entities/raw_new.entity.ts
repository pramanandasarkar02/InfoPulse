import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RawNewsDocument = RawNews & Document;

@Schema({ timestamps: true })
export class RawNews {
  @Prop({ type: Object })
  source: {
    id?: string;
    name?: string;
  };

  @Prop()
  author: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  url: string;

  @Prop()
  urlToImage: string;

  @Prop()
  publishedAt: Date;

  @Prop({ type: Object })
  content: Record<string, any>;
}

export const RawNewsSchema = SchemaFactory.createForClass(RawNews);