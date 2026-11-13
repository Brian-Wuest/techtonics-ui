import { inject, Pipe, PipeTransform } from '@angular/core';
import { ColorsService } from 'techtonics-ui/services';

@Pipe({
  name: 'uiInvertColor',
  pure: true,
})
export class InvertColorPipe implements PipeTransform {
  private colorService: ColorsService = inject(ColorsService);
  private defaultColor: string = '#000000';

  transform(color: string, nullColor: string = this.defaultColor): string {
    // If the color is null, blank string, or plain white, just return black.
    if (
      color == null ||
      color.trim() == '' ||
      color.toLocaleLowerCase() == '#ffffff' ||
      color.toLocaleLowerCase() == '#fff'
    ) {
      if (nullColor != null && nullColor.trim() != '') {
        return nullColor;
      }

      return this.defaultColor;
    }

    return this.colorService.contrastHexColor(color);
  }
}
