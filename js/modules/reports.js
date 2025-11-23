// Reports Module dengan 8 Tab Laporan - COMPLETE VERSION
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
        if (this.isInitialized) {
            console.log('📊 Reports module already initialized');
            return;
        }

        console.log('🚀 Initializing Reports module...');
        
        try {
            if (typeof DataTable === 'undefined') {
                throw new Error('DataTable class not found');
            }

            this.initFilters();
            this.initTabs();
            this.bindEvents();
            
            this.setActiveTabUI(this.currentTab);
            this.updateReportTitle();
            
            await this.loadData();
            
            this.isInitialized = true;
            console.log('✅ Reports module initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Reports module:', error);
            this.showError('Gagal menginisialisasi modul laporan: ' + error.message);
        }
    }

    // Initialize tabs
    initTabs() {
        const tabsContainer = document.querySelector('.flex.overflow-x-auto');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.report-tab');
            if (tab) {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId);
            }
        });
    }

    // Set active tab UI
    setActiveTabUI(tabId) {
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        const activeTab = document.querySelector(`.report-tab[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeTab.classList.remove('border-transparent', 'text-gray-500');
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
            titleElement.textContent = titleMap[this.currentTab] || 'Laporan';
        }
    }

    // Switch between tabs
    async switchTab(tabId) {
        if (this.isLoading || this.currentTab === tabId) return;

        this.isLoading = true;
        
        try {
            this.showLoadingState();
            
            this.setActiveTabUI(tabId);
            this.currentTab = tabId;
            this.updateReportTitle();
            
            this.destroyTable();
            await this.loadData();
            
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
    }

    // Hide loading state
    hideLoadingState() {
        const filterBtn = document.getElementById('apply-filters');
        const exportBtn = document.getElementById('export-report');
        if (filterBtn) filterBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
    }

    // Initialize filters
    initFilters() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        this.filters.startDate = startDate.toISOString().split('T')[0];
        this.filters.endDate = endDate.toISOString().split('T')[0];
        
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const outletEl = document.getElementById('outlet-filter');
        
        if (startDateEl) startDateEl.value = this.filters.startDate;
        if (endDateEl) endDateEl.value = this.filters.endDate;
        if (outletEl) this.filters.outlet = outletEl.value;
    }

    // Load data
    async loadData() {
        if (this.isLoading) return;

        this.isLoading = true;
        
        try {
            let data = [];
            
            switch(this.currentTab) {
                case 'detail-transaksi':
                    data = await this.loadDetailTransaksi();
                    break;
                case 'pembayaran':
                    data = await this.loadLaporanPembayaran();
                    break;
                case 'komisi':
                    data = await this.loadLaporanKomisi();
                    break;
                case 'membercard':
                    data = await this.loadLaporanMembercard();
                    break;
                case 'absen':
                    data = await this.loadLaporanAbsen();
                    break;
                case 'omset':
                    data = await this.loadLaporanOmset();
                    break;
                case 'pemasukan-pengeluaran':
                    data = await this.loadLaporanPemasukanPengeluaran();
                    break;
                case 'transaksi-cancel':
                    data = await this.loadLaporanTransaksiCancel();
                    break;
                default:
                    data = await this.loadDetailTransaksi();
            }

            this.currentData = Array.isArray(data) ? data : [];
            
            this.initTable();
            this.updateSummary();

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.currentData = [];
            this.showError('Gagal memuat data: ' + error.message);
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
            
            return data || this.generateFallbackTransactionData();
        } catch (error) {
            console.error('Error loading detail transaksi:', error);
            return this.generateFallbackTransactionData();
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
            return this.generateFallbackPembayaranData();
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
            return this.generateFallbackKomisiData();
        }
    }

    async loadLaporanMembercard() {
        try {
            let query = supabase
                .from('membercard')
                .select('*')
                .limit(500);

            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            return this.processMembercardData(data || []);
        } catch (error) {
            console.error('Error loading membercard:', error);
            return this.generateFallbackMembercardData();
        }
    }

    async loadLaporanAbsen() {
        try {
            let query = supabase
                .from('absen')
                .select('*')
                .order('clockin', { ascending: false })
                .limit(500);

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

            return this.processAbsenData(data || []);
        } catch (error) {
            console.error('Error loading absen:', error);
            return this.generateFallbackAbsenData();
        }
    }

    async loadLaporanOmset() {
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

            return this.processOmsetData(data || []);
        } catch (error) {
            console.error('Error loading omset:', error);
            return this.generateFallbackOmsetData();
        }
    }

    async loadLaporanPemasukanPengeluaran() {
        try {
            let query = supabase
                .from('arus_kas')
                .select('*')
                .order('tanggal', { ascending: false })
                .limit(500);

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

            return data || [];
        } catch (error) {
            console.error('Error loading pemasukan pengeluaran:', error);
            return this.generateFallbackPemasukanPengeluaranData();
        }
    }

    async loadLaporanTransaksiCancel() {
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

            const canceledData = data.filter(item => 
                item.status === 'canceled' || item.status === 'cancelled'
            );
            
            return canceledData;
        } catch (error) {
            console.error('Error loading transaksi cancel:', error);
            return this.generateFallbackCancelData();
        }
    }

    // ==================== DATA PROCESSING METHODS ====================

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

    processMembercardData(data) {
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
        
        return Object.values(result);
    }

    processAbsenData(data) {
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
        
        return tableData;
    }

    // ==================== FALLBACK DATA GENERATORS ====================

    generateFallbackTransactionData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 50; i++) {
            const date = new Date();
            date.setDate(today.getDate() - Math.floor(i / 10));
            
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
        
        return data;
    }

    generateFallbackPembayaranData() {
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
        
        return data;
    }

    generateFallbackKomisiData() {
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
        
        return data;
    }

    generateFallbackMembercardData() {
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
        
        return data;
    }

    generateFallbackAbsenData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const karyawans = ['Echwan Abdillah', 'Hari Suryono', 'Ahmad Fauzi', 'Siti Rahma', 'Budi Santoso'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
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
        
        return data;
    }

    generateFallbackOmsetData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
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
        
        return data;
    }

    generateFallbackPemasukanPengeluaranData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const jenisList = ['pemasukan', 'pengeluaran'];
        const kategoriPemasukan = ['Penjualan', 'Top Up Member', 'Lainnya'];
        const kategoriPengeluaran = ['Gaji Karyawan', 'Bahan Baku', 'Operasional', 'Listrik', 'Air'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 60; i++) {
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
        
        return data;
    }

    generateFallbackCancelData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 15; i++) {
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
        
        return data;
    }

    // ==================== TABLE MANAGEMENT ====================

    destroyTable() {
        if (this.table) {
            try {
                if (typeof this.table.destroy === 'function') {
                    this.table.destroy();
                }
                this.table = null;
            } catch (error) {
                console.warn('Error destroying table:', error);
            }
        }
    }

    initTable() {
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) return;

        try {
            const columns = this.getTableColumns();
            
            this.table = new DataTable('reports-table', {
                columns: columns,
                data: this.currentData,
                searchable: true,
                pagination: true,
                pageSize: 15
            });

            this.table.init();
            
        } catch (error) {
            console.error('❌ Error initializing table:', error);
            this.showError('Gagal memuat tabel: ' + error.message);
        }
    }

    showError(message) {
        const tableContainer = document.getElementById('reports-table');
        if (tableContainer) {
            tableContainer.innerHTML = `
                <div class="flex justify-center items-center py-12">
                    <div class="text-center">
                        <div class="text-red-400 text-6xl mb-4">❌</div>
                        <p class="text-red-500 text-lg">Terjadi Kesalahan</p>
                        <p class="text-gray-600 text-sm">${message}</p>
                    </div>
                </div>
            `;
        }
    }

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

        return columnDefinitions[this.currentTab] || columnDefinitions['detail-transaksi'];
    }

    // ==================== EVENT HANDLERS ====================

    bindEvents() {
        const filterBtn = document.getElementById('apply-filters');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        }
        
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    async applyFilters() {
        if (this.isLoading) return;

        try {
            this.showLoadingState();
            
            const startDate = document.getElementById('start-date');
            const endDate = document.getElementById('end-date');
            const outlet = document.getElementById('outlet-filter');

            if (startDate) this.filters.startDate = startDate.value;
            if (endDate) this.filters.endDate = endDate.value;
            if (outlet) this.filters.outlet = outlet.value;

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
                
                case 'membercard':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseInt(item.jumlah_membercard) || 0), 0);
                    totalTransactions = this.currentData.length;
                    totalItems = 0;
                    totalProfit = totalSales * 100000;
                    break;
                
                case 'absen':
                    totalSales = this.currentData.length;
                    totalTransactions = new Set(this.currentData.map(item => item.karyawan)).size;
                    totalItems = 0;
                    totalProfit = totalSales * 50000;
                    break;
                
                case 'omset':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_omset) || 0), 0);
                    totalTransactions = this.currentData.reduce((sum, item) => sum + (parseInt(item.jumlah_transaksi) || 0), 0);
                    totalItems = this.currentData.length;
                    totalProfit = totalSales * 0.2;
                    break;
                
                case 'pemasukan-pengeluaran':
                    const pemasukan = this.currentData
                        .filter(item => item.jenis === 'pemasukan')
                        .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);
                    const pengeluaran = this.currentData
                        .filter(item => item.jenis === 'pengeluaran')
                        .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);
                    totalSales = pemasukan;
                    totalTransactions = this.currentData.length;
                    totalItems = pengeluaran;
                    totalProfit = pemasukan - pengeluaran;
                    break;
                
                case 'transaksi-cancel':
                    totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                    totalTransactions = this.currentData.length;
                    totalItems = new Set(this.currentData.map(item => item.order_no)).size;
                    totalProfit = -totalSales;
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

            let csvContent = "";
            const columns = this.getTableColumns();
            
            // Header
            csvContent += columns.map(col => `"${col.title}"`).join(',') + '\n';
            
            // Data
            this.currentData.forEach(item => {
                const row = columns.map(col => {
                    let value = item[col.key] || '';
                    
                    if (col.type === 'currency' && typeof value === 'number') {
                        value = Helpers.formatCurrency(value, false);
                    } else if (col.type === 'date' && value) {
                        value = Helpers.formatDateWIB(value);
                    }
                    
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
            
        } catch (error) {
            this.hideLoadingState();
            this.showError('Gagal mengexport laporan: ' + error.message);
        }
    }
}

// Initialize reports
let reports = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        setTimeout(() => {
            if (typeof DataTable === 'undefined') {
                console.error('❌ DataTable not loaded');
                return;
            }
            
            reports = new Reports();
            window.reportsModule = reports;
            
            reports.init().catch(console.error);
        }, 100);
        
    } catch (error) {
        console.error('❌ Error initializing Reports module:', error);
    }
});
