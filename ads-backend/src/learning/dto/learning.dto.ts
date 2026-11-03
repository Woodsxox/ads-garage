import { IsInt, IsObject, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  step: number;
}

export class SubmitLessonDto {
  /** Exercise step index -> chosen option id, e.g. `{ "3": "b", "4": "a" }`. */
  @IsObject()
  answers: Record<string, string>;
}
