import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uiFindObject',
  pure: true,
})
export class FindObjectPipe implements PipeTransform {
  transform<T>(items: T[], path: string, value: any): T | undefined {
    if (!items || !path || value == null) {
      return undefined;
    }

    const keys = path.split('.');

    return items.find((item) => {
      // Safely drill down into the object structure using th ekey path.
      let currentPropertyValue = item;

      for (const key of keys) {
        if (currentPropertyValue == null) {
          return false;
        }

        // @ts-ignore
        currentPropertyValue = currentPropertyValue[key];
      }

      return currentPropertyValue === value;
    });
  }
}
