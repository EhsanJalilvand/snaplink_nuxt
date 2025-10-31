# Installation Guide

## Dependencies Installation

برای استفاده از صفحات authentication، ابتدا dependencies مورد نیاز رو نصب کنید:

```bash
cd .app
pnpm install
```

## Required Dependencies

صفحات authentication به این dependencies نیاز دارن:

- `@zxcvbn-ts/core` - برای password strength validation
- `@zxcvbn-ts/language-common` - دیکشنری مشترک
- `@zxcvbn-ts/language-en` - دیکشنری انگلیسی

## Keycloak Setup

1. Keycloak رو نصب کنید:
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

2. Environment variables رو تنظیم کنید:
```bash
cp env.example .env
# سپس مقادیر Keycloak رو وارد کنید
```

## Testing

بعد از نصب dependencies، صفحات authentication رو تست کنید:

1. `/auth/login` - صفحه ورود
2. `/auth/register` - صفحه ثبت‌نام
3. `/auth/forgot-password` - فراموشی رمز عبور
4. `/auth/verify-email` - تایید ایمیل
5. `/auth/2fa` - احراز هویت دو مرحله‌ای

## Demo Codes

برای تست از این کدها استفاده کنید:
- Email verification: `123456`
- 2FA code: `123456`
- Login password: `password`




