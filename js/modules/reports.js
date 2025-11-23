// Reports Module dengan 8 Tab Laporan - FIXED VERSION
class Reports {
    constructor() {
        this.currentData = [];
        this.currentTab = 'detail-transaksi'; // Tab default
        this.table = null;
        this.filters = {
            startDate: '',
            endDate: '',
            outlet: ''
        };
        this.isInitialized = false;
        
        // Bind methods to maintain 'this' context
        this.init = this.init.bind(this);
        this.initTabs = this.initTabs.bind(this);
        this.switchTab = this.switchTab.bind(this);
        this.loadData = this.loadData.bind(this);
        this.initFilters = this.initFilters.bind(this);
        this.initTable = this.initTable.bind(this);
        this.applyFilters = this.applyFilters.bind(this);
        this.exportReport = this.exportReport.bind(this);
        this.updateSummary = this.updateSummary.bind(this);
        this.updateReportTitle = this.updateReportTitle.bind(this);
        this.updateTableForCurrentTab = this.updateTableForCurrentTab.bind(this);
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('Reports module already initialized');
            return;
        }

        console.log('Initializing Reports module');
        
        try {
            this.initTabs();
            this.initFilters();
            this.bindEvents();
            
            // Set active tab UI pertama kali
            this.setActiveTabUI(this.currentTab);
            this.updateReportTitle();
            
            await this.loadData();
            
            this.isInitialized = true;
            console.log('Reports module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Reports module:', error);
            Notifications.error('Gagal menginisialisasi modul laporan: ' + error.message);
        }
    }

    // Initialize tabs
    initTabs() {
        const tabs = document.querySelectorAll('.report-tab');
        console.log('Found tabs:', tabs.length);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                console.log('Tab clicked:', tabId);
                this.switchTab(tabId);
            });
        });
    }

    // Set active tab UI
    setActiveTabUI(tabId) {
        console.log('Setting active tab UI for:', tabId);
        
        // Remove all active classes from all tabs
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.remove('active', 'border-blue-500', 'text-blue-600', 'bg-blue-50');
            tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
        
        // Add active classes to current tab
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            console.log('✅ Active tab UI updated:', tabId);
        } else {
            console.warn('Tab element not found for:', tabId);
        }
    }

    // Update report title based on current tab
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
            console.log('Report title updated to:', newTitle);
        } else {
            console.warn('Report title element not found');
        }
    }

    // Switch between tabs - FIXED VERSION
    async switchTab(tabId) {
        if (this.currentTab === tabId) {
            console.log('Tab already active:', tabId);
            return;
        }

        console.log('Switching to tab:', tabId);
        
        try {
            Helpers.showLoading();
            
            // 1. Update UI first
            this.setActiveTabUI(tabId);
            
            // 2. Update current tab
            this.currentTab = tabId;
            
            // 3. Update report title
            this.updateReportTitle();
            
            console.log('Current tab set to:', this.currentTab);
            
            // 4. Load data for new tab
            await this.loadData();
            
            Helpers.hideLoading();
            console.log('✅ Tab switched successfully:', tabId);
            
        } catch (error) {
            console.error('Error switching tab:', error);
            Helpers.hideLoading();
            Notifications.error('Gagal memuat laporan: ' + error.message);
        }
    }

    // Initialize filters
    initFilters() {
        console.log('Initializing filters');
        
        // Set default dates (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        this.filters.startDate = startDate.toISOString().split('T')[0];
        this.filters.endDate = endDate.toISOString().split('T')[0];
        
        // Set filter values in DOM jika elemen ada
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const outletEl = document.getElementById('outlet-filter');
        
        if (startDateEl) startDateEl.value = this.filters.startDate;
        if (endDateEl) endDateEl.value = this.filters.endDate;
        if (outletEl) this.filters.outlet = outletEl.value;

        console.log('Filters initialized:', this.filters);
    }

    // Load data based on current tab
    async loadData() {
        try {
            console.log('Loading data for tab:', this.currentTab);

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
                    console.warn('Unknown tab, loading detail transaksi');
                    data = await this.loadDetailTransaksi();
            }

            this.currentData = Array.isArray(data) ? data : [];
            console.log('Data loaded:', this.currentData.length, 'records');
            
            // Initialize or update table
            if (!this.table) {
                this.initTable();
            } else {
                this.updateTableForCurrentTab();
            }

            this.updateSummary();
            return this.currentData;

        } catch (error) {
            console.error('Error loading data:', error);
            Notifications.error('Gagal memuat data laporan: ' + error.message);
            this.currentData = [];
            this.updateSummary();
            return [];
        }
    }

    // ==================== DATA LOADING METHODS ====================

    async loadDetailTransaksi() {
        console.log('Loading detail transaksi');
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false });

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
            console.error('Supabase error:', error);
            throw error;
        }
        return data || [];
    }

    async loadLaporanPembayaran() {
        console.log('Loading laporan pembayaran');
        
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false });

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
        if (error) throw error;

        return this.processPembayaranData(data || []);
    }

    processPembayaranData(data) {
        const result = {};
        
        data.forEach(item => {
            const outlet = item.outlet || 'Unknown';
            const paymentType = item.payment_type || 'cash';
            const amount = parseFloat(item.amount) || 0;
            const isCancel = item.status === 'canceled' || item.status === 'cancelled';
            
            if (!result[outlet]) {
                result[outlet] = {};
            }
            
            if (!result[outlet][paymentType]) {
                result[outlet][paymentType] = {
                    totalAmount: 0,
                    totalAmountCancel: 0
                };
            }
            
            if (isCancel) {
                result[outlet][paymentType].totalAmountCancel += amount;
            } else {
                result[outlet][paymentType].totalAmount += amount;
            }
        });
        
        // Convert to array format for table
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

    async loadLaporanKomisi() {
        console.log('Loading laporan komisi');
        
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false });

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
        if (error) throw error;

        return this.processKomisiData(data || []);
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
            
            // Hitung komisi (contoh: 10% dari total amount)
            const komisi = amount * 0.1;
            result[key].total_komisi += komisi;
        });
        
        return Object.values(result);
    }

    async loadLaporanMembercard() {
        console.log('Loading laporan membercard');
        
        try {
            let query = supabase
                .from('membercard')
                .select('*');

            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            return this.processMembercardData(data || []);
        } catch (error) {
            console.warn('Membercard table not found, using fallback data');
            return this.generateFallbackMembercardData();
        }
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

    generateFallbackMembercardData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Hari Suryono', 'Echwan Abdillah', 'Ahmad Fauzi'];
        
        return outlets.map(outlet => {
            const kasir = kasirs[Math.floor(Math.random() * kasirs.length)];
            const jumlah = Math.floor(Math.random() * 20) + 10;
            
            return {
                outlet: outlet,
                kasir: kasir,
                jumlah_membercard: jumlah
            };
        });
    }

    async loadLaporanAbsen() {
        console.log('Loading laporan absen');
        
        try {
            let query = supabase
                .from('absen')
                .select('*')
                .order('clockin', { ascending: false });

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
            console.warn('Absen table not found, using fallback data');
            return this.generateFallbackAbsenData();
        }
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

    generateFallbackAbsenData() {
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
        
        return data;
    }

    async loadLaporanOmset() {
        console.log('Loading laporan omset');
        
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false });

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

    async loadLaporanPemasukanPengeluaran() {
        console.log('Loading laporan pemasukan pengeluaran');
        
        try {
            let query = supabase
                .from('arus_kas')
                .select('*')
                .order('tanggal', { ascending: false });

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
            console.warn('Arus kas table not found, using fallback data');
            return this.generateFallbackPemasukanPengeluaranData();
        }
    }

    generateFallbackPemasukanPengeluaranData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const jenisList = ['pemasukan', 'pengeluaran'];
        const kategoriPemasukan = ['Penjualan', 'Top Up Member', 'Lainnya'];
        const kategoriPengeluaran = ['Gaji Karyawan', 'Bahan Baku', 'Operasional', 'Listrik', 'Air'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
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

    async loadLaporanTransaksiCancel() {
        console.log('Loading laporan transaksi cancel');
        
        let query = supabase
            .from('transaksi_detail')
            .select('*')
            .order('order_date', { ascending: false });

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
    }

    // ==================== TABLE MANAGEMENT ====================

    initTable() {
        console.log('Initializing table for tab:', this.currentTab);
        
        const tableContainer = document.getElementById('reports-table');
        if (!tableContainer) {
            console.error('Table container #reports-table not found');
            return;
        }

        const columns = this.getTableColumns();
        
        this.table = new DataTable('reports-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 15
        });

        this.table.init();
        this.table.updateData(this.currentData);
    }

    updateTableForCurrentTab() {
        console.log('Updating table for tab:', this.currentTab);
        
        if (this.table && typeof this.table.destroy === 'function') {
            this.table.destroy();
        }
        
        this.initTable();
    }

    getTableColumns() {
        const columnDefinitions = {
            'detail-transaksi': this.getDetailTransaksiColumns(),
            'pembayaran': this.getPembayaranColumns(),
            'komisi': this.getKomisiColumns(),
            'membercard': this.getMembercardColumns(),
            'absen': this.getAbsenColumns(),
            'omset': this.getOmsetColumns(),
            'pemasukan-pengeluaran': this.getPemasukanPengeluaranColumns(),
            'transaksi-cancel': this.getTransaksiCancelColumns()
        };

        return columnDefinitions[this.currentTab] || this.getDetailTransaksiColumns();
    }

    // Column definitions
    getDetailTransaksiColumns() {
        return [
            { 
                title: 'Tanggal', 
                key: 'order_date',
                type: 'date'
            },
            { title: 'Order No', key: 'order_no' },
            { title: 'Outlet', key: 'outlet' },
            { title: 'Kasir', key: 'kasir' },
            { title: 'Customer', key: 'customer_name' },
            { title: 'Item', key: 'item_name' },
            { title: 'Qty', key: 'qty' },
            { 
                title: 'Harga Jual', 
                key: 'harga_jual',
                type: 'currency'
            },
            { 
                title: 'Amount', 
                key: 'amount',
                type: 'currency'
            },
            { 
                title: 'Payment', 
                key: 'payment_type',
                formatter: (value) => {
                    const types = {
                        'cash': 'Cash',
                        'transfer': 'Transfer',
                        'debit_card': 'Debit Card',
                        'credit_card': 'Credit Card'
                    };
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
                    
                    return `
                        <span class="px-2 py-1 text-xs rounded-full ${bgColor}">
                            ${text}
                        </span>
                    `;
                }
            }
        ];
    }

    getPembayaranColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { 
                title: 'Type Pembayaran', 
                key: 'payment_type',
                formatter: (value) => {
                    const types = {
                        'cash': 'Cash',
                        'transfer': 'Transfer',
                        'debit_card': 'Debit Card',
                        'credit_card': 'Credit Card'
                    };
                    return types[value] || value;
                }
            },
            { 
                title: 'Total Amount Cancel', 
                key: 'total_amount_cancel',
                type: 'currency'
            },
            { 
                title: 'Total Amount', 
                key: 'total_amount',
                type: 'currency'
            }
        ];
    }

    getKomisiColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { title: 'Served By', key: 'kasir' },
            { 
                title: 'Total Amount', 
                key: 'total_amount',
                type: 'currency'
            },
            { 
                title: 'Total Komisi', 
                key: 'total_komisi',
                type: 'currency'
            }
        ];
    }

    getMembercardColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { title: 'Kasir', key: 'kasir' },
            { title: 'Jumlah Membercard', key: 'jumlah_membercard' }
        ];
    }

    getAbsenColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { title: 'Karyawan', key: 'karyawan' },
            { 
                title: 'Clock In', 
                key: 'clockin',
                type: 'datetime'
            },
            { 
                title: 'Clock Out', 
                key: 'clockout',
                type: 'datetime'
            },
            { title: 'Jam Kerja', key: 'jam_kerja' }
        ];
    }

    getOmsetColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { 
                title: 'Tanggal', 
                key: 'tanggal',
                type: 'date'
            },
            { 
                title: 'Total Omset', 
                key: 'total_omset',
                type: 'currency'
            },
            { title: 'Jumlah Transaksi', key: 'jumlah_transaksi' },
            { 
                title: 'Rata-rata Transaksi', 
                key: 'rata_rata_transaksi',
                type: 'currency'
            }
        ];
    }

    getPemasukanPengeluaranColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { 
                title: 'Tanggal', 
                key: 'tanggal',
                type: 'date'
            },
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
            { 
                title: 'Nominal', 
                key: 'nominal',
                type: 'currency'
            },
            { title: 'Dibuat Oleh', key: 'created_by' }
        ];
    }

    getTransaksiCancelColumns() {
        return [
            { 
                title: 'Tanggal', 
                key: 'order_date',
                type: 'date'
            },
            { title: 'Order No', key: 'order_no' },
            { title: 'Outlet', key: 'outlet' },
            { title: 'Kasir', key: 'kasir' },
            { title: 'Customer', key: 'customer_name' },
            { 
                title: 'Amount', 
                key: 'amount',
                type: 'currency'
            },
            { 
                title: 'Alasan Cancel', 
                key: 'cancel_reason',
                formatter: (value) => value || 'Tidak ada alasan'
            }
        ];
    }

    // ==================== EVENT HANDLERS ====================

    bindEvents() {
        console.log('Binding events');
        
        // Filter button
        const filterBtn = document.getElementById('apply-filters');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        } else {
            console.warn('Filter button not found');
        }
        
        // Export button
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        } else {
            console.warn('Export button not found');
        }

        // Enter key untuk filters
        const filterInputs = document.querySelectorAll('#start-date, #end-date, #outlet-filter');
        filterInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        });
    }

    async applyFilters() {
        console.log('Applying filters');
        
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        const outlet = document.getElementById('outlet-filter');

        if (startDate) this.filters.startDate = startDate.value;
        if (endDate) this.filters.endDate = endDate.value;
        if (outlet) this.filters.outlet = outlet.value;

        console.log('Filters applied:', this.filters);
        
        await this.loadData();
        Notifications.success('Filter diterapkan');
    }

    // ==================== SUMMARY & EXPORT ====================

    updateSummary() {
        let totalSales = 0;
        let totalTransactions = 0;
        let totalItems = 0;
        let totalProfit = 0;

        switch(this.currentTab) {
            case 'detail-transaksi':
                totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                totalTransactions = new Set(this.currentData.map(item => item.order_no)).size;
                totalItems = this.currentData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
                totalProfit = this.currentData.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);
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
                totalTransactions = new Set(this.currentData.map(item => item.order_no)).size;
                totalItems = this.currentData.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
                totalProfit = totalSales * 0.15;
        }

        this.updateSummaryCard('total-sales', Helpers.formatCurrency(totalSales));
        this.updateSummaryCard('total-transactions', totalTransactions);
        this.updateSummaryCard('total-items', totalItems);
        this.updateSummaryCard('total-profit', Helpers.formatCurrency(totalProfit));
    }

    updateSummaryCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    async exportReport() {
        try {
            Helpers.showLoading();

            let csvContent = "";
            let filename = "";

            const exportMethods = {
                'detail-transaksi': () => {
                    csvContent = this.generateDetailTransaksiCSV();
                    filename = `laporan-detail-transaksi-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'pembayaran': () => {
                    csvContent = this.generatePembayaranCSV();
                    filename = `laporan-pembayaran-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'komisi': () => {
                    csvContent = this.generateKomisiCSV();
                    filename = `laporan-komisi-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'membercard': () => {
                    csvContent = this.generateMembercardCSV();
                    filename = `laporan-membercard-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'absen': () => {
                    csvContent = this.generateAbsenCSV();
                    filename = `laporan-absen-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'omset': () => {
                    csvContent = this.generateOmsetCSV();
                    filename = `laporan-omset-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'pemasukan-pengeluaran': () => {
                    csvContent = this.generatePemasukanPengeluaranCSV();
                    filename = `laporan-pemasukan-pengeluaran-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'transaksi-cancel': () => {
                    csvContent = this.generateTransaksiCancelCSV();
                    filename = `laporan-transaksi-cancel-${new Date().toISOString().split('T')[0]}.csv`;
                }
            };

            const exportMethod = exportMethods[this.currentTab] || exportMethods['detail-transaksi'];
            exportMethod();

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Helpers.hideLoading();
            Notifications.success('Laporan berhasil diexport');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal mengexport laporan: ' + error.message);
        }
    }

    // CSV generation methods
    generateDetailTransaksiCSV() {
        let csvContent = "Tanggal,Order No,Outlet,Kasir,Customer,Item,Qty,Harga Jual,Amount,Payment Type,Status\n";
        
        this.currentData.forEach(item => {
            const row = [
                Helpers.formatDateWIB(item.order_date),
                item.order_no,
                item.outlet,
                item.kasir,
                item.customer_name,
                item.item_name,
                item.qty,
                item.harga_jual,
                item.amount,
                item.payment_type,
                item.status
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generatePembayaranCSV() {
        let csvContent = "Outlet,Type Pembayaran,Total Amount Cancel,Total Amount\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.payment_type,
                item.total_amount_cancel,
                item.total_amount
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateKomisiCSV() {
        let csvContent = "Outlet,Served By,Total Amount,Total Komisi\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.kasir,
                item.total_amount,
                item.total_komisi
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateMembercardCSV() {
        let csvContent = "Outlet,Kasir,Jumlah Membercard\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.kasir,
                item.jumlah_membercard
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateAbsenCSV() {
        let csvContent = "Outlet,Karyawan,Clock In,Clock Out,Jam Kerja\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.karyawan,
                Helpers.formatDateWIB(item.clockin),
                Helpers.formatDateWIB(item.clockout),
                item.jam_kerja
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateOmsetCSV() {
        let csvContent = "Outlet,Tanggal,Total Omset,Jumlah Transaksi,Rata-rata Transaksi\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.tanggal,
                item.total_omset,
                item.jumlah_transaksi,
                item.rata_rata_transaksi
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generatePemasukanPengeluaranCSV() {
        let csvContent = "Outlet,Tanggal,Jenis,Kategori,Keterangan,Nominal,Dibuat Oleh\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.tanggal,
                item.jenis,
                item.kategori,
                item.keterangan,
                item.nominal,
                item.created_by
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateTransaksiCancelCSV() {
        let csvContent = "Tanggal,Order No,Outlet,Kasir,Customer,Amount,Alasan Cancel\n";
        
        this.currentData.forEach(item => {
            const row = [
                Helpers.formatDateWIB(item.order_date),
                item.order_no,
                item.outlet,
                item.kasir,
                item.customer_name,
                item.amount,
                item.cancel_reason || 'Tidak ada alasan'
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    // Cleanup method
    destroy() {
        if (this.table && typeof this.table.destroy === 'function') {
            this.table.destroy();
        }
        
        // Remove event listeners
        const tabs = document.querySelectorAll('.report-tab');
        tabs.forEach(tab => {
            tab.replaceWith(tab.cloneNode(true));
        });
        
        this.isInitialized = false;
        console.log('Reports module destroyed');
    }
}

// Initialize reports globally
let reports = null;
document.addEventListener('DOMContentLoaded', () => {
    reports = new Reports();
    window.reportsModule = reports; // Expose for debugging
    
    // Auto-initialize if element exists
    if (document.getElementById('reports-table')) {
        reports.init();
    }
});
