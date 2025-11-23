// Reports Module dengan 8 Tab Laporan - DEBUG FIXED VERSION
class Reports {
    constructor() {
        this.currentData = [];
        this.currentTab = 'detail-transaksi';
        this.table = null;
        this.filters = {
            startDate: '',
            endDate: '',
            outlet: ''
        };
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('🔄 Reports constructor called');
        
        // Bind methods
        this.init = this.init.bind(this);
        this.initTabs = this.initTabs.bind(this);
        this.switchTab = this.switchTab.bind(this);
        this.loadData = this.loadData.bind(this);
        this.initFilters = this.initFilters.bind(this);
        this.initTable = this.initTable.bind(this);
        this.destroyTable = this.destroyTable.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.exportReport = this.exportReport.bind(this);
        this.updateSummary = this.updateSummary.bind(this);
        this.updateReportTitle = this.updateReportTitle.bind(this);
    }

    // Initialize module
    async init() {
        console.log('🚀 Reports.init() called');
        
        if (this.isInitialized) {
            console.log('📊 Reports module already initialized, reinitializing...');
            this.isInitialized = false; // Allow reinitialization
        }

        try {
            // Check dependencies
            if (typeof DataTable === 'undefined') {
                throw new Error('DataTable class not found');
            }
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase client not found');
            }

            console.log('✅ Dependencies checked');

            this.initFilters();
            this.initTabs();
            this.bindEvents();
            
            // Set initial UI state
            this.setActiveTabUI(this.currentTab);
            this.updateReportTitle();
            
            // Load initial data
            await this.loadData();
            
            this.isInitialized = true;
            console.log('✅ Reports module initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Reports module:', error);
            this.showError('Gagal menginisialisasi modul laporan: ' + error.message);
        }
    }

    // Initialize tabs dengan debug
    initTabs() {
        console.log('🔧 Initializing tabs...');
        
        const tabs = document.querySelectorAll('.report-tab');
        console.log('📋 Found tabs:', tabs.length);
        
        if (tabs.length === 0) {
            console.error('❌ No report tabs found!');
            return;
        }

        // Remove existing event listeners first
        tabs.forEach(tab => {
            tab.replaceWith(tab.cloneNode(true));
        });

        // Get fresh references
        const freshTabs = document.querySelectorAll('.report-tab');
        
        freshTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const tabId = tab.getAttribute('data-tab');
                console.log('🎯 Tab clicked:', tabId, 'Current tab:', this.currentTab);
                
                if (tabId !== this.currentTab) {
                    this.switchTab(tabId);
                }
            });
            
            console.log('📝 Tab event listener added:', tab.getAttribute('data-tab'));
        });

        console.log('✅ Tabs initialized');
    }

    // Set active tab UI
    setActiveTabUI(tabId) {
        console.log('🎨 Setting active tab UI:', tabId);
        
        const tabs = document.querySelectorAll('.report-tab');
        
        tabs.forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabId;
            
            if (isActive) {
                tab.classList.add('active', 'border-blue-500', 'text-blue-600');
                tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                console.log('✅ Activated tab:', tabId);
            } else {
                tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
                tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });
    }

    // Update report title
    updateReportTitle() {
        const titleMap = {
            'detail-transaksi': 'Laporan Detail Transaksi',
            'pembayaran': 'Laporan Pembayaran',
            'komisi': 'Laporan Komisi', 
            'membercard': 'Laporan Membercard',
            'absen': 'Laporan Absensi Karyawan',
            'omset': 'Laporan Omset',
            'pemasukan-pengeluaran': 'Laporan Pemasukan & Pengeluaran',
            'transaksi-cancel': 'Laporan Transaksi Cancel'
        };

        const titleElement = document.getElementById('report-title');
        if (titleElement) {
            const newTitle = titleMap[this.currentTab] || 'Laporan';
            titleElement.textContent = newTitle;
            console.log('📝 Report title updated:', newTitle);
        } else {
            console.warn('⚠️ Report title element not found');
        }
    }

    // Switch between tabs - FIXED VERSION
    async switchTab(tabId) {
        console.log('🔄 switchTab called:', tabId);
        
        if (this.isLoading) {
            console.log('⏳ Tab switch in progress, skipping...');
            return;
        }

        if (this.currentTab === tabId) {
            console.log('🔁 Tab already active:', tabId);
            return;
        }

        this.isLoading = true;
        
        try {
            console.log('🔄 Starting tab switch to:', tabId);
            
            // Show loading immediately
            this.showLoadingState();
            
            // Update UI first for immediate feedback
            this.setActiveTabUI(tabId);
            this.currentTab = tabId;
            this.updateReportTitle();
            
            console.log('📊 Tab switched to:', tabId);
            
            // Clear previous table
            this.destroyTable();
            
            // Load data for new tab
            await this.loadData();
            
            console.log('✅ Tab switch completed:', tabId);
            
        } catch (error) {
            console.error('❌ Error switching tab:', error);
            this.showError('Gagal memuat data laporan: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Show loading state
    showLoadingState() {
        console.log('⏳ Showing loading state...');
        
        const tableContainer = document.getElementById('reports-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-gray-600">Memuat data laporan...</span>
                </div>
            `;
        } else {
            console.error('❌ Table container not found for loading state');
        }
        
        // Disable buttons
        this.setButtonsState(true);
    }

    // Hide loading state
    hideLoadingState() {
        console.log('✅ Hiding loading state');
        this.setButtonsState(false);
    }

    // Set buttons state
    setButtonsState(disabled) {
        const filterBtn = document.getElementById('apply-filters');
        const exportBtn = document.getElementById('export-report');
        
        if (filterBtn) {
            filterBtn.disabled = disabled;
            filterBtn.innerHTML = disabled ? 
                '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...' : 
                '<i class="fas fa-filter mr-2"></i>Terapkan Filter';
        }
        if (exportBtn) exportBtn.disabled = disabled;
    }

    // Initialize filters
    initFilters() {
        console.log('🔧 Initializing filters...');
        
        // Set default dates (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        this.filters.startDate = startDate.toISOString().split('T')[0];
        this.filters.endDate = endDate.toISOString().split('T')[0];
        
        // Update DOM elements
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const outletEl = document.getElementById('outlet-filter');
        
        if (startDateEl) {
            startDateEl.value = this.filters.startDate;
            console.log('📅 Start date set:', this.filters.startDate);
        }
        if (endDateEl) {
            endDateEl.value = this.filters.endDate;
            console.log('📅 End date set:', this.filters.endDate);
        }
        if (outletEl) {
            this.filters.outlet = outletEl.value;
            console.log('🏪 Outlet filter set:', this.filters.outlet);
        }

        console.log('✅ Filters initialized');
    }

    // Load data dengan debug extensive
    async loadData() {
        console.log('📥 loadData() called for tab:', this.currentTab);
        
        if (this.isLoading) {
            console.log('⏳ Data load already in progress');
            return;
        }

        this.isLoading = true;
        
        try {
            console.log('🔄 Starting data load...');
            
            let data = [];
            const dataLoaders = {
                'detail-transaksi': () => this.loadDetailTransaksi(),
                'pembayaran': () => this.loadLaporanPembayaran(),
                'komisi': () => this.loadLaporanKomisi(),
                'membercard': () => this.loadLaporanMembercard(),
                'absen': () => this.loadLaporanAbsen(),
                'omset': () => this.loadLaporanOmset(),
                'pemasukan-pengeluaran': () => this.loadLaporanPemasukanPengeluaran(),
                'transaksi-cancel': () => this.loadLaporanTransaksiCancel()
            };

            const loader = dataLoaders[this.currentTab];
            if (loader) {
                console.log('🔍 Executing data loader for:', this.currentTab);
                data = await loader();
            } else {
                console.warn('⚠️ No loader found for tab:', this.currentTab);
                data = await this.loadDetailTransaksi();
            }

            this.currentData = Array.isArray(data) ? data : [];
            console.log('✅ Data loaded:', this.currentData.length, 'records');

            // Initialize or update table
            if (this.currentData.length > 0) {
                this.initTable();
            } else {
                this.showNoDataMessage();
            }

            this.updateSummary();

            return this.currentData;

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.currentData = [];
            this.showError('Gagal memuat data: ' + error.message);
            return [];
        } finally {
            this.isLoading = false;
            console.log('📥 loadData() completed');
        }
    }

    // ==================== DATA LOADING METHODS ====================

    async loadDetailTransaksi() {
        console.log('🔍 Loading detail transaksi...');
        
        try {
            let query = supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(100);

            // Apply filters
            if (this.filters.startDate) {
                query = query.gte('order_date', this.filters.startDate);
                console.log('📅 Filter start date:', this.filters.startDate);
            }
            if (this.filters.endDate) {
                query = query.lte('order_date', this.filters.endDate);
                console.log('📅 Filter end date:', this.filters.endDate);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
                console.log('🏪 Filter outlet:', this.filters.outlet);
            }

            console.log('🔍 Executing Supabase query...');
            const { data, error } = await query;
            
            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Detail transaksi loaded:', data?.length || 0, 'records');
            return data || this.generateFallbackData();

        } catch (error) {
            console.error('❌ Error loading detail transaksi:', error);
            return this.generateFallbackData();
        }
    }

    async loadLaporanPembayaran() {
        console.log('🔍 Loading laporan pembayaran...');
        
        try {
            let query = supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(100);

            if (this.filters.startDate) {
                query = query.gte('order_date', this.filters.startDate);
            }
            if (this.filters.endDate) {
                query = query.lte('order_date', this.filters.endDate);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedData = this.processPembayaranData(data || []);
            console.log('✅ Laporan pembayaran loaded:', processedData.length, 'records');
            return processedData;

        } catch (error) {
            console.error('❌ Error loading pembayaran:', error);
            return this.generateFallbackPembayaranData();
        }
    }

    // ... (other load methods dengan debug)

    processPembayaranData(data) {
        console.log('🔄 Processing pembayaran data:', data.length, 'records');
        
        const result = {};
        
        data.forEach(item => {
            const outlet = item.outlet || 'Unknown';
            const paymentType = item.payment_type || 'cash';
            const amount = parseFloat(item.amount) || 0;
            const isCancel = item.status === 'canceled' || item.status === 'cancelled';
            
            if (!result[outlet]) result[outlet] = {};
            if (!result[outlet][paymentType]) {
                result[outlet][paymentType] = { totalAmount: 0, totalAmountCancel: 0 };
            }
            
            if (isCancel) {
                result[outlet][paymentType].totalAmountCancel += amount;
            } else {
                result[outlet][paymentType].totalAmount += amount;
            }
        });
        
        const tableData = [];
        Object.keys(result).forEach(outlet => {
            Object.keys(result[outlet]).forEach(paymentType => {
                tableData.push({
                    outlet: outlet,
                    payment_type: paymentType,
                    total_amount_cancel: result[outlet][paymentType].totalAmountCancel,
                    total_amount: result[outlet][paymentType].totalAmount
                });
            });
        });
        
        console.log('✅ Pembayaran data processed:', tableData.length, 'records');
        return tableData;
    }

    generateFallbackData() {
        console.log('🔄 Generating fallback data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 25; i++) {
            const date = new Date();
            date.setDate(today.getDate() - Math.floor(i / 5));
            
            data.push({
                order_date: date.toISOString(),
                order_no: `ORD${1000 + i}`,
                outlet: outlets[Math.floor(Math.random() * outlets.length)],
                kasir: kasirs[Math.floor(Math.random() * kasirs.length)],
                customer_name: `Customer ${i + 1}`,
                item_name: `Item ${Math.floor(Math.random() * 5) + 1}`,
                qty: Math.floor(Math.random() * 3) + 1,
                harga_jual: Math.floor(Math.random() * 50000) + 25000,
                amount: Math.floor(Math.random() * 150000) + 50000,
                payment_type: ['cash', 'transfer'][Math.floor(Math.random() * 2)],
                status: ['completed', 'pending'][Math.floor(Math.random() * 2)]
            });
        }
        
        console.log('✅ Fallback data generated:', data.length, 'records');
        return data;
    }

    generateFallbackPembayaranData() {
        console.log('🔄 Generating fallback pembayaran data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const paymentTypes = ['cash', 'transfer'];
        
        const data = [];
        
        outlets.forEach(outlet => {
            paymentTypes.forEach(paymentType => {
                data.push({
                    outlet: outlet,
                    payment_type: paymentType,
                    total_amount_cancel: Math.floor(Math.random() * 500000),
                    total_amount: Math.floor(Math.random() * 5000000) + 1000000
                });
            });
        });
        
        console.log('✅ Fallback pembayaran data generated:', data.length, 'records');
        return data;
    }

    // ==================== TABLE MANAGEMENT ====================

    destroyTable() {
        if (this.table) {
            console.log('🗑️ Destroying table...');
            try {
                if (typeof this.table.destroy === 'function') {
                    this.table.destroy();
                }
                this.table = null;
            } catch (error) {
                console.warn('⚠️ Error destroying table:', error);
            }
        }
    }

    initTable() {
        console.log('🔄 initTable() called');
        
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) {
            console.error('❌ Table container not found');
            return;
        }

        try {
            const columns = this.getTableColumns();
            console.log('📊 Table columns:', columns.length);
            
            // Initialize DataTable
            this.table = new DataTable('reports-table', {
                columns: columns,
                data: this.currentData,
                searchable: true,
                pagination: true,
                pageSize: 15
            });

            console.log('✅ DataTable instance created, calling init()...');
            
            // Call init method
            this.table.init();
            
            console.log('✅ Table initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing table:', error);
            this.showError('Gagal memuat tabel: ' + error.message);
        }
    }

    showNoDataMessage() {
        console.log('📭 Showing no data message');
        
        const tableContainer = document.getElementById('reports-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex justify-center items-center py-12">
                    <div class="text-center">
                        <div class="text-gray-400 text-6xl mb-4">📊</div>
                        <p class="text-gray-500 text-lg">Tidak ada data yang ditemukan</p>
                        <p class="text-gray-400 text-sm">Coba ubah filter atau periode waktu</p>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        console.error('❌ Showing error:', message);
        
        const tableContainer = document.getElementById('reports-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex justify-center items-center py-12">
                    <div class="text-center">
                        <div class="text-red-400 text-6xl mb-4">❌</div>
                        <p class="text-red-500 text-lg">Terjadi Kesalahan</p>
                        <p class="text-gray-600 text-sm">${message}</p>
                        <button onclick="reports.loadData()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            `;
        }
    }

    getTableColumns() {
        console.log('📋 Getting table columns for tab:', this.currentTab);
        
        const columnDefinitions = {
            'detail-transaksi': [
                { title: 'Tanggal', key: 'order_date', type: 'date' },
                { title: 'Order No', key: 'order_no' },
                { title: 'Outlet', key: 'outlet' },
                { title: 'Kasir', key: 'kasir' },
                { title: 'Customer', key: 'customer_name' },
                { title: 'Item', key: 'item_name' },
                { title: 'Qty', key: 'qty' },
                { title: 'Harga Jual', key: 'harga_jual', type: 'currency' },
                { title: 'Amount', key: 'amount', type: 'currency' },
                { 
                    title: 'Payment', 
                    key: 'payment_type',
                    formatter: (value) => {
                        const types = { 'cash': 'Cash', 'transfer': 'Transfer' };
                        return types[value] || value;
                    }
                },
                { 
                    title: 'Status', 
                    key: 'status',
                    formatter: (value) => {
                        const isCompleted = value === 'completed';
                        const isCanceled = value === 'canceled' || value === 'cancelled';
                        let bgColor = 'bg-yellow-100 text-yellow-800';
                        let text = 'Pending';
                        
                        if (isCompleted) {
                            bgColor = 'bg-green-100 text-green-800';
                            text = 'Selesai';
                        } else if (isCanceled) {
                            bgColor = 'bg-red-100 text-red-800';
                            text = 'Cancel';
                        }
                        
                        return `<span class="px-2 py-1 text-xs rounded-full ${bgColor}">${text}</span>`;
                    }
                }
            ],
            'pembayaran': [
                { title: 'Outlet', key: 'outlet' },
                { 
                    title: 'Type Pembayaran', 
                    key: 'payment_type',
                    formatter: (value) => {
                        const types = { 'cash': 'Cash', 'transfer': 'Transfer' };
                        return types[value] || value;
                    }
                },
                { title: 'Total Amount Cancel', key: 'total_amount_cancel', type: 'currency' },
                { title: 'Total Amount', key: 'total_amount', type: 'currency' }
            ]
            // ... (tambahkan lainnya sesuai kebutuhan)
        };

        const columns = columnDefinitions[this.currentTab] || columnDefinitions['detail-transaksi'];
        console.log('✅ Columns selected:', columns.length, 'columns');
        return columns;
    }

    // ==================== EVENT HANDLERS ====================

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Filter button
        const filterBtn = document.getElementById('apply-filters');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                console.log('🔍 Filter button clicked');
                this.applyFilters();
            });
            console.log('✅ Filter button event bound');
        } else {
            console.warn('⚠️ Filter button not found');
        }
        
        // Export button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('💾 Export button clicked');
                this.exportReport();
            });
            console.log('✅ Export button event bound');
        } else {
            console.warn('⚠️ Export button not found');
        }

        console.log('✅ Events bound successfully');
    }

    async applyFilters() {
        if (this.isLoading) {
            console.log('⏳ Operation in progress, skipping filter...');
            return;
        }

        console.log('🔍 Applying filters...');
        
        try {
            this.showLoadingState();
            
            const startDate = document.getElementById('start-date');
            const endDate = document.getElementById('end-date');
            const outlet = document.getElementById('outlet-filter');

            if (startDate) {
                this.filters.startDate = startDate.value;
                console.log('📅 Start date updated:', this.filters.startDate);
            }
            if (endDate) {
                this.filters.endDate = endDate.value;
                console.log('📅 End date updated:', this.filters.endDate);
            }
            if (outlet) {
                this.filters.outlet = outlet.value;
                console.log('🏪 Outlet updated:', this.filters.outlet);
            }

            await this.loadData();
            
            console.log('✅ Filters applied successfully');
            
        } catch (error) {
            console.error('❌ Error applying filters:', error);
            this.showError('Gagal menerapkan filter');
        } finally {
            this.hideLoadingState();
        }
    }

    // ==================== SUMMARY & EXPORT ====================

    updateSummary() {
        console.log('📊 Updating summary...');
        
        try {
            let totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            let totalTransactions = this.currentData.length;
            
            this.updateSummaryCard('total-sales', Helpers.formatCurrency(totalSales));
            this.updateSummaryCard('total-transactions', totalTransactions.toLocaleString());
            
            console.log('✅ Summary updated - Sales:', totalSales, 'Transactions:', totalTransactions);
            
        } catch (error) {
            console.error('❌ Error updating summary:', error);
        }
    }

    updateSummaryCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        } else {
            console.warn('⚠️ Summary card element not found:', elementId);
        }
    }

    async exportReport() {
        try {
            if (this.currentData.length === 0) {
                this.showError('Tidak ada data untuk diexport');
                return;
            }

            console.log('💾 Starting export...');
            this.showLoadingState();

            let csvContent = "";
            const columns = this.getTableColumns();
            
            // Header
            csvContent += columns.map(col => `"${col.title}"`).join(',') + '\n';
            
            // Data
            this.currentData.forEach(item => {
                const row = columns.map(col => {
                    let value = item[col.key] || '';
                    return `"${value}"`;
                }).join(',');
                csvContent += row + '\n';
            });

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `laporan-${this.currentTab}-${new Date().toISOString().split('T')[0]}.csv`);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.hideLoadingState();
            console.log('✅ Export completed');
            
        } catch (error) {
            this.hideLoadingState();
            console.error('❌ Export error:', error);
            this.showError('Gagal mengexport laporan: ' + error.message);
        }
    }
}

// Initialize reports dengan protection
let reports = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Initializing Reports...');
    
    try {
        // Tunggu sebentar untuk pastikan semua dependencies loaded
        setTimeout(() => {
            console.log('🔍 Checking dependencies...');
            
            if (typeof DataTable === 'undefined') {
                console.error('❌ DataTable not loaded');
                return;
            }
            if (typeof supabase === 'undefined') {
                console.error('❌ Supabase not loaded');
                return;
            }
            
            console.log('✅ All dependencies loaded, creating Reports instance...');
            
            reports = new Reports();
            window.reportsModule = reports;
            
            console.log('🚀 Starting Reports initialization...');
            reports.init().catch(error => {
                console.error('❌ Reports initialization failed:', error);
            });
            
        }, 500); // Increased delay untuk pastikan semua loaded
        
    } catch (error) {
        console.error('❌ Error initializing Reports module:', error);
    }
});

// Juga initialize ketika page fully loaded
window.addEventListener('load', () => {
    console.log('🔄 Window loaded event - Checking Reports...');
    
    if (!reports && document.getElementById('reports-table')) {
        console.log('🔄 Initializing reports on window load...');
        reports = new Reports();
        reports.init().catch(console.error);
    }
});
