import en from './en';
import hi from './hi';
import pa from './pa';

export type Language = 'en' | 'hi' | 'pa';

export const translations = {
  en,
  hi,
  pa,
};

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let obj: any = translations[lang];
  for (const k of keys) {
    if (obj && typeof obj === 'object' && k in obj) {
      obj = obj[k];
    } else {
      return key;
    }
  }
  return typeof obj === 'string' ? obj : key;
}