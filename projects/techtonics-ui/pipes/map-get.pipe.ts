import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uiMapGet',
  pure: true,
})
/**
 * This pipe is used to get the valu eof a map key.
 * Generally used in an ngIf/@If
 */
export class MapGetPipe implements PipeTransform {
  transform<K, V>(map: Map<K, V>, key: K): V | undefined {
    return map ? map.get(key) : undefined;
  }
}
