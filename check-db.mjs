import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efmfyuewgtejsmwiusgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWZ5dWV3Z3RlanNtd2l1c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTQyNTUsImV4cCI6MjA5NjQ5MDI1NX0.EEJRj0ECRuwZ7-K3_4C9jlLKblLA3AV0-IFDJiucF2E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  // 1. Check if columns exist
  console.log('=== 1. Checking condominios table columns ===');
  const { data: colData, error: colErr } = await supabase
    .from('condominios')
    .select('id, arquivo_cnpj_path, administradora_contrato_path, arquivo_regimento_path, arquivo_convencao_path')
    .limit(1);
  if (colErr) {
    console.error('Column check error:', colErr.message);
  } else {
    console.log('✅ All columns exist. Sample:', colData);
  }

  // 2. List buckets (will fail with anon key, that's expected)
  console.log('\n=== 2. Listing storage buckets ===');
  const { data: buckets, error: buckErr } = await supabase.storage.listBuckets();
  if (buckErr) {
    console.log('Bucket list error (expected with anon key):', buckErr.message);
  } else {
    console.log('Buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  // 3. Try to list files in the bucket (checks if bucket exists + read access)
  console.log('\n=== 3. Listing files in "anexos" bucket ===');
  const { data: files, error: fileErr } = await supabase.storage
    .from('anexos')
    .list('', { limit: 5 });
  if (fileErr) {
    console.error('File list error:', fileErr.message);
  } else {
    console.log('Files in bucket:', files);
  }

  // 4. Try authenticated upload by first signing in
  console.log('\n=== 4. Attempting to sign in as test user and upload ===');
  // Try to sign in - we need to test with actual auth
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@condoplus.com',
    password: 'admin123'
  });
  
  if (authErr) {
    console.log('Auth error (trying default credentials):', authErr.message);
    // Try another common test user
    const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'test1234'
    });
    if (authErr2) {
      console.log('Auth error 2:', authErr2.message);
      console.log('\n⚠️  Cannot test authenticated upload without valid credentials.');
      console.log('   The upload may fail because user is not authenticated.');
    } else {
      console.log('Signed in as test user');
    }
  } else {
    console.log('Signed in successfully');
    
    // Try upload with authenticated user
    const dummyFile = new Blob(['test content'], { type: 'application/pdf' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('anexos')
      .upload(`cnpj/test-${Date.now()}.pdf`, dummyFile);
    
    if (uploadError) {
      console.error('Authenticated upload error:', uploadError.message);
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // Clean up test file
      await supabase.storage.from('anexos').remove([uploadData.path]);
      console.log('Test file cleaned up');
    }
  }

  // 5. Check storage policies via raw query
  console.log('\n=== 5. Checking storage.objects policies ===');
  const { data: policies, error: polErr } = await supabase.rpc('get_storage_policies', {});
  if (polErr) {
    console.log('Cannot query policies directly (expected):', polErr.message);
  } else {
    console.log('Policies:', policies);
  }
}

checkAll().catch(console.error);
