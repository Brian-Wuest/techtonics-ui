import { Service, signal } from '@angular/core';

@Service()
export class ThemeService {
  private setTheme = signal<'light' | 'dark'>('light');

  /**
   * Returns a read-only signal containing the theme value.
   */
  public get theme() {
    return this.setTheme.asReadonly();
  }

  constructor() {
    const saved = localStorage.getItem('theme');

    if (saved === 'dark') {
      this.setDark();
    } else {
      this.setLight();
    }
  }

  public setLight() {
    document.documentElement.removeAttribute('data-theme');
    this.setTheme.set('light');
    localStorage.setItem('theme', 'light');
  }

  public setDark() {
    document.documentElement.setAttribute('data-theme', 'dark');
    this.setTheme.set('dark');
    localStorage.setItem('theme', 'dark');
  }

  public toggle() {
    this.setTheme() === 'light' ? this.setDark() : this.setLight();
  }
}
