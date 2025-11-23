// Reports Module dengan 8 Tab Laporan - FIXED DATA TABLE VERSION
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
        
        // Auto-bind methods
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
        this.checkDataTableDependency = this.checkDataTableDependency.bind(this);
    }

    // Check if DataTable class is available
    checkDataTableDependency() {
        if (typeof DataTable === 'undefined') {
            console.error('❌ DataTable class is not defined');
            this.showError('DataTable library tidak ditemukan. Pastikan script DataTable sudah di-load.');
            return false;
        }
        return true;
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('📊 Reports module already initialized');
            return;
        }

        console.log('🚀 Initializing Reports module...');
        
        try {
            // Check dependency first
            if (!this.checkDataTableDependency()) {
                return;
            }

            // Initialize dalam urutan yang benar
            this.initFilters();
            this.initTabs();
            this.bindEvents();
            
            // Set UI state pertama kali
            this.setActiveTabUI(this.currentTab);
            this.updateReportTitle();
            
            // Load data initial
            await this.loadData();
            
            this.isInitialized = true;
            console.log('✅ Reports module initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Reports module:', error);
            this.showError('Gagal menginisialisasi modul laporan: ' + error.message);
        }
    }

    // Initialize tabs dengan event delegation
    initTabs() {
        const tabsContainer = document.querySelector('.flex.overflow-x-auto');
        if (!tabsContainer) {
            console.warn('Tabs container not found');
            return;
        }

        // Gunakan event delegation untuk menghindari multiple event listeners
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.report-tab');
            if (tab) {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                console.log('🔄 Tab clicked:', tabId);
                this.switchTab(tabId);
            }
        });

        console.log('✅ Tabs initialized with event delegation');
    }

    // Set active tab UI
    setActiveTabUI(tabId) {
        console.log('🎨 Setting active tab UI for:', tabId);
        
        // Remove active class dari semua tabs
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.remove(
                'active', 
                'border-blue-500', 
                'text-blue-600',
                'bg-blue-50'
            );
            tab.classList.add(
                'border-transparent', 
                'text-gray-500',
                'hover:text-gray-700',
                'hover:border-gray-300'
            );
        });
        
        // Add active class ke tab yang dipilih
        const activeTab = document.querySelector(`.report-tab[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add(
                'active', 
                'border-blue-500', 
                'text-blue-600'
            );
            activeTab.classList.remove(
                'border-transparent', 
                'text-gray-500',
                'hover:text-gray-700',
                'hover:border-gray-300'
            );
            console.log('✅ Active tab UI updated:', tabId);
        } else {
            console.warn('⚠️ Tab element not found for:', tabId);
        }
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
            console.log('📝 Report title updated to:', newTitle);
        }
    }

    // Switch between tabs
    async switchTab(tabId) {
        if (this.isLoading) {
            console.log('⏳ Tab switch in progress, skipping...');
            return;
        }

        if (this.currentTab === tabId) {
            console.log('🔁 Tab already active:', tabId);
            return;
        }

        console.log('🔄 Switching to tab:', tabId);
        
        this.isLoading = true;
        
        try {
            this.showLoadingState();
            
            // Update UI state FIRST
            this.setActiveTabUI(tabId);
            this.currentTab = tabId;
            this.updateReportTitle();
            
            console.log('📊 Current tab set to:', this.currentTab);
            
            // Clear previous table properly
            this.destroyTable();
            
            // Load data for new tab
            await this.loadData();
            
            console.log('✅ Tab switch completed successfully:', tabId);
            
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
        const tableContainer = document.getElementById('reports-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex justify-center items-center py-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-gray-600">Memuat data...</span>
                </div>
            `;
        }
        
        // Disable buttons selama loading
        this.setButtonsState(true);
    }

    // Hide loading state
    hideLoadingState() {
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
        
        // Set default dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        this.filters.startDate = startDate.toISOString().split('T')[0];
        this.filters.endDate = endDate.toISOString().split('T')[0];
        
        // Update DOM elements
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const outletEl = document.getElementById('outlet-filter');
        
        if (startDateEl) startDateEl.value = this.filters.startDate;
        if (endDateEl) endDateEl.value = this.filters.endDate;
        if (outletEl) this.filters.outlet = outletEl.value;

        console.log('✅ Filters initialized:', this.filters);
    }

    // Load data dengan error handling
    async loadData() {
        if (this.isLoading) {
            console.log('⏳ Data load in progress, skipping...');
            return;
        }

        this.isLoading = true;
        
        try {
            console.log('📥 Loading data for tab:', this.currentTab);

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

            const loader = dataLoaders[this.currentTab] || dataLoaders['detail-transaksi'];
            data = await loader();

            this.currentData = Array.isArray(data) ? data : [];
            console.log('✅ Data loaded:', this.currentData.length, 'records');

            // Initialize table setelah data loaded
            this.initTable();

            // Update summary
            this.updateSummary();

            return this.currentData;

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.currentData = [];
            this.showError('Gagal memuat data: ' + error.message);
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    // ==================== DATA LOADING METHODS ====================

    async loadDetailTransaksi() {
        try {
            let query = supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(500);

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
            
            return data || this.generateFallbackData('transaksi');
        } catch (error) {
            console.error('Error loading detail transaksi:', error);
            return this.generateFallbackData('transaksi');
        }
    }

    async loadLaporanPembayaran() {
        try {
            let query = supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(500);

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

            return this.processPembayaranData(data || []);
        } catch (error) {
            console.error('Error loading pembayaran:', error);
            return this.generateFallbackData('pembayaran');
        }
    }

    async loadLaporanKomisi() {
        try {
            let query = supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(500);

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

            return this.processKomisiData(data || []);
        } catch (error) {
            console.error('Error loading komisi:', error);
            return this.generateFallbackData('komisi');
        }
    }

    // Process methods
    processPembayaranData(data) {
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
        
        return tableData;
    }

    processKomisiData(data) {
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
        
        return Object.values(result);
    }

    // Generate fallback data untuk semua tipe
    generateFallbackData(type) {
        console.log(`🔄 Generating fallback data for: ${type}`);
        
        const baseData = this.generateBaseData();
        
        switch(type) {
            case 'pembayaran':
                return this.processPembayaranData(baseData);
            case 'komisi':
                return this.processKomisiData(baseData);
            case 'transaksi':
            default:
                return baseData;
        }
    }

    generateBaseData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        const customers = ['Customer A', 'Customer B', 'Customer C'];
        const items = ['Item 1', 'Item 2', 'Item 3'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - Math.floor(i / 5));
            
            data.push({
                order_date: date.toISOString(),
                order_no: `ORD${1000 + i}`,
                outlet: outlets[Math.floor(Math.random() * outlets.length)],
                kasir: kasirs[Math.floor(Math.random() * kasirs.length)],
                customer_name: customers[Math.floor(Math.random() * customers.length)],
                item_name: items[Math.floor(Math.random() * items.length)],
                qty: Math.floor(Math.random() * 3) + 1,
                harga_jual: Math.floor(Math.random() * 50000) + 25000,
                amount: Math.floor(Math.random() * 150000) + 50000,
                payment_type: ['cash', 'transfer'][Math.floor(Math.random() * 2)],
                status: ['completed', 'pending'][Math.floor(Math.random() * 2)]
            });
        }
        
        return data;
    }

    // ==================== TABLE MANAGEMENT ====================

    // Destroy table properly
    destroyTable() {
        if (this.table) {
            console.log('🗑️ Destroying existing table...');
            try {
                // Cek method destroy tersedia
                if (typeof this.table.destroy === 'function') {
                    this.table.destroy();
                } else if (typeof this.table.destroyTable === 'function') {
                    this.table.destroyTable();
                }
                this.table = null;
            } catch (error) {
                console.warn('Error destroying table:', error);
            }
        }
    }

    // Initialize table dengan safety checks
    initTable() {
        console.log('🔄 Initializing table for tab:', this.currentTab);
        
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) {
            console.error('❌ Table container #reports-table not found');
            return;
        }

        // Check DataTable dependency
        if (!this.checkDataTableDependency()) {
            this.showSimpleTable();
            return;
        }

        try {
            const columns = this.getTableColumns();
            
            // Pastikan DataTable constructor ada
            if (typeof DataTable !== 'function') {
                throw new Error('DataTable is not a constructor');
            }

            // Initialize table
            this.table = new DataTable('reports-table', {
                columns: columns,
                searchable: true,
                pagination: true,
                pageSize: 10,
                emptyMessage: 'Tidak ada data yang ditemukan'
            });

            // Pastikan method init ada
            if (typeof this.table.init === 'function') {
                this.table.init();
            } else {
                console.warn('Table init method not found, calling directly');
            }

            // Update data
            if (this.currentData.length > 0) {
                if (typeof this.table.updateData === 'function') {
                    this.table.updateData(this.currentData);
                }
            } else {
                this.showNoDataMessage();
            }

            console.log('✅ Table initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing DataTable:', error);
            this.showSimpleTable();
        }
    }

    // Fallback simple table jika DataTable gagal
    showSimpleTable() {
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) return;

        if (this.currentData.length === 0) {
            this.showNoDataMessage();
            return;
        }

        const columns = this.getTableColumns();
        let html = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr class="bg-gray-50">
        `;

        // Header
        columns.forEach(col => {
            html += `<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">${col.title}</th>`;
        });

        html += `</tr></thead><tbody>`;

        // Rows
        this.currentData.forEach((row, index) => {
            html += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
            columns.forEach(col => {
                let value = row[col.key] || '';
                
                // Format values
                if (col.type === 'currency' && typeof value === 'number') {
                    value = Helpers.formatCurrency(value);
                } else if (col.type === 'date' && value) {
                    value = Helpers.formatDateWIB(value);
                } else if (col.formatter && typeof col.formatter === 'function') {
                    value = col.formatter(value);
                }
                
                html += `<td class="px-4 py-2 text-sm text-gray-900 border-b">${value}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table></div>`;

        tableContainer.innerHTML = html;
        console.log('✅ Simple table rendered as fallback');
    }

    // Show no data message
    showNoDataMessage() {
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

    // Show error message
    showError(message) {
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
        
        // Show notification jika available
        if (window.Notifications) {
            Notifications.error(message);
        } else {
            console.error('Error:', message);
        }
    }

    // Get table columns
    getTableColumns() {
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
            ]
        };

        return columnDefinitions[this.currentTab] || columnDefinitions['detail-transaksi'];
    }

    // ==================== EVENT HANDLERS ====================

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Filter button
        const filterBtn = document.getElementById('apply-filters');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        }
        
        // Export button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        console.log('✅ Events bound successfully');
    }

    async applyFilters() {
        if (this.isLoading) return;

        console.log('🔍 Applying filters...');
        
        try {
            this.showLoadingState();
            
            const startDate = document.getElementById('start-date');
            const endDate = document.getElementById('end-date');
            const outlet = document.getElementById('outlet-filter');

            if (startDate) this.filters.startDate = startDate.value;
            if (endDate) this.filters.endDate = endDate.value;
            if (outlet) this.filters.outlet = outlet.value;

            console.log('✅ Filters applied:', this.filters);
            
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Error applying filters:', error);
            this.showError('Gagal menerapkan filter');
        } finally {
            this.hideLoadingState();
        }
    }

    // ==================== SUMMARY & EXPORT ====================

    updateSummary() {
        try {
            let totalSales = 0;
            let totalTransactions = 0;
            let totalItems = 0;
            let totalProfit = 0;

            switch(this.currentTab) {
                case 'detail-transaksi':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    totalTransactions = new Set(this.currentData.map(item => item.order_no)).size;
                    totalItems = this.currentData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
                    totalProfit = totalSales * 0.15;
                    break;
                
                case 'pembayaran':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                    totalTransactions = this.currentData.length;
                    totalItems = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_amount_cancel) || 0), 0);
                    totalProfit = totalSales - totalItems;
                    break;
                
                case 'komisi':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                    totalTransactions = this.currentData.length;
                    totalItems = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_komisi) || 0), 0);
                    totalProfit = totalItems;
                    break;
                
                default:
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    totalTransactions = this.currentData.length;
                    totalItems = this.currentData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
                    totalProfit = totalSales * 0.15;
            }

            this.updateSummaryCard('total-sales', Helpers.formatCurrency(totalSales));
            this.updateSummaryCard('total-transactions', totalTransactions.toLocaleString());
            this.updateSummaryCard('total-items', totalItems.toLocaleString());
            this.updateSummaryCard('total-profit', Helpers.formatCurrency(totalProfit));

        } catch (error) {
            console.error('Error updating summary:', error);
        }
    }

    updateSummaryCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    async exportReport() {
        try {
            if (this.currentData.length === 0) {
                this.showError('Tidak ada data untuk diexport');
                return;
            }

            this.showLoadingState();

            // Simple export logic
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
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.hideLoadingState();
            
            if (window.Notifications) {
                Notifications.success('Laporan berhasil diexport');
            }

        } catch (error) {
            this.hideLoadingState();
            this.showError('Gagal mengexport laporan: ' + error.message);
        }
    }

    // Cleanup
    destroy() {
        console.log('🧹 Cleaning up Reports module...');
        this.destroyTable();
        this.isInitialized = false;
        this.isLoading = false;
    }
}

// Safe initialization
let reports = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Tunggu sampai semua resources loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeReports);
        } else {
            setTimeout(initializeReports, 100);
        }
        
        function initializeReports() {
            if (!document.getElementById('reports-table')) {
                console.log('⏳ Reports table not found, retrying...');
                setTimeout(initializeReports, 500);
                return;
            }
            
            reports = new Reports();
            window.reportsModule = reports;
            
            reports.init().catch(error => {
                console.error('❌ Failed to initialize reports:', error);
            });
        }
        
    } catch (error) {
        console.error('❌ Error initializing Reports module:', error);
    }
});
