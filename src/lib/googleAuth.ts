import supabase from './supabase';

export async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to the home page or wherever they are
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    console.error('[google-auth] Error calling signInWithOAuth:', err);
    alert('حدث خطأ أثناء محاولة تسجيل الدخول عبر جوجل.');
  }
}

// Function to handle the redirect (Supabase handles this automatically usually, 
// but we keep the stub if any component imports it)
export function handleGoogleRedirect() {
  // Native Supabase handles parsing the hash/URL parameters on its own.
  // We can just leave this as a no-op so we don't break existing App.tsx imports.
}
