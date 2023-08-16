// @ts-ignore
import en from './assets/strings.en.json';
// @ts-ignore
import de from './assets/strings.de.json';

const SUPPORTED_LANGUAGES: Map<string, URL> = new Map([
  ['en', en],
  ['de', de]
]);
const DEFAULT_LANGUAGE = en;

export class TranslationMapper {
  private _strings: { [key: string]: string } = {};
  private initialized: boolean = false;
  private _initializedResolve: (value?: void) => void = () => {};
  public initializedPromise: Promise<void> = new Promise((resolve) => {
    this._initializedResolve = resolve;
  });

  public static detectLanguage(): string {
    return navigator.language.split('-')[0]; // only first part of language is relevant for this app
  }

  constructor(language: string) {
    let languageFileUrl = SUPPORTED_LANGUAGES.get(language) ?? DEFAULT_LANGUAGE;
    fetch(languageFileUrl).then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          this._strings = json;
          this.initialized = true;
          this._initializedResolve();
        });
      }
    });
  }

  public get strings(): { [key: string]: string } {
    if (!this.initialized) throw new TranslationMapperError('TranslationMapper not initialized');
    return this._strings;
  }

  public get(key: string): string {
    let translation = this.strings[key];
    if (translation === undefined) throw new TranslationMapperError(`Translation for key ${key} not found`);
    return translation;
  }
}

export class TranslationMapperError extends Error {
  constructor(message: string) {
    super(message);
  }
}
