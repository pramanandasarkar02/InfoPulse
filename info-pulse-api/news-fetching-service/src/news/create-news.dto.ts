// news/create-news.dto.ts
import { IsString, IsUrl, IsArray, IsOptional, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value || '')
  summary?: string; // Note: this maps to 'summery' in the schema

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value || '')
  content?: string; // Made optional since extraction might fail

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    return [];
  })
  images: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    return [];
  })
  keywords: string[] = [];
}