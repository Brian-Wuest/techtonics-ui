import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from 'techtonics-ui/services';

/**
 * Use this intereceptor if you are using REST api endpoints as it will automatically pull in
 * the loader service and call `show()` before the call is made and call `hide()`
 * when the call finalizes (even if there is an error with the call this still happens).
 *
 * This automates the usage of a Loading Indicator in your system.
 * @param req
 * @param next
 * @returns
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Increment counter and trigger backdrop reveal
  loaderService.show();

  return next(req).pipe(
    finalize(() => {
      // Decrement counter once the HTTP lifecycle pipeline resolves completely
      loaderService.hide();
    }),
  );
};

// How to register
/*
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor]) // Register it dynamically here
    )
  ]
};
*/
