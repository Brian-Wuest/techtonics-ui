import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UILoadingIndicatorComponent } from './ui-loading-indicator.component';
import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [UILoadingIndicatorComponent],
  template: `
    <ui-loading-indicator [loading]="loading()" />
    <div id="sibling-app-root">
      <button>Interactable Content</button>
    </div>
  `,
})
class TestHostComponent {
  loading = signal(false);
}

describe('Zoneless LoadingIndicatorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, UILoadingIndicatorComponent],
      providers: [
        // Forces TestBed to evaluate template cycles using modern Zoneless scheduling
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;

    // Manually push a layout sibling into the test DOM document body for our effect to find
    const mockSibling = document.createElement('div');
    mockSibling.id = 'external-app-container';
    document.body.appendChild(mockSibling);

    await fixture.whenStable(); // Wait for initialization to complete
  });

  afterEach(() => {
    document.getElementById('external-app-container')?.remove();
  });

  it('should not display the backdrop by default', () => {
    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeNull();
  });

  it('should display the overlay backdrop and add the inert attribute asynchronously', async () => {
    const mockSibling = document.getElementById('external-app-container');
    expect(mockSibling?.hasAttribute('inert')).toBe(false);

    // Act: Update the signal state
    hostComponent.loading.set(true);

    // Wait: Let the Angular compiler process the microtask queue without Zone interference
    await fixture.whenStable();

    // Assert: The component renders and the side-effect executes
    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).not.toBeNull();
    expect(mockSibling?.hasAttribute('inert')).toBe(true);
  });

  it('should remove the inert attribute when loading returns to false', async () => {
    const mockSibling = document.getElementById('external-app-container');

    // Turn loader on
    hostComponent.loading.set(true);
    await fixture.whenStable();
    expect(mockSibling?.hasAttribute('inert')).toBe(true);

    // Turn loader off
    hostComponent.loading.set(false);
    await fixture.whenStable();

    // The document body element should be un-trapped
    expect(mockSibling?.hasAttribute('inert')).toBe(false);
  });
});
