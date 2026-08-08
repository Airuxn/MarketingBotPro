import translationData from './translations.json'

export type Language = 'en' | 'fr' | 'nl'

export const translations = translationData

export function getTranslation(key: string, lang: Language): string {
  const keys = key.split('.')
  let value: any = translations[lang]

  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      // Fallback to English if translation missing
      value = translations.en
      for (const k2 of keys) {
        value = value?.[k2]
      }
      break
    }
  }

  return value || key
}
