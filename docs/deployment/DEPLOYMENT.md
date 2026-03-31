# Tax Return Calculator - Vercel Deployment

## Environment Variables Required

Create environment variables in Vercel dashboard:

### Supabase Configuration

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

### Email Configuration (Optional)

- `SMTP_HOST` - SMTP server host (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (e.g., 587)
- `SMTP_SECURE` - Use SSL (true/false)
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password/app password
- `SMTP_FROM` - From email address

### Frontend Configuration

- `VITE_API_URL` - API base URL (leave empty for relative paths)
- `FRONTEND_URL` - Frontend URL for OAuth callbacks (e.g., https://your-app.vercel.app)

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the environment variables above
3. Deploy - Vercel will automatically build both frontend and backend

## Project Structure

- `project/` - React frontend (Vite)
- `backend/` - Node.js backend (Express)
- `vercel.json` - Vercel configuration

## Build Process

- Frontend: `npm run vercel-build` → `project/dist/`
- Backend: Serverless functions in `backend/api/`
