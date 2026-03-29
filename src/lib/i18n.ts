export type Locale = "kz" | "ru" | "en";

type Dictionary = Record<string, Partial<Record<Locale, string>>>;

const dictionary: Dictionary = {
  // Intentionally empty for now. Keys are already wired in components.
};

export function t(key: string, fallback: string, locale: Locale = "en"): string {
  return dictionary[key]?.[locale] ?? fallback;
}
