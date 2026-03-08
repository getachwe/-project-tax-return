require("dotenv").config();
const { getSupabaseServiceClient } = require("./supabaseClient");

async function setupDatabase() {
  console.log("Setting up Supabase database...");

  try {
    const service = await getSupabaseServiceClient();

    // Create profiles table
    console.log("Creating profiles table...");
    const { error: profilesError } = await service.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      `,
    });

    if (profilesError) {
      console.log("Profiles table setup:", profilesError.message);
    } else {
      console.log("✅ Profiles table created successfully");
    }

    // Create tax_calculations table
    console.log("Creating tax_calculations table...");
    const { error: calculationsError } = await service.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS tax_calculations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          tax_data JSONB NOT NULL,
          calculation_result JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own calculations" ON tax_calculations;
        CREATE POLICY "Users can view own calculations" ON tax_calculations FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own calculations" ON tax_calculations;
        CREATE POLICY "Users can insert own calculations" ON tax_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
      `,
    });

    if (calculationsError) {
      console.log("Tax calculations table setup:", calculationsError.message);
    } else {
      console.log("✅ Tax calculations table created successfully");
    }

    // Create reports table
    console.log("Creating reports table...");
    const { error: reportsError } = await service.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS reports (
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
        
        DROP POLICY IF EXISTS "Users can view own reports" ON reports;
        CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
        CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
        CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = user_id);
        
        CREATE INDEX IF NOT EXISTS reports_user_id_created_idx ON reports(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS reports_user_id_year_idx ON reports(user_id, year);
      `,
    });

    if (reportsError) {
      console.log("Reports table setup:", reportsError.message);
    } else {
      console.log("✅ Reports table created successfully");
    }

    // Create storage bucket
    console.log("Creating storage bucket...");
    const { error: bucketError } = await service.storage.createBucket(
      "reports",
      {
        public: false,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: 10485760, // 10MB
      }
    );

    if (bucketError && !bucketError.message.includes("already exists")) {
      console.log("Storage bucket setup:", bucketError.message);
    } else {
      console.log("✅ Storage bucket created successfully");
    }

    console.log("\n🎉 Database setup completed!");
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
