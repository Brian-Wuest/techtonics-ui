import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from 'techtonics-ui/services';
import { HTTP_ERROR_TRANSLATOR } from './error-translator.token';

export const errorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const errorMessageTranslator = inject(HTTP_ERROR_TRANSLATOR);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let defaultMessage = 'An unexpected error occurred.';

      if (error.status === 0) {
        defaultMessage = 'Network error. Please check your connection.';
      } else if (error.status === 401) {
        defaultMessage = 'Your session has expired. Please log in again.';
      } else if (error.status === 403) {
        defaultMessage = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        defaultMessage = 'The requested resource was not found.';
      } else if (error.error?.message) {
        // Use a backend-provided error message if available
        defaultMessage = error.error.message;
      }

      // Get the appropriate message to show to  the user based on this status.
      // If the token has not been implemented we will just show the default message determined above.
      const message = errorMessageTranslator.translate(error.status, defaultMessage, error.message, error);

      if (message && message.trim() != '') {
        // Trigger your notification
        toastService.show(message, 'error');
      }

      // Rethrow the error so components/services can still react if needed
      return throwError(() => error);
    }),
  );
};
