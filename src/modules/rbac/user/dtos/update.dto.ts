import {
    IsNotEmpty,
    IsString,
    MaxLength,
    Matches,
    IsEmail,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsDateString,
  } from "class-validator";
  import { Transform } from "class-transformer";

  export class UpdateDto {
    @IsNotEmpty({ message: 'First name should not be empty' })
    @IsString()
    @MaxLength(50)
    firstName: string;

    @IsNotEmpty({ message: 'Last name should not be empty' })
    @IsString()
    @MaxLength(50)
    lastName: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(10)
    empId: string;

    @IsNotEmpty()
    @IsString()
    roleId: string;

    @IsOptional()
    @IsString()
    @MaxLength(1)
    @Matches(/^(M|F|O)$/, {
      message: 'Gender must be "M", "F", or "O".',
    })
    gender?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Invalid email address.' })
    @MaxLength(100)
    email?: string;

    @IsOptional()
    @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string (YYYY-MM-DD)' })
    dateOfBirth?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(15)
    @Transform(({ value }) => {
      // If mobile doesn't start with '88', prepend '88'
      if (!value.startsWith('88')) {
        return `88${value}`;
      }
      return value;
    })
    @Matches(/^88\d{11}$/, {
      message: 'Mobile number must start with "88" followed by 11 digits.',
    })
    phone: string;

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
