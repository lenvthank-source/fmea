import { IsArray, IsUUID } from 'class-validator';

export class LinkFailuresDto {
  @IsArray()
  @IsUUID('all', { each: true })
  effectIds: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  causeIds: string[];
}
