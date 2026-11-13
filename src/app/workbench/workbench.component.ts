import { Component, signal, computed, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UIButtonComponent } from 'techtonics-ui/ui-button';

interface ComponentControl {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  value: any;
  options?: string[];
}

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, UIButtonComponent],
  template: `
    <div class="workbench-layout">
      <!-- 1. The Dynamic Preview Area -->
      <section class="preview-panel">
        <h3>Component Canvas</h3>
        <div class="canvas-item">
          <!-- Bind properties directly to signal dictionary entries -->
          <ui-button
            [variant]="controls()['variant'].value()"
            [disabled]="controls()['disabled'].value()"
            [color]="controls()['color'].value()"
            (click)="logOutput('clicked', $event)"
            [iconClass]="controls()['iconClass'].value()">
            <!-- Projecting into standard slots -->
            <!-- <span slot="icon">🔥</span> -->
            {{ controls()['label'].value() }}
          </ui-button>
        </div>
      </section>

      <!-- 2. The Knobs / Controls Panel -->
      <aside class="control-panel">
        <h3>Interactive Controls</h3>
        @for (key of controlKeys; track key) {
          <div class="control-group">
            <label>{{ key }}</label>

            @if (controls()[key].type === 'boolean') {
              <input
                type="checkbox"
                [ngModel]="controls()[key].value()"
                (ngModelChange)="controls()[key].value.set($event)" />
            }
            @if (controls()[key].type === 'string') {
              <input
                type="text"
                [ngModel]="controls()[key].value()"
                (ngModelChange)="controls()[key].value.set($event)" />
            }
            @if (controls()[key].type === 'select') {
              <select
                [ngModel]="controls()[key].value()"
                (ngModelChange)="controls()[key].value.set($event)">
                @for (opt of controls()[key].options; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            }
          </div>
        }

        <!-- 3. Real-time Output Log Grid -->
        <div class="output-logger">
          <h3>Event Monitor</h3>
          <div class="log-terminal">
            @for (log of outputLogs(); track $index) {
              <div class="log-line">⚡ {{ log.event }} fired -> {{ log.payload | json }}</div>
            }
          </div>
        </div>
      </aside>

      <!-- 4. Real-time Syntax Generation Panel -->
      <section class="code-panel">
        <h3>Usage Code</h3>
        <pre><code>{{ generatedCodeSyntax() }}</code></pre>
      </section>
    </div>
  `,
  styles: [
    `
      .workbench-layout {
        display: grid;
        grid-template-columns: 1fr 350px;
        grid-template-rows: auto auto;
        gap: 20px;
        padding: 20px;
        font-family: sans-serif;
      }
      .preview-panel,
      .control-panel,
      .code-panel {
        border: 1px solid var(--border);
        padding: 16px;
        border-radius: 8px;
        background: var(--surface);
      }
      .preview-panel {
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .canvas-item {
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
        padding: 40px;
        border-radius: 6px;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
      }
      .control-group {
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .control-group label {
        font-weight: bold;
        font-size: 14px;
      }
      .code-panel {
        grid-column: 1 / -1;
        background: var(--bg);
        color: var(--text-primary);
        border-radius: 6px;
      }
      .log-terminal {
        background: #000;
        color: #00ff00;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        max-height: 120px;
        overflow-y: auto;
      }
    `,
  ],
})
export class WorkbenchComponent {
  // Define UI states using strongly typed signal configurations mapping back to the extracted meta types
  readonly controls = signal<Record<string, { type: string; value: any; options?: string[] }>>({
    label: { type: 'string', value: signal('Click Me') },
    disabled: { type: 'boolean', value: signal(false) },
    variant: {
      type: 'select',
      value: signal('solid'),
      options: ['solid', 'outline', 'ghost', 'icon'],
    },
    color: {
      type: 'select',
      value: signal('primary'),
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
    },
    iconClass: { type: 'string', value: signal('ti ti-device-floppy') },
  });

  readonly outputLogs = signal<Array<{ event: string; payload: any }>>([]);

  get controlKeys() {
    return Object.keys(this.controls());
  }

  // Pure function computing consumption markup code on the fly
  readonly generatedCodeSyntax = computed(() => {
    const ctrl = this.controls();
    const labelVal = ctrl['label'].value();
    const disabledVal = ctrl['disabled'].value();
    const variantVal = ctrl['variant'].value();
    const colorVal = ctrl['color'].value();
    const iconClassVal = ctrl['iconClass'].value();

    let code = `<lib-custom-button\n`;
    code += `  variant="${variantVal}"\n`;
    code += `  color="${colorVal}"\n`;
    code += `  iconClass="${iconClassVal}"\n`;
    if (disabledVal) code += `  [disabled]="true"\n`;
    code += `  (clicked)="onHandleClick($event)">\n`;
    code += `  ${labelVal}\n`;
    code += `</lib-custom-button>`;

    return code;
  });

  logOutput(eventName: string, payload: any) {
    this.outputLogs.update((prev) => [{ event: eventName, payload }, ...prev.slice(0, 4)]);
  }
}
