import { IsArray, IsInt, Min, ArrayMinSize } from 'class-validator';

export class SubmitAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  answers!: number[];
}
