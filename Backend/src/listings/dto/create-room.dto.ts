import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomNumber!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  roomName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;
}

export class UpdateRoomDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomNumber?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  roomName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
