import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;
}
