import { useRouter } from "next/router";

export function useTranslation() {
  const router = useRouter();
  const { locale } = router;

  const t = (key, params = {}) => {
    try {
      // Import the translation file for the current locale
      const translations = require(`../../public/locales/${locale}/common.json`);

      // Split the key by dots and traverse the translations object
      let translation = key
        .split(".")
        .reduce((obj, k) => obj?.[k], translations);

      if (!translation) return key;

      // Replace any parameters in the translation string
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });

      return translation;
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  return { t, locale };
}
