import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  ComponentRef,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from 'techtonics-ui/services';
import registryData from '../../assets/component-registry.json';
import { CHILD_TEMPLATE_REGISTRY, COMPONENT_MAP, EXTRA_DOC_IMPORTS, MOCK_DATA_REGISTRY } from '../models/doc-registry';

interface RegistryInput {
  name: string;
  controlType: 'string' | 'number' | 'boolean' | 'select' | 'json';
  options: string[];
  description: string;
  defaultValue: any;
  isRequired: boolean;
  typeSignature: string;
}

interface ComponentMeta {
  inputs: RegistryInput[];
  outputs: { name: string; typeSignature: string }[];
  slots: { default: boolean; named: string[] };
  templateChildren?: string[];
  typeDefinitions?: Record<string, Array<{ name: string; type: string; optional: boolean }>>;
}

@Component({
  selector: 'app-universal-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, ...EXTRA_DOC_IMPORTS],
  template: `
    <div class="app-container" [class.dark-theme]="themeService.theme() === 'dark'">
      <!-- 1. Left Sidebar Navigation Menu -->
      <aside class="sidebar">
        <h2>📚 Component Lib ({{ componentList.length }})</h2>
        <button class="theme-toggle" (click)="toggleTheme()">
          {{ themeService.theme() === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode' }}
        </button>
        <ul class="nav-list">
          @for (compName of componentList; track compName) {
            <li [class.active]="selectedClassName() === compName" (click)="selectComponent(compName)">
              {{ compName.replace('Component', '') }}
            </li>
          }
        </ul>
      </aside>

      <!-- Main Interaction Workspace -->
      <main class="workbench-main">
        <header>
          <h1>
            Active Testbench: <code>{{ selectedClassName() }}</code>
          </h1>
        </header>

        <div class="workspace-grid">
          <!-- 2. Sandbox Preview Canvas -->
          <section class="canvas-card">
            <h3>Component Sandbox Preview</h3>
            <div class="render-host">
              <ng-container #dynamicHost></ng-container>
            </div>

            <!-- Context Overlay Simulation Trigger Button -->
            @if (hasTriggerCapabilities()) {
              <div class="trigger-overlay-pad">
                <button class="action-trigger-btn" (click)="simulateTriggerAction()">
                  ⚡ Force Trigger Action / Open Overlay
                </button>
              </div>
            }
          </section>

          <!-- 3. Parameter Configuration Knobs Panel -->
          <aside class="knobs-card">
            <h3>Interactive Configuration Knobs</h3>

            <!-- Default Content Projection Slot Input Field -->
            @if (activeMetadata()?.slots?.default) {
              <div class="knob-row projection-box">
                <label>📋 Inner Text Content (slot/ng-content)</label>
                <input type="text" [ngModel]="slotTextContent()" (ngModelChange)="updateProjectedText($event)" />
              </div>
            }

            <div class="control-box">
              @for (inp of activeMetadata()?.inputs; track inp.name) {
                <div class="knob-row">
                  <div class="knob-header">
                    <label [class.required-label]="inp.isRequired">
                      {{ inp.name }}
                      @if (inp.isRequired) {
                        <span class="req-star">*</span>
                      }
                    </label>

                    <!-- Clear Element Modifier Tool Badge Toggle Button -->
                    @if (!inp.isRequired) {
                      <button
                        class="clear-val-btn"
                        [class.is-cleared]="knobStates()[inp.name]() === 'undefined'"
                        (click)="
                          updateKnob(
                            inp.name,
                            knobStates()[inp.name]() === 'undefined' ? inp.defaultValue : 'undefined'
                          )
                        ">
                        {{ knobStates()[inp.name]() === 'undefined' ? 'Reset' : 'Clear (undefined)' }}
                      </button>
                    }
                  </div>

                  @if (knobStates()[inp.name]() !== 'undefined') {
                    @if (inp.controlType === 'boolean') {
                      <input
                        type="checkbox"
                        [ngModel]="knobStates()[inp.name]()"
                        (ngModelChange)="updateKnob(inp.name, $event)" />
                    }
                    @if (inp.controlType === 'string') {
                      <input
                        type="text"
                        [ngModel]="knobStates()[inp.name]()"
                        (ngModelChange)="updateKnob(inp.name, $event)" />
                    }
                    @if (inp.controlType === 'number') {
                      <input
                        type="number"
                        [ngModel]="knobStates()[inp.name]()"
                        (ngModelChange)="updateKnob(inp.name, $event)" />
                    }
                    @if (inp.controlType === 'select') {
                      <select [ngModel]="knobStates()[inp.name]()" (ngModelChange)="updateKnob(inp.name, $event)">
                        @for (opt of inp.options; track opt) {
                          <option [value]="opt">{{ opt }}</option>
                        }
                      </select>
                    }
                    @if (inp.controlType === 'json') {
                      <div class="json-container">
                        <textarea
                          rows="5"
                          [ngModel]="knobStates()[inp.name]()"
                          (ngModelChange)="updateJsonKnob(inp.name, $event)"
                          [class.json-error]="jsonErrors()[inp.name]"></textarea>
                      </div>
                    }
                  } @else {
                    <div class="cleared-placeholder-badge">Value explicitly set to <code>undefined</code></div>
                  }
                </div>
              }
            </div>

            <!-- Output Action Streams Log Terminal -->
            <div class="event-monitor">
              <h3>Event Output Log Monitor</h3>
              <div class="terminal">
                @for (log of liveLogs(); track $index) {
                  <div class="terminal-line">⚡ {{ log.event }} &rarr; {{ log.data | json }}</div>
                } @empty {
                  <div class="terminal-placeholder">No output streams fired yet...</div>
                }
              </div>
            </div>
          </aside>
        </div>

        <!-- 4. Technical Data-Type Specification Ledger Documentation Section -->
        <section class="documentation-specs-card">
          <h2>Technical Type Specifications & Documentation</h2>

          <div class="spec-tables-wrapper">
            <!-- Properties Table -->
            <div class="spec-block">
              <h3>Inputs (Properties)</h3>
              <table class="doc-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type Signature</th>
                    <th>Required</th>
                    <th>Description / Usage Details</th>
                    <th>Default Value</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inp of activeMetadata()?.inputs; track inp.name) {
                    <tr>
                      <td>
                        <code class="prop-name">{{ inp.name }}</code>
                      </td>
                      <td>
                        <code class="type-sig">{{ inp.typeSignature }}</code>
                      </td>
                      <td>
                        <span class="badge" [class.badge-red]="inp.isRequired">{{
                          inp.isRequired ? 'Yes' : 'No'
                        }}</span>
                      </td>
                      <td class="doc-desc-cell">{{ inp.description || '-- No documentation provided --' }}</td>
                      <td>
                        <code>{{ inp.controlType === 'json' ? '{...}' : inp.defaultValue }}</code>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Events Table -->
            <div class="spec-block">
              <h3>Outputs (Events)</h3>
              <table class="doc-table">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Emitted Payload Type</th>
                  </tr>
                </thead>
                <tbody>
                  @for (outp of activeMetadata()?.outputs; track outp.name) {
                    <tr>
                      <td>
                        <code class="event-name">({{ outp.name }})</code>
                      </td>
                      <td>
                        <code class="type-sig">{{ outp.typeSignature }}</code>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2" class="empty-msg">No structural outputs emitted.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Custom Nested Interfaces Inspector Grid -->
          @if (objectKeys(activeMetadata()?.typeDefinitions || {}).length > 0) {
            <div class="complex-types-breakout">
              <h3>Nested Interface Layout Breakdowns</h3>
              @for (typeName of objectKeys(activeMetadata()?.typeDefinitions || {}); track typeName) {
                <div class="interface-card">
                  <h4>
                    <code>interface {{ typeName }}</code>
                  </h4>
                  <table class="doc-table mini-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Optional</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (field of activeMetadata()?.typeDefinitions?.[typeName]; track field.name) {
                        <tr>
                          <td>
                            <code>{{ field.name }}</code>
                          </td>
                          <td>
                            <code class="type-sig">{{ field.type }}</code>
                          </td>
                          <td>
                            <span class="badge">{{ field.optional ? 'Yes' : 'No' }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </section>

        <!-- 5. Dynamic Code Block Clipboard Copy Bar -->
        <footer class="syntax-guide">
          <div class="syntax-header">
            <h3>Consumer Implementation Markup Blueprint</h3>
            <button class="copy-btn" (click)="copyCodeToClipboard()">
              {{ copySuccess() ? '✅ Copied!' : '📋 Copy Code' }}
            </button>
          </div>
          <pre><code>{{ consumptionSyntax() }}</code></pre>
        </footer>
      </main>
    </div>

    <!-- Hidden Reusable Template Content Elements to satisfy contentChild signals safely -->
    <div style="display: none;">
      <ng-template #defaultItemMarkup let-item>
        <span>📁 {{ item?.label || item }}</span>
      </ng-template>
      <ng-template #defaultSeparatorMarkup>
        <span style="color: #94a3b8; margin: 0 8px;">&rsaquo;</span>
      </ng-template>

      <ng-template #gridColumns>
        <ui-grid-col field="id" header="ID" [sortable]="true"></ui-grid-col>
        <ui-grid-col field="name" header="Item Name" [sortable]="true"></ui-grid-col>
        <ui-grid-col field="status" header="Status" [sortable]="false"></ui-grid-col>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        height: 100vh;
        font-family: system-ui, sans-serif;
        transition:
          background 0.2s,
          color 0.2s;
      }
      .app-container:not(.dark-theme) {
        background: #fdfdfd;
        color: #1e1e1e;
        --border: #e2e8f0;
        --card-bg: #ffffff;
        --th-bg: #f1f5f9;
      }
      .app-container.dark-theme {
        background: #0f172a;
        color: #f8fafc;
        --border: #334155;
        --card-bg: #1e293b;
        --th-bg: #0f172a;
      }
      .sidebar {
        width: 280px;
        border-right: 1px solid var(--border);
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .theme-toggle {
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        border: 1px solid var(--border);
        background: var(--card-bg);
        color: inherit;
        font-weight: 600;
      }
      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .nav-list li {
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      .nav-list li:hover {
        background: rgba(0, 0, 0, 0.04);
      }
      .dark-theme .nav-list li:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .nav-list li.active {
        background: #3b82f6 !important;
        color: white;
      }
      .workbench-main {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .workspace-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 20px;
      }
      .canvas-card,
      .knobs-card,
      .syntax-guide,
      .documentation-specs-card {
        border: 1px solid var(--border);
        background: var(--card-bg);
        padding: 22px;
        border-radius: 12px;
        position: relative;
      }
      .render-host {
        min-height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed var(--border);
        border-radius: 8px;
        padding: 20px;
        position: relative;
      }
      .knob-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }
      .knob-row label {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
      }
      .dark-theme .knob-row label {
        color: #94a3b8;
      }
      .projection-box {
        padding-bottom: 12px;
        border-bottom: 1px dashed var(--border);
        margin-bottom: 16px;
      }
      .required-label {
        color: #ef4444 !important;
      }
      .req-star {
        color: #ef4444;
      }
      .knob-row input[type='text'],
      .knob-row input[type='number'],
      .knob-row select {
        padding: 8px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: transparent;
        color: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .json-container {
        width: 100%;
      }
      .json-container textarea {
        width: 100%;
        font-family: monospace;
        font-size: 11px;
        background: #020617;
        color: #34d399;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px;
        box-sizing: border-box;
        resize: vertical;
      }
      .json-container textarea.json-error {
        border-color: #ef4444;
        color: #f87171;
      }
      .trigger-overlay-pad {
        position: absolute;
        bottom: 16px;
        right: 16px;
        z-index: 10;
      }
      .action-trigger-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .action-trigger-btn:hover {
        background: #059669;
      }
      .event-monitor {
        margin-top: 20px;
      }
      .terminal {
        background: #020617;
        color: #38bdf8;
        font-family: monospace;
        font-size: 12px;
        padding: 12px;
        border-radius: 6px;
        min-height: 100px;
        max-height: 150px;
        overflow-y: auto;
      }
      .spec-tables-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 16px;
      }
      .doc-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 13px;
        margin-top: 10px;
      }
      .doc-table th,
      .doc-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--border);
      }
      .doc-table th {
        background: var(--th-bg);
        font-weight: 600;
        color: #64748b;
      }
      .dark-theme .doc-table th {
        color: #94a3b8;
      }
      .prop-name {
        color: #ec4899;
        font-weight: 600;
      }
      .event-name {
        color: #f59e0b;
        font-weight: 600;
      }
      .type-sig {
        color: #3b82f6;
        font-weight: bold;
      }
      .badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        background: #e2e8f0;
        color: #475569;
      }
      .badge-red {
        background: #fee2e2;
        color: #b91c1c;
      }
      .dark-theme .badge {
        background: #334155;
        color: #cbd5e1;
      }
      .complex-types-breakout {
        margin-top: 24px;
        border-top: 1px dashed var(--border);
        padding-top: 20px;
      }
      .interface-card {
        background: var(--th-bg);
        padding: 16px;
        border-radius: 8px;
        margin-top: 12px;
        border: 1px solid var(--border);
      }
      .interface-card h4 {
        margin: 0 0 8px 0;
        color: #10b981;
      }
      .syntax-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .copy-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }
      .copy-btn:hover {
        background: #2563eb;
      }
      .syntax-guide pre {
        background: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 13px;
        margin: 0;
        line-height: 1.5;
      }
      .knob-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      .clear-val-btn {
        background: transparent;
        border: 1px solid var(--border);
        color: #64748b;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
      }
      .clear-val-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-color: #ef4444;
      }
      .clear-val-btn.is-cleared {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      .cleared-placeholder-badge {
        font-size: 12px;
        color: #64748b;
        font-style: italic;
        padding: 8px;
        background: rgba(0, 0, 0, 0.02);
        border: 1px dashed var(--border);
        border-radius: 6px;
        text-align: center;
      }
      .dark-theme .cleared-placeholder-badge {
        background: rgba(255, 255, 255, 0.02);
        color: #94a3b8;
      }
      .knob-description-text {
        margin: -2px 0 6px 0;
        font-size: 11px;
        color: #64748b;
        line-height: 1.4;
      }
      .dark-theme .knob-description-text {
        color: #94a3b8;
      }
      .doc-desc-cell {
        font-size: 12px;
        color: #475569;
        max-width: 250px;
        line-height: 1.4;
      }
      .dark-theme .doc-desc-cell {
        color: #cbd5e1;
      }
    `,
  ],
})
export class UniversalWorkbenchComponent {
  private document: Document = inject(DOCUMENT);
  protected themeService = inject(ThemeService);
  @ViewChild('dynamicHost', { read: ViewContainerRef, static: true }) host!: ViewContainerRef;
  @ViewChild('defaultItemMarkup', { read: TemplateRef, static: true })
  defaultItemTemplate!: TemplateRef<any>;
  @ViewChild('defaultSeparatorMarkup', { read: TemplateRef, static: true })
  defaultSeparatorTemplate!: TemplateRef<any>;
  private activeComponentRef: ComponentRef<any> | null = null;
  private dynamicTextNode: any = null;
  objectKeys = Object.keys;

  @ViewChild('gridColumns', { read: ElementRef, static: true }) gridColumnsRef!: ElementRef<HTMLElement>;

  // Dictionary mapping the string configuration identifier keys back to our compiled TemplateRef handles
  // Combined index providing quick references to both the real elements and raw string blueprints
  get childBlueprintsMap(): Record<string, ElementRef<HTMLElement>> {
    return {
      gridColumns: this.gridColumnsRef,
    };
  }
  readonly selectedClassName = signal('UIButtonComponent');
  readonly slotTextContent = signal('Click Me');
  readonly liveLogs = signal<Array<{ event: string; data: any }>>([]);
  readonly jsonErrors = signal<Record<string, boolean>>({});
  readonly copySuccess = signal(false);
  readonly componentRegistry = registryData as Record<string, ComponentMeta>;
  readonly componentList = Object.keys(COMPONENT_MAP);
  readonly activeMetadata = computed(() => this.componentRegistry[this.selectedClassName()]);
  readonly knobStates = signal<Record<string, any>>({});
  readonly hasTriggerCapabilities = computed(() => {
    const name = this.selectedClassName().toLowerCase();
    return name.includes('modal') || name.includes('drawer') || name.includes('dialog') || name.includes('popover');
  });

  constructor() {
    // Upgraded binding sync interceptor loop
    effect(() => {
      const currentKnobs = this.knobStates();
      if (!this.activeComponentRef) return;

      Object.keys(currentKnobs).forEach((inputName) => {
        const metaInput = this.activeMetadata()?.inputs.find((i) => i.name === inputName);
        let liveVal = currentKnobs[inputName]();

        // Intercept string placeholders and transform them into real keywords
        if (liveVal === 'undefined' || liveVal === undefined) {
          liveVal = undefined;
        } else if (liveVal === 'null' || liveVal === null) {
          liveVal = null;
        } else if (metaInput?.controlType === 'json') {
          try {
            liveVal = JSON.parse(liveVal);
          } catch (e) {
            return; // Skip assigning invalid user JSON structures mid-keystroke
          }
        }

        this.activeComponentRef!.setInput(inputName, liveVal);
      });
    });

    effect(() => {
      this.renderSelectedComponent(this.selectedClassName());
    });
  }

  toggleTheme() {
    this.themeService.toggle();
  }
  selectComponent(className: string) {
    this.selectedClassName.set(className);
  }
  updateKnob(name: string, value: any) {
    this.knobStates()[name].set(value);
  }
  updateJsonKnob(name: string, rawStringValue: string) {
    this.knobStates()[name].set(rawStringValue);
    try {
      JSON.parse(rawStringValue);
      this.jsonErrors.update((prev) => ({ ...prev, [name]: false }));
    } catch (e) {
      this.jsonErrors.update((prev) => ({ ...prev, [name]: true }));
    }
  }
  updateProjectedText(newText: string) {
    this.slotTextContent.set(newText);
    if (this.dynamicTextNode) {
      this.dynamicTextNode.textContent = newText;
    }
  }
  simulateTriggerAction() {
    if (!this.activeComponentRef) return;
    const inst = this.activeComponentRef.instance;
    // Check if the component maps visibility parameters using common input naming variations
    const possibleFlags = ['visible', 'open', 'isOpen', 'show'];
    let flagFound = false;
    possibleFlags.forEach((flag) => {
      if (flag in inst) {
        flagFound = true;
        if (inst[flag] && typeof inst[flag].set === 'function') {
          inst[flag].set(true); // Supports Writeable Signals
        } else {
          this.updateKnob(flag, true); // Fallback to standard input properties
        }
      }
    });
    // If utilizing direct public class interaction actions instead of pure data flags
    if (typeof inst.open === 'function') inst.open();
    else if (typeof inst.show === 'function') inst.show();
    else if (typeof inst.toggle === 'function' && !flagFound) inst.toggle();
    this.activeComponentRef.changeDetectorRef.detectChanges();
  }

  private renderSelectedComponent(className: string) {
    this.host.clear();

    const componentType = COMPONENT_MAP[className];
    const meta = this.componentRegistry[className];
    if (!componentType || !meta) return;

    // Reset parameters tracking dictionary states
    const newKnobs: Record<string, any> = {};
    meta.inputs.forEach((inp: any) => {
      let baselineValue = inp.defaultValue;
      if (MOCK_DATA_REGISTRY[className]?.[inp.name] !== undefined) {
        const customMock = MOCK_DATA_REGISTRY[className][inp.name];
        baselineValue = inp.controlType === 'json' ? JSON.stringify(customMock, null, 2) : customMock;
      }
      newKnobs[inp.name] = signal(baselineValue);
    });
    this.knobStates.set(newKnobs);

    const projectableNodes: any[][] = [];
    const defaultSlotNodes: any[] = [];

    // AUTOMATED HARVESTING: Read children nodes straight out of the DOM containers
    const childConfig = CHILD_TEMPLATE_REGISTRY[className];
    if (childConfig && this.childBlueprintsMap[childConfig.templateKey]) {
      const containerElement = this.childBlueprintsMap[childConfig.templateKey].nativeElement;

      // Clone the node children instances so they can be securely projected without altering the hidden source
      Array.from(containerElement.childNodes).forEach((node) => {
        defaultSlotNodes.push(node.cloneNode(true));
      });
    }

    if (meta.slots?.default && defaultSlotNodes.length === 0) {
      defaultSlotNodes.push(document.createTextNode(this.slotTextContent()));
    }
    projectableNodes.push(defaultSlotNodes);

    // Instantiate element context frame
    this.activeComponentRef = this.host.createComponent(componentType, {
      projectableNodes: projectableNodes,
    });

    // Fulfill generic contentChild structural templates
    if (meta.templateChildren && meta.templateChildren.length > 0) {
      meta.templateChildren.forEach((templateName: string) => {
        const inputProp = templateName + 'Template';
        if (inputProp in this.activeComponentRef!.instance) {
          const selectedTemp = templateName.toLowerCase().includes('separator')
            ? this.defaultSeparatorTemplate
            : this.defaultItemTemplate;
          this.activeComponentRef!.setInput(inputProp, selectedTemp);
        }
      });
    }

    // Set initial input assignments
    meta.inputs.forEach((inp: any) => {
      let activeVal =
        MOCK_DATA_REGISTRY[className]?.[inp.name] !== undefined
          ? MOCK_DATA_REGISTRY[className][inp.name]
          : inp.defaultValue;
      if (inp.controlType === 'json' && typeof activeVal === 'string' && activeVal !== '') {
        try {
          activeVal = JSON.parse(activeVal);
        } catch (e) {}
      }
      this.activeComponentRef!.setInput(inp.name, activeVal);
    });

    this.activeComponentRef.changeDetectorRef.detectChanges();
  }

  // Pure computed signal calculating implementation markup dynamically using your DOM code references
  readonly consumptionSyntax = computed(() => {
    const className = this.selectedClassName();
    const meta = this.activeMetadata();
    const currentKnobs = this.knobStates();
    if (!meta) return '';

    const selector = 'ui-' + className.toLowerCase().replace('component', '').substring(2);
    let tag = `<${selector}\n`;

    // 1. Process normal knob input configurations...
    meta.inputs.forEach((inp: any) => {
      const valSignal = currentKnobs[inp.name];
      if (valSignal) {
        const activeVal = valSignal();
        if (activeVal === 'undefined' || activeVal === undefined) return;
        if (activeVal === 'null' || activeVal === null) tag += `  [${inp.name}]="null"\n`;
        else if (inp.controlType === 'json') tag += `  [${inp.name}]='${activeVal.replace(/\s+/g, ' ')}'\n`;
        else if (inp.controlType === 'boolean' && activeVal === true) tag += `  [${inp.name}]="true"\n`;
        else if (inp.controlType !== 'boolean') tag += `  ${inp.name}="${activeVal}"\n`;
      }
    });

    // 2. Process output handlers...
    meta.outputs.forEach((outp: any) => {
      tag += `  (${outp.name})="handle${outp.name}($event)"\n`;
    });

    // 3. RE-EVALUATE INNER LAYOUT STRINGS WITH TYPE-SAFE SECURE BOUNDARIES
    const childConfig = CHILD_TEMPLATE_REGISTRY[className];
    const blueprintElementRef = childConfig ? this.childBlueprintsMap[childConfig.templateKey] : null;

    if (blueprintElementRef && blueprintElementRef.nativeElement) {
      // FIX: Guard against undefined by accessing innerHTML safely
      const rawHtmlCode = blueprintElementRef.nativeElement.innerHTML || '';

      // Clean up spacing and carriage returns from the template code block formatting
      const formattedInnerCode = rawHtmlCode
        .split('\n')
        .map((line) => (line.trim() ? '  ' + line.trim() : ''))
        .filter((line) => line)
        .join('\n');

      tag += `>\n${formattedInnerCode}\n</${selector}>`;
    } else if (
      meta.slots?.default ||
      (meta.slots?.named && meta.slots.named.length > 0) ||
      (meta.templateChildren && meta.templateChildren.length > 0)
    ) {
      tag += `>\n`;
      if (meta.slots?.default) tag += `  ${this.slotTextContent()}\n`;
      if (meta.slots?.named) {
        meta.slots.named.forEach(
          (slotName: string) => (tag += `  <span ${slotName.replace(/[\[\]]/g, '')}>🌟</span>\n`),
        );
      }
      if (meta.templateChildren) {
        meta.templateChildren.forEach((tempName: string) => {
          tag += `  <ng-template #${tempName} let-item>\n    <span>{{ item.label }}</span>\n  </ng-template>\n`;
        });
      }
      tag += `</${selector}>`;
    } else {
      tag += `></${selector}>`;
    }

    return tag;
  });

  copyCodeToClipboard() {
    navigator.clipboard.writeText(this.consumptionSyntax());
    this.copySuccess.set(true);
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
