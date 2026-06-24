import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efmfyuewgtejsmwiusgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWZ5dWV3Z3RlanNtd2l1c2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTQyNTUsImV4cCI6MjA5NjQ5MDI1NX0.EEJRj0ECRuwZ7-K3_4C9jlLKblLA3AV0-IFDJiucF2E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('Checking anexos bucket...');
  const { data, error } = await supabase.storage.getBucket('anexos');
  
  if (error) {
    console.error('Error fetching bucket:', error.message);
  } else {
    console.log('Bucket exists:', data);
  }

  console.log('Testing dummy upload...');
  const dummyFile = new Blob(['Hello, world!'], { type: 'text/plain' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('anexos')
    .upload(`test/test-${Date.now()}.txt`, dummyFile);

  if (uploadError) {
    console.error('Upload Error:', uploadError.message);
  } else {
    console.log('Upload successful:', uploadData);
  }
}

checkStorage();
