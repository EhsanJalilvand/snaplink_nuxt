# Authentication Setup Guide

This project includes a complete authentication system integrated with Keycloak, featuring all modern security practices.

## Features

✅ **Complete Authentication Flow**
- User Registration with email verification
- Login with username/password
- Password reset via email
- Two-Factor Authentication (2FA)
- Email verification
- Secure logout

✅ **Security Features**
- Form validation with Zod
- CSRF protection
- Secure token storage
- Password strength validation
- Rate limiting ready
- XSS protection

✅ **User Experience**
- Responsive design
- Loading states
- Error handling
- Success notifications
- Multi-language support ready

## Pages Created

- `/auth/login` - Login page with social auth options
- `/auth/register` - Registration with password validation
- `/auth/forgot-password` - Password reset request
- `/auth/verify-email` - Email verification
- `/auth/2fa` - Two-factor authentication
- `/auth/reset-password` - Password reset form
- `/auth/index` - Redirects to login

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/verify-2fa` - 2FA verification
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user info

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=snaplink-app
KEYCLOAK_CLIENT_SECRET=your-client-secret-here
KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback

# Application Configuration
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_APP_NAME=SnapLink

# Security
NUXT_PUBLIC_CSRF_SECRET=your-csrf-secret-here
NUXT_PUBLIC_JWT_SECRET=your-jwt-secret-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@snaplink.com
```

## Keycloak Setup

1. **Install Keycloak**
   ```bash
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Create Realm**
   - Go to http://localhost:8080/admin
   - Login with admin/admin
   - Create new realm: "snaplink"

3. **Create Client**
   - Go to Clients → Create
   - Client ID: `snaplink-app`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`

4. **Configure Client**
   - Enable "Direct Access Grants"
   - Enable "Service Accounts"
   - Set Client Secret

## Usage

### In Components

```vue
<script setup>
const { user, isAuthenticated, login, logout } = useAuth()

// Login
const handleLogin = async () => {
  const result = await login(email.value, password.value)
  if (result.success) {
    // Redirect to dashboard
  }
}

// Logout
const handleLogout = async () => {
  await logout()
}
</script>
```

### Protected Routes

The middleware automatically protects routes starting with `/dashboard`. Users will be redirected to login if not authenticated.

### Form Validation

All forms use Zod validation with proper error handling:

```vue
<script setup>
const zodSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
})

const { handleSubmit, setFieldError } = useForm({
  validationSchema: toTypedSchema(zodSchema),
})
</script>
```

## Security Best Practices

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **CSRF Protection**: Implemented via Keycloak
3. **Input Validation**: All inputs validated with Zod
4. **Error Handling**: Generic error messages to prevent information leakage
5. **Rate Limiting**: Ready for implementation
6. **HTTPS**: Required in production

## Customization

### Styling
All pages use Tailwind CSS and can be customized by modifying the classes in the Vue files.

### Validation Messages
Update validation messages in the `VALIDATION_TEXT` objects in each page.

### Email Templates
Configure email templates in Keycloak admin console.

### Social Login
Add social login providers in Keycloak and update the buttons in login/register pages.

## Testing

Test the authentication flow:

1. Register a new user
2. Verify email (use demo code: 123456)
3. Login with credentials
4. Test password reset
5. Test 2FA (use demo code: 123456)

## Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **HTTPS**: Enable HTTPS for all communications
3. **Database**: Configure proper database for user data
4. **Monitoring**: Add logging and monitoring
5. **Backup**: Implement proper backup strategies
6. **Scaling**: Configure for horizontal scaling

## Support

For issues or questions:
1. Check Keycloak logs
2. Verify environment variables
3. Check browser console for errors
4. Ensure all dependencies are installed





