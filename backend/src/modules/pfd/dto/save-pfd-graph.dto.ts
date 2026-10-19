import { IsInt, IsObject, Min } from 'class-validator';
import type { PfdGraph } from '../pfd-graph';

export class SavePfdGraphDto {
  @IsInt()
  @Min(0)
  version: number;

  @IsObject()
  graph: PfdGraph;
}
