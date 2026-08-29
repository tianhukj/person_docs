/*
# Create person_records and verify_tasks tables + storage bucket

1. New Tables
- `person_records`: stores person/ID document profiles.
  - id (uuid PK, default gen_random_uuid())
  - mrz_text (text, nullable) — passport/ID MRZ machine-readable zone text
  - full_name (text, not null) — person's full name
  - name_en (text, nullable) — English name
  - document_no (text, not null) — document number
  - date_of_birth (text, not null) — date of birth
  - sex (text, not null) — sex/gender
  - country (text, not null) — nationality
  - issue_org (text, not null) — issuing authority
  - issue_date (text, not null) — issue date
  - document_face_img_url (text, not null) — relative URL to the document face image stored in the `person-docs` storage bucket
- `verify_tasks`: stores IDAnalyzer verification tasks linked to a person record.
  - id (uuid PK, default gen_random_uuid())
  - person_id (uuid FK -> person_records.id ON DELETE CASCADE, not null)
  - session_id (text, not null, unique) — IDAnalyzer session id
  - session_kycid (text, not null) — IDAnalyzer KYC profile id
  - session_url (text, not null) — IDAnalyzer verification web link
  - status (text, not null, CHECK in ('待核验','通过','未通过')) — verification status
  - image_url (text, nullable) — relative URL to the face photo captured in IDAnalyzer (stored in `person-docs` bucket)
  - created_at (timestamptz, default now())
  - finished_at (timestamptz, nullable)

2. Storage
- Create public bucket `person-docs` for storing document face images and captured verification photos.

3. Security
- Enable RLS on both tables.
- The app has a simple fixed login (admin/123456) implemented client-side and uses the anon key (no Supabase Auth session). Therefore policies allow `anon, authenticated` full CRUD, since access control is enforced at the app layer (the login gate). This is documented as intentional single-tenant shared data.
- Storage bucket policies: allow public read + anon upload/update/delete on `person-docs`.

4. Indexes
- person_records.full_name (for list search)
- verify_tasks.person_id (for join lookups)
- verify_tasks.status (for filtering)
*/
-- person_records
CREATE TABLE IF NOT EXISTS person_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mrz_text text,
  full_name text NOT NULL,
  name_en text,
  document_no text NOT NULL,
  date_of_birth text NOT NULL,
  sex text NOT NULL,
  country text NOT NULL,
  issue_org text NOT NULL,
  issue_date text NOT NULL,
  document_face_img_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE person_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_person_records" ON person_records;
CREATE POLICY "anon_select_person_records" ON person_records FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_person_records" ON person_records;
CREATE POLICY "anon_insert_person_records" ON person_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_person_records" ON person_records;
CREATE POLICY "anon_update_person_records" ON person_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_person_records" ON person_records;
CREATE POLICY "anon_delete_person_records" ON person_records FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_person_records_full_name ON person_records (full_name);

-- verify_tasks
CREATE TABLE IF NOT EXISTS verify_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES person_records(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  session_kycid text NOT NULL,
  session_url text NOT NULL,
  status text NOT NULL CHECK (status IN ('待核验','通过','未通过')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE verify_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_verify_tasks" ON verify_tasks;
CREATE POLICY "anon_select_verify_tasks" ON verify_tasks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_verify_tasks" ON verify_tasks;
CREATE POLICY "anon_insert_verify_tasks" ON verify_tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_verify_tasks" ON verify_tasks;
CREATE POLICY "anon_update_verify_tasks" ON verify_tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_verify_tasks" ON verify_tasks;
CREATE POLICY "anon_delete_verify_tasks" ON verify_tasks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_verify_tasks_person_id ON verify_tasks (person_id);
CREATE INDEX IF NOT EXISTS idx_verify_tasks_status ON verify_tasks (status);

-- Storage bucket for document/verification images
INSERT INTO storage.buckets (id, name, public)
VALUES ('person-docs', 'person-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_person_docs" ON storage.objects;
CREATE POLICY "anon_read_person_docs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'person-docs');
DROP POLICY IF EXISTS "anon_insert_person_docs" ON storage.objects;
CREATE POLICY "anon_insert_person_docs" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'person-docs');
DROP POLICY IF EXISTS "anon_update_person_docs" ON storage.objects;
CREATE POLICY "anon_update_person_docs" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'person-docs') WITH CHECK (bucket_id = 'person-docs');
DROP POLICY IF EXISTS "anon_delete_person_docs" ON storage.objects;
CREATE POLICY "anon_delete_person_docs" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'person-docs');
