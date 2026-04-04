import type { NgxFbForm } from '@ngx-formbar/core';
import type { ExampleControls } from '@ngx-formbar/examples';

export function formConfig(
  content: Record<string, ExampleControls>,
): NgxFbForm<ExampleControls> {
  return { content };
}
