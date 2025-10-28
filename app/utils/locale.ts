export function getLocaleFlag(code: string) {
  switch (code) {
    case 'en':
      return '/img/icons/flags/united-states-of-america.svg'
    case 'fa':
      return '/img/icons/flags/iran.svg'
    case 'ar':
      return '/img/icons/flags/saudi-arabia.svg'
    default:
      return '/img/icons/flags/united-states-of-america.svg'
  }
}
