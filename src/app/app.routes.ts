import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UIDocsComponent } from './ui-docs/ui-docs.component';
import { WorkbenchComponent } from './workbench/workbench.component';
import { UniversalWorkbenchComponent } from './universal-workbench/universal-workbench.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'ui-docs',
    component: UIDocsComponent,
  },
  {
    path: 'ui-workbench',
    component: WorkbenchComponent,
  },
  {
    path: 'ui-universal-workbench',
    component: UniversalWorkbenchComponent,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
