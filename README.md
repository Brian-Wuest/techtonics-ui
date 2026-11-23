# techtonics-ui

A full angular component library with minimal dependencies

- [techtonics-ui](#techtonics-ui)
  - [Development server](#development-server)
  - [Code scaffolding](#code-scaffolding)
  - [Building](#building)
  - [Running unit tests](#running-unit-tests)
  - [Running end-to-end tests](#running-end-to-end-tests)
  - [Additional Resources](#additional-resources)
  - [Tabler icons](#tabler-icons)
  - [How to review size of the library](#how-to-review-size-of-the-library)
  - [Create entry point files](#create-entry-point-files)
  - [How consume in other applications (repositories)](#how-consume-in-other-applications-repositories)
  - [Creating the .nvmrc file](#creating-the-nvmrc-file)
  - [Component library icons](#component-library-icons)
  - [Example of a input element implementing every form control option](#example-of-a-input-element-implementing-every-form-control-option)
    - [In a consuming app for error translation, create a bridge class as below](#in-a-consuming-app-for-error-translation-create-a-bridge-class-as-below)
    - [Validation script for when a supported validation key is added but a translation key is missed](#validation-script-for-when-a-supported-validation-key-is-added-but-a-translation-key-is-missed)
  - [Consuming Techtonics-UI in other applications](#consuming-techtonics-ui-in-other-applications)
  - [Using the error-translator token](#using-the-error-translator-token)
  - [CSS Gotcha's](#css-gotchas)

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Tabler icons

Note: Whnever tabler icons gets an update and we update the package, we need to manually update the `tabler-icons-override.css` file with the latest from
`node_modules\@tabler\icons-webfont\dist\tabler-icons.css`. Make sure to remove the font-face at the top since we are directly pulling in the font-face in index.html.

Also make sure to copy the `woff2` file from: `node_modules\@tabler\icons-webfont\dist\fonts\tabler-icons.woff2` and place in the `src/assets/fonts` folder.

This is all so we have the smallest resulting package for this project as well as for our component library!

## How to review size of the library

Build the library using the following command:

```shell
npm run build:shared:prod
```

Next run the following command to run the source-map-explorer, if you don't already have this installed, it will prompt you to be installed.

```shell

npx source-map-explorer "C:\_src\the_todoer\client_angular\dist\techtonics-ui\fesm2022\techtonics-ui.mjs" --no-border-checks

```

## Create entry point files

Quick script for creating entry point and ng-package files.

```bash
for dir in */; do
  # Skip standard src folder
  if [ "$dir" != "src/" ]; then
    echo '{"lib": {"entryFile": "public-api.ts"}}' > "${dir}ng-package.json"
    touch "${dir}public-api.ts"
    echo "Created entry point for $dir"
  fi
done

```

## How consume in other applications (repositories)

- Build this application

```bash
npm run build:lib
```

- Open the consuming application's `package.json`.
- Run the standard installation command pointing directly to the compiled `dist` folder for the library:

```bash
npm install ../path-to-your-library-repo/dist/techtonics-ui
```

**Note**: you May have to adjust the relative path

- Update consuming application's `angular.json` file and ensure the `preserviceSymlinks` option is set to true.

```json
"architect": {
  "build": {
    "options": {
      "preserveSymlinks": true
    }
  }
}

```

## Creating the .nvmrc file

run the following command from the root directory:

```bash
node -v > .nvmrc
```

## Component library icons

This library expects the `tabler icons` library to be used.
In-fact there is a peer dependency set for `@ng-icons/tabler-icons": "36.1.0`.
Fortunately! There is an easy-to-use directive to pull in icons as you need to without having to pull in the _entire_ web font!
Simply inport the `UIIconInterceptorDirective` and then utilize the `ui-icon` directive in your component and you are good to go!
Make sure to provide the necessary icons in your `app.config.ts` file though!

Keep in mind that all icons that you want to utilize in your application need to be provided this way or they won't work.
But this makes for a much smaller bundle size than what you would normally have.

Here are the required icons for this library:

- tablerCalendar: Used in the date-time picker
- tablerCalendarClock: Used in the date-time picker
- tablerClock: Used in the date-time picker
- tablerAlertTriangle: Used in the data grid
- tablerMoon: Used in the theme toggle
- tablerSun: Used in the theme toggle.

Example:

```TypeScript
import { provideIcons } from '@ng-icons/core';
import { tablerDisc, tablerLoadBalancer, tablerDeviceGamepad3 } from '@ng-icons/tabler-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIcons({ 
      tablerDisc, tablerLoadBalancer, tablerDeviceGamepad3,
    }),
  ],
};

```

## Example of a input element implementing every form control option

```TypeScript
import { Component, model, input, output, ElementRef, viewChild } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { DisabledReason, ValidationError } from '@angular/forms';

@Component({
  selector: 'app-kitchen-sink-input',
  standalone: true,
  template: `
    <div class="field-container" [hidden]="hidden()">
      <label [attr.for]="name()">
        {{ name() }} @if (required()) { <span class="req">*</span> }
      </label>

      <input
        #inputEl
        [id]="name()"
        [value]="value() ?? ''"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [attr.min]="min()"
        [attr.max]="max()"
        [attr.minlength]="minLength()"
        [attr.maxlength]="maxLength()"
        [attr.pattern]="pattern()"
        (input)="onInput($event)"
        (blur)="touch.emit()"
        [class.is-dirty]="dirty()"
        [class.is-touched]="touched()"
        [class.is-invalid]="invalid()"
        [class.is-pending]="pending()"
      />

      <!-- Validation Error Reporting -->
      @if (invalid() && touched()) {
        <div class="errors">
          @for (err of errors(); track err) {
            <p>{{ err.message }}</p>
          }
        </div>
      }

      <!-- Accessibility / Tooltip Context for Disabling -->
      @if (disabled() && disabledReasons().length) {
        <div class="disabled-reasons">
          @for (reason of disabledReasons(); track reason) {
            <small>{{ reason.message }}</small>
          }
        </div>
      }
    </div>
  `
})
export class KitchenSinkInputComponent implements FormValueControl<string | null> {
  // --- 1. The Core Synchronized Model Value ---
  readonly value = model<string | null>(null);
  readonly checked = undefined; // Enforced constraint: must remain undefined for FormValueControl

  // --- 2. Interaction & State Tracking Inputs (Read-only states provided down by FormField) ---
  readonly touched = input<boolean>(false);
  readonly dirty = input<boolean>(false);
  readonly name = input<string>('');

  // --- 3. Validation Inputs ---
  readonly invalid = input<boolean>(false);
  readonly pending = input<boolean>(false);
  readonly errors = input<readonly ValidationError[]>([]);

  // --- 4. Availability & Field Presence Inputs ---
  readonly disabled = input<boolean>(false);
  readonly disabledReasons = input<readonly DisabledReason[]>([]);
  readonly readonly = input<boolean>(false);
  readonly hidden = input<boolean>(false);

  // --- 5. Constraint & HTML Validation Inputs ---
  readonly required = input<boolean>(false);
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly minLength = input<number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly pattern = input<string | RegExp | null>(null);

  // --- 6. Interaction Outputs ---
  readonly touch = output<void>();

  // Element reference to pass focus commands cleanly down to the true DOM node
  private inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  // --- 7. Interface Methods ---
  
  /**
   * Invoked automatically by the form system when programmatically calling `.focus()` 
   * on the associated form field tree.
   */
  focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }

  /**
   * Invoked automatically when the root form executes a `.reset()` routine.
   */
  reset(): void {
    this.value.set(null);
  }

  // --- Internal handlers ---
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value === '' ? null : target.value);
  }
}

```

### In a consuming app for error translation, create a bridge class as below

```Typescript
// consuming-app/src/app/core/transloco-validation-bridge.ts
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { 
  ValidationTranslator, 
  extractAndUnifyValidationContext,
  SUPPORTED_VALIDATION_KEYS 
} from '@shared-ui/validation';

@Injectable()
export class TranslocoValidationBridge implements ValidationTranslator {
  private transloco = inject(TranslocoService);

  constructor() {
    // Proactive discoverability check: Lists missing keys in the console during development
    this.transloco.selectTranslation().subscribe(() => {
      SUPPORTED_VALIDATION_KEYS.forEach(key => {
        const translocoKey = `validation.${key}`;
        if (this.transloco.translate(translocoKey) === translocoKey) {
          console.warn(`[Validation Translation Warning]: Missing translation for key "${translocoKey}"`);
        }
      });
    });
  }

  translate(kind: string, context?: Record<string, any>): string {
    const normalizedKind = kind.toLowerCase();
    const key = `validation.${normalizedKind}`;
    
    if (this.transloco.translate(key) === key) {
      return ''; 
    }
    
    // Clean one-liner call to the shared utility library function
    const unifiedContext = extractAndUnifyValidationContext(context);
    
    return this.transloco.translate(key, unifiedContext);
  }
}


// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { VALIDATION_TRANSLATOR } from '@shared-ui/validation';
import { TranslocoValidationBridge } from './core/transloco-validation-bridge';
import { provideTransloco } from '@jsverse/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({ ... }),
    
    // Bridge the library token to the application-owned Transloco bridge
    {
      provide: VALIDATION_TRANSLATOR,
      useClass: TranslocoValidationBridge
    }
  ],
};

```

Traslation key

```json
{
  "validation": {
    "required": "This field is required.",
    "email": "Please enter a valid email address.",
    "min": "Value must be at least {min}.",
    "minlength": "Must be at least {length} characters long.",
    "maxlength": "Cannot be more than {length} characters long.",
    "passwordstrength": "Password must include uppercase, lowercase, numbers, and symbols.",
    "integersonly": "Please enter digits/numbers only.",
    "invalidcreditcard": "Please enter a valid credit card number.",
    "fieldmatch": "This field must match the {matchField} field."
  }
}
```

### Validation script for when a supported validation key is added but a translation key is missed

```TypeScript
// scripts/validate-translations.ts
import * as fs from 'fs';
import * as path from 'path';
// Import the discoverable single-source-of-truth from your shared UI library
import { SUPPORTED_VALIDATION_KEYS } from '@shared-ui/validation';

// Define the target translation paths to verify
const TRANSLATION_FILE_PATH = path.resolve(__dirname, '../src/assets/i18n/en.json');

function validateLocalizationFiles() {
  console.log('🔍 Auditing validation translation strings against UI Library registry...');

  // 1. Verify file presence
  if (!fs.existsSync(TRANSLATION_FILE_PATH)) {
    console.error(`❌ Error: Translation file not found at ${TRANSLATION_FILE_PATH}`);
    process.exit(1);
  }

  // 2. Read and parse the active JSON configuration
  const fileContent = fs.readFileSync(TRANSLATION_FILE_PATH, 'utf-8');
  let translationJson: any;

  try {
    translationJson = JSON.parse(fileContent);
  } catch (e) {
    console.error(`❌ Error: Failed to parse JSON file at ${TRANSLATION_FILE_PATH}. Invalid format.`);
    process.exit(1);
  }

  // Ensure the "validation" namespace block exists
  const validationNamespace = translationJson.validation;
  if (!validationNamespace) {
    console.error(`❌ Error: Missing top-level "validation" object layout inside your translation file.`);
    process.exit(1);
  }

  const missingKeys: string[] = [];

  // 3. Diff the file keys against your library's living registry array
  SUPPORTED_VALIDATION_KEYS.forEach((registeredKey) => {
    // Check if the lowercase key exists and has an actual value assigned
    if (!validationNamespace[registeredKey] || validationNamespace[registeredKey].trim() === '') {
      missingKeys.push(`validation.${registeredKey}`);
    }
  });

  // 4. Report status results to the build pipeline terminal execution context
  if (missingKeys.length > 0) {
    console.error('\n❌ Build Failure: Found missing translation definitions for supported validators:');
    missingKeys.forEach((key) => {
      console.error(`   👉 Missing key entry: "${key}"`);
    });
    console.error('\n Please update your localization file to support these values to prevent UI fallback bugs.\n');
    process.exit(1); // Exiting with code 1 breaks the script chain execution (failing the pipeline)
  }

  console.log('✅ Success: All core library validation rules are fully translated in the active language scope!');
  process.exit(0);
}

validateLocalizationFiles();

```

Package Json Updates

```Json
{
  "name": "consuming-application",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "npm run validate:translations && ng build",
    "test": "ng test",
    "validate:translations": "ts-node scripts/validate-translations.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.2"
  }
}

```

## Consuming Techtonics-UI in other applications

In `angular.json:

- Add `"preserveSymlinks": true` under `projects.<app-name>.architect.build.options`.
  - This is to ensure that the components use the consuming application's version of angular instead of the component libary's version.
- Under `architect.serve.options` add `"prebundle": {"exclude": ["techtonics-ui"]}` so the dev server does not cache state or duplicated dependencies.

## Using the error-translator token

Create an service which implements the `HttpErrorTranslator` interface.

This is a simple example, you might want to look for more/other status codes or do other things.

```TypeScript
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { HttpErrorTranslator } from 'techtonics-ui/interceptors';
import { translationKeys } from '../common/translateKeys';

@Service()
export class ErrorTranslatorService implements HttpErrorTranslator {
  private translateService = inject(TranslocoService);
  private translateKeys = translationKeys;

  translate(
    status: number,
    defaultMessage: string,
    serverMessage?: string,
    serverError?: HttpErrorResponse,
  ): string {
    let message = translationKeys.ErrorMessages.DefaultHttpError;
    let translateMessage = true;

    if (status === 0) {
      message = translationKeys.ErrorMessages.GeneralNetworkError;
    } else if (status === 401) {
      message = translationKeys.ErrorMessages.SessionExpired;
    } else if (status === 403) {
      message = translationKeys.ErrorMessages.Unauthorized;
    } else if (status === 404) {
      message = translationKeys.ErrorMessages.NotFound;
    } else if (serverError?.error?.message) {
      // Use a backend-provided error message if available
      message = serverError.error.message;

      translateMessage = false;
    }

    if (translateMessage) {
      message = this.translateService.translate(message);
    }

    return message;
  }
}

```

Provide the token on your `app.config.ts`

```Typescript
    {
      provide: HTTP_ERROR_TRANSLATOR,
      useValue: ErrorTranslatorService,
    },
     provideHttpClient(withInterceptors([loadingInterceptor, errorNotificationInterceptor])),
```

Add the `<ui-toast-container>` to your main html document (generally app.html). This way toasts are always at the top.

```HTML
<div class="app-shell-columns">
  <ui-app-nav
    [items]="mainItems()"
    (itemClick)="navItemClicked($event)"
    [logo]="this.title()"
    [showProfileMenu]="false"
  ></ui-app-nav>
  <main class="app-main">
    <ui-toast-container></ui-toast-container>
    <router-outlet></router-outlet>
  </main>
</div>

```

Now with this, any http error encountered when running the application will be captured by your service and you can show the appropriate message based on the context of the error and show it regardless of the component which created the issue in the first place.
This also give you complete control within your consuming application as the interceptor will NOT show a toast notification if you end up returning null or an empty string. By returning null/empty you can determine which exceptions do not really need to be presented to the user.

## CSS Gotcha's

- Do NOT use nested selectors in certain circumstances.
  - For `:host`, `::ng-deep`, `:host-context`, or similar angular-specific selectors. These cannot be nested in most cases because it doesn't scope like you expect. This is especially true for `ng-deep` as it won't strip out the component specific attribute selector!
  - Instead you MUST write your overrides like this:

```css
:host div.complete-item ::ng-deep .checked {
  text-decoration: line-through;
}
```
