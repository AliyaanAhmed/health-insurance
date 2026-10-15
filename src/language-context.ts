import { createContext, useContext } from 'react'
export type Language = 'en' | 'ar'
export const LanguageContext = createContext({
  locale: 'en' as Language,
  toggle: () => {},
  t: (text: string) => text,
})
export const useLanguage = () => useContext(LanguageContext)
