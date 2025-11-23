// Konfigurasi Supabase
const supabaseUrl = 'https://intzwjmlypmopzauxeqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludHp3am1seXBtb3B6YXV4ZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTc5MTIsImV4cCI6MjA3MDI5MzkxMn0.VwwVEDdHtYP5gui4epTcNfLXhPkmfFbRVb5y8mrXJiM';

// Inisialisasi Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Test koneksi
supabase.from('karyawan').select('count', { count: 'exact', head: true })
  .then(response => {
    console.log('Koneksi Supabase berhasil:', response);
  })
  .catch(error => {
    console.error('Koneksi Supabase gagal:', error);
  });