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
  Length
} from 'class-validator';
import { Transform } from 'class-transformer';
import { genderTypes } from '@prisma/client';
import { CustomPasswordDecorator } from '../decorators/customPassword.decorator';

export class RegisterDto {
  @IsEmail({}, { message: 'أدخل بريد إلكتروني صحيح' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
  @MaxLength(50, { message: 'كلمة المرور يجب ألا تزيد عن 50 حرف' })
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
        'استخدم حرف كبير وصغير ورقم ورمز',
    },
  )
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'تأكيد كلمة المرور مطلوب' })
  @CustomPasswordDecorator({ message: 'كلمتا المرور غير متطابقتين' })
  confirmPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  @MinLength(2, {
    message: 'الاسم الأول يجب ألا يقل عن حرفين',
  })
  @MaxLength(100, {
    message: 'الاسم الأول يجب ألا يزيد عن 100 حرف',
  })
  @Matches(
    /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u,
    {
      message:
        'الاسم الأول يجب أن يحتوي على حروف فقط',
    },
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'اسم العائلة مطلوب' })
  @MinLength(2, {
    message: 'اسم العائلة يجب ألا يقل عن حرفين',
  })
  @MaxLength(100, {
    message: 'اسم العائلة يجب ألا يزيد عن 100 حرف',
  })
  @Matches(
    /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u,
    {
      message:
        'اسم العائلة يجب أن يحتوي على حروف فقط',
    },
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName!: string;

  @IsEnum(genderTypes, { message: 'اختر النوع' })
  gender!: genderTypes;

  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يزيد عن 20 رقم' })
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'ادخل رقم هاتف صحيح',
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
