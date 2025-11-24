// Main application
class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.outlets = [];
        this.moduleScriptsLoaded = {};
        this.modulePaths = {
            'members': 'js/modules/members.js',
            'employees': 'js/modules/employees.js',
            'outlets': 'js/modules/outlets.js',
            'products': 'js/modules/products.js',
            'group_products': 'js/modules/group_products.js',
            'stock_management': 'js/modules/stock_management.js',
            'reports': 'js/modules/reports.js'
        };
        this.init();
    }

    // Load module script dynamically dengan path yang benar
    async loadModuleScript(moduleName) {
        // Jika sudah diload, return langsung
        if (this.moduleScriptsLoaded[moduleName]) {
            console.log(`📦 ${moduleName}.js already loaded`);
            return true;
        }

        // Dapatkan path dari mapping
        const modulePath = this.modulePaths[moduleName] || `js/modules/${moduleName}.js`;
        
        console.log(`🔄 Loading ${moduleName} from: ${modulePath}`);
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = modulePath;
            script.onload = () => {
                console.log(`✅ ${moduleName}.js loaded successfully`);
                this.moduleScriptsLoaded[moduleName] = true;
                resolve(true);
            };
            script.onerror = () => {
                console.error(`❌ Failed to load ${modulePath}`);
                this.moduleScriptsLoaded[moduleName] = false;
                reject(new Error(`Failed to load ${modulePath}`));
            };
            document.head.appendChild(script);
        });
    }

    // Tunggu sampai DOM fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOM fully loaded, initializing app...');
            this.init();
        });
    } else {
        console.log('✅ DOM already ready, initializing app...');
        this.init();
    }
}


    // Initialize application
    async init() {
        console.log('App initializing...');
        
        // Check authentication
        if (!await Auth.checkAuth() && !window.location.pathname.endsWith('login.html')) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        if (window.location.pathname.endsWith('login.html')) {
            return;
        }

        // Load outlets data first
        await this.loadOutletsData();

        // Initialize components
        this.initSidebar();
        this.initHeader();
        this.loadModule('dashboard');
        this.updateDateTime();

        // Update datetime every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    // Load outlets data from Supabase
    async loadOutletsData() {
        try {
            const { data, error } = await supabase
                .from('outlet')
                .select('outlet')
                .order('outlet', { ascending: true });

            if (error) throw error;

            this.outlets = data || [];
            console.log('Outlets loaded:', this.outlets);
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    // Get outlets for other modules
    getOutlets() {
        return this.outlets;
    }

   // Initialize sidebar dengan logo - SEMUA MODUL DITAMPILKAN
initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }

    const user = Auth.getCurrentUser();
    sidebar.classList.add('bg-blue-50');

    // Logo HTML
    const logoHTML = `
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <div class="flex items-center space-x-3">
                <div class="logo-container">
                    <img src="assets/logo.png" alt="Babeh Barbershop Logo" class="logo-img" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'logo-fallback\\'>B</span>';">
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-gray-800">Babeh Barbershop</h2>
                    <p class="text-sm text-gray-600">Office</p>
                </div>
            </div>
        </div>
    `;

    // Navigation menu - SEMUA MODUL DITAMPILKAN TANPA FILTER ROLE
    const navHTML = `
        <nav class="flex-1 px-4 py-6 space-y-2">
            <!-- Semua menu ditampilkan untuk semua role -->
            <a href="#" onclick="app.loadModule('dashboard')" class="sidebar-item ${this.currentModule === 'dashboard' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                <span>Dashboard</span>
            </a>
            
            <a href="#" onclick="app.loadModule('group_products')" class="sidebar-item ${this.currentModule === 'group_products' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                <span>Group Produk</span>
            </a>
            
            <a href="#" onclick="app.loadModule('products')" class="sidebar-item ${this.currentModule === 'products' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span>Produk</span>
            </a>

            <a href="#" onclick="app.loadModule('stock_management')" class="sidebar-item ${this.currentModule === 'stock_management' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Manajemen Stok</span>
            </a>

            <a href="#" onclick="app.loadModule('employees')" class="sidebar-item ${this.currentModule === 'employees' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                </svg>
                <span>Karyawan</span>
            </a>

            <a href="#" onclick="app.loadModule('members')" class="sidebar-item ${this.currentModule === 'members' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                <span>Member</span>
            </a>

            <a href="#" onclick="app.loadModule('outlets')" class="sidebar-item ${this.currentModule === 'outlets' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span>Outlet</span>
            </a>

            <a href="#" onclick="app.loadModule('reports')" class="sidebar-item ${this.currentModule === 'reports' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Laporan</span>
            </a>
        </nav>
    `;

  // User profile section - DENGAN PHOTO_URL
const userName = user ? (user.nama_karyawan || user.user_metadata?.display_name || user.email || 'User') : 'User';
const userRole = user ? (user.role || 'User') : 'User';
const userPhotoUrl = user?.photo_url; // Ambil photo_url dari user data
const userInitial = userName.charAt(0).toUpperCase();

const profileHTML = `
    <div class="p-4 border-t border-gray-200">
        <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                ${userPhotoUrl ? 
                    `<img src="${userPhotoUrl}" alt="${userName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'text-gray-600 font-semibold\\'>${userInitial}</span>';" />` :
                    `<span class="text-gray-600 font-semibold">${userInitial}</span>`
                }
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${userName}</p>
                <p class="text-sm text-gray-500 truncate capitalize">${userRole}</p>
            </div>
        </div>
        <button onclick="Auth.logout()" class="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-red-100 rounded-md transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Logout</span>
        </button>
    </div>
`;
    sidebar.innerHTML = logoHTML + navHTML + profileHTML;
    
    console.log('✅ Sidebar initialized - All modules displayed');
}

    // Initialize header
    initHeader() {
        const header = document.getElementById('header');
        if (!header) {
            console.error('Header element not found');
            return;
        }

        header.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900" id="page-title">Dashboard</h1>
                    <p class="text-sm text-gray-600" id="page-description">Ringkasan aktivitas dan statistik</p>
                </div>
                <div class="text-right">
                    <div class="text-lg font-semibold text-gray-900" id="current-datetime"></div>
                    <div class="text-sm text-gray-600" id="current-date"></div>
                </div>
            </div>
        `;
        
        console.log('Header initialized');
    }

    // Update date and time
    updateDateTime() {
        const now = new Date();
        const datetimeEl = document.getElementById('current-datetime');
        const dateEl = document.getElementById('current-date');

        if (datetimeEl) {
            datetimeEl.textContent = now.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Load module
    async loadModule(moduleName) {
        console.log('Loading module:', moduleName);
        this.currentModule = moduleName;
		
		// Cleanup module sebelumnya jika perlu
    if (moduleName !== 'reports' && window.reportsModule) {
        window.reportsModule.cleanup();
    }
        
        // Update active state in sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[onclick="app.loadModule('${moduleName}')"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        const content = document.getElementById('content');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        Helpers.showLoading();

        try {
            let moduleHTML = '';
            let pageTitle = '';
            let pageDescription = '';

            switch (moduleName) {
                case 'dashboard':
                    pageTitle = 'Dashboard';
                    pageDescription = 'Ringkasan aktivitas dan statistik';
                    moduleHTML = await this.loadDashboard();
                    break;
                case 'products':
                    pageTitle = 'Manajemen Produk';
                    pageDescription = 'Kelola data produk dan inventory';
                    moduleHTML = this.loadProducts();
                    break;
                case 'group_products':
                    pageTitle = 'Group Produk';
                    pageDescription = 'Kelola kategori dan group produk';
                    moduleHTML = this.loadGroupProducts();
                    break;
		 case 'stock_management':
                pageTitle = 'Manajemen Stok';
                pageDescription = 'Kelola stok masuk, keluar, dan pergerakan stok';
                moduleHTML = this.loadStockManagement();
                break;
                case 'employees':
                    pageTitle = 'Manajemen Karyawan';
                    pageDescription = 'Kelola data karyawan dan akses';
                    moduleHTML = this.loadEmployees();
                    break;
                case 'members':
                    pageTitle = 'Manajemen Member';
                    pageDescription = 'Kelola data member dan poin';
                    moduleHTML = this.loadMembers();
                    break;
                case 'outlets':
                    pageTitle = 'Manajemen Outlet';
                    pageDescription = 'Kelola data outlet cabang';
                    moduleHTML = this.loadOutlets();
                    break;
                case 'reports':
                    pageTitle = 'Laporan';
                    pageDescription = 'Laporan transaksi dan analisis';
                    moduleHTML = this.loadReports();
                    break;
                default:
                    moduleHTML = '<div class="text-center py-8"><p class="text-gray-500">Module tidak ditemukan</p></div>';
            }

            // Update page title
            const pageTitleEl = document.getElementById('page-title');
            const pageDescEl = document.getElementById('page-description');
            if (pageTitleEl) pageTitleEl.textContent = pageTitle;
            if (pageDescEl) pageDescEl.textContent = pageDescription;

            content.innerHTML = moduleHTML;
// Beri sedikit delay untuk memastikan DOM ter-render
    setTimeout(() => {
        this.initModule(moduleName);
    }, 50);

    console.log('Module loaded successfully:', moduleName);
			
            // Initialize module-specific JavaScript
            this.initModule(moduleName);

            console.log('Module loaded successfully:', moduleName);

        } catch (error) {
            console.error('Error loading module:', error);
            content.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Gagal memuat module: ${error.message}</p>
                </div>
            `;
        } finally {
            Helpers.hideLoading();
        }
    }

    // Load products module - TAMBAH FILTER OUTLET
    loadProducts() {
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        console.log('Loading products module');
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Daftar Produk</h3>
                        <button id="add-product" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                            Tambah Produk
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Filter Outlet</label>
                            <select id="outlet-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Outlet</option>
                                ${outletOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
                            <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Filter Inventory</label>
                            <select id="inventory-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua</option>
                                <option value="true">Aktif</option>
                                <option value="false">Nonaktif</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div id="products-table"></div>
                </div>
            </div>
        `;
    }

    // Load group products module
    loadGroupProducts() {
        console.log('Loading group products module');
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Daftar Group Produk</h3>
                    <button id="add-group-product" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Group
                    </button>
                </div>
                <div class="p-6">
                    <div id="group-products-table"></div>
                </div>
            </div>
        `;
    }


// Load stock management module - TAMBAH TOMBOL RESET
loadStockManagement() {
    console.log('Loading stock management module');
    return `
        <div class="space-y-6">
            <!-- Header dengan tombol reset -->
            <div class="flex justify-between items-center">
               
                <div class="flex space-x-2">
                    <button 
                        onclick="stockManagement.exportBeforeReset()"
                        class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                        title="Export Data Sebelum Reset"
                    >
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Export Data
                    </button>
                    <button 
                        onclick="stockManagement.showResetOptions()"
                        class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                        title="Reset Data Stok"
                    >
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Reset Data
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Stok Masuk</h3>
                            <button onclick="stockManagement.showStockInForm()" class="text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                Tambah Stok Masuk
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 text-red-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Stok Keluar</h3>
                            <button onclick="stockManagement.showStockOutForm()" class="text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                Tambah Stok Keluar
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Pergerakan Stok</h3>
                            <button onclick="stockManagement.showStockMovement()" class="text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                Lihat Laporan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Stock Movements -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Pergerakan Stok Terbaru</h3>
                    <span class="text-sm text-gray-500">
                        Total: <span id="movement-count">${this.stockMovements ? this.stockMovements.length : 0}</span> records
                    </span>
                </div>
                <div class="p-6">
                    <div id="recent-stock-movements">
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p class="mt-2 text-gray-500">Memuat data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    // Load employees module
    loadEmployees() {
        console.log('Loading employees module');
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Manajemen Karyawan</h3>
                    <button id="add-employee" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Karyawan
                    </button>
                </div>
                <div class="p-6">
                    <div id="employees-table"></div>
                </div>
            </div>
        `;
    }

    // Load members module - TAMBAH FILTER OUTLET
    loadMembers() {
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        console.log('Loading members module');
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Manajemen Member</h3>
                        <button id="add-member" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                            Tambah Member
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Filter Outlet</label>
                            <select id="outlet-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Outlet</option>
                                ${outletOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
                            <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button id="clear-filters" class="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div id="members-table"></div>
                </div>
            </div>
        `;
    }

    // Load outlets module
    loadOutlets() {
        console.log('Loading outlets module');
        return `
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Manajemen Outlet</h3>
                    <button id="add-outlet" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Outlet
                    </button>
                </div>
                <div class="p-6">
                    <div id="outlets-table"></div>
                </div>
            </div>
        `;
    }

    // Load reports module
    loadReports() {
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        console.log('Loading reports module');
        return `
            <div class="space-y-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Total Penjualan</h3>
                                <p class="text-2xl font-semibold text-gray-900" id="total-sales">Rp 0</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Total Transaksi</h3>
                                <p class="text-2xl font-semibold text-gray-900" id="total-transactions">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Total Item Terjual</h3>
                                <p class="text-2xl font-semibold text-gray-900" id="total-items">0</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Total Profit</h3>
                                <p class="text-2xl font-semibold text-gray-900" id="total-profit">Rp 0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800">Filter Laporan</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                <input type="date" id="start-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                <input type="date" id="end-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                                <select id="outlet-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Semua Outlet</option>
                                    ${outletOptions}
                                </select>
                            </div>
                            <div class="flex items-end">
                                <button id="apply-filters" class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                    Terapkan Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export Button -->
                <div class="flex justify-end">
                    <button id="export-report" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Export CSV
                    </button>
                </div>

   <!-- TAB STRUCTURE - FLEX WRAP -->
            <div class="bg-white rounded-lg shadow">
                <div class="border-b border-gray-200">
                    <nav class="flex flex-wrap gap-2 px-4 py-3" aria-label="Tabs">
                        <button class="report-tab active whitespace-nowrap px-4 py-2 border-b-2 border-blue-500 font-medium text-sm text-blue-600 bg-blue-50 rounded-t" data-tab="detail-transaksi">
                            📊 Detail Transaksi
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="pembayaran">
                            💳 Pembayaran
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="komisi">
                            💰 Komisi
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="membercard">
                            🎫 Membercard
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="absen">
                            👥 Absen
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="omset">
                            📈 Omset
                        </button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="pemasukan-pengeluaran">
                            💸 Pemasukan & Pengeluaran
                        </button>
						<button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="order-transaksi">
 					   📋 Order Transaksi
						</button>
                        <button class="report-tab whitespace-nowrap px-4 py-2 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-t" data-tab="transaksi-cancel">
                            ❌ Transaksi Cancel
                        </button>
                    </nav>
                </div>
                   <!-- Report Title Section - DIBAWAH TAB -->
                <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 class="text-lg font-semibold text-gray-800" id="report-title">Detail Transaksi</h3>
                    <p class="text-sm text-gray-600 mt-1" id="report-subtitle">Ringkasan lengkap semua transaksi</p>
                </div>
                <!-- Single Table Container -->
                <div class="p-6">
                    <div id="reports-table"></div>
                </div>
            </div>
        </div>
            <!-- END TAB STRUCTURE -->

      <!-- Reports Table -->
                <div class="bg-white rounded-lg shadow">
                    
                    <div class="p-6">
                        <div id="reports-table"></div>
                    </div>
                </div>
            </div>
       `;
    }

    // Load dashboard module
    async loadDashboard() {
        console.log('Loading dashboard content');
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-medium text-gray-500">Total Produk</h3>
                                <p class="text-2xl font-semibold text-gray-900" id="total-products">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Total Karyawan</h3>
                            <p class="text-2xl font-semibold text-gray-900" id="total-employees">0</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Total Member</h3>
                            <p class="text-2xl font-semibold text-gray-900" id="total-members">0</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-sm font-medium text-gray-500">Total Outlet</h3>
                            <p class="text-2xl font-semibold text-gray-900" id="total-outlets">0</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Penjualan Hari Ini</h3>
                        <span class="text-2xl font-bold text-green-600" id="today-sales">Rp 0</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-800">Penjualan Bulan Ini</h3>
                        <span class="text-2xl font-bold text-blue-600" id="monthly-sales">Rp 0</span>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Aksi Cepat</h3>
                        <button id="refresh-dashboard" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm">
                            Refresh Data
                        </button>
                    </div>
                    <div class="space-y-3">
                        <button onclick="app.loadModule('products')" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span class="text-gray-700">Tambah Produk Baru</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                        <button onclick="app.loadModule('employees')" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span class="text-gray-700">Kelola Karyawan</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                        <button onclick="app.loadModule('reports')" class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <span class="text-gray-700">Lihat Laporan</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Transaksi Terbaru</h3>
                    <button onclick="app.loadModule('reports')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Lihat Semua
                    </button>
                </div>
                <div class="p-6">
                    <div id="recent-transactions">
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p class="mt-2 text-gray-500">Memuat transaksi...</p>
                        </div>
                </div>
            </div>
        </div>
    `;
}


// Update initModule method - FIXED VERSION
initModule(moduleName) {
    console.log('Initializing module JS:', moduleName);
    console.log('Available modules:', {
        GroupProducts: typeof GroupProducts,
        Products: typeof Products,
        Members: typeof Members, // TAMBAH INI
        groupProducts: typeof groupProducts,
        products: typeof products,
        members: typeof members, // TAMBAH INI
        dashboard: typeof dashboard
    });
    
    // Beri timeout untuk memastikan DOM ter-render sepenuhnya
    setTimeout(() => {
        try {
            switch (moduleName) {
                case 'dashboard':
                    if (typeof dashboard !== 'undefined' && dashboard !== null) {
                        dashboard.init();
                        console.log('✅ Dashboard module initialized');
                    } else {
                        console.error('❌ Dashboard module not available');
                    }
                    break;
                    
                case 'products':
                    console.log('🔄 Initializing products module...');
                    if (typeof Products !== 'undefined') {
                        console.log('📦 Using Products class constructor');
                        window.products = new Products();
                        window.products.init();
                        console.log('✅ Products module initialized via constructor');
                    } 
                    else if (typeof products !== 'undefined' && products !== null) {
                        console.log('📦 Using existing products instance');
                        if (typeof products.init === 'function') {
                            products.init();
                            console.log('✅ Products module initialized (existing instance)');
                        } else {
                            console.error('❌ products.init is not a function');
                        }
                    }
                    else {
                        console.error('❌ Products class not defined, attempting dynamic load...');
                        this.loadModuleScript('products');
                    }
                    break;
                    
                case 'group_products':
                    console.log('🔄 Initializing group_products module...');
                    if (typeof GroupProducts !== 'undefined') {
                        console.log('📦 Using GroupProducts class constructor');
                        window.groupProducts = new GroupProducts();
                        window.groupProducts.init();
                        console.log('✅ Group products module initialized via constructor');
                    } 
                    else if (typeof groupProducts !== 'undefined' && groupProducts !== null) {
                        console.log('📦 Using existing groupProducts instance');
                        if (typeof groupProducts.init === 'function') {
                            groupProducts.init();
                            console.log('✅ Group products module initialized (existing instance)');
                        } else {
                            console.error('❌ groupProducts.init is not a function');
                        }
                    }
                    else {
                        console.error('❌ GroupProducts class not defined, attempting dynamic load...');
                        this.loadModuleScript('group_products');
                    }
                    break;
                    
                case 'members':
                    console.log('🔄 Initializing members module...');
                    // PATTERN YANG SAMA DENGAN PRODUCTS & GROUP_PRODUCTS
                    if (typeof Members !== 'undefined') {
                        console.log('📦 Using Members class constructor');
                        window.members = new Members();
                        window.members.init();
                        console.log('✅ Members module initialized via constructor');
                    } 
                    else if (typeof members !== 'undefined' && members !== null) {
                        console.log('📦 Using existing members instance');
                        if (typeof members.init === 'function') {
                            members.init();
                            console.log('✅ Members module initialized (existing instance)');
                        } else {
                            console.error('❌ members.init is not a function');
                        }
                    }
                    else {
                        console.error('❌ Members class not defined, attempting dynamic load...');
                        this.loadModuleScript('members');
                    }
                    break;
                    
                case 'employees':
                    console.log('🔄 Initializing employees module...');
                    // APPLY SAME PATTERN
                    if (typeof Employees !== 'undefined') {
                        console.log('📦 Using Employees class constructor');
                        window.employees = new Employees();
                        window.employees.init();
                        console.log('✅ Employees module initialized via constructor');
                    } 
                    else if (typeof employees !== 'undefined' && employees !== null) {
                        console.log('📦 Using existing employees instance');
                        if (typeof employees.init === 'function') {
                            employees.init();
                            console.log('✅ Employees module initialized (existing instance)');
                        } else {
                            console.error('❌ employees.init is not a function');
                        }
                    }
                    else {
                        console.error('❌ Employees class not defined, attempting dynamic load...');
                        this.loadModuleScript('employees');
                    }
                    break;
                    
                case 'outlets':
                    console.log('🔄 Initializing outlets module...');
                    // APPLY SAME PATTERN
                    if (typeof Outlets !== 'undefined') {
                        console.log('📦 Using Outlets class constructor');
                        window.outlets = new Outlets();
                        window.outlets.init();
                        console.log('✅ Outlets module initialized via constructor');
                    } 
                    else if (typeof outlets !== 'undefined' && outlets !== null) {
                        console.log('📦 Using existing outlets instance');
                        if (typeof outlets.init === 'function') {
                            outlets.init();
                            console.log('✅ Outlets module initialized (existing instance)');
                        } else {
                            console.error('❌ outlets.init is not a function');
                        }
                    }
                    else {
                        console.error('❌ Outlets class not defined, attempting dynamic load...');
                        this.loadModuleScript('outlets');
                    }
                    break;
                    
                case 'stock_management':
                    if (typeof stockManagement !== 'undefined' && stockManagement !== null) {
                        stockManagement.init();
                        console.log('✅ Stock Management module initialized');
                    } else {
                        console.error('❌ Stock Management module not available');
                    }
                    break;
                    
                case 'reports':
                    if (typeof reports !== 'undefined' && reports !== null) {
                        reports.init();
                        console.log('✅ Reports module initialized');
                    } else {
                        console.error('❌ Reports module not available');
                    }
                    break;
                    
                default:
                    console.log('ℹ️ No specific JS for module:', moduleName);
            }
        } catch (error) {
            console.error('💥 Error initializing module:', moduleName, error);
        }
    }, 300);
}

// Separate initialization methods untuk better organization
initializeDashboard() {
    if (typeof dashboard !== 'undefined' && dashboard !== null) {
        // Cek jika sudah initialized
        if (!dashboard.isInitialized) {
            dashboard.init();
            console.log('✅ Dashboard module initialized');
        } else {
            console.log('ℹ️ Dashboard already initialized');
        }
    } else {
        console.error('❌ Dashboard module not available');
    }
}

initializeProducts() {
    console.log('🔄 Initializing products module...');
    
    // Approach 1: Gunakan class constructor
    if (typeof Products !== 'undefined') {
        console.log('📦 Using Products class constructor');
        if (!window.products || !window.products.isInitialized) {
            window.products = new Products();
            window.products.init();
            console.log('✅ Products module initialized via constructor');
        } else {
            console.log('ℹ️ Products already initialized');
        }
    } 
    // Approach 2: Gunakan existing instance
    else if (typeof products !== 'undefined' && products !== null) {
        console.log('📦 Using existing products instance');
        if (typeof products.init === 'function' && !products.isInitialized) {
            products.init();
            console.log('✅ Products module initialized (existing instance)');
        } else if (products.isInitialized) {
            console.log('ℹ️ Products instance already initialized');
        } else {
            console.error('❌ products.init is not a function');
        }
    }
    // Approach 3: Dynamic loading
    else {
        console.error('❌ Products class not defined, attempting dynamic load...');
        this.loadModuleScript('products');
    }
}

initializeGroupProducts() {
    console.log('🔄 Initializing group_products module...');
    
    if (typeof GroupProducts !== 'undefined') {
        console.log('📦 Using GroupProducts class constructor');
        if (!window.groupProducts || !window.groupProducts.isInitialized) {
            window.groupProducts = new GroupProducts();
            window.groupProducts.init();
            console.log('✅ Group products module initialized via constructor');
        } else {
            console.log('ℹ️ GroupProducts already initialized');
        }
    } 
    else if (typeof groupProducts !== 'undefined' && groupProducts !== null) {
        console.log('📦 Using existing groupProducts instance');
        if (typeof groupProducts.init === 'function' && !groupProducts.isInitialized) {
            groupProducts.init();
            console.log('✅ Group products module initialized (existing instance)');
        } else if (groupProducts.isInitialized) {
            console.log('ℹ️ GroupProducts instance already initialized');
        } else {
            console.error('❌ groupProducts.init is not a function');
        }
    }
    else {
        console.error('❌ GroupProducts class not defined, attempting dynamic load...');
        this.loadModuleScript('group_products');
    }
}

initializeStockManagement() {
    if (typeof stockManagement !== 'undefined' && stockManagement !== null) {
        if (!stockManagement.isInitialized) {
            stockManagement.init();
            console.log('✅ Stock Management module initialized');
        } else {
            console.log('ℹ️ Stock Management already initialized');
        }
    } else {
        console.error('❌ Stock Management module not available');
    }
}

initializeEmployees() {
    if (typeof employees !== 'undefined' && employees !== null) {
        if (!employees.isInitialized) {
            employees.init();
            console.log('✅ Employees module initialized');
        } else {
            console.log('ℹ️ Employees already initialized');
        }
    } else {
        console.error('❌ Employees module not available');
    }
}

initializeMembers() {
    console.log('🔄 Initializing members module...');
    
    // Approach 1: Gunakan class constructor
    if (typeof Members !== 'undefined') {
        console.log('📦 Using Members class constructor');
        if (!window.members || !window.members.isInitialized) {
            window.members = new Members();
            window.members.init();
            console.log('✅ Members module initialized via constructor');
        } else {
            console.log('ℹ️ Members already initialized');
        }
    } 
    // Approach 2: Gunakan existing instance
    else if (typeof members !== 'undefined' && members !== null) {
        console.log('📦 Using existing members instance');
        if (typeof members.init === 'function' && !members.isInitialized) {
            members.init();
            console.log('✅ Members module initialized (existing instance)');
        } else if (members.isInitialized) {
            console.log('ℹ️ Members instance already initialized');
        } else {
            console.error('❌ members.init is not a function');
        }
    }
    // Approach 3: Dynamic loading
    else {
        console.error('❌ Members class not defined, attempting dynamic load...');
        this.loadModuleScript('members');
        
        // Fallback: show user-friendly message
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML += `
                <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-yellow-800">Module Sedang Dimuat</h3>
                            <div class="mt-2 text-sm text-yellow-700">
                                <p>Members module sedang dimuat. Silakan refresh halaman atau tunggu beberapa saat.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

initializeOutlets() {
    if (typeof outlets !== 'undefined' && outlets !== null) {
        if (!outlets.isInitialized) {
            outlets.init();
            console.log('✅ Outlets module initialized');
        } else {
            console.log('ℹ️ Outlets already initialized');
        }
    } else {
        console.error('❌ Outlets module not available');
    }
}

initializeReports() {
    if (typeof reports !== 'undefined' && reports !== null) {
        if (!reports.isInitialized) {
            reports.init();
            console.log('✅ Reports module initialized');
        } else {
            console.log('ℹ️ Reports already initialized');
        }
    } else {
        console.error('❌ Reports module not available');
    }
}

    // Load dashboard statistics
    async loadDashboardStats() {
        console.log('Loading dashboard statistics');
        try {
            // Load total products
            const { data: products, error: productsError } = await supabase
                .from('produk')
                .select('*', { count: 'exact' });

            if (!productsError && products) {
                const totalProductsEl = document.getElementById('total-products');
                if (totalProductsEl) totalProductsEl.textContent = products.length;
                console.log('Total products:', products.length);
            }

            // Load total employees
            const { data: employees, error: employeesError } = await supabase
                .from('karyawan')
                .select('*', { count: 'exact' });

            if (!employeesError && employees) {
                const totalEmployeesEl = document.getElementById('total-employees');
                if (totalEmployeesEl) totalEmployeesEl.textContent = employees.length;
                console.log('Total employees:', employees.length);
            }

            // Load total members
            const { data: members, error: membersError } = await supabase
                .from('membercard')
                .select('*', { count: 'exact' });

            if (!membersError && members) {
                const totalMembersEl = document.getElementById('total-members');
                if (totalMembersEl) totalMembersEl.textContent = members.length;
                console.log('Total members:', members.length);
            }

            // Load total outlets
            const { data: outlets, error: outletsError } = await supabase
                .from('outlet')
                .select('*', { count: 'exact' });

            if (!outletsError && outlets) {
                const totalOutletsEl = document.getElementById('total-outlets');
                if (totalOutletsEl) totalOutletsEl.textContent = outlets.length;
                console.log('Total outlets:', outlets.length);
            }

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
}

// Initialize app globally
let app = null;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app;
});
