import { Service } from '@angular/core';

@Service()
export class FuzzyMatchingService {
  public fuzzyMatch(text: string, query: string): boolean {
    if (text == null || query == null) {
      return false;
    }

    text = text.toLowerCase();
    query = query.toLowerCase();

    let ti = 0;

    for (let qi = 0; qi < query.length; qi++) {
      ti = text.indexOf(query[qi], ti);

      if (ti === -1) {
        return false;
      }

      ti++;
    }

    return true;
  }

  public matchStringArray(items: Array<string>, query: string): Array<string> {
    if (items == null || items.length == 0) {
      return [];
    }

    if (query == null || query == '') {
      // There was no query in the first place, just return everything.
      return items;
    }

    return items.filter((x) => this.fuzzyMatch(x, query));
  }

  public matchObjectArray<T>(
    items: Array<T>,
    query: string,
    keyFunction: (item: T) => string,
  ): Array<T> {
    if (items == null || items.length == 0 || keyFunction == null) {
      return [];
    }

    if (query == null || query == '') {
      // There was no query in the first place, just return everything.
      return items;
    }

    return items.filter((item) => {
      const text = keyFunction(item);
      return this.fuzzyMatch(text, query);
    });
  }
}
