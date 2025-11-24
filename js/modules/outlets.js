// Outlets Module - FIXED VERSION (using group_products pattern)
class Outlets {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.isInitialized = false;
        console.log('Outlets class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('Outlets already initialized');
            return;
        }

        console.log('Initializing Outlets module...');
        try {
            await this.loadData();
            this.initTable();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ Outlets module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Outlets:', error);
        }
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            console.log('Loading outlets data...');
            
            const { data, error } = await supabase
                .from('outlet')
                .select('*')
                .order('outlet', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            console.log('Loaded outlets:', this.currentData);
            
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading outlets data:', error);
            Notifications.error('Gagal memuat data outlet: ' + error.message);
            return [];
        }
    }

    // Initialize table - TAMBAH KOLOM LONGITUDE, LATITUDE, DAN KONVERSI POINT
    initTable() {
        console.log('Initializing outlets table...');
        
        const columns = [
            { 
                title: 'Nama Outlet', 
                key: 'outlet',
                formatter: (value) => `<span class="font-medium text-gray-900">${value || '-'}</span>`
            },
            { 
                title: 'Kode Outlet', 
                key: 'kode_outlet',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Alamat', 
                key: 'alamat',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Nomor WA', 
                key: 'nomor_wa',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Longitude', 
                key: 'outlet_long',
                formatter: (value) => {
                    if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                    return `<span class="font-mono text-sm">${parseFloat(value).toFixed(6)}</span>`;
                }
            },
            { 
                title: 'Latitude', 
                key: 'outlet_lat',
                formatter: (value) => {
                    if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                    return `<span class="font-mono text-sm">${parseFloat(value).toFixed(6)}</span>`;
                }
            },
            { 
                title: 'Konversi Point', 
                key: 'konversi_point',
                formatter: (value) => {
                    if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                    return `<span class="font-medium text-green-600">${value.toLocaleString('id-ID')}</span>`;
                }
            },
            { 
                title: 'Jam Buka', 
                key: 'jam_buka',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Jam Tutup', 
                key: 'jam_tutup',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Reservation', 
                key: 'reservation',
                formatter: (value) => {
                    return value ? 
                        '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ya</span>' : 
                        '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Tidak</span>';
                }
            },
            {
                title: 'Aksi',
                key: 'id',
                formatter: (id, row) => this.getActionButtons(id, row),
                width: '150px'
            }
        ];

        // Cek jika DataTable class tersedia
        if (typeof DataTable === 'undefined') {
            console.error('DataTable class not found!');
            this.renderFallbackTable();
            return;
        }

        this.table = new DataTable('outlets-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            emptyMessage: 'Tidak ada data outlet',
            searchPlaceholder: 'Cari outlet...'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Outlets table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('outlets-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-2">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Tidak ada data outlet</p>
                    <button onclick="window.outlets.showForm()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Outlet Pertama
                    </button>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor WA</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konversi Point</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Buka</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Tutup</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservation</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        this.currentData.forEach(item => {
            tableHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.outlet || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.kode_outlet || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">${item.alamat || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.nomor_wa || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${item.outlet_long ? parseFloat(item.outlet_long).toFixed(6) : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${item.outlet_lat ? parseFloat(item.outlet_lat).toFixed(6) : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${item.konversi_point ? item.konversi_point.toLocaleString('id-ID') : '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.jam_buka || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.jam_tutup || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${
                            item.reservation 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                        }">
                            ${item.reservation ? 'Ya' : 'Tidak'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${this.getActionButtons(item.id, item)}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    // Get action buttons HTML
    getActionButtons(id, row) {
        return `
            <div class="flex space-x-2">
                <button 
                    onclick="window.outlets.handleEdit('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="Edit Outlet"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button 
                    onclick="window.outlets.handleDelete('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Hapus Outlet"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Hapus
                </button>
            </div>
        `;
    }

    // Bind events
    bindEvents() {
        console.log('Binding outlets events...');
        
        // Add button event
        const addBtn = document.getElementById('add-outlet');
        if (addBtn) {
            // Remove existing event listeners first
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-outlet');
            
            newAddBtn.addEventListener('click', () => {
                console.log('Add outlet button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add button not found!');
        }
    }

    // Handle edit - PUBLIC METHOD
    handleEdit(id) {
        console.log('Edit handled for:', id);
        this.edit(id);
    }

    // Handle delete - PUBLIC METHOD  
    handleDelete(id) {
        console.log('Delete handled for:', id);
        this.delete(id);
    }

    // Show form for add/edit - TAMBAH INPUT LONGITUDE, LATITUDE, DAN KONVERSI POINT
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Outlet' : 'Tambah Outlet';

        const content = `
            <div class="space-y-4">
                <form id="outlet-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Outlet *</label>
                            <input 
                                type="text" 
                                name="outlet" 
                                value="${this.escapeHtml(item ? item.outlet : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                maxlength="100"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kode Outlet</label>
                            <input 
                                type="text" 
                                name="kode_outlet" 
                                value="${this.escapeHtml(item ? item.kode_outlet : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                maxlength="20"
                            >
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                        <textarea 
                            name="alamat" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            rows="3"
                            maxlength="255"
                        >${this.escapeHtml(item ? item.alamat : '')}</textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WA</label>
                            <input 
                                type="text" 
                                name="nomor_wa"
                                value="${this.escapeHtml(item ? item.nomor_wa : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                maxlength="20"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Konversi Point</label>
                            <input 
                                type="number" 
                                name="konversi_point" 
                                value="${item && item.konversi_point !== null ? item.konversi_point : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                min="0"
                                step="1"
                                placeholder="Contoh: 1000"
                            >
                            <p class="text-xs text-gray-500 mt-1">Jumlah point untuk konversi</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="flex items-center mt-6">
                                <input 
                                    type="checkbox" 
                                    name="reservation" 
                                    ${item && item.reservation ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                >
                                <span class="ml-2 text-sm text-gray-700">Menerima Reservation</span>
                            </label>
                        </div>
                    </div>

                    <!-- KOORDINAT GEOGRAFIS -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input 
                                type="number" 
                                name="outlet_long" 
                                value="${item && item.outlet_long !== null ? item.outlet_long : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                step="0.000001"
                                placeholder="Contoh: 106.123456"
                            >
                            <p class="text-xs text-gray-500 mt-1">Koordinat bujur (contoh: 106.123456)</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input 
                                type="number" 
                                name="outlet_lat" 
                                value="${item && item.outlet_lat !== null ? item.outlet_lat : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                step="0.000001"
                                placeholder="Contoh: -6.123456"
                            >
                            <p class="text-xs text-gray-500 mt-1">Koordinat lintang (contoh: -6.123456)</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Jam Buka</label>
                            <input 
                                type="time" 
                                name="jam_buka" 
                                value="${this.escapeHtml(item ? item.jam_buka : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Jam Tutup</label>
                            <input 
                                type="time" 
                                name="jam_tutup" 
                                value="${this.escapeHtml(item ? item.jam_tutup : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                        </div>
                    </div>

                    <!-- TOMBOL BANTU KOORDINAT -->
                    <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 class="text-sm font-medium text-blue-800 mb-2">Bantuan Koordinat</h4>
                        <div class="space-y-2">
                            <button type="button" onclick="window.outlets.getCurrentLocation()" 
                                    class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                                📍 Dapatkan Lokasi Saat Ini
                            </button>
                            <p class="text-xs text-blue-600">
                                Klik tombol di atas untuk mendapatkan koordinat lokasi Anda secara otomatis
                            </p>
                        </div>
                    </div>
                </form>
                
                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-800">Informasi</h3>
                            <div class="mt-1 text-sm text-blue-700">
                                <p>Field dengan tanda * wajib diisi. Koordinat geografis digunakan untuk fitur maps dan lokasi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: () => {
                    console.log('Cancel button clicked');
                    modal.close();
                },
                primary: false
            },
            {
                text: isEdit ? 'Update Data' : 'Simpan Data',
                onclick: () => {
                    console.log('Save button clicked');
                    if (isEdit) {
                        this.update(item.id);
                    } else {
                        this.save();
                    }
                },
                primary: true
            }
        ];

        // Create modal
        modal.createModal(title, content, buttons, { 
            size: 'max-w-2xl',
            customClass: 'outlet-modal'
        });
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get current location using Geolocation API
    getCurrentLocation() {
        if (!navigator.geolocation) {
            Notifications.error('Geolocation tidak didukung oleh browser Anda');
            return;
        }

        Helpers.showLoading('Mendapatkan lokasi...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                Helpers.hideLoading();
                
                const longitude = position.coords.longitude;
                const latitude = position.coords.latitude;
                
                // Isi form fields
                const longInput = document.querySelector('input[name="outlet_long"]');
                const latInput = document.querySelector('input[name="outlet_lat"]');
                
                if (longInput) longInput.value = longitude.toFixed(6);
                if (latInput) latInput.value = latitude.toFixed(6);
                
                Notifications.success('Lokasi berhasil didapatkan');
            },
            (error) => {
                Helpers.hideLoading();
                let errorMessage = 'Gagal mendapatkan lokasi: ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Akses lokasi ditolak';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Informasi lokasi tidak tersedia';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Timeout mendapatkan lokasi';
                        break;
                    default:
                        errorMessage += 'Error tidak diketahui';
                }
                
                Notifications.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // Save new outlet - TAMBAH HANDLING LONGITUDE, LATITUDE, DAN KONVERSI POINT
    async save() {
        try {
            console.log('Saving new outlet...');
            
            const form = document.getElementById('outlet-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Form data:', data);

            // Validasi data
            if (!data.outlet) {
                Notifications.error('Nama outlet harus diisi');
                return;
            }

            // Convert checkbox value to boolean
            data.reservation = data.reservation === 'on';

            // Handle numeric values for coordinates and konversi_point
            if (data.outlet_long) {
                data.outlet_long = parseFloat(data.outlet_long);
            } else {
                data.outlet_long = null;
            }
            
            if (data.outlet_lat) {
                data.outlet_lat = parseFloat(data.outlet_lat);
            } else {
                data.outlet_lat = null;
            }

            // Handle konversi_point
            if (data.konversi_point) {
                data.konversi_point = parseInt(data.konversi_point);
            } else {
                data.konversi_point = null;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('outlet')
                .insert([data])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Save successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Outlet berhasil ditambahkan!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving outlet:', error);
            Notifications.error('Gagal menambah outlet: ' + error.message);
        }
    }

    // Edit outlet
    edit(id) {
        console.log('Editing outlet:', id);
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (item) {
            console.log('Found item for editing:', item);
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            console.log('Current data:', this.currentData);
            Notifications.error('Data outlet tidak ditemukan untuk diedit');
        }
    }

    // Update outlet - TAMBAH HANDLING LONGITUDE, LATITUDE, DAN KONVERSI POINT
    async update(id) {
        try {
            console.log('Updating outlet:', id);
            
            const form = document.getElementById('outlet-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Update data:', data);

            // Validasi data
            if (!data.outlet) {
                Notifications.error('Nama outlet harus diisi');
                return;
            }

            // Convert checkbox value to boolean
            data.reservation = data.reservation === 'on';

            // Handle numeric values for coordinates and konversi_point
            if (data.outlet_long) {
                data.outlet_long = parseFloat(data.outlet_long);
            } else {
                data.outlet_long = null;
            }
            
            if (data.outlet_lat) {
                data.outlet_lat = parseFloat(data.outlet_lat);
            } else {
                data.outlet_lat = null;
            }

            // Handle konversi_point
            if (data.konversi_point) {
                data.konversi_point = parseInt(data.konversi_point);
            } else {
                data.konversi_point = null;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('outlet')
                .update(data)
                .eq('id', parseInt(id))
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Outlet berhasil diupdate!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating outlet:', error);
            Notifications.error('Gagal mengupdate outlet: ' + error.message);
        }
    }

    // Delete outlet
    delete(id) {
        console.log('Delete button clicked for ID:', id);
        
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (!item) {
            console.error('Item not found for deletion:', id);
            Notifications.error('Data tidak ditemukan');
            return;
        }

        console.log('Showing confirmation for:', item);
        
        const confirmMessage = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Outlet?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus outlet <strong>"${this.escapeHtml(item.outlet)}"</strong>. Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
        `;

        modal.showConfirm(
            confirmMessage,
            () => this.confirmDelete(id),
            () => console.log('Delete cancelled')
        );
    }

    async confirmDelete(id) {
        try {
            console.log('Confirming delete for:', id);
            const numericId = parseInt(id);
            
            Helpers.showLoading();

            const { error } = await supabase
                .from('outlet')
                .delete()
                .eq('id', numericId);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Outlet berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting outlet:', error);
            Notifications.error('Gagal menghapus outlet: ' + error.message);
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing outlets data...');
        await this.loadData();
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up outlets module...');
        this.isInitialized = false;
        this.table = null;
    }
}

// Initialize outlets globally
let outlets = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for outlets module...');
    
    // Hanya inisialisasi jika di halaman yang memiliki outlets
    if (document.getElementById('outlets-table')) {
        console.log('Initializing outlets module...');
        outlets = new Outlets();
        window.outlets = outlets;
        
        // Tunggu sedikit untuk memastikan app sudah terload
        setTimeout(() => {
            outlets.init();
        }, 100);
    }
});
