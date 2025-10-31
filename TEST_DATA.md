# Test Data for Authentication

## Login Test Data
- **Email:** `admin@admin.com`
- **Password:** `admin`
- **Trust Device:** Optional checkbox

## Register Test Data
- **Username:** `admin`
- **Email:** `admin@admin.com`
- **Password:** `admin`
- **Confirm Password:** `admin`

## Verification Codes
- **Email Verification Code:** `1234`
- **2FA Code:** `1234`

## Test Flow
1. Go to `/auth/register`
2. Fill in the test data above
3. Submit the form
4. You'll be redirected to `/auth/verify-email`
5. Enter verification code `1234`
6. You'll be redirected to `/auth/login`
7. Login with the test credentials
8. You'll be redirected to `/dashboard`

## Dashboard Features
- Shows user information
- Logout button
- Change password link
- User profile details

## Notes
- All test data is hardcoded for development
- In production, replace with real Keycloak integration
- The system uses cookies for session management
- All forms have proper validation



