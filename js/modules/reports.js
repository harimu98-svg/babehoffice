// Reports Module dengan 8 Tab Laporan - FINAL VERSION WITH FOOTER
class Reports {
    constructor() {
        // Cek apakah instance sudah ada
        if (window.reportsInstance) {
            return window.reportsInstance;
        }
        
        this.currentData = [];
        this.currentTab = 'detail-transaksi';
        this.table = null;
        this.filters = {
            startDate: '',
            endDate: '',
            outlet: ''
        };
        this.isInitialized = false;
        this.tableInitialized = false;
        
        // Bind methods
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
        this.cleanup = this.cleanup.bind(this);
        this.setDefaultDateFilter = this.setDefaultDateFilter.bind(this);
        this.getFooterData = this.getFooterData.bind(this);

        window.reportsInstance = this;
    }

    // Initialize module
    async init() {
        console.log('Initializing Reports module, current state:', {
            initialized: this.isInitialized,
            tableInitialized: this.tableInitialized
        });

        try {
            // Reset UI state pertama kali
            if (!this.isInitialized) {
                this.setDefaultDateFilter();
                this.initTabs();
                this.initFilters();
                this.bindEvents();
                
                this.setActiveTabUI(this.currentTab);
                this.updateReportTitle();
                
                await this.loadData();
                this.isInitialized = true;
            } else {
                // Jika sudah initialized, cukup render ulang
                console.log('Reports module already initialized, re-rendering...');
                this.setActiveTabUI(this.currentTab);
                this.updateReportTitle();
                await this.loadData();
            }
            
            console.log('Reports module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Reports module:', error);
            Notifications.error('Gagal menginisialisasi modul laporan: ' + error.message);
        }
    }

    // ==================== FOOTER METHODS ====================

    getFooterData() {
    if (!this.currentData || this.currentData.length === 0) {
        return null;
    }

    const footerData = {};
    const columns = this.getTableColumns();
    
    columns.forEach((col, index) => {
        const key = col.key;
        
        if (key === 'outlet' || key === 'hari' || key === 'kasir' || key === 'serve_by') {
            // Kolom teks: kosong atau "TOTAL" untuk kolom pertama
            footerData[key] = index === 0 ? 'TOTAL' : '';
        } 
        else if (key === 'tanggal') {
            footerData[key] = '';
        }
        else if (col.type === 'currency' || this.isNumericColumn(key)) {
            // Kolom numerik: hitung total
            footerData[key] = this.currentData.reduce((sum, item) => {
                const value = parseFloat(item[key]) || 0;
                return sum + value;
            }, 0);
        } 
        else {
            footerData[key] = '';
        }
    });

    return footerData;
}

   // Tambah di constructor atau sebagai method
async getKaryawanRole(namaKaryawan) {
    if (!namaKaryawan || namaKaryawan === 'Unknown') return 'staff';
    
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('role')
            .eq('nama_karyawan', namaKaryawan)
            .single();
        
        if (error || !data) {
            console.warn(`Role not found for ${namaKaryawan}:`, error);
            return 'staff';
        }
        
        return data.role || 'staff';
    } catch (error) {
        console.error('Error getting karyawan role:', error);
        return 'staff';
    }
}

// Update isNumericColumn untuk kolom baru
isNumericColumn(key) {
    const numericColumns = [
        'qty', 'jumlah_membercard', 'jumlah_transaksi', 'point', 'redeem_qty',
        'discount_percent', 'total_amount', 'amount', 'harga_jual', 'harga_beli',
        'profit', 'comission', 'total_omset', 'total_modal', 'total_discount',
        'total_redeem', 'omset_bersih', 'net_profit', 'rata_rata_transaksi',
        'totalAmount', 'totalAmountCancel', 'total_komisi', 'total_uop',
        'omset_cash', 'top_up_kas', 'sisa_setoran', 'hutang_komisi', 
        'pemasukan_lain_lain', 'uop', 'tips_qris', 'bayar_hutang_komisi',
        'iuran_rt', 'sumbangan', 'iuran_sampah', 'galon', 'biaya_admin_setoran',
        'yakult', 'pengeluaran_lain_lain', 'pemasukan', 'pengeluaran', 'saldo',
        // Tambah kolom komisi baru
        'total_amount', 'uop', 'total_komisi', 'tips_qris', 'jumlah_transaksi'
    ];
    
    return numericColumns.includes(key);
}
    // Set default date filter (hari ini)
    setDefaultDateFilter() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        this.filters.startDate = todayString;
        this.filters.endDate = todayString;
        
        console.log('Default date filter set to today:', todayString);
    }

    // Initialize tabs
    initTabs() {
        // Hapus event listeners lama jika ada
        const oldTabs = document.querySelectorAll('.report-tab');
        oldTabs.forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });

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
            'order-transaksi': 'Laporan Order Transaksi',
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

    // Switch between tabs
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
        
        // Set filter values in DOM
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
                case 'order-transaksi':
                    data = await this.loadOrderTransaksi();
                    break;
                default:
                    console.warn('Unknown tab, loading detail transaksi');
                    data = await this.loadDetailTransaksi();
            }

            this.currentData = Array.isArray(data) ? data : [];
            console.log('Data loaded:', this.currentData.length, 'records');
            
            // Initialize or update table
            if (!this.table || !this.tableInitialized) {
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
            
            // Tetap initialize table dengan data kosong
            if (!this.table || !this.tableInitialized) {
                this.initTable();
            }
            
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
            .from('transaksi_order')
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
            const kasir = item.kasir || 'Unknown';
            const tanggal = item.order_date ? item.order_date.split('T')[0] : 'Unknown';
            const amount = parseFloat(item.total_amount) || 0;
            const isCancel = item.status === 'canceled' || item.status === 'cancelled';
            
            const key = `${outlet}-${paymentType}-${kasir}-${tanggal}`;
            
            if (!result[key]) {
                result[key] = {
                    outlet: outlet,
                    payment_type: paymentType,
                    kasir: kasir,
                    tanggal: tanggal,
                    totalAmount: 0,
                    totalAmountCancel: 0
                };
            }
            
            if (isCancel) {
                result[key].totalAmountCancel += amount;
            } else {
                result[key].totalAmount += amount;
            }
        });
        
        return Object.values(result);
    }

    async loadLaporanKomisi() {
    console.log('Loading laporan komisi dari tabel komisi');
    
    try {
        // 1. Ambil data dari tabel komisi dulu
        let query = supabase
            .from('komisi')
            .select('*')
            .order('tanggal', { ascending: false });

        // Apply filters
        if (this.filters.startDate) {
            query = query.gte('tanggal', this.filters.startDate);
        }
        if (this.filters.endDate) {
            query = query.lte('tanggal', this.filters.endDate);
        }
        if (this.filters.outlet) {
            query = query.eq('outlet', this.filters.outlet);
        }

        const { data: komisiData, error } = await query;
        if (error) {
            console.error('Error loading komisi data:', error);
            throw error;
        }
        
        console.log('Data komisi ditemukan:', komisiData?.length || 0, 'records');
        
        if (!komisiData || komisiData.length === 0) {
            return [];
        }
        
        // 2. Ambil semua serve_by unik untuk ambil role dari karyawan
        const serveByNames = [...new Set(
            komisiData
                .map(item => item.serve_by)
                .filter(name => name && name !== 'Unknown')
        )];
        
        console.log('Unique serve_by names:', serveByNames);
        
        // 3. Query role dari tabel karyawan
        let roleMap = {};
        if (serveByNames.length > 0) {
            const { data: karyawanData, error: karyawanError } = await supabase
                .from('karyawan')
                .select('nama_karyawan, role')
                .in('nama_karyawan', serveByNames);
            
            if (karyawanError) {
                console.error('Error fetching karyawan roles:', karyawanError);
            } else if (karyawanData) {
                // Buat mapping nama_karyawan -> role
                karyawanData.forEach(k => {
                    if (k.nama_karyawan) {
                        roleMap[k.nama_karyawan] = k.role || 'staff';
                    }
                });
                console.log('Role mapping created:', roleMap);
            }
        }
        
        // 4. Process data komisi dengan role
        return this.processKomisiWithRole(komisiData, roleMap);
        
    } catch (error) {
        console.error('Error load laporan komisi:', error);
        throw error;
    }
}

processKomisiWithRole(komisiData, roleMap) {
    console.log('Processing komisi data with role mapping');
    
    const result = [];
    
    for (const item of komisiData) {
        const tanggal = item.tanggal || 'Unknown';
        let hari = 'Unknown';
        
        try {
            if (tanggal !== 'Unknown') {
                const dateObj = new Date(tanggal);
                if (!isNaN(dateObj.getTime())) {
                    hari = this.getDayName(dateObj.getDay());
                }
            }
        } catch (e) {
            console.warn('Error parsing date:', tanggal, e);
        }
        
        // Ambil role dari mapping atau default 'staff'
        const serveByName = item.serve_by || 'Unknown';
        const role = roleMap[serveByName] || 'staff';
        
        console.log(`Processing ${serveByName}: role=${role}, uop=${item.uop}, alasan=${item.alasan_nouop}`);
        
        // Atur UOP berdasarkan role
        let uopValue = item.uop || 0;
        
        if (role === 'kasir' || role === 'cashier') {
            // Kasir: UOP = 0
            uopValue = 0;
        } else if (role === 'barberman' || role === 'therapist') {
            // Barberman/Therapist: UOP = komisi.uop (ambil dari database)
            uopValue = item.uop || 0;
        } else {
            // Staff lain: UOP = 0 atau sesuai database
            uopValue = 0;
        }
        
        result.push({
            outlet: item.outlet || 'Unknown',
            tanggal: tanggal,
            hari: hari,
            kasir: item.kasir || 'Unknown',
            serve_by: serveByName,
            total_amount: item.total_transaksi || 0,
            uop: uopValue,
            total_komisi: item.komisi || 0,
            tips_qris: item.tips_qris || 0,
            jumlah_transaksi: item.jumlah_transaksi || 0,
            role: role,
            alasan_nouop: item.alasan_nouop || '', // SIMPAN alasan_nouop untuk ditampilkan
            original_uop: item.uop || 0 // Simpan original untuk debug
        });
    }
    
    console.log('Processed komisi data:', result);
    return result;
}
// Helper untuk nama hari
getDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex] || 'Unknown';
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
        const groupedData = {};
        
        data.forEach(item => {
            const tanggal = this.extractDateFromTimestamp(item.created_at);
            const outlet = item.outlet || 'Unknown';
            const kasir = item.kasir_create || item.kasir || item.created_by || 'Unknown';
            
            const key = `${tanggal}-${outlet}-${kasir}`;
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    tanggal: tanggal,
                    outlet: outlet,
                    kasir: kasir,
                    jumlah_membercard: 0
                };
            }
            
            groupedData[key].jumlah_membercard += 1;
        });
        
        return Object.values(groupedData);
    }

    extractDateFromTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        if (timestamp.includes('T')) {
            return timestamp.split('T')[0];
        } else if (timestamp.includes(' ')) {
            return timestamp.split(' ')[0];
        } else {
            return timestamp;
        }
    }

    async loadLaporanAbsen() {
        console.log('Loading laporan absen');
        
        try {
            let query = supabase
                .from('absen')
                .select('*')
                .order('tanggal', { ascending: false });

            if (this.filters.startDate) {
                const [year, month, day] = this.filters.startDate.split('-');
                const startDateAbsenFormat = `${day}/${month}/${year}`;
                query = query.gte('tanggal', startDateAbsenFormat);
            }
            if (this.filters.endDate) {
                const [year, month, day] = this.filters.endDate.split('-');
                const endDateAbsenFormat = `${day}/${month}/${year}`;
                query = query.lte('tanggal', endDateAbsenFormat);
            }
            if (this.filters.outlet) {
                query = query.eq('outlet', this.filters.outlet);
            }

            const { data, error } = await query;
            if (error) throw error;

            console.log('📊 Data absen ditemukan:', data.length, 'records');
            return this.processAbsenData(data || []);
        } catch (error) {
            console.error('Error load absen:', error);
            return this.generateFallbackAbsenData();
        }
    }

    processAbsenData(data) {
        return data.map(item => {
            let tanggal = 'Unknown';
            if (item.tanggal) {
                const parts = item.tanggal.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    tanggal = `${year}-${month}-${day}`;
                }
            }
            
            const karyawan = item.nama || 'Unknown';
            const jadwalMasuk = '09:00';
            const jadwalPulang = '21:00';
            
            // FORMAT BARU: Clock In dan Clock Out hanya jam:menit
            let clockinTime = item.clockin || '';
            let clockinDisplay = '';
            if (clockinTime) {
                // Format jam:menit saja
                if (clockinTime.includes(':')) {
                    const timeParts = clockinTime.split(':');
                    if (timeParts.length >= 2) {
                        clockinDisplay = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                    }
                } else if (clockinTime.length >= 4) {
                    // Format HHMM
                    clockinDisplay = `${clockinTime.substring(0, 2)}:${clockinTime.substring(2, 4)}`;
                }
            }
            
            let clockoutTime = item.clockout || '';
            let clockoutDisplay = '';
            if (clockoutTime) {
                // Format jam:menit saja
                if (clockoutTime.includes(':')) {
                    const timeParts = clockoutTime.split(':');
                    if (timeParts.length >= 2) {
                        clockoutDisplay = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
                    }
                } else if (clockoutTime.length >= 4) {
                    // Format HHMM
                    clockoutDisplay = `${clockoutTime.substring(0, 2)}:${clockoutTime.substring(2, 4)}`;
                }
            }
            
            let jamKerja = 'Masih bekerja';
            if (clockinTime && clockoutTime) {
                try {
                    // Buat tanggal lengkap untuk perhitungan
                    const clockinFull = `${tanggal}T${clockinDisplay}:00`;
                    const clockoutFull = `${tanggal}T${clockoutDisplay}:00`;
                    
                    const clockin = new Date(clockinFull);
                    const clockout = new Date(clockoutFull);
                    
                    if (!isNaN(clockin.getTime()) && !isNaN(clockout.getTime())) {
                        const diffMs = clockout - clockin;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        jamKerja = `${diffHours} jam ${diffMinutes} menit`;
                    }
                } catch (e) {
                    console.warn('Error hitung jam kerja:', e);
                    jamKerja = 'Error hitung';
                }
            }
            
            let keterangan = '';
            
            if (clockinDisplay) {
                const [clockinHours, clockinMinutes] = clockinDisplay.split(':').map(Number);
                const [jadwalMasukHours, jadwalMasukMinutes] = jadwalMasuk.split(':').map(Number);
                
                if (clockinHours > jadwalMasukHours || 
                    (clockinHours === jadwalMasukHours && clockinMinutes > jadwalMasukMinutes)) {
                    const telatMenit = (clockinHours - jadwalMasukHours) * 60 + (clockinMinutes - jadwalMasukMinutes);
                    keterangan = `Terlambat ${telatMenit} menit`;
                }
            }
            
            if (clockoutDisplay && keterangan === '') {
                const [clockoutHours, clockoutMinutes] = clockoutDisplay.split(':').map(Number);
                const [jadwalPulangHours, jadwalPulangMinutes] = jadwalPulang.split(':').map(Number);
                
                if (clockoutHours < jadwalPulangHours || 
                    (clockoutHours === jadwalPulangHours && clockoutMinutes < jadwalPulangMinutes)) {
                    const cepatMenit = (jadwalPulangHours - clockoutHours) * 60 + (jadwalPulangMinutes - clockoutMinutes);
                    keterangan = `Pulang Cepat ${cepatMenit} menit`;
                }
            }
            
            if (keterangan === '' && clockinDisplay) {
                keterangan = 'Tepat waktu';
            }
            
            return {
                outlet: item.outlet || 'Unknown',
                karyawan: karyawan,
                tanggal: tanggal,
                jadwal_masuk: jadwalMasuk,
                jadwal_pulang: jadwalPulang,
                clockin: clockinDisplay, // Hanya jam:menit
                clockout: clockoutDisplay, // Hanya jam:menit
                jam_kerja: jamKerja,
                keterangan: keterangan
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
            const clockin = `${clockinHour.toString().padStart(2, '0')}:${clockinMinute.toString().padStart(2, '0')}`;
            
            const clockoutHour = 16 + Math.floor(Math.random() * 4);
            const clockoutMinute = Math.floor(Math.random() * 60);
            const clockout = `${clockoutHour.toString().padStart(2, '0')}:${clockoutMinute.toString().padStart(2, '0')}`;
            
            const diffHours = clockoutHour - clockinHour;
            const diffMinutes = clockoutMinute - clockinMinute;
            const jamKerja = `${diffHours} jam ${Math.abs(diffMinutes)} menit`;
            
            let keterangan = '';
            if (clockinHour > 8 || (clockinHour === 8 && clockinMinute > 0)) {
                const telatMenit = (clockinHour - 8) * 60 + clockinMinute;
                keterangan = `Terlambat ${telatMenit} menit`;
            } else {
                keterangan = 'Tepat waktu';
            }
            
            data.push({
                outlet: outlet,
                karyawan: karyawan,
                tanggal: date.toISOString().split('T')[0],
                jadwal_masuk: '08:00',
                jadwal_pulang: '17:00',
                clockin: clockin,
                clockout: clockout,
                jam_kerja: jamKerja,
                keterangan: keterangan
            });
        }
        
        return data;
    }

    async loadLaporanOmset() {
        console.log('Loading laporan omset dari transaksi_order');
        
        let query = supabase
            .from('transaksi_order')
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
        const isCompleted = item.status === 'completed';
        
        if (!isCompleted) return;
        
        const key = `${outlet}-${orderDate}`;
        
        if (!result[key]) {
            result[key] = {
                outlet: outlet,
                tanggal: orderDate,
                total_omset: 0,
                total_modal: 0,
                total_discount: 0,
                total_redeem: 0,
                total_komisi: 0,
                jumlah_transaksi: 0
            };
        }
        
        const subtotal = parseFloat(item.subtotal_amount) || 0;
        const modal = parseFloat(item.harga_beli) || 0;
        const discount = parseFloat(item.discount_amount) || 0;
        const redeem = parseFloat(item.redeem_amount) || 0;
        const komisi = parseFloat(item.comission) || 0;
        
        result[key].total_omset += subtotal;
        result[key].total_modal += modal;
        result[key].total_discount += discount;
        result[key].total_redeem += redeem;
        result[key].total_komisi += komisi;
        result[key].jumlah_transaksi += 1;
    });
    
    // PERBAIKAN FORMULA DAN URUTAN
    const tableData = Object.values(result).map(item => {
        // Formula baru
        const omset_kotor = item.total_omset - item.total_discount - item.total_redeem;
        const omset_bersih = omset_kotor - item.total_modal;
        const net_profit = omset_bersih - item.total_komisi;
        const rata_transaksi = item.jumlah_transaksi > 0 ? item.total_omset / item.jumlah_transaksi : 0;
        
        return {
            outlet: item.outlet,
            tanggal: item.tanggal,
            total_omset: item.total_omset,
            total_discount: item.total_discount,
            total_redeem: item.total_redeem,
            omset_kotor: omset_kotor,           // TAMBAH KOLOM BARU
            total_modal: item.total_modal,
            omset_bersih: omset_bersih,
            total_komisi: item.total_komisi,
            net_profit: net_profit,
            jumlah_transaksi: item.jumlah_transaksi,
            rata_rata_transaksi: rata_transaksi
        };
    });
    
    return tableData;
}


    async loadLaporanPemasukanPengeluaran() {
        console.log('Loading laporan pemasukan pengeluaran');
        
        try {
            let query = supabase
                .from('kas')
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
            console.warn('Kas table not found, using fallback data');
            return this.generateFallbackPemasukanPengeluaranData();
        }
    }

    generateFallbackPemasukanPengeluaranData() {
        const outlets = ['Rempoa', 'Ciputat', 'Pondok Cabe'];
        const kasirs = ['Devi Siska Sari', 'Hari Suryono', 'Echwan Abdillah'];
        
        const data = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            const outlet = outlets[Math.floor(Math.random() * outlets.length)];
            const kasir = kasirs[Math.floor(Math.random() * kasirs.length)];
            
            data.push({
                tanggal: date.toISOString().split('T')[0],
                outlet: outlet,
                kasir: kasir,
                omset_cash: Math.floor(Math.random() * 1000000) + 500000,
                top_up_kas: Math.floor(Math.random() * 100000) + 50000,
                sisa_setoran: Math.floor(Math.random() * 200000),
                hutang_komisi: Math.floor(Math.random() * 300000),
                pemasukan_lain_lain: Math.floor(Math.random() * 50000),
                note_pemasukan_lain: 'Pemasukan lain-lain',
                komisi: Math.floor(Math.random() * 400000),
                uop: Math.floor(Math.random() * 100000),
                tips_qris: Math.floor(Math.random() * 50000),
                pengeluaran_lain_lain: Math.floor(Math.random() * 100000),
                note_pengeluaran_lain: 'Pengeluaran lain-lain',
                bayar_hutang_komisi: Math.floor(Math.random() * 200000),
                iuran_rt: Math.floor(Math.random() * 50000),
                sumbangan: Math.floor(Math.random() * 100000),
                iuran_sampah: Math.floor(Math.random() * 20000),
                galon: Math.floor(Math.random() * 15000),
                biaya_admin_setoran: Math.floor(Math.random() * 25000),
                yakult: Math.floor(Math.random() * 10000),
                pemasukan: Math.floor(Math.random() * 1500000) + 500000,
                pengeluaran: Math.floor(Math.random() * 800000) + 200000,
                saldo: Math.floor(Math.random() * 2000000) + 1000000
            });
        }
        
        return data;
    }

    async loadOrderTransaksi() {
        console.log('Loading laporan order transaksi');
        
        let query = supabase
            .from('transaksi_order')
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

        return this.processOrderTransaksiData(data || []);
    }

    processOrderTransaksiData(data) {
        return data.map(item => {
            return {
                outlet: item.outlet || 'Unknown',
                order_no: item.order_no || '',
                order_date: item.order_date ? item.order_date.split(' ')[0] : 'Unknown',
                order_time: item.order_time || 'Unknown',
                serve_by: item.serve_by || '',
                kasir: item.kasir || '',
                customer_id: item.customer_id || '',
                customer_name: item.customer_name || 'Umum',
                harga_beli: parseFloat(item.harga_beli) || 0,
                harga_jual: parseFloat(item.harga_jual) || 0,
                discount_percent: parseFloat(item.discount_percent) || 0,
                discount_amount: parseFloat(item.discount_amount) || 0,
                redeem_qty: parseInt(item.redeem_qty) || 0,
                subtotal_amount: parseFloat(item.subtotal_amount) || 0,
                profit: parseFloat(item.profit) || 0,
                comission: parseFloat(item.comission) || 0,
                payment_type: item.payment_type || 'cash',
                status: item.status || '',
                point: parseInt(item.point) || 0,
                redeem_amount: parseFloat(item.redeem_amount) || 0,
                total_amount: parseFloat(item.total_amount) || 0,
                cash_change: parseFloat(item.cash_change) || 0,
                cash_received: parseFloat(item.cash_received) || 0,
                ipaymu_reference_id: item.ipaymu_reference_id || ''
            };
        });
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
            setTimeout(() => this.initTable(), 100);
            return;
        }

        tableContainer.innerHTML = '';

        const columns = this.getTableColumns();
        const footerData = this.getFooterData();
        
        if (this.table && typeof this.table.destroy === 'function') {
            this.table.destroy();
        }
        
        this.table = new DataTable('reports-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 15,
            footerData: footerData
        });

        this.table.init();
        this.table.updateData(this.currentData);
        this.tableInitialized = true;
        
        console.log('Table initialized successfully with footer');
    }

    updateTableForCurrentTab() {
        console.log('Updating table for tab:', this.currentTab);
        
        if (this.table && this.tableInitialized) {
            const columns = this.getTableColumns();
            const footerData = this.getFooterData();
            
            this.table.options.columns = columns;
            this.table.options.footerData = footerData;
            this.table.updateData(this.currentData);
            console.log('Table updated with new data and footer');
        } else {
            this.initTable();
        }
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
            'order-transaksi': this.getOrderTransaksiColumns(),
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
            { title: 'Served By', key: 'serve_by' },
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
            { 
                title: 'Tanggal', 
                key: 'tanggal',
                type: 'date'
            },
            { title: 'Outlet', key: 'outlet' },
            { title: 'Kasir', key: 'kasir' },
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
                key: 'totalAmountCancel',
                type: 'currency'
            },
            { 
                title: 'Total Amount', 
                key: 'totalAmount',
                type: 'currency'
            }
        ];
    }

    getKomisiColumns() {
    return [
        { 
            title: '🏪 Outlet', 
            key: 'outlet'
        },
        { 
            title: '📅 Tanggal', 
            key: 'tanggal',
            type: 'date',
            formatter: (value) => {
                if (!value || value === 'Unknown') return '-';
                return value;
            }
        },
        { 
            title: '📆 Hari', 
            key: 'hari'
        },
        { 
            title: '💵 Kasir', 
            key: 'kasir'
        },
        { 
            title: '👤 Served By', 
            key: 'serve_by',
            formatter: (value, row) => {
                // PERBAIKAN: Gunakan optional chaining dan default value
                const role = row?.role || 'staff';
                const roleColors = {
                    'kasir': 'bg-green-100 text-green-800 border border-green-200',
                    'barberman': 'bg-blue-100 text-blue-800 border border-blue-200',
                    'therapist': 'bg-purple-100 text-purple-800 border border-purple-200',
                    'owner': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                    'staff': 'bg-gray-100 text-gray-800 border border-gray-200'
                };
                
                const color = roleColors[role] || roleColors['staff'];
                const roleText = role.charAt(0).toUpperCase() + role.slice(1);
                
                return `
                    <div class="flex flex-col space-y-1">
                        <span class="font-medium">${value || '-'}</span>
                        <span class="inline-block px-2 py-1 text-xs rounded ${color}">
                            ${roleText}
                        </span>
                    </div>
                `;
            }
        },
        { 
            title: '💰 Total Amount', 
            key: 'total_amount',
            type: 'currency',
            formatter: (value) => {
                return Helpers.formatCurrency(value || 0);
            }
        },
        { 
            title: '💸 UOP', 
            key: 'uop',
            type: 'currency',
            formatter: (value, row) => {
                // PERBAIKAN: Gunakan optional chaining
                const role = row?.role || 'staff';
                const alasan_nouop = row?.alasan_nouop || '';
                
                if (role === 'kasir') {
                    return `
                        <div class="flex flex-col space-y-1">
                            <span class="text-gray-500 italic">-</span>
                            <span class="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 rounded">
                                UOP Dibayarkan Bulanan
                            </span>
                        </div>
                    `;
                }
                
                if (!value || value === 0) {
                    if (role === 'barberman' || role === 'therapist') {
                        // Untuk barberman yang UOP = 0, tampilkan alasan dari komisi.alasan_nouop
                        return `
                            <div class="flex flex-col space-y-1">
                                <span class="text-orange-500">-</span>
                                ${alasan_nouop ? `
                                    <span class="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 border border-orange-200 rounded">
                                        ${alasan_nouop}
                                    </span>
                                ` : ''}
                            </div>
                        `;
                    }
                    return `<span class="text-gray-500">-</span>`;
                }
                
                // Jika ada UOP nilai
                if (role === 'barberman' || role === 'therapist') {
                    return `
                        <div class="flex flex-col space-y-1">
                            <span class="text-blue-600 font-bold">${Helpers.formatCurrency(value)}</span>
                            ${alasan_nouop ? `
                                <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 border border-gray-200 rounded">
                                    ${alasan_nouop}
                                </span>
                            ` : ''}
                        </div>
                    `;
                }
                
                return Helpers.formatCurrency(value);
            }
        },
        { 
            title: '📈 Total Komisi', 
            key: 'total_komisi',
            type: 'currency',
            formatter: (value) => {
                if (!value || value === 0) {
                    return '<span class="text-gray-500">-</span>';
                }
                return `<span class="text-green-600 font-semibold">${Helpers.formatCurrency(value)}</span>`;
            }
        },
        { 
            title: '💳 Tips QRIS', 
            key: 'tips_qris',
            type: 'currency',
            formatter: (value) => {
                if (!value || value === 0) {
                    return '<span class="text-gray-500">-</span>';
                }
                return `<span class="text-purple-600">${Helpers.formatCurrency(value)}</span>`;
            }
        },
        { 
            title: '🛒 Jml Trans', 
            key: 'jumlah_transaksi',
            formatter: (value) => {
                return `<span class="font-medium">${value || 0}</span>`;
            }
        }
    ];
}
    getMembercardColumns() {
        return [
            { 
                title: 'Tanggal', 
                key: 'tanggal',
                formatter: (value) => {
                    if (!value || value === 'Unknown') return '-';
                    if (value.includes('T') || value.includes(' ')) {
                        const datePart = value.split('T')[0] || value.split(' ')[0];
                        return datePart;
                    }
                    return value;
                }
            },
            { title: 'Outlet', key: 'outlet' },
            { title: 'Kasir', key: 'kasir' },
            { title: 'Jumlah Membercard', key: 'jumlah_membercard' }
        ];
    }

    getAbsenColumns() {
        return [
            { 
                title: 'Tanggal', 
                key: 'tanggal',
                type: 'date'
            },
            { title: 'Outlet', key: 'outlet' },
            { title: 'Karyawan', key: 'karyawan' },
            { title: 'Jadwal Masuk', key: 'jadwal_masuk' },
            { title: 'Jadwal Pulang', key: 'jadwal_pulang' },
            { 
                title: 'Clock In', 
                key: 'clockin',
                formatter: (value) => value || '-'
            },
            { 
                title: 'Clock Out', 
                key: 'clockout',
                formatter: (value) => value || '-'
            },
            { title: 'Jam Kerja', key: 'jam_kerja' },
            { title: 'Keterangan', key: 'keterangan' }
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
        { 
            title: 'Discount', 
            key: 'total_discount',
            type: 'currency'
        },
        { 
            title: 'Redeem', 
            key: 'total_redeem',
            type: 'currency'
        },
        { 
            title: 'Omset Kotor', 
            key: 'omset_kotor',
            type: 'currency'
        },
        { 
            title: 'Modal', 
            key: 'total_modal',
            type: 'currency'
        },
        { 
            title: 'Omset Bersih', 
            key: 'omset_bersih',
            type: 'currency'
        },
        { 
            title: 'Komisi', 
            key: 'total_komisi',
            type: 'currency'
        },
        { 
            title: 'Net Profit', 
            key: 'net_profit',
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
            { title: '📅 Tanggal', key: 'tanggal', type: 'date' },
            { title: '🏪 Outlet', key: 'outlet' },
            { title: '👤 Kasir', key: 'kasir' },
            { title: '💵 Omset Cash', key: 'omset_cash', type: 'currency' },
            { title: '💰 Top Up Kas', key: 'top_up_kas', type: 'currency' },
            { title: '🔄 Sisa Setoran', key: 'sisa_setoran', type: 'currency' },
            { title: '🏦 Hutang Komisi', key: 'hutang_komisi', type: 'currency' },
            { title: '📥 Pemasukan Lain', key: 'pemasukan_lain_lain', type: 'currency' },
            { title: '📝 Note Pemasukan', key: 'note_pemasukan_lain' },
            { title: '💸 Komisi', key: 'komisi', type: 'currency' },
            { title: '👥 UOP', key: 'uop', type: 'currency' },
            { title: '💳 Tips QRIS', key: 'tips_qris', type: 'currency' },
            { title: '💳 Bayar Hutang', key: 'bayar_hutang_komisi', type: 'currency' },
            { title: '🏘️ Iuran RT', key: 'iuran_rt', type: 'currency' },
            { title: '🎁 Sumbangan', key: 'sumbangan', type: 'currency' },
            { title: '🗑️ Iuran Sampah', key: 'iuran_sampah', type: 'currency' },
            { title: '💧 Galon', key: 'galon', type: 'currency' },
            { title: '🏦 Biaya Admin', key: 'biaya_admin_setoran', type: 'currency' },
            { title: '🥤 Yakult', key: 'yakult', type: 'currency' },
            { title: '📤 Pengeluaran Lain', key: 'pengeluaran_lain_lain', type: 'currency' },
            { title: '📝 Note Pengeluaran', key: 'note_pengeluaran_lain' },
            { title: '✅ Total Pemasukan', key: 'pemasukan', type: 'currency' },
            { title: '❌ Total Pengeluaran', key: 'pengeluaran', type: 'currency' },
            { title: '💰 Saldo', key: 'saldo', type: 'currency' }
        ];
    }

    getOrderTransaksiColumns() {
        return [
            { title: 'Outlet', key: 'outlet' },
            { title: 'Order No', key: 'order_no' },
            { 
                title: 'Tanggal', 
                key: 'order_date',
                type: 'date'
            },
            { title: 'Waktu', key: 'order_time' },
            { title: 'Serve By', key: 'serve_by' },
            { title: 'Kasir', key: 'kasir' },
            { title: 'Customer ID', key: 'customer_id' },
            { title: 'Customer Name', key: 'customer_name' },
            { 
                title: 'Harga Beli', 
                key: 'harga_beli',
                type: 'currency'
            },
            { 
                title: 'Harga Jual', 
                key: 'harga_jual',
                type: 'currency'
            },
            { 
                title: 'Discount %', 
                key: 'discount_percent',
                formatter: (value) => `${value}%`
            },
            { 
                title: 'Discount Amount', 
                key: 'discount_amount',
                type: 'currency'
            },
            { title: 'Redeem Qty', key: 'redeem_qty' },
            { 
                title: 'Subtotal', 
                key: 'subtotal_amount',
                type: 'currency'
            },
            { 
                title: 'Profit', 
                key: 'profit',
                type: 'currency'
            },
            { 
                title: 'Komisi', 
                key: 'comission',
                type: 'currency'
            },
            { 
                title: 'Payment Type', 
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
                    const statusMap = {
                        'completed': 'Selesai',
                        'pending': 'Pending',
                        'canceled': 'Cancel',
                        'cancelled': 'Cancel'
                    };
                    const statusText = statusMap[value] || value;
                    const bgColor = value === 'completed' ? 'bg-green-100 text-green-800' : 
                                   value === 'canceled' || value === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                   'bg-yellow-100 text-yellow-800';
                    
                    return `
                        <span class="px-2 py-1 text-xs rounded-full ${bgColor}">
                            ${statusText}
                        </span>
                    `;
                }
            },
            { title: 'Point', key: 'point' },
            { 
                title: 'Redeem Amount', 
                key: 'redeem_amount',
                type: 'currency'
            },
            { 
                title: 'Total Amount', 
                key: 'total_amount',
                type: 'currency'
            },
            { 
                title: 'Cash Received', 
                key: 'cash_received',
                type: 'currency'
            },
            { 
                title: 'Cash Change', 
                key: 'cash_change',
                type: 'currency'
            },
            { title: 'iPaymu Reference', key: 'ipaymu_reference_id' }
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
        
        const oldFilterBtn = document.getElementById('apply-filters');
        const oldExportBtn = document.getElementById('export-report');
        
        if (oldFilterBtn) {
            const newFilterBtn = oldFilterBtn.cloneNode(true);
            oldFilterBtn.parentNode.replaceChild(newFilterBtn, oldFilterBtn);
        }
        
        if (oldExportBtn) {
            const newExportBtn = oldExportBtn.cloneNode(true);
            oldExportBtn.parentNode.replaceChild(newExportBtn, oldExportBtn);
        }

        const filterBtn = document.getElementById('apply-filters');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.applyFilters());
        } else {
            console.warn('Filter button not found');
        }
        
        const exportBtn = document.getElementById('export-report');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        } else {
            console.warn('Export button not found');
        }

        const filterInputs = document.querySelectorAll('#start-date, #end-date, #outlet-filter');
        filterInputs.forEach(input => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('keypress', (e) => {
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
                totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
                totalTransactions = this.currentData.length;
                totalItems = this.currentData.reduce((sum, item) => sum + (parseFloat(item.totalAmountCancel) || 0), 0);
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
                const pemasukan = this.currentData.reduce((sum, item) => sum + (parseFloat(item.pemasukan) || 0), 0);
                const pengeluaran = this.currentData.reduce((sum, item) => sum + (parseFloat(item.pengeluaran) || 0), 0);
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
            case 'order-transaksi':
                totalSales = this.currentData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
                totalTransactions = this.currentData.length;
                totalItems = this.currentData.reduce((sum, item) => sum + (parseInt(item.redeem_qty) || 0), 0);
                totalProfit = this.currentData.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);
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
                'order-transaksi': () => {
                    csvContent = this.generateOrderTransaksiCSV();
                    filename = `laporan-order-transaksi-${new Date().toISOString().split('T')[0]}.csv`;
                },
                'transaksi-cancel': () => {
                    csvContent = this.generateTransaksiCancelCSV();
                    filename = `laporan-transaksi-cancel-${new Date().toISOString().split('T')[0]}.csv`;
                }
            };

            const exportMethod = exportMethods[this.currentTab] || exportMethods['detail-transaksi'];
            exportMethod();

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

    // CSV generation methods (tetap sama seperti sebelumnya)
    generateDetailTransaksiCSV() {
        let csvContent = "Tanggal,Order No,Outlet,Kasir,Served By,Customer,Item,Qty,Harga Jual,Amount,Payment Type,Status\n";
        
        this.currentData.forEach(item => {
            const row = [
                Helpers.formatDateWIB(item.order_date),
                item.order_no,
                item.outlet,
                item.kasir,
                item.serve_by,
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
        let csvContent = "Tanggal,Outlet,Kasir,Type Pembayaran,Total Amount Cancel,Total Amount\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.tanggal,
                item.outlet,
                item.kasir,
                item.payment_type,
                item.totalAmountCancel,
                item.totalAmount
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

generateKomisiCSV() {
    let csvContent = "Outlet,Tanggal,Hari,Kasir,Served By,Role,Total Amount,UOP,Alasan UOP,Total Komisi,Tips QRIS,Jumlah Transaksi\n";
    
    this.currentData.forEach(item => {
        // Tentukan teks alasan untuk CSV
        let alasanText = '';
        if (item.role === 'kasir') {
            alasanText = 'UOP Dibayarkan Bulanan';
        } else if (item.alasan_nouop) {
            alasanText = item.alasan_nouop;
        } else if (!item.uop || item.uop === 0) {
            alasanText = 'Tidak ada UOP';
        }
        
        const row = [
            item.outlet,
            item.tanggal,
            item.hari,
            item.kasir,
            item.serve_by,
            item.role || 'staff',
            item.total_amount,
            item.uop,
            alasanText,
            item.total_komisi,
            item.tips_qris,
            item.jumlah_transaksi
        ].map(field => `"${field}"`).join(',');
        
        csvContent += row + '\n';
    });

    return csvContent;
}
    generateMembercardCSV() {
        let csvContent = "Tanggal,Outlet,Kasir,Jumlah Membercard\n";
        
        this.currentData.forEach(item => {
            const tanggal = this.formatDateForCSV(item.tanggal);
            const outlet = item.outlet || 'Unknown';
            const kasir = item.kasir || 'Unknown';
            const jumlah = item.jumlah_membercard || 0;
            
            const row = [
                tanggal,
                outlet,
                kasir,
                jumlah
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    formatDateForCSV(dateString) {
        if (!dateString || dateString === 'Unknown') return 'Unknown';
        
        if (dateString.includes('T')) {
            return dateString.split('T')[0];
        } else if (dateString.includes(' ')) {
            return dateString.split(' ')[0];
        } else {
            return dateString;
        }
    }

    generateAbsenCSV() {
        let csvContent = "Tanggal,Outlet,Karyawan,Jadwal Masuk,Jadwal Pulang,Clock In,Clock Out,Jam Kerja,Keterangan\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.tanggal,
                item.outlet,
                item.karyawan,
                item.jadwal_masuk,
                item.jadwal_pulang,
                item.clockin || '-',
                item.clockout || '-',
                item.jam_kerja,
                item.keterangan
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateOmsetCSV() {
    // PERBAIKAN URUTAN KOLOM CSV
    let csvContent = "Outlet,Tanggal,Total Omset,Discount,Redeem,Omset Kotor,Modal,Omset Bersih,Komisi,Net Profit,Jumlah Transaksi,Rata-rata Transaksi\n";
    
    this.currentData.forEach(item => {
        const row = [
            item.outlet,
            item.tanggal,
            item.total_omset,
            item.total_discount,
            item.total_redeem,
            item.omset_kotor,           // TAMBAH KOLOM BARU
            item.total_modal,
            item.omset_bersih,
            item.total_komisi,
            item.net_profit,
            item.jumlah_transaksi,
            item.rata_rata_transaksi
        ].map(field => `"${field}"`).join(',');
        
        csvContent += row + '\n';
    });

    return csvContent;
}


    generatePemasukanPengeluaranCSV() {
        let csvContent = "Tanggal,Outlet,Kasir,Omset Cash,Top Up Kas,Sisa Setoran,Hutang Komisi,Pemasukan Lain,Note Pemasukan,Komisi,UOP,Tips QRIS,Bayar Hutang Komisi,Iuran RT,Sumbangan,Iuran Sampah,Galon,Biaya Admin Setoran,Yakult,Pengeluaran Lain,Note Pengeluaran,Total Pemasukan,Total Pengeluaran,Saldo\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.tanggal,
                item.outlet,
                item.kasir,
                item.omset_cash,
                item.top_up_kas,
                item.sisa_setoran,
                item.hutang_komisi,
                item.pemasukan_lain_lain,
                item.note_pemasukan_lain,
                item.komisi,
                item.uop,
                item.tips_qris,
                item.bayar_hutang_komisi,
                item.iuran_rt,
                item.sumbangan,
                item.iuran_sampah,
                item.galon,
                item.biaya_admin_setoran,
                item.yakult,
                item.pengeluaran_lain_lain,
                item.note_pengeluaran_lain,
                item.pemasukan,
                item.pengeluaran,
                item.saldo
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + '\n';
        });

        return csvContent;
    }

    generateOrderTransaksiCSV() {
        let csvContent = "Outlet,Order No,Tanggal,Waktu,Serve By,Kasir,Customer ID,Customer Name,Harga Beli,Harga Jual,Discount %,Discount Amount,Redeem Qty,Subtotal,Profit,Komisi,Payment Type,Status,Point,Redeem Amount,Total Amount,Cash Received,Cash Change,iPaymu Reference\n";
        
        this.currentData.forEach(item => {
            const row = [
                item.outlet,
                item.order_no,
                item.order_date,
                item.order_time,
                item.serve_by,
                item.kasir,
                item.customer_id,
                item.customer_name,
                item.harga_beli,
                item.harga_jual,
                item.discount_percent,
                item.discount_amount,
                item.redeem_qty,
                item.subtotal_amount,
                item.profit,
                item.comission,
                item.payment_type,
                item.status,
                item.point,
                item.redeem_amount,
                item.total_amount,
                item.cash_received,
                item.cash_change,
                item.ipaymu_reference_id
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
    cleanup() {
        console.log('Cleaning up Reports module');
        
        if (this.table && typeof this.table.destroy === 'function') {
            this.table.destroy();
            this.table = null;
            this.tableInitialized = false;
        }
        
        this.currentData = [];
        this.currentTab = 'detail-transaksi';
        this.isInitialized = false;
        
        console.log('Reports module cleaned up');
    }

    // Destroy method
    destroy() {
        this.cleanup();
        console.log('Reports module destroyed');
    }
}

// Initialize reports globally
let reports = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!window.reportsInstance) {
        reports = new Reports();
        window.reportsModule = reports;
    } else {
        reports = window.reportsInstance;
    }
    
    if (document.getElementById('reports-table')) {
        setTimeout(() => {
            reports.init();
        }, 100);
    }
});
