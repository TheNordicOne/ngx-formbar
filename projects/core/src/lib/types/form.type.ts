import { NgxFwBaseContent, NgxFwContent } from './content.type';

export interface NgxFwForm<
  ContentType extends NgxFwBaseContent = NgxFwContent,
> {
  content: Record<string, ContentType>;
}
