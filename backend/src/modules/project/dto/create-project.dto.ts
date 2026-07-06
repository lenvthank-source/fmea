import { IsNotEmpty, IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  customer: string; // Required

  @IsString()
  @IsOptional()
  plantId?: string;

  @IsString()
  @IsOptional()
  productFamilyId?: string;

  @IsString()
  @IsOptional()
  modelYear?: string;

  @IsString()
  @IsNotEmpty()
  organisationName: string; // Required

  @IsString()
  @IsOptional()
  organisationCode?: string;

  @IsString()
  @IsNotEmpty()
  orgPartNumber: string;

  @IsString()
  @IsOptional()
  organisationPlant?: string;

  @IsString()
  @IsOptional()
  customerPartNumber?: string;

  @IsString()
  @IsNotEmpty()
  partName: string; // Required

  @IsString()
  @IsOptional()
  keyContact?: string;

  @IsString()
  @IsOptional()
  latestChangeLevel?: string;

  @IsDateString()
  @IsOptional()
  drawingRevDate?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  controlPlanNumber?: string;

  @IsString()
  @IsOptional()
  assemblyLineNumber?: string;

  @IsDateString()
  @IsOptional()
  originationDate?: string;

  @IsDateString()
  @IsOptional()
  supplierApprovalDate?: string;

  @IsDateString()
  @IsOptional()
  otherApprovalDate?: string;

  @IsArray()
  @IsNotEmpty()
  documentTypes: string[]; // Required

  @IsArray()
  @IsOptional()
  cftMembers?: string[];

  @IsString()
  @IsOptional()
  customerEngApprover?: string;

  @IsDateString()
  @IsOptional()
  customerEngApprovalDate?: string;

  @IsString()
  @IsOptional()
  customerQualApprover?: string;

  @IsDateString()
  @IsOptional()
  customerQualApprovalDate?: string;

  @IsString()
  @IsOptional()
  otherApprover?: string;

  @IsDateString()
  @IsOptional()
  otherApprovalDate2?: string;

  @IsString()
  @IsOptional()
  dwgNumber?: string;

  @IsString()
  @IsOptional()
  dwgRevNoAndDate?: string;

  @IsString()
  @IsOptional()
  preliminaryFinalFlag?: string;
}
