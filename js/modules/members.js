// Members Module
class Members {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
    }

    // Initialize module
    async init() {
        console.log('Initializing Members module');
        await this.loadOutlets();
        await this.loadData();
        this.initTable();
        this.bindEvents();
        console.log('Members module initialized');
    }

    // Load outlets from app
    async loadOutlets() {
        if (window.app && window.app.getOutlets) {
            this.outlets = window.app.getOutlets();
        } else {
            // Fallback: load outlets directly
            try {
                const { data, error } = await supabase
                    .from('outlet')
                    .select('outlet')
                    .order('outlet', { ascending: true });

                if (!error) {
                    this.outlets = data || [];
                }
            } catch (error) {
                console.error('Error loading outlets:', error);
                this.outlets = [];
            }
        }
        console.log('Members outlets:', this.outlets);
    }

    // Load data from Supabase dengan filter
   async loadData(filters = {}) {
    try {
        Helpers.showLoading();
        
        const allData = [];
        let page = 1;
        const pageSize = 1000; // Max per request
        let hasMore = true;

        console.log('🔄 Loading member data with pagination...');

        while (hasMore) {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            
            let query = supabase
                .from('membercard')
                .select('*')
                .range(from, to);

            // Apply filters
            if (filters.outlet) {
                query = query.eq('outlet', filters.outlet);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query.order('id', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                allData.push(...data);
                console.log(`📥 Page ${page}: Loaded ${data.length} records (total: ${allData.length})`);
                
                // Jika dapat kurang dari pageSize, berarti sudah last page
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        },
        
    // Initialize table
    initTable() {
        this.table = new DataTable('members-table', {
            columns: [
                { title: 'Nama', key: 'nama' },
                { title: 'Nomor WA', key: 'nomorWA' },
                { title: 'ID Member', key: 'id_member' },
                { title: 'Outlet', key: 'outlet' },
                { 
                    title: 'Point', 
                    key: 'point',
                    formatter: (value) => value || 0
                },
                { 
                    title: 'Berlaku', 
                    key: 'berlaku',
                    type: 'date'
                },
                { 
                    title: 'Status', 
                    key: 'status',
                    formatter: (value) => {
                        const isActive = value === 'active';
                        return `
                            <span class="px-2 py-1 text-xs rounded-full ${
                                isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                        `;
                    }
                }
            ],
            actions: [
                {
                    text: 'Edit',
                    onclick: 'members.edit',
                    color: 'blue'
                },
                {
                    text: 'Hapus',
                    onclick: 'members.delete',
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

    // Bind events dengan filter
    bindEvents() {
        const addBtn = document.getElementById('add-member');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
        }

        // Filter events
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');
        const clearFiltersBtn = document.getElementById('clear-filters');

        if (outletFilter) {
            outletFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    // Apply filters
    applyFilters() {
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');

        const filters = {
            outlet: outletFilter ? outletFilter.value : '',
            status: statusFilter ? statusFilter.value : ''
        };

        this.loadData(filters);
    }

    // Clear filters
    clearFilters() {
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');

        if (outletFilter) outletFilter.value = '';
        if (statusFilter) statusFilter.value = '';

        this.loadData();
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Member' : 'Tambah Member';

        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>${outlet.outlet}</option>`
        ).join('');

        const content = `
            <form id="member-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                        <input 
                            type="text" 
                            name="nama" 
                            value="${item ? item.nama : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WA</label>
                        <input 
                            type="text" 
                            name="nomorWA" 
                            value="${item ? item.nomorWA : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ID Member</label>
                        <input 
                            type="text" 
                            name="id_member" 
                            value="${item ? item.id_member : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                        <select 
                            name="outlet" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Pilih Outlet</option>
                            ${outletOptions}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Point</label>
                        <input 
                            type="number" 
                            name="point" 
                            value="${item ? item.point : 0}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                        <input 
                            type="date" 
                            name="tanggal_lahir" 
                            value="${item ? item.tanggal_lahir : ''}"
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Berlaku Sampai</label>
                        <input 
                            type="date" 
                            name="berlaku" 
                            value="${item ? item.berlaku : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            name="status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="active" ${item && item.status === 'active' ? 'selected' : ''}>Aktif</option>
                            <option value="inactive" ${item && item.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
                        </select>
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
                onclick: `members.${isEdit ? 'update' : 'save'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
    }

    // Save new member
    async save() {
        try {
            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .insert([data]);

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menambah member: ' + error.message);
        }
    }

    // Edit member
    edit(id) {
        console.log('=== EDIT DEBUG ===');
        console.log('ID received:', id, 'Type:', typeof id);
        
        // Convert ID ke number
        const numericId = parseInt(id);
        console.log('Numeric ID:', numericId);
        
        const item = this.currentData.find(d => d.id === numericId);
        console.log('Find result:', item);
        
        if (item) {
            this.showForm(item);
        } else {
            console.error('Item not found with ID:', numericId);
            console.log('Available IDs:', this.currentData.map(d => ({id: d.id, type: typeof d.id})));
            Notifications.error('Data member tidak ditemukan');
        }
    }

    // Update member
    async update(id) {
        try {
            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal mengupdate member: ' + error.message);
        }
    }

    // Delete member
    async delete(id) {
        modal.showConfirm(
            'Apakah Anda yakin ingin menghapus member ini?',
            `members.confirmDelete('${id}')`
        );
    }

    async confirmDelete(id) {
        try {
            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadData();
            Notifications.success('Member berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menghapus member: ' + error.message);
        }
    }
}

// Initialize members globally
let members = null;
document.addEventListener('DOMContentLoaded', () => {
    members = new Members();
    window.members = members;
});
