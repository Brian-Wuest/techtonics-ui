import { Service } from '@angular/core';

@Service()
export class ColorsService {
  hexToHsl(hex: string): { h: number; s: number; l: number } {
    let red = 0,
      green = 0,
      blue = 0;

    if (hex.length == 4) {
      red = parseInt(hex[1] + hex[1], 16);
      green = parseInt(hex[2] + hex[2], 16);
      blue = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) {
      red = parseInt(hex[1] + hex[2], 16);
      green = parseInt(hex[3] + hex[4], 16);
      blue = parseInt(hex[5] + hex[6], 16);
    }

    red /= 255;
    green /= 255;
    blue /= 255;

    let max = Math.max(red, green, blue),
      min = Math.min(red, green, blue);

    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max == min) {
      // Acrhomatic
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case red: {
          h = (green - blue) / d + (green < blue ? 6 : 0);
          break;
        }

        case green: {
          h = (blue - red) / d + 2;
          break;
        }

        case blue: {
          h = (red - green) / d + 4;
          break;
        }
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s,
      l,
    };
  }

  // Helper to convert htl to hex
  hslToHex(h: number, s: number, l: number): string {
    l = Math.max(0, Math.min(1, l));

    let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = l - c / 2,
      red = 0,
      green = 0,
      blue = 0;

    if (0 <= h && h < 60) {
      red = c;
      ((green = x), (blue = 0));
    } else if (60 <= h && h < 120) {
      red = x;
      ((green = c), (blue = 0));
    } else if (120 <= h && h < 180) {
      red = 0;
      green = c;
      blue = x;
    } else if (180 <= h && h < 240) {
      red = 0;
      green = x;
      blue = c;
    } else if (240 <= h && h < 300) {
      red = x;
      green = 0;
      blue = c;
    } else if (300 <= h && h < 360) {
      red = c;
      green = 0;
      blue = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  /**
   * Lightens or darkens a hex color with an optional contrast amount (defaults to 45%.)
   * @param hex  The hex value to lighten/darken.
   * @param contrastAmount The amount of contrast to change the value by (as a decimal percentage).
   * @returns The updated color code as HEX (#FFFFFF)
   */
  contrastHexColor(hex: string, contrastAmount: number = 0.45): string {
    if (hex == null || hex.length == 0) {
      hex = '#000000';
    }

    const { h, s, l } = this.hexToHsl(hex);

    // Chec if the constrast amount is a value value.
    if (contrastAmount == null || contrastAmount > 1 || contrastAmount <= 0) {
      contrastAmount = 0.45;
    }

    // Preceived lightness is typically judged at a 0.5 threshold.
    if (l > 0.5) {
      // Light color: darken by contrast amount.
      return this.hslToHex(h, s, Math.max(0, l - contrastAmount));
    } else {
      // Dark color: lighted by contrast amount.
      return this.hslToHex(h, s, Math.min(0, l + contrastAmount));
    }
  }
}
