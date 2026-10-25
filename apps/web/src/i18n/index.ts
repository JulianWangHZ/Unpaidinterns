import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zhTW from './zh-TW.json';
import { LANGUAGE_STORAGE_KEY, pickLanguage, type Language } from './language.js';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, 'zh-TW': { translation: zhTW } },
  lng: pickLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY), navigator.language),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
document.documentElement.lang = i18n.language;

export function setLanguage(language: Language): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
  void i18n.changeLanguage(language);
}
