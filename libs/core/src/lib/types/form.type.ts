import { NgxFbBaseContent, NgxFbContent } from './content.type';

export interface NgxFbForm<
  ContentType extends NgxFbBaseContent = NgxFbContent,
> {
  content: Record<string, ContentType>;
}
