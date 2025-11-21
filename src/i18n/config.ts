import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mk from './locales/mk.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'mk';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      mk: { translation: mk },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'mk',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
