import React, { createContext, useState, useContext } from "react";
import { useRouter } from "next/router";

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const router = useRouter();
  const [locale, setLocale] = useState(router.locale || "zh-TW");

  const changeLanguage = (newLocale) => {
    const { pathname, asPath, query } = router;
    // Update the URL and locale
    router.push({ pathname, query }, asPath, { locale: newLocale });
    setLocale(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
