import {
    IsNotEmpty,
    IsString,
    MaxLength,
    Matches,
    IsEmail,
    IsOptional,
    IsNumber,
    ValidateIf,
    Validate,
    IsBoolean,
    IsDateString,
  } from "class-validator";
  import { Transform } from "class-transformer";

  export class PermissionDto {
    @IsNotEmpty({ message: 'Name should not be empty' })
    @IsString()
    @MaxLength(50)
    name: string;

    @IsNotEmpty({ message: 'Slug should not be empty' })
    @IsString()
    @MaxLength(50)
    slug: string;

    @IsOptional()
    inactiveAt?: Date;

    @IsOptional()
    @IsNumber()
    inactiveBy?: number;

    @IsOptional()
    @IsNumber()
    createdBy?: number;

    @IsOptional()
    @IsNumber()
    updatedBy?: number;

    @IsOptional()
    @Transform(({ value }) => {
      if (value === '1' || value === 1 || value === true || value === 'true') return true;
      if (value === '0' || value === 0 || value === false || value === 'false') return false;
      return value;
    })
    @IsBoolean({ message: 'Invalid status value' })
    isActive?: boolean;
  }
