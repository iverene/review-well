# Supabase & Prisma Configuration Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `review-well`
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be ready (1-2 minutes)

## 2. Get Connection Details

Once project is ready:

1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the full URI, it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

4. Also note these values from the dashboard:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **Anon Key**: Found in **Settings** → **API**
   - **Service Role Key**: Found in **Settings** → **API** (keep secret!)

## 3. Update .env File

Create or update `backend/.env`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Supabase Storage
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_KEY="[YOUR-SERVICE-ROLE-KEY]"
SUPABASE_STORAGE_BUCKET="uploads"
```

## 4. Run Prisma Migration

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Or for production (creates SQL file)
npx prisma migrate deploy
```

## 5. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click "New bucket"
3. Configure:
   - **Name**: `uploads`
   - **Public bucket**: Yes (for public avatars/files)
4. Click "Create bucket"

### Set Bucket Policies

Go to **Storage** → **uploads** → **Policies** → Add policy:

```sql
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 6. Enable Google OAuth

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your **Google Client ID** and **Client Secret**
4. Add redirect URL: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

## 7. Verify Connection

Run this test script:

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.\$connect();
    console.log('Database connected successfully!');
    const tables = await prisma.\$queryRaw\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    \`;
    console.log('Tables:', tables);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.\$disconnect();
  }
}
test();
"
```

## 8. Seed Database (Optional)

Create `backend/prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Add seed data here if needed
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
```

Run with: `npx prisma db seed`

## Common Issues

### Connection Timeout
If connection times out, check:
1. IP whitelist in Supabase (Settings → Database → Network)
2. Connection string format
3. Password correctness

### Migration Errors
If migration fails:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or force push schema
npx prisma db push
```

### Storage Upload Fails
Check:
1. Bucket exists and is public
2. Service role key is correct
3. File size limits (default 50MB)
