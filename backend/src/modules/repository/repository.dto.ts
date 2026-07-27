import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateWorkElementPackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  packageData: any; // { functions: [...] }

  @IsUUID()
  @IsOptional()
  sourceProjectId?: string;
}

export class UpdateWorkElementPackageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  packageData?: any;
}

export class RejectWorkElementPackageDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class ImportWorkElementPackageDto {
  @IsUUID()
  @IsNotEmpty()
  revisionId: string;

  @IsUUID()
  @IsNotEmpty()
  processStepId: string;
}
