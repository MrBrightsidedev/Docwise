# Docwise – AI-Powered Legal Documents

Build, edit, and export legally sound documents in minutes using AI.

## Features

- **Google Auth + Email login** - Secure authentication with Supabase
- **Clean dashboard + document list** - Intuitive interface for managing documents
- **AI-generated legal text** - Create NDAs, contracts, and agreements with AI assistance
- **Export to PDF or Google Docs** - Multiple export options with Google Workspace integration
- **Usage limits by subscription** - Tiered pricing with Stripe integration
- **Secure token management** - Encrypted storage of Google OAuth tokens

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth & Database)
- **Payments**: Stripe for subscription management
- **Integrations**: Google Workspace (Docs, Sheets, Drive)
- **Routing**: React Router
- **Styling**: Tailwind CSS with Inter font
- **Icons**: Lucide React
- **Deployment**: Netlify (via Bolt)

## Getting Started

### Prerequisites

1. Create a [Supabase](https://supabase.com) account and project
2. Set up authentication providers (Email + Google OAuth)
3. Create a [Stripe](https://stripe.com) account for payments
4. Set up Google OAuth credentials for Workspace integration
5. Create the required database tables (see Database Setup below)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with your configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AI_API_KEY=your_ai_api_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REDIRECT_URI=your_google_oauth_redirect_uri
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The application includes several migration files that create the necessary database structure:

#### Core Tables
- **documents**: Store user documents with RLS policies
- **user_usage**: Track AI generation usage and subscription plans
- **google_tokens**: Securely store Google OAuth tokens (encrypted in production)

#### Stripe Integration Tables
- **stripe_customers**: Link Supabase users to Stripe customers
- **stripe_subscriptions**: Manage subscription status and billing info
- **stripe_orders**: Track one-time purchases

#### Security Features
- Row Level Security (RLS) enabled on all tables
- Secure views for user data access
- Automatic user_usage record creation on signup
- Token expiration checking functions

### Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email authentication
3. Enable Google OAuth:
   - Add your Google OAuth credentials
   - Set redirect URL to: `https://your-domain.com/dashboard`

### Stripe Setup

1. Create products in your Stripe dashboard
2. Update `src/stripe-config.ts` with your product IDs and price IDs
3. Set up webhook endpoints in Stripe dashboard:
   - Endpoint URL: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### Google Workspace Integration

1. Create a Google Cloud Project
2. Enable Google Docs, Drive, and Sheets APIs
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Update environment variables with your Google OAuth credentials

**Note**: The Google integration is currently scaffolded with placeholder implementations. To complete the integration:

1. Implement actual Google API calls in the edge functions
2. Add token refresh logic for expired tokens
3. Implement proper token encryption for production use
4. Add error handling for Google API rate limits

## Deployment

### Netlify (Recommended)

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Custom Domain (Optional)

Use [Entri](https://entri.com) or your preferred domain registrar to set up a custom domain.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── DocCard.tsx
│   ├── DocEditor.tsx
│   ├── AIModal.tsx
│   ├── PlanCard.tsx
│   ├── CheckoutButton.tsx
│   └── SubscriptionStatus.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Editor.tsx
│   ├── Pricing.tsx
│   ├── Account.tsx
│   └── Success.tsx
├── lib/               # Utilities and configurations
│   ├── supabase.ts
│   ├── stripe.ts
│   └── google-integration.ts
├── stripe-config.ts   # Stripe product configuration
└── App.tsx           # Main app component

supabase/
├── functions/         # Edge functions
│   ├── stripe-checkout/
│   ├── stripe-webhook/
│   ├── google-auth/
│   └── google-docs-export/
└── migrations/        # Database migrations
    ├── create_documents_table.sql
    ├── create_user_usage_table.sql
    ├── create_google_tokens_table.sql
    └── [stripe_tables].sql
```

## Features Overview

### Authentication
- Email/password signup and login
- Google OAuth integration
- Protected routes for authenticated users
- User session management with Supabase

### Document Management
- Create, edit, and delete documents
- Rich text editor with AI generation
- Document versioning and auto-save
- Export to PDF and Google Docs

### AI Integration
- AI-powered document generation
- Multiple document types (NDAs, contracts, agreements)
- Customizable prompts and templates
- Usage tracking and limits

### Subscription Management
- Free, Pro, and Business tiers
- Stripe-powered billing
- Usage-based limitations
- Subscription status tracking

### Google Workspace Integration
- Secure OAuth token storage
- Export documents to Google Docs
- Export data to Google Sheets
- Token refresh handling

## Security Considerations

### Production Deployment
- **Token Encryption**: Implement proper encryption for Google OAuth tokens
- **Environment Variables**: Never expose sensitive keys in frontend code
- **HTTPS Only**: Ensure all API calls use HTTPS
- **Token Rotation**: Implement automatic token refresh
- **Rate Limiting**: Add rate limiting to prevent abuse

### Database Security
- Row Level Security (RLS) enabled on all tables
- Secure views for user data access
- Foreign key constraints for data integrity
- Audit trails for sensitive operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@docwise.com or create an issue in the repository.

## TODO Items for Production

### Google Integration
- [ ] Implement actual Google API calls in edge functions
- [ ] Add proper token encryption for production
- [ ] Implement token refresh logic
- [ ] Add comprehensive error handling
- [ ] Implement rate limiting for Google API calls

### Security Enhancements
- [ ] Add request validation middleware
- [ ] Implement API rate limiting
- [ ] Add audit logging for sensitive operations
- [ ] Encrypt sensitive data at rest

### Features
- [ ] Add document collaboration features
- [ ] Implement document templates
- [ ] Add advanced export options
- [ ] Create admin dashboard for user management