// Group Products Module - COMPLETE FIXED VERSION
class GroupProducts {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
        this.isInitialized = false;
        console.log('GroupProducts class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('GroupProducts already initialized');
            return;
        }

        console.log('Initializing GroupProducts module...');
        try {
            await this.loadOutlets();
            await this.loadData();
            this.initTable();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ GroupProducts module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing GroupProducts:', error);
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
                .order('created_at', { ascending: false });

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
                title: 'ID', 
                key: 'id',
                formatter: (value) => `<span class="text-xs text-gray-500">${value ? value.substring(0, 8) + '...' : '-'}</span>`,
                width: '120px'
            },
            { 
                title: 'Outlet', 
                key: 'outlet',
                formatter: (value) => `<span class="font-medium">${value || '-'}</span>`
            },
            { 
                title: 'Group Produk', 
                key: 'group',
                formatter: (value) => `<span class="text-gray-900">${value || '-'}</span>`
            },
            { 
                title: 'Status', 
                key: 'status',
                formatter: (value) => {
                    const isActive = value === 'active';
                    return `
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }">
                            ${isActive ? '🟢 Aktif' : '🔴 Nonaktif'}
                        </span>
                    `;
                },
                width: '120px'
            },
            {
                title: 'Aksi',
                key: 'id',
                formatter: (id, row) => this.getActionButtons(id, row),
                width: '120px'
            }
        ];

        // Cek jika DataTable class tersedia
        if (typeof DataTable === 'undefined') {
            console.error('DataTable class not found!');
            this.renderFallbackTable();
            return;
        }

        this.table = new DataTable('group-products-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            emptyMessage: 'Tidak ada data group produk',
            searchPlaceholder: 'Cari group produk...'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Group products table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('group-products-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-2">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Tidak ada data group produk</p>
                    <button onclick="groupProducts.showForm()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Group Pertama
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        this.currentData.forEach(item => {
            tableHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.outlet || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.group || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            item.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }">
                            ${item.status === 'active' ? 'Aktif' : 'Nonaktif'}
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

    // Get action buttons HTML - FIXED VERSION
    getActionButtons(id, row) {
        return `
            <div class="flex space-x-2">
                <button 
                    onclick="window.groupProducts.handleEdit('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="Edit Group Produk"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button 
                    onclick="window.groupProducts.handleDelete('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Hapus Group Produk"
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
        console.log('Binding group products events...');
        
        // Add button event
        const addBtn = document.getElementById('add-group-product');
        if (addBtn) {
            // Remove existing event listeners first
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-group-product');
            
            newAddBtn.addEventListener('click', () => {
                console.log('Add group product button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add button not found!');
        }

        // Refresh button (jika ada)
        const refreshBtn = document.getElementById('refresh-group-products');
        if (!refreshBtn) {
            // Tambahkan refresh button jika belum ada
            const header = document.querySelector('#group-products-table')?.closest('.bg-white')?.querySelector('.px-6.py-4');
            if (header) {
                const refreshButton = document.createElement('button');
                refreshButton.id = 'refresh-group-products';
                refreshButton.className = 'bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors ml-2';
                refreshButton.innerHTML = `
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Refresh
                `;
                refreshButton.addEventListener('click', () => this.loadData());
                header.appendChild(refreshButton);
            }
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

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Group Produk' : 'Tambah Group Produk';
        
        console.log('Showing form for:', isEdit ? 'edit' : 'add', item);

        // Generate outlet options
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${this.escapeHtml(outlet.outlet)}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>
                ${this.escapeHtml(outlet.outlet)}
            </option>`
        ).join('');

        const currentOutlet = item ? item.outlet : '';
        const currentGroup = item ? item.group : '';
        const currentStatus = item ? item.status : 'active';

        const content = `
            <div class="space-y-4">
                <form id="group-product-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Outlet *</label>
                        <select 
                            name="outlet" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                        >
                            <option value="">Pilih Outlet</option>
                            ${outletOptions}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Pilih outlet untuk group produk ini</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Group Produk *</label>
                        <input 
                            type="text" 
                            name="group" 
                            value="${this.escapeHtml(currentGroup)}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Contoh: Hair Care, Styling, dll."
                            required
                            maxlength="100"
                        >
                        <p class="text-xs text-gray-500 mt-1">Masukkan nama group produk (maks. 100 karakter)</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select 
                            name="status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>🟢 Aktif</option>
                            <option value="inactive" ${currentStatus === 'inactive' ? 'selected' : ''}>🔴 Nonaktif</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Status aktif/nonaktif group produk</p>
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
                                <p>Group produk digunakan untuk mengkategorikan produk-produk yang serupa.</p>
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
            size: 'max-w-md',
            customClass: 'group-product-modal'
        });

        // Auto-focus pada input pertama
        setTimeout(() => {
            const firstInput = document.querySelector('#group-product-form input, #group-product-form select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        if (!text) return '';
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

            // Validasi length
            if (data.group.length > 100) {
                Notifications.error('Nama group produk maksimal 100 karakter');
                return;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('group_produk')
                .insert([{
                    outlet: data.outlet.trim(),
                    group: data.group.trim(),
                    status: data.status || 'active'
                }])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                
                // Handle duplicate error
                if (error.code === '23505') {
                    Notifications.error('Group produk dengan nama tersebut sudah ada di outlet ini');
                } else {
                    throw error;
                }
                return;
            }

            console.log('Save successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil ditambahkan!');

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
            console.log('Found item for editing:', item);
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            console.log('Current data:', this.currentData);
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

            // Validasi length
            if (data.group.length > 100) {
                Notifications.error('Nama group produk maksimal 100 karakter');
                return;
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('group_produk')
                .update({
                    outlet: data.outlet.trim(),
                    group: data.group.trim(),
                    status: data.status || 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase error:', error);
                
                // Handle duplicate error
                if (error.code === '23505') {
                    Notifications.error('Group produk dengan nama tersebut sudah ada di outlet ini');
                } else {
                    throw error;
                }
                return;
            }

            console.log('Update successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil diupdate!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating group product:', error);
            Notifications.error('Gagal mengupdate group produk: ' + error.message);
        }
    }

    // Delete group product
    delete(id) {
        console.log('Delete button clicked for ID:', id);
        
        const item = this.currentData.find(d => d.id === id);
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
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Group Produk?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus group produk <strong>"${this.escapeHtml(item.group)}"</strong> dari outlet <strong>"${this.escapeHtml(item.outlet)}"</strong>. Tindakan ini tidak dapat dibatalkan.
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
            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Group produk berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting group product:', error);
            
            if (error.code === '23503') {
                Notifications.error('Tidak dapat menghapus group produk karena masih digunakan oleh produk lain');
            } else {
                Notifications.error('Gagal menghapus group produk: ' + error.message);
            }
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing group products data...');
        await this.loadData();
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up group products module...');
        this.isInitialized = false;
        this.table = null;
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

// Export untuk module system (jika digunakan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroupProducts;
}
