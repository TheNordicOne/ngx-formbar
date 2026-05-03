import { computed, inject, Signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { NgxFbConfigurationService } from '../services/configuration.service';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { resolveTestId } from './resolve-test-id';

/**
 * Derives the test identifier for a control or group, scoped under the parent
 * group's test id when present. The `testIdBuilder` from the global config
 * controls how parent and child segments are joined.
 *
 * @template T Type of the content node, extending `NgxFbBaseContent`.
 * @param content Signal of the control or group content config.
 * @param name Signal of the entry name used as the leaf segment.
 * @returns A signal of the resolved test id string.
 */
export function withTestId(
  content: Signal<NgxFbBaseContent>,
  name: Signal<string>,
): Signal<string> {
  const parent = inject(NGX_FW_PARENT_CONTEXT, {
    optional: true,
    skipSelf: true,
  });

  const globalConfig = inject(NgxFbConfigurationService);

  return resolveTestId(
    content,
    name,
    globalConfig.testIdBuilder,
    computed(() => parent?.testId()),
  );
}
