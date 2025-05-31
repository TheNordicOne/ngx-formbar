import { NgxFwBaseContent } from './content.type';

export interface NgxFwForm<
  ContentType extends NgxFwBaseContent = NgxFwBaseContent,
> {
  content: ContentType[];
}
