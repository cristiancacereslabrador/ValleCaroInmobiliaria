import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUploadSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimetype?: string;

  @IsInt()
  @Min(1)
  size: number;

  @IsOptional()
  @IsIn(['tour360'])
  type?: string;
}
