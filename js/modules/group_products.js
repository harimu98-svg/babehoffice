// Group Products Module - FIXED VERSION
class GroupProducts {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
        console.log('GroupProducts class initialized');
    }

    // Initialize module
    async init() {
        console.log('Initializing GroupProducts module...');
        try {
            await this.loadOutlets();
            await this.loadData();
            this.initTable();
            this.bindEvents();
            console.log('GroupProducts module initialized successfully');
        } catch (error) {
            console.error('Error initializing GroupProducts:', error);
        }
    }

    // Load outlets from app
    async loadOutlets() {
        try {
            if (window.app && window.app.getOutlets) {
                this.outlets = window.app.getOutlets();
                console.log('Loaded outlets from app:', this.outlets);
            } else {
                // Fallback: load outlets directly
                const { data, error } = await supabase
                    .from('outlet')
                    .select('outlet')
                    .eq('status', 'active')
                    .order('outlet', { ascending: true });

                if (error) throw error;
                this.outlets = data || [];
                console.log('Loaded outlets directly:', this.outlets);
            }
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            console.log('Loading group products data...');
            
            const { data, error } = await supabase
                .from('group_produk')
                .select('*')
                .order('group', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            console.log('Loaded group products:', this.currentData);
            
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading group products data:', error);
            Notifications.error('Gagal memuat data group produk: ' + error.message);
            return [];
        }
    }

    // Initialize table
    initTable() {
        console.log('Initializing group products table...');
        
        const columns = [
            { 
                title: 'Outlet', 
                key: 'outlet',
                formatter: (value) => value || '-'
            },
            { 
                title: 'Group Produk', 
                key: 'group',
                formatter: (value) => value || '-'
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
            },
            {
                title: 'Aksi',
                key: 'id',
                formatter: (id) => this.getActionButtons(id)
            }
        ];

        this.table = new DataTable('group-products-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            emptyMessage: 'Tidak ada data group produk'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Group products table initialized');
    }

    // Get action buttons HTML
    getActionButtons(id) {
        return `
            <div class="flex space-x-2">
                <button 
                    onclick="groupProducts.edit('${id}')" 
                    class="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button 
                    onclick="groupProducts.delete('${id}')" 
                    class="text-red-600 hover:text-red-800 transition-colors"
                    title="Hapus"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        `;
    }

    // Bind events
    bindEvents() {
        console.log('Binding group products events...');
        
        // Add button event
        const addBtn = document.getElementById('add-group-product');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('Add group product button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add button not found!');
        }
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Group Produk' : 'Tambah Group Produk';
        
        console.log('Showing form for:', isEdit ? 'edit' : 'add', item);

        // Generate outlet options
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>
                ${outlet.outlet}
            </option>`
        ).join('');

        const content = `
            <form id="group-product-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Outlet *</label>
                    <select 
                        name="outlet" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Pilih Outlet</option>
                        ${outletOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Group Produk *</label>
                    <input 
                        type="text" 
                        name="group" 
                        value="${item ? this.escapeHtml(item.group) : ''}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama group produk"
                        required
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
            </form>
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
                text: isEdit ? 'Update' : 'Simpan',
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
        modal.createModal(title, content, buttons, { size: 'max-w-md' });
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Save new group product
    async save() {
        try {
            console.log('Saving new group product...');
            
            const form = document.getElementById('group-product-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Form data:', data);

            // Validasi data
            if (!data.outlet || !data.group) {
                Notifications.error('Outlet dan Group Produk harus diisi');
                return;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('group_produk')
                .insert([{
                    outlet: data.outlet,
                    group: data.group,
                    status: data.status || 'active'
                }])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Save successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving group product:', error);
            Notifications.error('Gagal menambah group produk: ' + error.message);
        }
    }

    // Edit group product
    edit(id) {
        console.log('Editing group product:', id);
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            Notifications.error('Data tidak ditemukan untuk diedit');
        }
    }

    // Update group product
    async update(id) {
        try {
            console.log('Updating group product:', id);
            
            const form = document.getElementById('group-product-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Update data:', data);

            // Validasi data
            if (!data.outlet || !data.group) {
                Notifications.error('Outlet dan Group Produk harus diisi');
                return;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('group_produk')
                .update({
                    outlet: data.outlet,
                    group: data.group,
                    status: data.status || 'active'
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            console.log('Update successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating group product:', error);
            Notifications.error('Gagal mengupdate group produk: ' + error.message);
        }
    }

    // Delete group product
    async delete(id) {
        console.log('Deleting group product:', id);
        
        const item = this.currentData.find(d => d.id === id);
        if (!item) {
            Notifications.error('Data tidak ditemukan');
            return;
        }

        modal.showConfirm(
            `Apakah Anda yakin ingin menghapus group produk "${item.group}"?`,
            () => this.confirmDelete(id)
        );
    }

    async confirmDelete(id) {
        try {
            console.log('Confirming delete for:', id);
            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Group produk berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting group product:', error);
            Notifications.error('Gagal menghapus group produk: ' + error.message);
        }
    }
}

// Initialize group products globally
let groupProducts = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for group products module...');
    
    // Hanya inisialisasi jika di halaman yang memiliki group products
    if (document.getElementById('group-products-table')) {
        console.log('Initializing group products module...');
        groupProducts = new GroupProducts();
        window.groupProducts = groupProducts;
        
        // Tunggu sedikit untuk memastikan app sudah terload
        setTimeout(() => {
            groupProducts.init();
        }, 100);
    }
});
