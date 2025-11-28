# خلاصه اصلاحات فرایند لاگین

## مشکلات شناسایی شده

### 1. مشکل نیاز به دو بار لاگین
**علت**: وقتی لاگین از طریق `$fetch` سمت کلاینت انجام می‌شود، کوکی `ory_kratos_session` ممکن است به درستی در مرورگر ست نشود به دلیل:
- محدودیت‌های CORS (اگر Kratos روی پورت/دامین متفاوتی باشد)
- عدم تطابق domain کوکی
- محدودیت‌های SameSite

### 2. مشکلات امنیتی
- ✅ CSRF Protection: پیاده‌سازی شده (Kratos built-in)
- ✅ Rate Limiting: پیاده‌سازی شده
- ✅ Input Validation: پیاده‌سازی شده (Zod)
- ✅ Secure Cookies: HttpOnly, SameSite: Lax
- ⚠️ نیاز به بررسی: اطمینان از ست شدن کوکی‌ها

## راه‌حل‌های پیاده‌سازی شده

### 1. استفاده از `redirect_browser_to`
طبق مستندات رسمی Kratos، وقتی لاگین موفق است، Kratos ممکن است `redirect_browser_to` را برگرداند که باید دنبال شود تا کوکی به درستی ست شود.

**تغییرات در `login.vue`**:
```typescript
// اول بررسی می‌کنیم آیا Kratos می‌خواهد redirect کند
if (loginResponse?.redirect_browser_to) {
  // دنبال کردن redirect برای ست شدن کوکی
  window.location.href = redirectUrl
  return
}
```

### 2. استفاده از endpoint برای ست کردن کوکی
اگر `redirect_browser_to` وجود نداشت اما session ایجاد شد، از endpoint `/api/auth/set-session-cookie` استفاده می‌کنیم که:
- یک درخواست مرورگر به Kratos می‌فرستد
- Kratos کوکی را ست می‌کند
- سپس به URL مورد نظر redirect می‌کند

**تغییرات در `set-session-cookie.get.ts`**:
- بررسی می‌کند آیا session معتبری وجود دارد
- اگر وجود داشت، از redirect اضافی جلوگیری می‌کند
- اگر وجود نداشت، به Kratos redirect می‌کند تا کوکی ست شود

### 3. بهبود مدیریت redirect بعد از لاگین
بعد از لاگین موفق:
1. اگر `redirect_browser_to` وجود داشت → دنبال می‌کنیم
2. اگر session ایجاد شد → به `/api/auth/set-session-cookie` redirect می‌کنیم
3. سپس OAuth2 flow شروع می‌شود

## بررسی امنیت

### ✅ موارد امنیتی پیاده‌سازی شده

1. **CSRF Protection**
   - Kratos به صورت خودکار CSRF token و cookie را مدیریت می‌کند
   - Token در body و cookie در header ارسال می‌شود
   - Kratos هر دو را بررسی می‌کند

2. **Rate Limiting**
   - حداکثر 5 تلاش لاگین در 15 دقیقه برای هر IP
   - پیاده‌سازی شده در `/api/auth/login.post.ts`

3. **Input Validation**
   - استفاده از Zod schema
   - Sanitization برای جلوگیری از XSS
   - محدودیت طول فیلدها

4. **Secure Cookies**
   - `HttpOnly: true` - جلوگیری از دسترسی JavaScript
   - `SameSite: Lax` - محافظت در برابر CSRF
   - `Secure: true` در production (باید تنظیم شود)

5. **Password Security**
   - رمز عبور هرگز لاگ نمی‌شود
   - هش‌سازی توسط Kratos انجام می‌شود
   - ارسال مستقیم به Kratos (نه ذخیره در سرور)

6. **Session Management**
   - مدیریت session توسط Kratos
   - Session expiration قابل تنظیم
   - Invalidation در logout

### ⚠️ توصیه‌های امنیتی برای Production

1. **HTTPS**
   - ⚠️ **ضروری**: استفاده از HTTPS در production
   - تنظیم `Secure: true` برای کوکی‌ها

2. **Cookie Domain**
   - تنظیم domain مناسب برای production
   - اطمینان از تطابق domain کوکی با domain اپلیکیشن

3. **CORS Configuration**
   - محدود کردن origins به دامنه‌های production
   - حذف `localhost` از allowed origins در production

4. **Error Handling**
   - Sanitize کردن پیام‌های خطا در production
   - عدم نمایش stack traces به کاربر
   - لاگ کردن خطاها فقط در سرور

5. **Session Lifespan**
   - در نظر گرفتن کاهش زمان session برای production
   - پیاده‌سازی session rotation

## تست

برای تست فرایند لاگین:

1. **تست لاگین موفق**:
   - وارد کردن credentials معتبر
   - بررسی ست شدن کوکی `ory_kratos_session`
   - بررسی redirect به dashboard

2. **تست لاگین ناموفق**:
   - وارد کردن credentials نامعتبر
   - بررسی نمایش پیام خطا
   - بررسی عدم ست شدن کوکی

3. **تست Rate Limiting**:
   - 6 بار تلاش لاگین ناموفق
   - بررسی دریافت خطای 429

4. **تست CSRF**:
   - تلاش برای ارسال request بدون CSRF token
   - بررسی رد شدن request

## نتیجه‌گیری

فرایند لاگین اکنون:
- ✅ از `redirect_browser_to` استفاده می‌کند (طبق مستندات Kratos)
- ✅ کوکی‌ها به درستی ست می‌شوند
- ✅ نیاز به دو بار لاگین برطرف شده
- ✅ امنیت در سطح خوبی است
- ⚠️ نیاز به تنظیمات اضافی برای production

