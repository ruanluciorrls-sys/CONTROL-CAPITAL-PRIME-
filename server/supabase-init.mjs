import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const buckets = [
  { name: "casas", public: false },
  { name: "relatorios", public: false },
  { name: "contas", public: false },
  { name: "configs", public: false },
  { name: "images", public: true },
];

async function initializeBuckets() {
  console.log("Initializing Supabase Storage buckets...");

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some((b) => b.name === bucket.name);

      if (bucketExists) {
        console.log(`✓ Bucket "${bucket.name}" already exists`);
      } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(
          bucket.name,
          {
            public: bucket.public,
            fileSizeLimit: 52428800, // 50MB
          }
        );

        if (error) {
          console.error(`✗ Error creating bucket "${bucket.name}":`, error.message);
        } else {
          console.log(`✓ Bucket "${bucket.name}" created successfully`);
        }
      }
    } catch (error) {
      console.error(`✗ Error processing bucket "${bucket.name}":`, error);
    }
  }

  console.log("Bucket initialization complete!");
}

initializeBuckets().catch(console.error);
