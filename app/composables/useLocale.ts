export function useAppLocale() {
  const locale = useState<string>('app-locale', () => 'en')
  return locale
}
