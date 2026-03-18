// Group Products Module - WITH AUTO-UPDATE PRODUCTS
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
        
        // Ambil data group
        const { data: groupData, error } = await supabase
            .from('group_produk')
            .select('*')
            .order('group', { ascending: true });

        if (error) throw error;

        // Untuk setiap group, hitung jumlah produk aktif
        const enrichedData = [];
        for (const group of groupData) {
            const { count, error: countError } = await supabase
                .from('produk')
                .select('*', { count: 'exact', head: true })
                .eq('group_produk', group.group)
                .eq('outlet', group.outlet)
                .eq('status', 'active');

            if (countError) {
                console.error('Error counting products:', countError);
            }

            enrichedData.push({
                ...group,
                product_count: count || 0
            });
        }

        this.currentData = enrichedData || [];
        console.log('Loaded group products with counts:', this.currentData);
        
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
            formatter: (value) => `<span class="font-medium">${value || '-'}</span>`
        },
        { 
            title: 'Group Produk', 
            key: 'group',
            formatter: (value) => `<span class="text-gray-900">${value || '-'}</span>`
        },
        { 
            title: 'Jumlah Produk', 
            key: 'product_count', // Langsung pakai field yang sudah dihitung
            formatter: (value) => {
                const count = value || 0;
                const bgColor = count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
                return `<span class="px-2 py-1 text-xs rounded-full ${bgColor}">${count} Produk</span>`;
            }
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

    // Hitung jumlah produk aktif dalam group
    async countActiveProducts(groupName, outlet) {
        try {
            const { count, error } = await supabase
                .from('produk')
                .select('*', { count: 'exact', head: true })
                .eq('group_produk', groupName)
                .eq('outlet', outlet)
                .eq('status', 'active');

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error counting products:', error);
            return 0;
        }
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

        // Render fallback table secara synchronous dulu, count akan diupdate via async terpisah
        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="group-products-tbody">
        `;

        this.currentData.forEach(item => {
            tableHTML += `
                <tr id="group-row-${item.id}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.outlet || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.group || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm" id="product-count-${item.id}">
                        <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Loading...</span>
                    </td>
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

        // Update count secara async
        this.currentData.forEach(async (item) => {
            const count = await this.countActiveProducts(item.group, item.outlet);
            const countCell = document.getElementById(`product-count-${item.id}`);
            if (countCell) {
                countCell.innerHTML = `<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${count} Produk</span>`;
            }
        });
    }

    // Get action buttons HTML
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
                                <p class="mt-1 font-medium">Jika group dinonaktifkan, semua produk aktif dalam group ini akan otomatis dinonaktifkan.</p>
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

            // Cek duplikasi
            const isDuplicate = this.currentData.some(item => 
                item.outlet === data.outlet && 
                item.group.toLowerCase() === data.group.trim().toLowerCase()
            );

            if (isDuplicate) {
                Notifications.error('Group produk dengan nama tersebut sudah ada di outlet ini');
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

    // Update group product - WITH AUTO-UPDATE PRODUCTS
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

            // Dapatkan data group sebelum update untuk perbandingan
            const oldGroupData = this.currentData.find(d => d.id === id);
            if (!oldGroupData) {
                Notifications.error('Data group tidak ditemukan');
                return;
            }

            // Cek duplikasi jika nama group berubah
            if (oldGroupData.group !== data.group.trim() || oldGroupData.outlet !== data.outlet) {
                const isDuplicate = this.currentData.some(item => 
                    item.id !== id && // exclude current item
                    item.outlet === data.outlet && 
                    item.group.toLowerCase() === data.group.trim().toLowerCase()
                );

                if (isDuplicate) {
                    Notifications.error('Group produk dengan nama tersebut sudah ada di outlet ini');
                    return;
                }
            }

            // HITUNG JUMLAH PRODUK YANG AKAN TERDAMPAK (jika status berubah)
            let affectedProductsCount = 0;
            if (oldGroupData.status === 'active' && data.status === 'inactive') {
                const { count, error: countError } = await supabase
                    .from('produk')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_produk', oldGroupData.group)
                    .eq('outlet', oldGroupData.outlet)
                    .eq('status', 'active');

                if (!countError) {
                    affectedProductsCount = count || 0;
                }

                // Jika ada produk yang terdampak, tampilkan konfirmasi
                if (affectedProductsCount > 0) {
                    const confirmMessage = `
                        <div class="text-center">
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Konfirmasi Perubahan Status</h3>
                            <p class="text-sm text-gray-600 mb-3">
                                Group produk <strong>"${oldGroupData.group}"</strong> akan dinonaktifkan.
                            </p>
                            <p class="text-sm text-gray-600 mb-3">
                                Terdapat <strong class="text-red-600">${affectedProductsCount} produk</strong> dengan status Aktif yang menggunakan group ini.
                            </p>
                            <p class="text-sm font-medium text-gray-700 mb-4">
                                Produk-produk tersebut akan otomatis dinonaktifkan. Lanjutkan?
                            </p>
                        </div>
                    `;

                    // Tampilkan konfirmasi menggunakan Promise
                    const userConfirmed = await new Promise((resolve) => {
                        modal.showConfirm(
                            confirmMessage,
                            () => resolve(true), // User setuju
                            () => resolve(false), // User batal
                            'Ya, Nonaktifkan',
                            'Batal'
                        );
                    });

                    if (!userConfirmed) {
                        console.log('User cancelled update due to affected products');
                        return;
                    }
                }
            }

            Helpers.showLoading();

            // START TRANSACTION (simulasi dengan sequential updates)
            try {
                // 1. Update group produk
                const { data: result, error } = await supabase
                    .from('group_produk')
                    .update({
                        outlet: data.outlet.trim(),
                        group: data.group.trim(),
                        status: data.status || 'active'
                    })
                    .eq('id', id)
                    .select();

                if (error) throw error;

                console.log('Group update successful:', result);

                // 2. Jika status berubah dari active menjadi inactive, update semua produk terkait
                if (oldGroupData.status === 'active' && data.status === 'inactive') {
                    console.log('⚠️ Group status changed to inactive, updating related products...');
                    
                    if (affectedProductsCount > 0) {
                        const { error: productsError, data: updatedProducts } = await supabase
                            .from('produk')
                            .update({ 
                                status: 'inactive',
                                updated_at: new Date().toISOString()
                            })
                            .eq('group_produk', oldGroupData.group)
                            .eq('outlet', oldGroupData.outlet)
                            .eq('status', 'active')
                            .select();

                        if (productsError) {
                            console.error('❌ Error updating related products:', productsError);
                            Notifications.warning('Group berhasil diupdate, tetapi gagal mengupdate produk terkait');
                        } else {
                            console.log(`✅ Successfully updated ${updatedProducts?.length || 0} related products to inactive`);
                            console.log('Updated products:', updatedProducts);
                        }
                    }
                }

                // 3. Jika nama group berubah, update semua produk yang menggunakan group lama
                if (oldGroupData.group !== data.group.trim() || oldGroupData.outlet !== data.outlet) {
                    console.log('⚠️ Group name/outlet changed, updating related products...');
                    
                    const { error: productsError, data: updatedProducts } = await supabase
                        .from('produk')
                        .update({ 
                            group_produk: data.group.trim(),
                            outlet: data.outlet.trim(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('group_produk', oldGroupData.group)
                        .eq('outlet', oldGroupData.outlet);

                    if (productsError) {
                        console.error('❌ Error updating products with new group name:', productsError);
                        Notifications.warning('Group berhasil diupdate, tetapi gagal mengupdate nama group di produk terkait');
                    } else {
                        console.log(`✅ Successfully updated products with new group name/outlet`);
                    }
                }

                // 4. Tutup modal dan refresh data
                modal.close();
                
                // 5. Refresh data group
                await this.loadData();
                
                // 6. Refresh products module jika ada
                if (window.products && typeof window.products.refresh === 'function') {
                    console.log('Refreshing products module...');
                    await window.products.refresh();
                }

                // 7. Tampilkan notifikasi sukses
                if (oldGroupData.status === 'active' && data.status === 'inactive' && affectedProductsCount > 0) {
                    Notifications.success(`Group berhasil dinonaktifkan. ${affectedProductsCount} produk turut dinonaktifkan.`);
                } else {
                    Notifications.success('Group produk berhasil diupdate!');
                }

            } catch (error) {
                Helpers.hideLoading();
                console.error('Error in update transaction:', error);
                Notifications.error('Gagal mengupdate data: ' + error.message);
            }

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating group product:', error);
            Notifications.error('Gagal mengupdate group produk: ' + error.message);
        }
    }

    // Delete group product
    async delete(id) {
        console.log('Delete button clicked for ID:', id);
        
        const item = this.currentData.find(d => d.id === id);
        if (!item) {
            console.error('Item not found for deletion:', id);
            Notifications.error('Data tidak ditemukan');
            return;
        }

        console.log('Showing confirmation for:', item);
        
        // Cek apakah masih ada produk yang menggunakan group ini
        const { count, error: countError } = await supabase
            .from('produk')
            .select('*', { count: 'exact', head: true })
            .eq('group_produk', item.group)
            .eq('outlet', item.outlet);

        if (countError) {
            console.error('Error checking products count:', countError);
        }

        let warningMessage = '';
        if (count > 0) {
            warningMessage = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                <strong class="font-medium">Peringatan:</strong> Masih ada ${count} produk yang menggunakan group ini. Group tidak dapat dihapus jika masih digunakan.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const confirmMessage = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Group Produk?</h3>
                ${warningMessage}
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus group produk <strong>"${this.escapeHtml(item.group)}"</strong> dari outlet <strong>"${this.escapeHtml(item.outlet)}"</strong>. Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
        `;

        if (count > 0) {
            Notifications.error('Tidak dapat menghapus group yang masih memiliki produk');
            return;
        }

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
