import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PLATFORM_IDS, type PlatformId } from '../platforms.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCampaignDto {
  @IsUUID()
  projectId: string;

  @IsIn(PLATFORM_IDS as unknown as string[])
  platformId: PlatformId;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsIn(['traffic', 'awareness', 'conversions'])
  objective: 'traffic' | 'awareness' | 'conversions';

  /** Dollars per day, up to two decimals. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100_000)
  dailyBudget: number;

  /** `YYYY-MM-DD`. */
  @Matches(ISO_DATE, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @Matches(ISO_DATE, { message: 'endDate must be YYYY-MM-DD' })
  endDate: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  audience: string;
}
