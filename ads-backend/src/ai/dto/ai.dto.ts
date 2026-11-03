import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { TONES, type Tone } from '../ai.provider.js';

export class GenerateCopyDto {
  /** What the ad is for, in plain words. */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt: string;

  @IsOptional()
  @IsIn(TONES as unknown as string[])
  tone?: Tone;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  variations?: number;

  /** Longest headline you can use, e.g. a platform limit. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(100)
  maxHeadlineChars?: number;

  /** A model id from GET /ai/models. Defaults to the best one your plan allows. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  model?: string;
}
