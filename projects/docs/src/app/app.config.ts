import { provideNgDocApp, provideSearchEngine, NgDocDefaultSearchEngine, providePageSkeleton, NG_DOC_DEFAULT_PAGE_SKELETON, provideMainPageProcessor, NG_DOC_DEFAULT_PAGE_PROCESSORS } from "@ng-doc/app";
import { NG_DOC_ROUTING, provideNgDocContext } from "@ng-doc/generated";
import { provideHttpClient, withInterceptorsFromDi, withFetch } from "@angular/common/http";
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(NG_DOC_ROUTING, withInMemoryScrolling({scrollPositionRestoration: "enabled", anchorScrolling: "enabled"})),
        provideHttpClient(withInterceptorsFromDi(), withFetch()),
        provideNgDocContext(),
        provideNgDocApp(),
        provideSearchEngine(NgDocDefaultSearchEngine),
        providePageSkeleton(NG_DOC_DEFAULT_PAGE_SKELETON),
        provideMainPageProcessor(NG_DOC_DEFAULT_PAGE_PROCESSORS)
    ]
};
