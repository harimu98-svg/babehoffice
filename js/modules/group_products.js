// Group Products Module - COMPLETE FIXED WITH BIDIRECTIONAL AUTO-UPDATE
class GroupProducts {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
        this.isInitialized = false;
        this.isLoading = false;
        console.log('✅ GroupProducts class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('GroupProducts already initialized');
            return;
        }

        console.log('🔄 Initializing GroupProducts module...');
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

    // Load data from Supabase dengan hitung jumlah produk (OPTIMIZED)
    async loadData() {
        if (this.isLoading) {
            console.log('Already loading data...');
            return;
        }

        try {
            this.isLoading = true;
            Helpers.showLoading();
            console.log('Loading group products data...');
            
            // Ambil data group (Query 1)
            const { data: groupData, error } = await supabase
                .from('group_produk')
                .select('*')
                .order('group', { ascending: true });

            if (error) throw error;

            if (!groupData || groupData.length === 0) {
                this.currentData = [];
                if (this.table) this.table.updateData([]);
                Helpers.hideLoading();
                this.isLoading = false;
                return [];
            }

            // Ambil semua produk aktif sekaligus (Query 2 - optimasi)
            const { data: productsData, error: productsError } = await supabase
                .from('produk')
                .select('group_produk, outlet, status');

            if (productsError) {
                console.error('Error loading products:', productsError);
            }

            // Hitung jumlah produk per group
            const productCountMap = new Map();
            const activeProductCountMap = new Map();
            
            if (productsData) {
                productsData.forEach(product => {
                    const key = `${product.outlet}|${product.group_produk}`;
                    // Total produk
                    productCountMap.set(key, (productCountMap.get(key) || 0) + 1);
                    
                    // Hanya produk active
                    if (product.status === 'active') {
                        activeProductCountMap.set(key, (activeProductCountMap.get(key) || 0) + 1);
                    }
                });
            }

            // Gabungkan data group dengan jumlah produk
            const enrichedData = groupData.map(group => {
                const key = `${group.outlet}|${group.group}`;
                const totalProducts = productCountMap.get(key) || 0;
                const activeProducts = activeProductCountMap.get(key) || 0;
                
                return {
                    ...group,
                    product_count: totalProducts,
                    active_product_count: activeProducts,
                    has_active_products: activeProducts > 0
                };
            });

            this.currentData = enrichedData || [];
            console.log(`✅ Loaded ${this.currentData.length} groups with product counts`);
            
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            this.isLoading = false;
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            this.isLoading = false;
            console.error('❌ Error loading group products data:', error);
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
                key: 'product_count',
                formatter: (value, row) => {
                    const total = value || 0;
                    const active = row.active_product_count || 0;
                    
                    let bgColor = 'bg-gray-100 text-gray-600';
                    let icon = '⚪';
                    
                    if (total > 0) {
                        if (active === total) {
                            bgColor = 'bg-green-100 text-green-800 border border-green-200';
                            icon = '✅';
                        } else if (active > 0) {
                            bgColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                            icon = '⚠️';
                        } else {
                            bgColor = 'bg-gray-100 text-gray-600 border border-gray-200';
                            icon = '📦';
                        }
                    }
                    
                    return `
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${bgColor}" title="${active} aktif dari ${total} total">
                            ${icon} ${total} Produk (${active} aktif)
                        </span>
                    `;
                }
            },
            { 
                title: 'Status', 
                key: 'status',
                formatter: (value, row) => {
                    const isActive = value === 'active';
                    const hasProducts = row.product_count > 0;
                    const hasActiveProducts = row.active_product_count > 0;
                    
                    // Tampilkan warning jika ada inkonsistensi
                    let warningIcon = '';
                    if (isActive && hasProducts && !hasActiveProducts) {
                        warningIcon = '<span class="ml-1 text-yellow-500" title="Group aktif tapi tidak ada produk aktif">⚠️</span>';
                    } else if (!isActive && hasActiveProducts) {
                        warningIcon = '<span class="ml-1 text-red-500" title="Group nonaktif tapi masih ada produk aktif">🔴</span>';
                    }
                    
                    return `
                        <span class="px-3 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                            isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }">
                            ${isActive ? '🟢 Aktif' : '🔴 Nonaktif'} ${warningIcon}
                        </span>
                    `;
                },
                width: '140px'
            },
            {
                title: 'Aksi',
                key: 'id',
                formatter: (id, row) => this.getActionButtons(id, row),
                width: '120px'
            }
        ];

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
        console.log('✅ Group products table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('group-products-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-gray-400 mb-3">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                    </div>
                    <p class="text-gray-500 text-lg mb-4">Belum ada group produk</p>
                    <button onclick="window.groupProducts.showForm()" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        Tambah Group Pertama
                    </button>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
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
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        this.currentData.forEach(item => {
            const total = item.product_count || 0;
            const active = item.active_product_count || 0;
            
            let countBgColor = 'bg-gray-100 text-gray-600';
            let countIcon = '⚪';
            
            if (total > 0) {
                if (active === total) {
                    countBgColor = 'bg-green-100 text-green-800';
                    countIcon = '✅';
                } else if (active > 0) {
                    countBgColor = 'bg-yellow-100 text-yellow-800';
                    countIcon = '⚠️';
                } else {
                    countBgColor = 'bg-gray-100 text-gray-600';
                    countIcon = '📦';
                }
            }
            
            const isActive = item.status === 'active';
            const statusBgColor = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            
            let statusIcon = isActive ? '🟢 Aktif' : '🔴 Nonaktif';
            let warningIcon = '';
            
            if (isActive && total > 0 && active === 0) {
                warningIcon = ' ⚠️';
            } else if (!isActive && active > 0) {
                warningIcon = ' 🔴';
            }

            tableHTML += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${this.escapeHtml(item.outlet) || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.escapeHtml(item.group) || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${countBgColor}" title="${active} aktif dari ${total} total">
                            ${countIcon} ${total} Produk (${active} aktif)
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${statusBgColor}">
                            ${statusIcon}${warningIcon}
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
        
        const addBtn = document.getElementById('add-group-product');
        if (addBtn) {
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-group-product');
            newAddBtn.addEventListener('click', () => {
                console.log('Add group product button clicked');
                this.showForm();
            });
            console.log('✅ Add button event bound');
        } else {
            console.error('❌ Add button not found!');
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
        
        // Generate outlet options
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${this.escapeHtml(outlet.outlet)}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>
                ${this.escapeHtml(outlet.outlet)}
            </option>`
        ).join('');

        const currentOutlet = item ? item.outlet : '';
        const currentGroup = item ? item.group : '';
        const currentStatus = item ? item.status : 'active';

        // Tampilkan warning jika edit group yang memiliki produk
        const hasProducts = item?.product_count > 0;
        const activeProducts = item?.active_product_count || 0;
        
        let warningMessage = '';
        if (isEdit && hasProducts) {
            if (currentStatus === 'active') {
                warningMessage = `
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-700">
                                    <strong>Informasi:</strong> Group ini memiliki <strong>${item.product_count} produk</strong> 
                                    (${activeProducts} aktif). Perubahan status akan mempengaruhi semua produk.
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            } else if (currentStatus === 'inactive' && activeProducts > 0) {
                warningMessage = `
                    <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-red-700">
                                    <strong>INKONSISTENSI:</strong> Group nonaktif tapi masih memiliki 
                                    <strong>${activeProducts} produk aktif</strong>!
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        const content = `
            <div class="space-y-4">
                ${warningMessage}
                <form id="group-product-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Outlet <span class="text-red-500">*</span>
                        </label>
                        <select 
                            name="outlet" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            required
                        >
                            <option value="">Pilih Outlet</option>
                            ${outletOptions}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Nama Group Produk <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="group" 
                            value="${this.escapeHtml(currentGroup)}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Contoh: Hair Care, Styling, dll."
                            required
                            maxlength="100"
                        >
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
                        <p class="text-xs text-gray-500 mt-1">
                            ${hasProducts ? '⚠️ Perubahan status akan mensinkronisasi semua produk dalam group ini' : ''}
                        </p>
                    </div>
                </form>
            </div>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: () => modal.close(),
                primary: false
            },
            {
                text: isEdit ? 'Update Data' : 'Simpan Data',
                onclick: () => {
                    if (isEdit) {
                        this.update(item.id);
                    } else {
                        this.save();
                    }
                },
                primary: true
            }
        ];

        modal.createModal(title, content, buttons, { 
            size: 'max-w-md',
            customClass: 'group-product-modal'
        });

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
            const form = document.getElementById('group-product-form');
            if (!form) throw new Error('Form tidak ditemukan');

            const formData = new FormData(form);
            const data = {
                outlet: formData.get('outlet')?.trim(),
                group: formData.get('group')?.trim(),
                status: formData.get('status') || 'active'
            };

            // Validasi
            if (!data.outlet || !data.group) {
                Notifications.error('Outlet dan Group Produk harus diisi');
                return;
            }

            if (data.group.length > 100) {
                Notifications.error('Nama group produk maksimal 100 karakter');
                return;
            }

            // Cek duplikasi
            const isDuplicate = this.currentData.some(item => 
                item.outlet === data.outlet && 
                item.group.toLowerCase() === data.group.toLowerCase()
            );

            if (isDuplicate) {
                Notifications.error('Group produk dengan nama tersebut sudah ada di outlet ini');
                return;
            }

            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .insert([data]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Group produk sudah ada');
                }
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('✅ Group produk berhasil ditambahkan!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving:', error);
            Notifications.error('Gagal menambah: ' + error.message);
        }
    }

    // Edit group product
    edit(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            this.showForm(item);
        } else {
            Notifications.error('Data tidak ditemukan');
        }
    }

    // Update group product - WITH BIDIRECTIONAL AUTO-UPDATE PRODUCTS (FIXED)
    async update(id) {
        try {
            const form = document.getElementById('group-product-form');
            if (!form) throw new Error('Form tidak ditemukan');

            const formData = new FormData(form);
            const newData = {
                outlet: formData.get('outlet')?.trim(),
                group: formData.get('group')?.trim(),
                status: formData.get('status') || 'active'
            };

            // Validasi
            if (!newData.outlet || !newData.group) {
                Notifications.error('Outlet dan Group Produk harus diisi');
                return;
            }

            if (newData.group.length > 100) {
                Notifications.error('Nama group produk maksimal 100 karakter');
                return;
            }

            // Dapatkan data lama
            const oldData = this.currentData.find(d => d.id === id);
            if (!oldData) {
                Notifications.error('Data tidak ditemukan');
                return;
            }

            // Cek duplikasi jika ada perubahan
            if (oldData.group !== newData.group || oldData.outlet !== newData.outlet) {
                const isDuplicate = this.currentData.some(item => 
                    item.id !== id && 
                    item.outlet === newData.outlet && 
                    item.group.toLowerCase() === newData.group.toLowerCase()
                );

                if (isDuplicate) {
                    Notifications.error('Group produk sudah ada di outlet ini');
                    return;
                }
            }

            // Konfirmasi jika akan mempengaruhi banyak produk
            const totalProducts = oldData.product_count || 0;
            if (totalProducts > 0 && oldData.status !== newData.status) {
                const action = newData.status === 'active' ? 'mengaktifkan' : 'menonaktifkan';
                const confirmMessage = `
                    <div class="text-center">
                        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                            <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Konfirmasi Perubahan Status</h3>
                        <p class="text-sm text-gray-600 mb-3">
                            Anda akan <strong>${action}</strong> group <strong>"${oldData.group}"</strong>.
                        </p>
                        <p class="text-sm text-gray-600 mb-4">
                            Group ini memiliki <strong>${totalProducts} produk</strong> yang akan ikut ${action} secara otomatis.
                        </p>
                        <p class="text-sm font-medium text-gray-700 mb-4">
                            Lanjutkan?
                        </p>
                    </div>
                `;

                const userConfirmed = await new Promise((resolve) => {
                    modal.showConfirm(
                        confirmMessage,
                        () => resolve(true),
                        () => resolve(false),
                        'Ya, Lanjutkan',
                        'Batal'
                    );
                });

                if (!userConfirmed) {
                    console.log('User cancelled update');
                    return;
                }
            }

            Helpers.showLoading();

            // START TRANSACTION
            try {
                // 1. Update group produk
                const { error: groupError } = await supabase
                    .from('group_produk')
                    .update({
                        outlet: newData.outlet,
                        group: newData.group,
                        status: newData.status
                    })
                    .eq('id', id);

                if (groupError) throw groupError;

                // 2. Jika status BERUBAH, sinkronkan semua produk dalam group
                if (oldData.status !== newData.status) {
                    console.log(`⚠️ Status group berubah: ${oldData.status} → ${newData.status}`);
                    console.log(`Mengupdate semua produk dalam group: ${oldData.group}`);
                    
                    const { error: productsError, data: updatedProducts } = await supabase
                        .from('produk')
                        .update({ 
                            status: newData.status, // IKUTI STATUS GROUP
                            updated_at: new Date().toISOString()
                        })
                        .eq('group_produk', oldData.group)
                        .eq('outlet', oldData.outlet);

                    if (productsError) {
                        console.error('❌ Gagal mengupdate produk:', productsError);
                        Notifications.warning('Group berhasil diupdate, tapi gagal mengupdate produk');
                    } else {
                        console.log(`✅ Semua produk dalam group berhasil diupdate ke status: ${newData.status}`);
                    }
                }

                // 3. Jika nama/outlet group berubah, update referensi di produk
                if (oldData.group !== newData.group || oldData.outlet !== newData.outlet) {
                    console.log('⚠️ Mengupdate referensi group di produk...');
                    
                    const { error: updateRefError } = await supabase
                        .from('produk')
                        .update({ 
                            group_produk: newData.group,
                            outlet: newData.outlet,
                            updated_at: new Date().toISOString()
                        })
                        .eq('group_produk', oldData.group)
                        .eq('outlet', oldData.outlet);

                    if (updateRefError) {
                        console.error('❌ Gagal mengupdate referensi produk:', updateRefError);
                        Notifications.warning('Group berhasil diupdate, tapi gagal mengupdate referensi produk');
                    } else {
                        console.log('✅ Referensi produk berhasil diupdate');
                    }
                }

                // 4. Tutup modal
                modal.close();
                
                // 5. Refresh data group
                await this.loadData();
                
                // 6. Refresh produk module jika ada
                if (window.products && typeof window.products.refresh === 'function') {
                    await window.products.refresh();
                }

                // 7. Notifikasi sukses
                if (oldData.status !== newData.status && totalProducts > 0) {
                    const action = newData.status === 'active' ? 'diaktifkan' : 'dinonaktifkan';
                    Notifications.success(`✅ Group berhasil ${action}. ${totalProducts} produk ikut ${action}.`);
                } else {
                    Notifications.success('✅ Group produk berhasil diupdate!');
                }

            } catch (error) {
                Helpers.hideLoading();
                console.error('Error in transaction:', error);
                Notifications.error('Gagal mengupdate: ' + error.message);
            }

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating:', error);
            Notifications.error('Gagal mengupdate: ' + error.message);
        }
    }

    // Delete group product
    async delete(id) {
        const item = this.currentData.find(d => d.id === id);
        if (!item) {
            Notifications.error('Data tidak ditemukan');
            return;
        }

        // Cek apakah masih ada produk yang menggunakan group ini
        if (item.product_count > 0) {
            Notifications.error(`Tidak dapat menghapus: masih ada ${item.product_count} produk dalam group ini`);
            return;
        }

        const confirmMessage = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Group Produk?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus group <strong>"${this.escapeHtml(item.group)}"</strong>.<br>
                    Tindakan ini tidak dapat dibatalkan.
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
            Helpers.showLoading();

            const { error } = await supabase
                .from('group_produk')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadData();
            Notifications.success('✅ Group produk berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting:', error);
            
            if (error.code === '23503') {
                Notifications.error('Tidak dapat menghapus: group masih digunakan');
            } else {
                Notifications.error('Gagal menghapus: ' + error.message);
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
        this.currentData = [];
    }
}

// Initialize group products globally
let groupProducts = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for group products module...');
    
    if (document.getElementById('group-products-table')) {
        console.log('🔄 Initializing group products module...');
        groupProducts = new GroupProducts();
        window.groupProducts = groupProducts;
        
        setTimeout(() => {
            groupProducts.init();
        }, 100);
    }
});
