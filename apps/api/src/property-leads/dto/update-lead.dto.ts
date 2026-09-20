import { IsEnum } from 'class-validator';
import { LeadStatus } from '../lead.enums';

export class UpdateLeadDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}
