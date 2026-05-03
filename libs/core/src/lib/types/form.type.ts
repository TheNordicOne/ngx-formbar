import { NgxFbBaseContent, NgxFbItem } from './content.type';

export interface NgxFbForm<ContentType extends NgxFbBaseContent = NgxFbItem> {
  content: Record<string, ContentType>;
}
