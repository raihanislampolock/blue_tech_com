import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class RoleDto {

    @IsNotEmpty({ message: 'Role name is required' })
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '1' || value === 1 || value === true || value === 'true') return true;
    if (value === '0' || value === 0 || value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Invalid status value' })
  status?: boolean;
}
