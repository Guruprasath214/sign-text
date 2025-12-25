# Forgot Password Setup Guide

## ✅ What's Been Implemented

1. **ForgotPassword Component** - Form to request password reset
2. **ResetPassword Component** - Form to set new password
3. **Email Integration** - EmailJS for sending reset emails
4. **Routes** - Added `/forgot-password` and `/reset-password` routes
5. **Auth Store** - Added `resetPassword` function

## 🚀 Setup EmailJS (REQUIRED)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Add Email Service
1. Go to **Email Services** in dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Connect your Gmail account
   - **Outlook**: Connect your Outlook account
   - Or use any other supported service
4. Note down your **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to **Email Templates** in dashboard
2. Click **Create New Template**
3. Use this template:

```
Subject: Password Reset Request - Your App

Hello,

You requested to reset your password. Click the link below to reset:

{{reset_link}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Your App Team
```

4. Make sure to use these variable names:
   - `{{to_email}}` - Recipient email (set in EmailJS)
   - `{{reset_link}}` - The reset URL
   - `{{user_email}}` - User's email address

5. Save and note your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. Find your **Public Key** (e.g., `AbC123XyZ456`)

### Step 5: Update Configuration
Open `src/config/emailjs.config.js` and replace with your credentials:

```javascript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_abc123',      // Your Service ID
  TEMPLATE_ID: 'template_xyz789',    // Your Template ID
  PUBLIC_KEY: 'AbC123XyZ456'         // Your Public Key
}
```

## 📧 Email Template Variables

Make sure your EmailJS template includes these variables:
- `{{to_email}}` - Automatically set by EmailJS
- `{{reset_link}}` - The password reset URL
- `{{user_email}}` - The user's email address

## 🔄 How It Works

1. **User enters email** on `/forgot-password`
2. **System generates token** and stores it in localStorage
3. **Email sent via EmailJS** with reset link
4. **User clicks link** in email (goes to `/reset-password?token=...`)
5. **Token validated** against localStorage
6. **User sets new password**
7. **Password updated** and user redirected to login

## 🔒 Security Features

- ✅ Token expires after 1 hour
- ✅ Token stored in localStorage (temporary)
- ✅ Email validation
- ✅ Password strength validation
- ✅ Token verification before reset

## 🧪 Testing

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for reset link
4. Click the link
5. Set new password
6. Login with new password

## ⚠️ Important Notes

### For Development:
- The current implementation uses **localStorage** for token storage
- This is fine for development and small apps
- Tokens expire after 1 hour

### For Production:
You should implement:
1. **Backend API** to handle password resets
2. **Database storage** for reset tokens
3. **Server-side validation**
4. **Rate limiting** to prevent abuse
5. **Secure token generation** (use crypto)

## 🔧 Troubleshooting

### Email not sending?
- Check EmailJS dashboard for errors
- Verify Service ID, Template ID, and Public Key
- Check browser console for errors
- Ensure you're not hitting EmailJS free tier limits (200 emails/month)

### Reset link not working?
- Check if token expired (1 hour)
- Clear localStorage and try again
- Check browser console for errors

### Gmail not working?
- Enable "Less secure app access" in Gmail settings
- Or use App Passwords for better security

## 📝 File Structure

```
front-end/
├── src/
│   ├── components/
│   │   ├── ForgotPassword.jsx     # Forgot password form
│   │   ├── ResetPassword.jsx      # Reset password form
│   │   ├── Login.jsx              # Login (updated with link)
│   │   └── Signup.jsx
│   ├── config/
│   │   └── emailjs.config.js      # EmailJS configuration
│   ├── store/
│   │   └── authStore.js           # Auth store (added resetPassword)
│   └── App.jsx                     # Routes added
```

## 🎨 Styling

All components use the same Tailwind CSS classes as Login/Signup:
- Consistent design
- Responsive layout
- Loading states
- Error handling
- Toast notifications

## 🚀 Next Steps

1. **Set up EmailJS account** (follow steps above)
2. **Test the flow** end-to-end
3. **Customize email template** to match your brand
4. **Consider backend implementation** for production

## 💡 Tips

- Use a dedicated email account for sending
- Monitor EmailJS dashboard for delivery status
- Keep Public Key secure (don't commit to public repos)
- Test with different email providers
- Consider implementing CAPTCHA to prevent spam

---

**Need Help?**
- EmailJS Docs: https://www.emailjs.com/docs/
- Support: Check browser console for errors
