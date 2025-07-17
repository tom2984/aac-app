# Database Migrations

## add_composite_questions.sql

This migration adds support for composite questions to the `form_questions` table.

### Changes:
1. Adds `sub_questions` JSONB column to store sub-question data
2. Adds database index for better performance
3. Adds documentation for the sub_questions structure

### To apply this migration:

#### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_composite_questions.sql`
4. Run the migration

#### Using Supabase CLI:
```bash
supabase db push
```

#### Using direct SQL connection:
```bash
psql "postgresql://postgres.qlvdlygekdfwqzuiojgv:h7hdh7ZQ76j9x3gE@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres" -f migrations/add_composite_questions.sql
```

### Testing:
After applying the migration, you should be able to:
1. Create questions with `question_type = 'composite'`
2. Store sub-questions in the `sub_questions` field as JSON
3. Use the teammate functionality without errors

### Rollback:
If needed, you can rollback by removing the column:
```sql
ALTER TABLE form_questions DROP COLUMN IF EXISTS sub_questions;
``` 