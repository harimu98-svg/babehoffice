// Members Module
class Members {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.currentMemberId = null;
        this.outlets = [];
    }

    // Initialize module
    async init() {
        await this.loadOutlets();
        await this.loadData();
        this.initTable();
        this.bindEvents();
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

    // Load data from Supabase dengan pagination lengkap
    async loadData(filters = {}) {
        try {
            Helpers.showLoading();
            
            const allData = [];
            let page = 1;
            const pageSize = 1000; // Max per request
            let hasMore = true;

            console.log('🔄 Loading member data with pagination...', filters);

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
            }

            console.log('✅ Finished loading:', {
                totalLoaded: allData.length,
                pages: page,
                firstRecord: allData[0] ? { id: allData[0].id, nama: allData[0].nama } : null,
                lastRecord: allData[allData.length - 1] ? { id: allData[allData.length - 1].id, nama: allData[allData.length - 1].nama } : null
            });

            // Cek apakah Hari Suryono ada
            const hariRecord = allData.find(item => item.id === 243);
            console.log('🔍 Hari Suryono in loaded data:', !!hariRecord);

            this.currentData = allData;
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading members:', error);
            Notifications.error('Gagal memuat data member: ' + error.message);
            return [];
        }
    }

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

    // Bind events
    bindEvents() {
        // Add button event
        const addBtn = document.getElementById('add-member');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
        }

        // Filter events
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');
        const clearFilters = document.getElementById('clear-filters');

        if (outletFilter) {
            outletFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
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

        this.loadData({ outlet: '', status: '' });
    }

    // Validate form
    validateForm() {
        const form = document.getElementById('member-form');
        const formData = new FormData(form);
        
        const nama = formData.get('nama');
        const nomorWA = formData.get('nomorWA');
        const outlet = formData.get('outlet');

        if (!nama || nama.trim() === '') {
            Notifications.error('Nama member harus diisi');
            return false;
        }

        if (!nomorWA || nomorWA.trim() === '') {
            Notifications.error('Nomor WA harus diisi');
            return false;
        }

        if (!outlet) {
            Notifications.error('Outlet harus dipilih');
            return false;
        }

        return true;
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Member' : 'Tambah Member';
        
        this.currentMemberId = item ? item.id : null;

        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>${outlet.outlet}</option>`
        ).join('');

        const content = `
            <form id="member-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nama Member <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="nama" 
                            value="${item ? item.nama : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            placeholder="Masukkan nama member"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nomor WA <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="nomorWA" 
                            value="${item ? item.nomorWA : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            placeholder="Contoh: 081234567890"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            ID Member
                        </label>
                        <input 
                            type="text" 
                            name="id_member" 
                            value="${item ? item.id_member : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Auto generate"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Outlet <span class="text-red-500">*</span>
                        </label>
                        <select 
                            name="outlet" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Pilih Outlet</option>
                            ${outletOptions}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Lahir
                        </label>
                        <input 
                            type="date" 
                            name="tanggal_lahir" 
                            value="${item && item.tanggal_lahir ? item.tanggal_lahir.split('T')[0] : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Berlaku Sampai
                        </label>
                        <input 
                            type="date" 
                            name="berlaku" 
                            value="${item && item.berlaku ? item.berlaku.split('T')[0] : ''}"
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
                        placeholder="Masukkan alamat member"
                    >${item ? item.alamat : ''}</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Point</label>
                        <input 
                            type="number" 
                            name="point" 
                            value="${item ? item.point : 0}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            placeholder="0"
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

                <div class="pt-4 border-t border-gray-200">
                    <p class="text-xs text-gray-500">
                        <span class="text-red-500">*</span> Menandakan field yang wajib diisi
                    </p>
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
                onclick: `members.${isEdit ? 'validateAndUpdate' : 'validateAndSave'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
    }

    // Validate and save new member
    async validateAndSave() {
        if (!this.validateForm()) {
            return;
        }
        await this.save();
    }

    // Validate and update member
    async validateAndUpdate(id) {
        if (!this.validateForm()) {
            return;
        }
        await this.update(id);
    }

    // Save new member
    async save() {
        try {
            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            
            const data = {
                nama: formData.get('nama'),
                nomorWA: formData.get('nomorWA'),
                id_member: formData.get('id_member') || null,
                outlet: formData.get('outlet'),
                tanggal_lahir: formData.get('tanggal_lahir') || null,
                alamat: formData.get('alamat') || null,
                berlaku: formData.get('berlaku') || null,
                point: parseInt(formData.get('point')) || 0,
                status: formData.get('status')
            };

            console.log('Saving member data:', data);

            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .insert([data]);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Save member error:', error);
            Notifications.error('Gagal menambah member: ' + error.message);
        }
    }

    // Edit member
    edit(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            this.showForm(item);
        }
    }

    // Update member
    async update(id) {
        try {
            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            
            const data = {
                nama: formData.get('nama'),
                nomorWA: formData.get('nomorWA'),
                id_member: formData.get('id_member') || null,
                outlet: formData.get('outlet'),
                tanggal_lahir: formData.get('tanggal_lahir') || null,
                alamat: formData.get('alamat') || null,
                berlaku: formData.get('berlaku') || null,
                point: parseInt(formData.get('point')) || 0,
                status: formData.get('status')
            };

            console.log('Updating member data:', data);

            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .update(data)
                .eq('id', id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Update member error:', error);
            Notifications.error('Gagal mengupdate member: ' + error.message);
        }
    }

    // Delete member
    async delete(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            modal.showConfirm(
                `Apakah Anda yakin ingin menghapus member "${item.nama}"?`,
                `members.confirmDelete('${id}')`
            );
        }
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

    // Export members to CSV
    async exportToCSV() {
        try {
            Helpers.showLoading();
            
            const { data, error } = await supabase
                .from('membercard')
                .select('*')
                .order('nama', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                Notifications.error('Tidak ada data member untuk diexport');
                return;
            }

            const headers = ['Nama', 'Nomor WA', 'ID Member', 'Outlet', 'Point', 'Status', 'Berlaku', 'Alamat'];
            const csvData = data.map(member => [
                `"${member.nama || ''}"`,
                `"${member.nomorWA || ''}"`,
                `"${member.id_member || ''}"`,
                `"${member.outlet || ''}"`,
                `"${member.point || 0}"`,
                `"${member.status || ''}"`,
                `"${member.berlaku || ''}"`,
                `"${member.alamat || ''}"`
            ]);

            const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Helpers.hideLoading();
            Notifications.success('Data member berhasil diexport');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Export error:', error);
            Notifications.error('Gagal mengexport data: ' + error.message);
        }
    }
}

// Initialize members globally
let members = null;
document.addEventListener('DOMContentLoaded', () => {
    members = new Members();
    window.members = members;
});
