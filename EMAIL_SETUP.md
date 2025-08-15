# Email Invitation System Setup

This guide explains how to set up the email invitation system for the coaching app.

## Features

- **Email Invitations**: Coaches can send email invitations to customers to join programs
- **Invitation Links**: Unique invitation links are generated for each invitation
- **Copy Link**: Coaches can copy and share invitation links directly
- **Invitation Acceptance**: Customers can accept invitations through a dedicated page

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### 3. Alternative Email Services

You can use other SMTP services by changing the configuration:

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### 4. Database Setup

The system automatically creates the required `invitations` table when you run the database setup.

## Usage

### For Coaches

1. Navigate to the Member Management or Coach Dashboard
2. Click "Send Invitation" button
3. Fill in customer details:
   - Full Name
   - Email Address
   - Program Selection
4. Click "Send Invitation Email"
5. The system will:
   - Send an email to the customer
   - Generate a unique invitation link
   - Display the link for copying

### For Customers

1. Customer receives an email invitation
2. Clicks the invitation link
3. Views program and coach details
4. Accepts the invitation
5. Gets redirected to create account or dashboard

## Email Template

The invitation email includes:
- Professional design with coach branding
- Program details (name, description, duration, price)
- Coach information (name, business, specialization)
- Clear call-to-action button
- Invitation link

## Development Mode

In development, emails are logged to the console instead of being sent. This allows you to test the system without setting up email credentials.

## Security Features

- Invitation tokens expire after 7 days
- Unique tokens prevent invitation reuse
- Email validation and sanitization
- Rate limiting (can be added)

## Troubleshooting

### Common Issues

1. **Email not sending**: Check SMTP credentials and firewall settings
2. **Invitation link not working**: Verify `NEXT_PUBLIC_APP_URL` is correct
3. **Database errors**: Ensure the `invitations` table exists

### Testing

1. Use the mock email service in development
2. Check console logs for email content
3. Verify invitation links work in the browser
4. Test invitation acceptance flow

## Customization

You can customize:
- Email templates in `lib/email-service.ts`
- Invitation expiration time in the database schema
- Email styling and branding
- Invitation page design

## Support

For issues or questions, check the application logs and verify your configuration settings.



