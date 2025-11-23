
// Outlets Module
class Outlets {
    constructor() {
        this.currentData = [];
        this.table = null;
    }

    // Initialize module
    async init() {
        console.log('Initializing Outlets module');
        await this.loadData();
        this.initTable();
        this.bindEvents();
        console.log('Outlets module initialized');
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            
            const { data, error } = await supabase
                .from('outlet')
                .select('*')
                .order('outlet', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal memuat data outlet: ' + error.message);
            return [];
        }
    }

    // Initialize table - TAMBAH KOLOM LONGITUDE, LATITUDE, DAN KONVERSI POINT
    initTable() {
        this.table = new DataTable('outlets-table', {
            columns: [
                { title: 'Nama Outlet', key: 'outlet' },
                { title: 'Kode Outlet', key: 'kode_outlet' },
                { title: 'Alamat', key: 'alamat' },
                { title: 'Nomor WA', key: 'nomor_wa' },
                { 
                    title: 'Longitude', 
                    key: 'outlet_long',
                    formatter: (value) => {
                        if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                        return parseFloat(value).toFixed(6);
                    }
                },
                { 
                    title: 'Latitude', 
                    key: 'outlet_lat',
                    formatter: (value) => {
                        if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                        return parseFloat(value).toFixed(6);
                    }
                },
                { 
                    title: 'Konversi Point', 
                    key: 'konversi_point',
                    formatter: (value) => {
                        if (value === null || value === undefined) return '<span class="text-gray-400">-</span>';
                        return value.toLocaleString('id-ID');
                    }
                },
                { title: 'Jam Buka', key: 'jam_buka' },
                { title: 'Jam Tutup', key: 'jam_tutup' },
                { 
                    title: 'Reservation', 
                    key: 'reservation',
                    formatter: (value) => value ? 'Ya' : 'Tidak'
                }
            ],
            actions: [
                {
                    text: 'Edit',
                    onclick: 'outlets.edit',
                    color: 'blue'
                },
                {
                    text: 'Hapus',
                    onclick: 'outlets.delete',
                    color: 'red'
                }
            ],
            searchable: true,
            pagination: true,
            pageSize: 10
        });

        this.table.init();
        this.table.updateData(this.currentData);
    }

    // Bind events
    bindEvents() {
        const addBtn = document.getElementById('add-outlet');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
        }
    }

    // Show form for add/edit - TAMBAH INPUT LONGITUDE, LATITUDE, DAN KONVERSI POINT
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Outlet' : 'Tambah Outlet';

        const content = `
            <form id="outlet-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Outlet</label>
                        <input 
                            type="text" 
                            name="outlet" 
                            value="${item ? item.outlet : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kode Outlet</label>
                        <input 
                            type="text" 
                            name="kode_outlet" 
                            value="${item ? item.kode_outlet : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    <textarea 
                        name="alamat" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                    >${item ? item.alamat : ''}</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WA</label>
                        <input 
                            type="text" 
                            name="nomor_wa"
                            value="${item ? item.nomor_wa : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Konversi Point</label>
                        <input 
                            type="number" 
                            name="konversi_point" 
                            value="${item && item.konversi_point !== null ? item.konversi_point : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            value="${item ? item.jam_buka : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jam Tutup</label>
                        <input 
                            type="time" 
                            name="jam_tutup" 
                            value="${item ? item.jam_tutup : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                </div>

                <!-- TOMBOL BANTU KOORDINAT -->
                <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 class="text-sm font-medium text-blue-800 mb-2">Bantuan Koordinat</h4>
                    <div class="space-y-2">
                        <button type="button" onclick="outlets.getCurrentLocation()" 
                                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            📍 Dapatkan Lokasi Saat Ini
                        </button>
                        <p class="text-xs text-blue-600">
                            Klik tombol di atas untuk mendapatkan koordinat lokasi Anda secara otomatis
                        </p>
                    </div>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: 'modal.close()',
                primary: false
            },
            {
                text: isEdit ? 'Update' : 'Simpan',
                onclick: `outlets.${isEdit ? 'update' : 'save'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
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
            const form = document.getElementById('outlet-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

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

            const { error } = await supabase
                .from('outlet')
                .insert([data]);

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Outlet berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menambah outlet: ' + error.message);
        }
    }

    // Edit outlet
    edit(id) {
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (item) {
            this.showForm(item);
        } else {
            console.error('Outlet not found with ID:', numericId);
            Notifications.error('Data outlet tidak ditemukan');
        }
    }

    // Update outlet - TAMBAH HANDLING LONGITUDE, LATITUDE, DAN KONVERSI POINT
    async update(id) {
        try {
            const form = document.getElementById('outlet-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

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

            const { error } = await supabase
                .from('outlet')
                .update(data)
                .eq('id', parseInt(id));

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Outlet berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal mengupdate outlet: ' + error.message);
        }
    }

    // Delete outlet
    async delete(id) {
        modal.showConfirm(
            'Apakah Anda yakin ingin menghapus outlet ini?',
            `outlets.confirmDelete('${id}')`
        );
    }

    async confirmDelete(id) {
        try {
            Helpers.showLoading();

            const { error } = await supabase
                .from('outlet')
                .delete()
                .eq('id', parseInt(id));

            if (error) throw error;

            await this.loadData();
            Notifications.success('Outlet berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menghapus outlet: ' + error.message);
        }
    }
}

// Initialize outlets globally
let outlets = null;
document.addEventListener('DOMContentLoaded', () => {
    outlets = new Outlets();
    window.outlets = outlets;
});
