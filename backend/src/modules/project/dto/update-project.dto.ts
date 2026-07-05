import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  modelYear?: string;

  @IsString()
  @IsOptional()
  organisationName?: string;

  @IsString()
  @IsOptional()
  organisationCode?: string;

  @IsString()
  @IsOptional()
  orgPartNumber?: string;

  @IsString()
  @IsOptional()
  organisationPlant?: string;

  @IsString()
  @IsOptional()
  customerPartNumber?: string;

  @IsString()
  @IsOptional()
  partName?: string;

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
  @IsOptional()
  documentTypes?: string[];

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

  @IsOptional()
  uiSettings?: any;
}
