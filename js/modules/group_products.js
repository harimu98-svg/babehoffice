// Group Products Module
class GroupProducts {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
        this.init();
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
        try {
            if (window.app && window.app.getOutlets) {
                this.outlets = window.app.getOutlets();
            } else {
                // Fallback: load outlets directly
                const { data, error } = await supabase
                    .from('outlet')
                    .select('outlet')
                    .eq('status', 'active')
                    .order('outlet', { ascending: true });

                if (!error) {
                    this.outlets = data || [];
                }
            }
            console.log('Group products outlets:', this.outlets);
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            
            const { data, error } = await supabase
                .from('group_produk')
                .select('*')
                .order('group', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal memuat data group produk: ' + error.message);
            return [];
        }
    }

    // Initialize table
    initTable() {
        this.table = new DataTable('group-products-table', {
            columns: [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Group Produk', key: 'group' },
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
                    onclick: 'groupProducts.edit',
                    color: 'blue'
                },
                {
                    text: 'Hapus',
                    onclick: 'groupProducts.delete',
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
        const addBtn = document.getElementById('add-group-product');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
        }
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Group Produk' : 'Tambah Group Produk';

        // Generate outlet options
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>${outlet.outlet}</option>`
        ).join('');

        const content = `
            <form id="group-product-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Group Produk</label>
                    <input 
                        type="text" 
                        name="group" 
                        value="${item ? item.group : ''}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onclick: 'modal.close()',
                primary: false
            },
            {
                text: isEdit ? 'Update' : 'Simpan',
                onclick: `groupProducts.${isEdit ? 'update' : 'save'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
    }

    // Save new group product
    async save() {
        try {
            const form = document.getElementById('group-product-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .insert([data]);

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menambah group produk: ' + error.message);
        }
    }

    // Edit group product
    edit(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            this.showForm(item);
        }
    }

    // Update group product
    async update(id) {
        try {
            const form = document.getElementById('group-product-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            modal.close();
            await this.loadData();
            Notifications.success('Group produk berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal mengupdate group produk: ' + error.message);
        }
    }

    // Delete group product
    async delete(id) {
        modal.showConfirm(
            'Apakah Anda yakin ingin menghapus group produk ini?',
            `groupProducts.confirmDelete('${id}')`
        );
    }

    async confirmDelete(id) {
        try {
            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadData();
            Notifications.success('Group produk berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menghapus group produk: ' + error.message);
        }
    }
}

// Initialize group products globally
let groupProducts = null;
document.addEventListener('DOMContentLoaded', () => {
    groupProducts = new GroupProducts();
    window.groupProducts = groupProducts;
});
