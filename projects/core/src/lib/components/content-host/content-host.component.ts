import { Component, computed, input, Type } from '@angular/core';
import { NgxFwContent } from '../../types/content.type';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'ngxfw-content-host',
  imports: [NgComponentOutlet],
  templateUrl: './content-host.component.html',
})
export class ContentHostComponent<T extends NgxFwContent> {
  readonly content = input.required<T>();
  readonly registrations = input.required<Map<string, Type<unknown>>>();

  readonly component = computed(() => {
    const registrations = this.registrations();
    const content = this.content();

    const component = registrations.get(content.type);
    return component ?? null;
  });

  readonly componentInputs = computed(() => ({ control: this.content() }));
}
