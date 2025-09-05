# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Supabase Configuration

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Email Configuration (Optional - for sending tax returns via email)

```
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

### Server Configuration

```
PORT=4000
```

## How to Get Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. For service role key, copy the service_role key (keep this secret!)

## Database Schema Required

Make sure your Supabase database has the following tables:

### profiles table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### tax_calculations table

```sql
CREATE TABLE tax_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tax_data JSONB NOT NULL,
  calculation_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own calculations" ON tax_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calculations" ON tax_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/me` - Get current user (requires Bearer token)

### Tax Calculations

- `POST /api/calculations` - Save tax calculation (requires Bearer token)
- `GET /api/calculations` - Get user's calculation history (requires Bearer token)

### Other Endpoints

- `POST /api/process-106` - Process 106 form
- `POST /api/calculate-tax` - Calculate tax directly
- `POST /api/generate-tax-return-pdf` - Generate PDF
- `POST /api/send-tax-return-email` - Send PDF via email
