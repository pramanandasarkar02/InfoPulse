import { SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export class News extends Document {

}



export const NewsSchema = SchemaFactory.createForClass(News);