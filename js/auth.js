// Authentication functions - UPDATED FOR SUPABASE AUTH
class Auth {
    // Static property untuk menyimpan user
    static currentUser = null;

    // Initialize auth state listener
    static initialize() {
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                console.log('User signed in, session:', session);
                this.handleSignedIn(session);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                this.handleSignedOut();
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Token refreshed');
            } else if (event === 'USER_UPDATED') {
                console.log('User updated');
            }
        });
    }

  static async handleSignedIn(session) {
    try {
        console.log('🔄 Handling signed in user:', session.user);
        
        const displayName = session.user.user_metadata?.display_name;
        console.log('🔍 Looking up karyawan by name:', displayName);
        
        // Get user profile from karyawan table using display_name
        const { data: karyawan, error } = await supabase
            .from('karyawan')
            .select('*')
            .eq('nama_karyawan', displayName) // Lookup by nama_karyawan
            .single();

        let userData;
        
        if (error || !karyawan) {
            console.warn('Karyawan data not found for name:', displayName, error);
            // Fallback to basic user data
            userData = {
                id: session.user.id,
                email: session.user.email,
                user_login: session.user.email.split('@')[0],
                nama_karyawan: displayName || session.user.email.split('@')[0],
                role: session.user.user_metadata?.role || 'user',
                photo_url: null, // Tidak ada photo_url
                outlet: 'default',
                last_login: new Date().toISOString()
            };
        } else {
            console.log('✅ Karyawan found:', karyawan);
            userData = {
                id: session.user.id,
                email: session.user.email,
                user_login: karyawan.user_login || session.user.email.split('@')[0],
                nama_karyawan: karyawan.nama_karyawan,
                role: karyawan.role || session.user.user_metadata?.role || 'user',
                photo_url: karyawan.photo_url, // Ambil photo_url dari tabel karyawan
                outlet: karyawan.outlet || 'default',
                last_login: new Date().toISOString()
            };
        }

        console.log('💾 Saving user data with photo_url:', userData.photo_url);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        Auth.currentUser = userData;
        
    } catch (error) {
        console.error('Error in handleSignedIn:', error);
    }
}
    // Handle signed out state
    static handleSignedOut() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('supabase.auth.token');
        Auth.currentUser = null;
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Check if user is logged in
    static async checkAuth() {
        // Jika di halaman login, skip auth check
        if (window.location.pathname.includes('login.html')) {
            console.log('On login page, skipping auth check');
            return true;
        }

        try {
            // Check Supabase session first
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session check error:', error);
                this.handleSignedOut();
                return false;
            }

            if (!session) {
                console.log('No Supabase session found');
                this.handleSignedOut();
                return false;
            }

            console.log('Supabase session valid, user:', session.user);
            
            // Verify user data is in localStorage
            const user = this.getCurrentUser();
            if (!user) {
                console.log('No user data in localStorage, refreshing...');
                await this.handleSignedIn(session);
            }

            return true;
            
        } catch (error) {
            console.error('Auth check error:', error);
            this.handleSignedOut();
            return false;
        }
    }

    // Login function dengan Supabase Auth
    static async login(email, password) {
        try {
            console.log('Supabase login attempt:', email);
            
            // Show loading jika Helpers tersedia
            if (typeof Helpers !== 'undefined') {
                Helpers.showLoading();
            } else {
                console.warn('Helpers not available, using fallback loading');
                const loading = document.getElementById('loading');
                if (loading) loading.classList.remove('hidden');
            }
            
            // Sign in with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('Supabase login response:', { data, error });

            if (error) {
                console.error('Supabase auth error:', error);
                throw new Error(this.getErrorMessage(error));
            }

            if (!data.user || !data.session) {
                throw new Error('Login gagal - tidak ada data user yang diterima');
            }

          console.log('Supabase login successful, user:', data.user);

const displayName = data.user.user_metadata?.display_name;
console.log('🔍 Looking up karyawan by name:', displayName);

// Lookup karyawan by nama_karyawan menggunakan display_name dari metadata
const { data: karyawan, error: karyawanError } = await supabase
    .from('karyawan')
    .select('*')
    .eq('nama_karyawan', displayName) // Lookup by nama_karyawan = display_name
    .single();

if (karyawanError) {
    console.warn('Karyawan data not found for name:', displayName, karyawanError);
}

// Prepare user data dengan photo_url
const userData = {
    id: data.user.id,
    email: data.user.email,
    user_login: karyawan?.user_login || data.user.email.split('@')[0],
    nama_karyawan: karyawan?.nama_karyawan || displayName || data.user.email.split('@')[0],
    role: karyawan?.role || data.user.user_metadata?.role || 'user',
    photo_url: karyawan?.photo_url || null, // Ambil photo_url dari karyawan
    outlet: karyawan?.outlet || 'default',
    last_login: new Date().toISOString()
};

console.log('Final user data with photo:', userData);

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('supabase.auth.token', data.session.access_token);
            
            // Simpan ke static property
            Auth.currentUser = userData;
            
            // Hide loading jika Helpers tersedia
            if (typeof Helpers !== 'undefined') {
                Helpers.hideLoading();
            } else {
                const loading = document.getElementById('loading');
                if (loading) loading.classList.add('hidden');
            }
            
            return { success: true, user: userData };
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Hide loading jika Helpers tersedia
            if (typeof Helpers !== 'undefined') {
                Helpers.hideLoading();
            } else {
                const loading = document.getElementById('loading');
                if (loading) loading.classList.add('hidden');
            }
            
            return { 
                success: false, 
                error: error.message || 'Terjadi kesalahan saat login' 
            };
        }
    }

    // Helper function untuk error messages
    static getErrorMessage(error) {
        const errorMap = {
            'Invalid login credentials': 'Email atau password salah',
            'Email not confirmed': 'Email belum dikonfirmasi',
            'Invalid email': 'Format email tidak valid',
            'User not found': 'User tidak ditemukan'
        };
        
        return errorMap[error.message] || error.message;
    }

    // Logout function
    static async logout() {
        console.log('Logging out from Supabase...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Supabase logout error:', error);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.handleSignedOut();
        }
    }

    // Get current user
    static getCurrentUser() {
        // Check static property first
        if (Auth.currentUser) {
            return Auth.currentUser;
        }
        
        // Check localStorage
        const stored = localStorage.getItem('currentUser');
        
        if (stored) {
            try {
                const parsedUser = JSON.parse(stored);
                
                // Validasi user object
                if (parsedUser && parsedUser.id && parsedUser.email) {
                    // Simpan ke static property untuk akses lebih cepat
                    Auth.currentUser = parsedUser;
                    return Auth.currentUser;
                } else {
                    console.warn('Invalid user data structure, clearing...');
                    localStorage.removeItem('currentUser');
                    return null;
                }
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('currentUser');
                return null;
            }
        }
        
        return null;
    }

    // Check permission
    static hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roles = ['admin', 'manager', 'kasir', 'pelayan'];
        const userRoleIndex = roles.indexOf(user.role);
        const requiredRoleIndex = roles.indexOf(requiredRole);

        return userRoleIndex <= requiredRoleIndex;
    }

    // Get current session (for debugging)
    static async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        return { session, error };
    }

    // Refresh session (if needed)
    static async refreshSession() {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        return { session, error };
    }
}

// Initialize auth when script loads
document.addEventListener('DOMContentLoaded', function() {
    Auth.initialize();
});