import { IsDefined, IsEnum, IsObject, IsString, Max } from 'class-validator';
import { DocumentTypeEnum } from 'src/types/enums/document-type';
import { IsDateYYYYMMDD } from '../validators/date-yyyy-mm-dd';

class DocumentAddressDto {
  @IsString()
  @Max(150)
  line1: string;

  @IsString()
  @Max(150)
  line2: string;

  @IsString()
  @Max(50)
  postalCode: string;

  @IsString()
  @Max(50)
  city: string;

  @IsString()
  @Max(50)
  state: string;

  @IsString()
  @Max(50)
  country: string;
}

export class CreateCompleteDto {
  @IsString()
  @IsEnum(DocumentTypeEnum)
  type: DocumentTypeEnum;

  @IsString()
  @Max(150)
  documentNumber: string;

  @IsString()
  @Max(150)
  fullName: string;

  @IsString()
  @IsDateYYYYMMDD()
  birthDate: string;

  @IsString()
  @Max(50)
  phone: string;

  @IsObject()
  address: DocumentAddressDto;

  @IsDefined()
  documentPicture: Buffer;

  @IsDefined()
  selfieWithDocument: Buffer;
}
