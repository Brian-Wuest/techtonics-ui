import { computed, inject, Service, signal } from '@angular/core';
import { LOADER_EXTENSIONS } from './loader.tokens';

@Service()
export class LoaderService {
  // Keeps track of the total number of concurrent requests in flight
  private activeRequests = signal<number>(0);

  /**
   * A computed signal determing if there are any active requests.
   */
  public isLoading = computed(() => this.activeRequests() > 0);

  constructor() {
    // Look up any optional extensions provided by the consuming app
    const extensions = inject(LOADER_EXTENSIONS, { optional: true }) || [];

    // Wire them up to this service instance's show/hide mechanics
    extensions.forEach((ext) => {
      if (ext.onInitialize) {
        ext.onInitialize(
          () => this.show(),
          () => this.hide(),
        );
      }
    });
  }

  /**
   * Increments a counter of active requests.
   */
  public show(): void {
    this.activeRequests.update((count) => count + 1);
  }

  /**
   * Decrements a counter of active requests.
   * Only when this counter is 0 is loading considered complete (I.E. isLoading = false).
   */
  public hide(): void {
    // Safeguard against sub-zero states
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}

// How to register this with nice-grpc-web
/*
import { Component, createEnvironmentInjector, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { createChannel, createClientFactory } from 'nice-grpc-web';
import { YourGrpcServiceDefinition } from './generated/your-service'; // Your proto compiled def
import { createLoadingMiddleware } from './loading.middleware';

@Component({
  selector: 'app-some-feature',
  template: `<button (click)="fetchData()">Call gRPC Server</button>`,
  standalone: true
})
export class SomeFeatureComponent implements OnInit {
  private envInjector = inject(EnvironmentInjector);
  private client!: typeof YourGrpcServiceDefinition;

  ngOnInit() {
    // 1. Establish your standard server endpoint channel
    const channel = createChannel('https://yourdomain.com');

    // 2. Create the middleware inside Angular's context so dependency injection works
    const loadingMiddleware = this.envInjector.runInContext(() => createLoadingMiddleware());

    // 3. Attach the middleware to the factory pipeline
    const factory = createClientFactory().use(loadingMiddleware);

    // 4. Generate your typed client stub
    this.client = factory.create(YourGrpcServiceDefinition, channel);
  }

  async fetchData() {
    // Executing this call automatically increments the LoaderService counter
    const response = await this.client.someRemoteMethod({});
    console.log(response);
  }
}

*/

// New way of registering this with nice-grpc-web (token registration)
// Note for later: When implementing in a gRPC project, see if we need to keep the optional peer dependency of nice-grpc-web
// We don't actually use it anywhere here and per the AI summary it seems that we could just remove it
// Since this example below would be entirely within the consuming application and NOT the shared library!
/*
import { ApplicationConfig } from '@angular/core';
import { LOADER_EXTENSIONS } from '@my-company/ui-components';
import { ClientMiddleware, createClientFactory, ClientFactory } from 'nice-grpc-web';

/**
 * A local app helper class that bridges the shared UI component library's
 * callbacks with a real nice-grpc-web ClientFactory instance.
 *
export class GrpcLoaderExtension {
  // Stub functions which are called and re-directed to the actual service implementation
  private showFn!: () => void;
  private hideFn!: () => void;

  // Expose the configured factory publicly for your application services to inject
  public factory!: ClientFactory;

  init(show: () => void, hide: () => void) {
    this.showFn = show;
    this.hideFn = hide;

    // Create a middleware handler using the functional hooks passed from the library
    const middleware: ClientMiddleware = async function* (call, options) {
      show();
      try {
        return yield* call.next(call.request, options);
      } finally {
        hide();
      }
    };

    this.factory = createClientFactory().use(middleware);
  }
}

// Instantiate it globally at the application level
export const grpcLoader = new GrpcLoaderExtension();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: LOADER_EXTENSIONS,
      useValue: {
        // Satisfies the shared library token interface exactly
        onInitialize: (show, hide) => grpcLoader.init(show, hide)
      },
      multi: true
    }
  ]
};
*/
