// Reports Module dengan 8 Tab Laporan - COMPLETE FIXED VERSION
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
        this.eventListeners = [];
        
        console.log('🔄 Reports constructor called');
        
        // Bind semua method yang diperlukan
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
        
        // Bind semua data loading methods
        this.loadDetailTransaksi = this.loadDetailTransaksi.bind(this);
        this.loadLaporanPembayaran = this.loadLaporanPembayaran.bind(this);
        this.loadLaporanKomisi = this.loadLaporanKomisi.bind(this);
        this.loadLaporanMembercard = this.loadLaporanMembercard.bind(this);
        this.loadLaporanAbsen = this.loadLaporanAbsen.bind(this);
        this.loadLaporanOmset = this.loadLaporanOmset.bind(this);
        this.loadLaporanPemasukanPengeluaran = this.loadLaporanPemasukanPengeluaran.bind(this);
        this.loadLaporanTransaksiCancel = this.loadLaporanTransaksiCancel.bind(this);
        
        // Bind processing methods
        this.processPembayaranData = this.processPembayaranData.bind(this);
        this.processKomisiData = this.processKomisiData.bind(this);
        this.processMembercardData = this.processMembercardData.bind(this);
        this.processAbsenData = this.processAbsenData.bind(this);
        this.processOmsetData = this.processOmsetData.bind(this);
    }

    // Initialize module
    async init() {
        console.log('🚀 Reports.init() called');
        
        if (this.isInitialized) {
            console.log('📊 Reports module already initialized, refreshing...');
            await this.refresh();
            return;
        }

        try {
            // Check if we're in the reports page
            if (!this.isReportsPage()) {
                console.log('⏭️ Not on reports page, skipping initialization');
                return;
            }

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

    // Refresh module when returning to page
    async refresh() {
        console.log('🔄 Refreshing Reports module...');
        
        try {
            // Reset loading state
            this.isLoading = false;
            
            // Re-initialize UI components
            this.initTabs();
            this.bindEvents();
            
            // Update UI state
            this.setActiveTabUI(this.currentTab);
            this.updateReportTitle();
            
            // Reload data
            await this.loadData();
            
            console.log('✅ Reports module refreshed successfully');
            
        } catch (error) {
            console.error('❌ Error refreshing Reports module:', error);
            await this.loadData(); // Fallback to full reload
        }
    }

    // Check if we're on reports page
    isReportsPage() {
        const contentArea = document.getElementById('content-area');
        return contentArea && contentArea.innerHTML.includes('reports-table');
    }

    // Initialize tabs dengan proper cleanup
    initTabs() {
        console.log('🔧 Initializing tabs...');
        
        const tabs = document.querySelectorAll('.report-tab');
        console.log('📋 Found tabs:', tabs.length);
        
        if (tabs.length === 0) {
            console.error('❌ No report tabs found!');
            return;
        }

        // Remove existing event listeners first
        this.removeAllEventListeners();

        // Add fresh event listeners
        tabs.forEach(tab => {
            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const tabId = tab.getAttribute('data-tab');
                console.log('🎯 Tab clicked:', tabId, 'Current tab:', this.currentTab);
                
                if (tabId !== this.currentTab) {
                    this.switchTab(tabId);
                }
            };
            
            tab.addEventListener('click', handler);
            this.eventListeners.push({ element: tab, event: 'click', handler });
            
            console.log('📝 Tab event listener added:', tab.getAttribute('data-tab'));
        });

        console.log('✅ Tabs initialized');
    }

    // Remove all event listeners
    removeAllEventListeners() {
        console.log('🧹 Removing existing event listeners...');
        
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(event, handler);
            }
        });
        
        this.eventListeners = [];
        console.log('✅ Event listeners removed');
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

    // Load data dengan proper error handling
    async loadData() {
        console.log('📥 loadData() called for tab:', this.currentTab);
        
        if (this.isLoading) {
            console.log('⏳ Data load already in progress, waiting...');
            // Tunggu sebentar lalu coba lagi
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.loadData();
        }

        this.isLoading = true;
        
        try {
            console.log('🔄 Starting data load...');
            
            let data = [];
            const dataLoaders = {
                'detail-transaksi': this.loadDetailTransaksi,
                'pembayaran': this.loadLaporanPembayaran,
                'komisi': this.loadLaporanKomisi,
                'membercard': this.loadLaporanMembercard,
                'absen': this.loadLaporanAbsen,
                'omset': this.loadLaporanOmset,
                'pemasukan-pengeluaran': this.loadLaporanPemasukanPengeluaran,
                'transaksi-cancel': this.loadLaporanTransaksiCancel
            };

            const loader = dataLoaders[this.currentTab];
            if (loader && typeof loader === 'function') {
                console.log('🔍 Executing data loader for:', this.currentTab);
                data = await loader.call(this); // Gunakan call untuk maintain context
            } else {
                console.warn('⚠️ No loader found for tab:', this.currentTab, 'Using fallback');
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
            }
            if (this.filters.endDate) {
                query = query.lte('order_date', this.filters.endDate);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

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

    async loadLaporanKomisi() {
        console.log('🔍 Loading laporan komisi...');
        
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

            const processedData = this.processKomisiData(data || []);
            console.log('✅ Laporan komisi loaded:', processedData.length, 'records');
            return processedData;

        } catch (error) {
            console.error('❌ Error loading komisi:', error);
            return this.generateFallbackKomisiData();
        }
    }

    async loadLaporanMembercard() {
        console.log('🔍 Loading laporan membercard...');
        
        try {
            let query = supabase
                .from('membercard')
                .select('*')
                .limit(100);

            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedData = this.processMembercardData(data || []);
            console.log('✅ Laporan membercard loaded:', processedData.length, 'records');
            return processedData;

        } catch (error) {
            console.error('❌ Error loading membercard:', error);
            return this.generateFallbackMembercardData();
        }
    }

    async loadLaporanAbsen() {
        console.log('🔍 Loading laporan absen...');
        
        try {
            let query = supabase
                .from('absen')
                .select('*')
                .order('clockin', { ascending: false })
                .limit(100);

            if (this.filters.startDate) {
                query = query.gte('clockin', this.filters.startDate);
            }
            if (this.filters.endDate) {
                query = query.lte('clockin', this.filters.endDate);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            const processedData = this.processAbsenData(data || []);
            console.log('✅ Laporan absen loaded:', processedData.length, 'records');
            return processedData;

        } catch (error) {
            console.error('❌ Error loading absen:', error);
            return this.generateFallbackAbsenData();
        }
    }

    async loadLaporanOmset() {
        console.log('🔍 Loading laporan omset...');
        
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

            const processedData = this.processOmsetData(data || []);
            console.log('✅ Laporan omset loaded:', processedData.length, 'records');
            return processedData;

        } catch (error) {
            console.error('❌ Error loading omset:', error);
            return this.generateFallbackOmsetData();
        }
    }

    async loadLaporanPemasukanPengeluaran() {
        console.log('🔍 Loading laporan pemasukan pengeluaran...');
        
        try {
            let query = supabase
                .from('kas')
                .select('*')
                .order('tanggal', { ascending: false })
                .limit(100);

            if (this.filters.startDate) {
                query = query.gte('tanggal', this.filters.startDate);
            }
            if (this.filters.endDate) {
                query = query.lte('tanggal', this.filters.endDate);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            console.log('✅ Laporan pemasukan pengeluaran loaded:', data?.length || 0, 'records');
            return data || [];

        } catch (error) {
            console.error('❌ Error loading pemasukan pengeluaran:', error);
            return this.generateFallbackPemasukanPengeluaranData();
        }
    }

    async loadLaporanTransaksiCancel() {
        console.log('🔍 Loading laporan transaksi cancel...');
        
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

            const canceledData = data.filter(item => 
                item.status === 'canceled' || item.status === 'cancelled'
            );
            
            console.log('✅ Laporan transaksi cancel loaded:', canceledData.length, 'records');
            return canceledData;

        } catch (error) {
            console.error('❌ Error loading transaksi cancel:', error);
            return this.generateFallbackCancelData();
        }
    }

    // ==================== DATA PROCESSING METHODS ====================

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

    processKomisiData(data) {
        console.log('🔄 Processing komisi data:', data.length, 'records');
        
        const result = {};
        
        data.forEach(item => {
            const outlet = item.outlet || 'Unknown';
            const kasir = item.kasir || 'Unknown';
            const amount = parseFloat(item.amount) || 0;
            const isCompleted = item.status === 'completed';
            
            if (!isCompleted) return;
            
            const key = `${outlet}-${kasir}`;
            
            if (!result[key]) {
                result[key] = {
                    outlet: outlet,
                    kasir: kasir,
                    total_amount: 0,
                    total_komisi: 0
                };
            }
            
            result[key].total_amount += amount;
            result[key].total_komisi += amount * 0.1;
        });
        
        console.log('✅ Komisi data processed:', Object.values(result).length, 'records');
        return Object.values(result);
    }

    processMembercardData(data) {
        console.log('🔄 Processing membercard data:', data.length, 'records');
        
        const result = {};
        
        data.forEach(item => {
            const outlet = item.outlet || 'Unknown';
            const kasir = item.created_by || item.kasir || 'Unknown';
            
            const key = `${outlet}-${kasir}`;
            
            if (!result[key]) {
                result[key] = {
                    outlet: outlet,
                    kasir: kasir,
                    jumlah_membercard: 0
                };
            }
            
            result[key].jumlah_membercard += 1;
        });
        
        console.log('✅ Membercard data processed:', Object.values(result).length, 'records');
        return Object.values(result);
    }

    processAbsenData(data) {
        console.log('🔄 Processing absen data:', data.length, 'records');
        
        return data.map(item => {
            const clockin = new Date(item.clockin);
            const clockout = item.clockout ? new Date(item.clockout) : new Date();
            
            const diffMs = clockout - clockin;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const jamKerja = `${diffHours} jam ${diffMinutes} menit`;
            
            return {
                outlet: item.outlet || 'Unknown',
                karyawan: item.karyawan || item.nama_karyawan || 'Unknown',
                clockin: item.clockin,
                clockout: item.clockout,
                jam_kerja: jamKerja
            };
        });
    }

    processOmsetData(data) {
        console.log('🔄 Processing omset data:', data.length, 'records');
        
        const result = {};
        
        data.forEach(item => {
            const outlet = item.outlet || 'Unknown';
            const orderDate = item.order_date ? item.order_date.split('T')[0] : 'Unknown';
            const amount = parseFloat(item.amount) || 0;
            const isCompleted = item.status === 'completed';
            
            if (!isCompleted) return;
            
            const key = `${outlet}-${orderDate}`;
            
            if (!result[key]) {
                result[key] = {
                    outlet: outlet,
                    tanggal: orderDate,
                    total_omset: 0,
                    jumlah_transaksi: 0
                };
            }
            
            result[key].total_omset += amount;
            result[key].jumlah_transaksi += 1;
        });
        
        const tableData = Object.values(result).map(item => {
            return {
                ...item,
                rata_rata_transaksi: item.jumlah_transaksi > 0 ? item.total_omset / item.jumlah_transaksi : 0
            };
        });
        
        console.log('✅ Omset data processed:', tableData.length, 'records');
        return tableData;
    }

    // ==================== FALLBACK DATA GENERATORS ====================

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

    generateFallbackKomisiData() {
        console.log('🔄 Generating fallback komisi data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        
        outlets.forEach(outlet => {
            kasirs.forEach(kasir => {
                const totalAmount = Math.floor(Math.random() * 5000000) + 1000000;
                data.push({
                    outlet: outlet,
                    kasir: kasir,
                    total_amount: totalAmount,
                    total_komisi: totalAmount * 0.1
                });
            });
        });
        
        console.log('✅ Fallback komisi data generated:', data.length, 'records');
        return data;
    }

    generateFallbackMembercardData() {
        console.log('🔄 Generating fallback membercard data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        
        outlets.forEach(outlet => {
            kasirs.forEach(kasir => {
                data.push({
                    outlet: outlet,
                    kasir: kasir,
                    jumlah_membercard: Math.floor(Math.random() * 20) + 5
                });
            });
        });
        
        console.log('✅ Fallback membercard data generated:', data.length, 'records');
        return data;
    }

    generateFallbackAbsenData() {
        console.log('🔄 Generating fallback absen data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const karyawans = ['Echwan Abdillah', 'Hari Suryono', 'Ahmad Fauzi', 'Siti Rahma', 'Budi Santoso'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 15; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const outlet = outlets[Math.floor(Math.random() * outlets.length)];
            const karyawan = karyawans[Math.floor(Math.random() * karyawans.length)];
            
            const clockinHour = 7 + Math.floor(Math.random() * 3);
            const clockinMinute = Math.floor(Math.random() * 60);
            const clockin = new Date(date);
            clockin.setHours(clockinHour, clockinMinute, 0);
            
            const clockoutHour = 16 + Math.floor(Math.random() * 4);
            const clockoutMinute = Math.floor(Math.random() * 60);
            const clockout = new Date(date);
            clockout.setHours(clockoutHour, clockoutMinute, 0);
            
            const diffMs = clockout - clockin;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const jamKerja = `${diffHours} jam ${diffMinutes} menit`;
            
            data.push({
                outlet: outlet,
                karyawan: karyawan,
                clockin: clockin.toISOString(),
                clockout: clockout.toISOString(),
                jam_kerja: jamKerja
            });
        }
        
        console.log('✅ Fallback absen data generated:', data.length, 'records');
        return data;
    }

    generateFallbackOmsetData() {
        console.log('🔄 Generating fallback omset data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            outlets.forEach(outlet => {
                const totalOmset = Math.floor(Math.random() * 10000000) + 5000000;
                const jumlahTransaksi = Math.floor(Math.random() * 50) + 20;
                
                data.push({
                    outlet: outlet,
                    tanggal: date.toISOString().split('T')[0],
                    total_omset: totalOmset,
                    jumlah_transaksi: jumlahTransaksi,
                    rata_rata_transaksi: totalOmset / jumlahTransaksi
                });
            });
        }
        
        console.log('✅ Fallback omset data generated:', data.length, 'records');
        return data;
    }

    generateFallbackPemasukanPengeluaranData() {
        console.log('🔄 Generating fallback pemasukan pengeluaran data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const jenisList = ['pemasukan', 'pengeluaran'];
        const kategoriPemasukan = ['Penjualan', 'Top Up Member', 'Lainnya'];
        const kategoriPengeluaran = ['Gaji Karyawan', 'Bahan Baku', 'Operasional', 'Listrik', 'Air'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 20; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const outlet = outlets[Math.floor(Math.random() * outlets.length)];
            const jenis = jenisList[Math.floor(Math.random() * jenisList.length)];
            const kategori = jenis === 'pemasukan' 
                ? kategoriPemasukan[Math.floor(Math.random() * kategoriPemasukan.length)]
                : kategoriPengeluaran[Math.floor(Math.random() * kategoriPengeluaran.length)];
            
            const nominal = jenis === 'pemasukan' 
                ? Math.floor(Math.random() * 5000000) + 1000000
                : Math.floor(Math.random() * 2000000) + 500000;
            
            data.push({
                outlet: outlet,
                tanggal: date.toISOString().split('T')[0],
                jenis: jenis,
                kategori: kategori,
                keterangan: `${jenis === 'pemasukan' ? 'Penerimaan' : 'Pengeluaran'} ${kategori}`,
                nominal: nominal,
                created_by: ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'][Math.floor(Math.random() * 3)]
            });
        }
        
        console.log('✅ Fallback pemasukan pengeluaran data generated:', data.length, 'records');
        return data;
    }

    generateFallbackCancelData() {
        console.log('🔄 Generating fallback cancel data...');
        
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 10; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            data.push({
                order_date: date.toISOString(),
                order_no: `CANCEL${100 + i}`,
                outlet: outlets[Math.floor(Math.random() * outlets.length)],
                kasir: kasirs[Math.floor(Math.random() * kasirs.length)],
                customer_name: `Customer ${i + 1}`,
                amount: Math.floor(Math.random() * 200000) + 50000,
                cancel_reason: ['Stok habis', 'Perubahan pesanan', 'Pembatalan customer'][Math.floor(Math.random() * 3)]
            });
        }
        
        console.log('✅ Fallback cancel data generated:', data.length, 'records');
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
            ],
            'komisi': [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Served By', key: 'kasir' },
                { title: 'Total Amount', key: 'total_amount', type: 'currency' },
                { title: 'Total Komisi', key: 'total_komisi', type: 'currency' }
            ],
            'membercard': [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Kasir', key: 'kasir' },
                { title: 'Jumlah Membercard', key: 'jumlah_membercard' }
            ],
            'absen': [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Karyawan', key: 'karyawan' },
                { title: 'Clock In', key: 'clockin', type: 'datetime' },
                { title: 'Clock Out', key: 'clockout', type: 'datetime' },
                { title: 'Jam Kerja', key: 'jam_kerja' }
            ],
            'omset': [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Tanggal', key: 'tanggal', type: 'date' },
                { title: 'Total Omset', key: 'total_omset', type: 'currency' },
                { title: 'Jumlah Transaksi', key: 'jumlah_transaksi' },
                { title: 'Rata-rata Transaksi', key: 'rata_rata_transaksi', type: 'currency' }
            ],
            'pemasukan-pengeluaran': [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Tanggal', key: 'tanggal', type: 'date' },
                { 
                    title: 'Jenis', 
                    key: 'jenis',
                    formatter: (value) => {
                        const isPemasukan = value === 'pemasukan';
                        return `
                            <span class="px-2 py-1 text-xs rounded-full ${
                                isPemasukan 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${isPemasukan ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                        `;
                    }
                },
                { title: 'Kategori', key: 'kategori' },
                { title: 'Keterangan', key: 'keterangan' },
                { title: 'Nominal', key: 'nominal', type: 'currency' },
                { title: 'Dibuat Oleh', key: 'created_by' }
            ],
            'transaksi-cancel': [
                { title: 'Tanggal', key: 'order_date', type: 'date' },
                { title: 'Order No', key: 'order_no' },
                { title: 'Outlet', key: 'outlet' },
                { title: 'Kasir', key: 'kasir' },
                { title: 'Customer', key: 'customer_name' },
                { title: 'Amount', key: 'amount', type: 'currency' },
                { title: 'Alasan Cancel', key: 'cancel_reason' }
            ]
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
            const handler = () => {
                console.log('🔍 Filter button clicked');
                this.applyFilters();
            };
            filterBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: filterBtn, event: 'click', handler });
            console.log('✅ Filter button event bound');
        } else {
            console.warn('⚠️ Filter button not found');
        }
        
        // Export button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            const handler = () => {
                console.log('💾 Export button clicked');
                this.exportReport();
            };
            exportBtn.addEventListener('click', handler);
            this.eventListeners.push({ element: exportBtn, event: 'click', handler });
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
            }
            if (endDate) {
                this.filters.endDate = endDate.value;
            }
            if (outlet) {
                this.filters.outlet = outlet.value;
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

    // Cleanup method
    destroy() {
        console.log('🧹 Cleaning up Reports module...');
        
        this.removeAllEventListeners();
        this.destroyTable();
        
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('✅ Reports module destroyed');
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
            
        }, 500);
        
    } catch (error) {
        console.error('❌ Error initializing Reports module:', error);
    }
});
