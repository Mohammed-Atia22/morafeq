// /* eslint-disable prettier/prettier */
// import {
//   IsEmail,
//   IsString,
//   MinLength,
//   MaxLength,
//   IsStrongPassword,
//   IsEnum,
// } from 'class-validator';
// import { CustomPasswordDecorator } from '../decorators/customPassword.decorator';
// import { genderTypes } from '@prisma/client';
// export class RegisterDto {
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   email!: string;

//   @IsString()
//   @MinLength(8, { message: 'Password must be at least 8 characters' })
//   @MaxLength(50)
//   @IsStrongPassword()
//   password!: string;

//   @CustomPasswordDecorator({message:"Invalid password"})
//   confirmPassword!:string

//   @IsString()
//   @MinLength(2, { message: 'First name must be at least 2 characters' })
//   @MaxLength(100)
//   firstName!: string;

//   @IsEnum(genderTypes, { message: 'Gender must be male or female' })
//   gender!: genderTypes;

//   @IsString()
//   @MinLength(2, { message: 'Last name must be at least 2 characters' })
//   @MaxLength(100)
//   lastName!: string;

//   @IsString()
//   phone!: string;

// }




// export class confirmrDto {
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   email!: string;

//   @IsString()

//   otp:string

// }




// export class forgetDto {
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   email!: string;

// }



// export class resetDto {
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   email!: string;

//   @IsString()
//   otp:string

//   @IsStrongPassword()
//   newPassword:string
  
//   @IsStrongPassword()
//   confirmPassword:string

// }

// export class ResendOtpDto {
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   email!: string;
// }





/* eslint-disable prettier/prettier */
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
  IsEnum,
   Matches,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { genderTypes } from '@prisma/client';
import { CustomPasswordDecorator } from '../decorators/customPassword.decorator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain uppercase, lowercase, number, and symbol',
    },
  )
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @CustomPasswordDecorator({ message: 'Passwords do not match' })
  confirmPassword!: string;

  @IsString()
@IsNotEmpty({ message: 'First name is required' })
@MinLength(2, {
  message: 'First name must be at least 2 characters',
})
@MaxLength(100, {
  message: 'First name must not exceed 100 characters',
})
@Matches(
  /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u,
  {
    message:
      'First name must contain letters only and may include spaces, hyphens, or apostrophes',
  },
)
@Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
firstName!: string;

@IsString()
@IsNotEmpty({ message: 'Last name is required' })
@MinLength(2, {
  message: 'Last name must be at least 2 characters',
})
@MaxLength(100, {
  message: 'Last name must not exceed 100 characters',
})
@Matches(
  /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u,
  {
    message:
      'Last name must contain letters only and may include spaces, hyphens, or apostrophes',
  },
)
@Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
lastName!: string;

  @IsEnum(genderTypes, { message: 'Gender must be male or female' })
  gender!: genderTypes;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Phone must be in international format, e.g. +201001234567',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone!: string;
}

export class confirmrDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain digits only' })
  otp!: string;
}

export class forgetDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class resetDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain digits only' })
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain uppercase, lowercase, number, and symbol',
    },
  )
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword!: string;
}

export class ResendOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}