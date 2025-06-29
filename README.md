# Docwise – AI-Powered Legal Documents

Build, edit, and export legally sound documents in minutes using AI.

## Features

- **Google Auth + Email login** - Secure authentication with Supabase
- **Clean dashboard + document list** - Intuitive interface for managing documents
- **AI-generated legal text** - Create NDAs, contracts, and agreements with AI assistance
- **Export to PDF or Google Docs** - Multiple export options (Google Docs coming soon)
- **Usage limits by subscription** - Tiered pricing with RevenueCat integration

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth & Database)
- **Routing**: React Router
- **Styling**: Tailwind CSS with Inter font
- **Icons**: Lucide React
- **Deployment**: Netlify (via Bolt)

## Getting Started

### Prerequisites

1. Create a [Supabase](https://supabase.com) account and project
2. Set up authentication providers (Email + Google OAuth)
3. Create the required database tables (see Database Setup below)

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
   VITE_AI_API_KEY=your_ai_api_key (optional)
   VITE_REVENUECAT_PUBLIC_KEY=your_revenuecat_public_key (optional)
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

Create the following tables in your Supabase database:

#### Documents Table
```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);
```

#### User Usage Table
```sql
CREATE TABLE user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ai_generations_used INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);
```

### Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email authentication
3. Enable Google OAuth:
   - Add your Google OAuth credentials
   - Set redirect URL to: `https://your-domain.com/dashboard`

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
│   └── PlanCard.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Editor.tsx
│   ├── Pricing.tsx
│   └── Account.tsx
├── lib/               # Utilities and configurations
│   └── supabase.ts
└── App.tsx           # Main app component
```

## Features Overview

### Authentication
- Email/password signup and login
- Google OAuth integration
- Protected routes for authenticated users
- User session management

### Document Management
- Create, edit, and delete documents
- Rich text editor with AI generation
- Document versioning and auto-save
- Export to PDF (Google Docs coming soon)

### AI Integration
- AI-powered document generation
- Multiple document types (NDAs, contracts, agreements)
- Customizable prompts and templates
- Usage tracking and limits

### Subscription Management
- Free, Pro, and Business tiers
- Usage-based limitations
- RevenueCat integration (placeholder)
- Upgrade/downgrade functionality

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