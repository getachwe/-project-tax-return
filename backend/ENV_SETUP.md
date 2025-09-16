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

# OR real SMTP (e.g., Gmail with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_gmail_address@gmail.com
```

### Server Configuration

```
PORT=4000
```

### Storage (Supabase)

יש ליצור Bucket פרטי בשם `reports` לשמירת קובצי PDF של דוחות. הגישה להורדה תתבצע באמצעות Signed URLs מהשרת בלבד.

## How to Get Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. For service role key, copy the service_role key (keep this secret!)

## How to Set Up Gmail App Password

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security > 2-Step Verification (make sure it's enabled)
3. Scroll down to "App passwords"
4. Click "App passwords"
5. Select "Mail" as the app
6. Select "Other (Custom name)" and enter "Tax Return App"
7. Click "Generate"
8. Copy the 16-character password (it will look like: abcd efgh ijkl mnop)
9. Use this password as SMTP_PASS in your .env file
10. Use your Gmail address as SMTP_USER

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

### reports table (לוג היסטוריה של דוחות)

```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tax_data JSONB NOT NULL,
  calculation_result JSONB NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- אופציונלי: לאפשר למשתמש למחוק דוחות שהוא יצר
CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX reports_user_id_created_idx ON reports(user_id, created_at DESC);
CREATE INDEX reports_user_id_year_idx ON reports(user_id, year);
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
