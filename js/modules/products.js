// Products Module - COMPLETE FIXED VERSION
class Products {
    constructor() {
        this.currentData = [];
        this.groupProducts = [];
        this.table = null;
        this.currentProductId = null;
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.outlets = [];
        this.isInitialized = false;
        console.log('✅ Products class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('Products already initialized');
            return;
        }

        console.log('🔄 Initializing Products module...');
        try {
            await this.loadOutlets();
            await this.loadGroupProducts();
            await this.loadData();
            this.initTable();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ Products module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Products:', error);
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
                    .order('outlet', { ascending: true });

                if (!error) {
                    this.outlets = data || [];
                }
            }
            console.log('Products outlets:', this.outlets);
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    // Load group products for dropdown
    async loadGroupProducts() {
        try {
            const { data, error } = await supabase
                .from('group_produk')
                .select('group')
                .eq('status', 'active')
                .order('group', { ascending: true });

            if (error) throw error;

            this.groupProducts = data || [];
            console.log('Loaded group products:', this.groupProducts);
        } catch (error) {
            console.error('Error loading group products:', error);
            this.groupProducts = [];
        }
    }

    // Load data from Supabase dengan filter
    async loadData(filters = {}) {
        try {
            Helpers.showLoading();
            console.log('Loading products data with filters:', filters);
            
            let query = supabase
                .from('produk')
                .select('*');

            // Apply filters
            if (filters.outlet) {
                query = query.eq('outlet', filters.outlet);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.inventory !== undefined && filters.inventory !== '') {
                query = query.eq('inventory', filters.inventory === 'true');
            }

            const { data, error } = await query.order('nama_produk', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            console.log('Loaded products:', this.currentData);
            
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading products data:', error);
            Notifications.error('Gagal memuat data produk: ' + error.message);
            return [];
        }
    }

    // Initialize table - FIXED VERSION
    initTable() {
        console.log('Initializing products table...');
        
        const columns = [
    { 
        title: 'Outlet', 
        key: 'outlet',
        formatter: (value) => `<span class="font-medium">${value || '-'}</span>`
    },
    { 
        title: 'Nama Produk', 
        key: 'nama_produk',
        formatter: (value) => `<span class="text-gray-900 font-semibold">${value || '-'}</span>`
    },
    { 
        title: 'Group Produk', 
        key: 'group_produk',
        formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
    },
    { 
        title: 'Foto', 
        key: 'foto_url',
        formatter: (value) => {
            if (!value) return '<span class="text-gray-400 text-sm">-</span>';
            return `
                <img src="${value}" alt="Produk" class="w-10 h-10 object-cover rounded-md cursor-pointer border" 
                     onclick="window.products.showImagePreview('${value}')">
            `;
        },
        width: '80px'
    },
    { 
        title: 'Harga Beli', 
        key: 'harga_beli',
        formatter: (value) => {
            if (!value) return 'Rp 0';
            return `Rp ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
        }
    },
    { 
        title: 'Harga Jual', 
        key: 'harga_jual',
        formatter: (value) => {
            if (!value) return 'Rp 0';
            return `Rp ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
        }
    },
    { 
        title: 'Stok', 
        key: 'stok',
        formatter: (value, row) => {
            // Jika stok NULL atau inventory nonaktif, tampilkan Unlimited
            if (value === null || value === undefined || !row.inventory) {
                return `
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        📦 Unlimited
                    </span>
                `;
            }
            return `
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
                    ${value || 0}
                </span>
            `;
        }
    },
    { 
        title: 'Inventory', 
        key: 'inventory',
        formatter: (value) => value ? 
            '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">✅ Aktif</span>' :
            '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">❌ Nonaktif</span>'
    },
    { 
        title: 'Status', 
        key: 'status',
        formatter: (value) => {
            const isActive = value === 'active';
            return `
                <span class="px-2 py-1 text-xs rounded-full ${
                    isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                }">
                    ${isActive ? '🟢 Aktif' : '🔴 Nonaktif'}
                </span>
            `;
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

        this.table = new DataTable('products-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            searchPlaceholder: 'Cari produk...'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Products table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('products-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-2">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Tidak ada data produk</p>
                    <button onclick="window.products.showForm()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Produk Pertama
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.nama_produk || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.group_produk || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${item.foto_url ? 
                            `<img src="${item.foto_url}" alt="Produk" class="w-10 h-10 object-cover rounded-md cursor-pointer border" onclick="window.products.showImagePreview('${item.foto_url}')">` : 
                            '<span class="text-gray-400">-</span>'
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${Helpers.formatNumber(item.harga_jual) || '0'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${item.stok === null || !item.inventory ? 
                            '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Unlimited</span>' : 
                            `<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">${item.stok}</span>`
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${item.inventory ? 
                            '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Aktif</span>' : 
                            '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Nonaktif</span>'
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        ${item.status === 'active' ? 
                            '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Aktif</span>' : 
                            '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Nonaktif</span>'
                        }
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
                    onclick="window.products.handleEdit('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="Edit Produk"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button 
                    onclick="window.products.handleDelete('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Hapus Produk"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Hapus
                </button>
            </div>
        `;
    }

    // Bind events dengan filter
    bindEvents() {
        console.log('Binding products events...');
        
        // Add button event
        const addBtn = document.getElementById('add-product');
        if (addBtn) {
            // Remove existing event listeners first
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-product');
            
            newAddBtn.addEventListener('click', () => {
                console.log('Add product button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add product button not found!');
        }

        // Filter events
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');
        const inventoryFilter = document.getElementById('inventory-filter');

        if (outletFilter) {
            outletFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (inventoryFilter) {
            inventoryFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    // Apply filters
    applyFilters() {
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');
        const inventoryFilter = document.getElementById('inventory-filter');

        const filters = {
            outlet: outletFilter ? outletFilter.value : '',
            status: statusFilter ? statusFilter.value : '',
            inventory: inventoryFilter ? inventoryFilter.value : ''
        };

        console.log('Applying filters:', filters);
        this.loadData(filters);
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

    // Upload image to Supabase Storage
    async uploadImage(file) {
    try {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // ✅ LANGSUNG DI ROOT BUCKET

        console.log('Uploading image to:', filePath);

        const { data, error } = await supabase.storage
            .from('produk')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('produk')
            .getPublicUrl(filePath);

        console.log('Image uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Gagal mengupload gambar: ' + error.message);
    }
}
    // Delete image from Supabase Storage
    async deleteImage(imageUrl) {
    try {
        if (!imageUrl) return;

        // Extract file name from URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${fileName}`; // ✅ LANGSUNG DI ROOT BUCKET

        console.log('Deleting image:', filePath);

        const { error } = await supabase.storage
            .from('produk')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting image:', error);
        } else {
            console.log('Image deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}
    // Handle file selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Notifications.error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Notifications.error('Ukuran file maksimal 5MB.');
            event.target.value = '';
            return;
        }

        this.selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreviewUrl = e.target.result;
            this.updateImagePreview();
        };
        reader.readAsDataURL(file);
    }

    // Update image preview
    updateImagePreview() {
        const previewContainer = document.getElementById('image-preview-container');
        const previewImg = document.getElementById('image-preview');
        const removeBtn = document.getElementById('remove-image-btn');

        if (previewContainer && previewImg) {
            if (this.imagePreviewUrl) {
                previewImg.src = this.imagePreviewUrl;
                previewContainer.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
            } else {
                previewContainer.classList.add('hidden');
                if (removeBtn) removeBtn.classList.add('hidden');
            }
        }
    }

    // Remove selected image
    removeImage() {
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.updateImagePreview();
        
        // Reset file input
        const fileInput = document.getElementById('foto_file');
        if (fileInput) fileInput.value = '';
    }

    // Show image preview in modal
    showImagePreview(imageUrl) {
        const content = `
            <div class="text-center">
                <img src="${imageUrl}" alt="Preview Produk" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                <div class="mt-4">
                    <a href="${imageUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        🔗 Buka gambar di tab baru
                    </a>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Tutup',
                onclick: () => modal.close(),
                primary: false
            }
        ];

        modal.createModal('Preview Foto Produk', content, buttons, { size: 'max-w-2xl' });
    }

    // Toggle stock input based on inventory checkbox
    toggleStockInput() {
        const inventoryCheckbox = document.getElementById('inventory-checkbox');
        const stokInput = document.getElementById('stok-input');
        const stokHelper = document.getElementById('stok-helper');
        const stokRequired = document.getElementById('stok-required');

        if (inventoryCheckbox && stokInput && stokHelper) {
            if (inventoryCheckbox.checked) {
                // Inventory AKTIF - Stok WAJIB diisi
                stokInput.readOnly = false;
                stokInput.required = true;
                stokInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
                stokInput.classList.add('bg-white');
                stokInput.value = stokInput.value || '0';
                stokHelper.textContent = 'Wajib diisi ketika inventory aktif';
                stokHelper.className = 'text-xs text-green-600 mt-1';
                if (stokRequired) stokRequired.classList.remove('hidden');
            } else {
                // Inventory NONAKTIF - Stok Unlimited (NULL)
                stokInput.readOnly = true;
                stokInput.required = false;
                stokInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                stokInput.classList.remove('bg-white');
                stokInput.value = '';
                stokHelper.textContent = 'Stok unlimited (inventory non-aktif)';
                stokHelper.className = 'text-xs text-gray-500 mt-1';
                if (stokRequired) stokRequired.classList.add('hidden');
            }
        }
    }

    // Validate form sebelum submit
    validateForm() {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        // Validasi mandatory fields
        const outlet = formData.get('outlet');
        const namaProduk = formData.get('nama_produk');
        const groupProduk = formData.get('group_produk');
        const hargaBeli = formData.get('harga_beli');
        const hargaJual = formData.get('harga_jual');
        const inventory = formData.get('inventory') === 'on';
        const stok = formData.get('stok');

        if (!outlet) {
            Notifications.error('Outlet harus dipilih');
            return false;
        }

        if (!namaProduk || namaProduk.trim() === '') {
            Notifications.error('Nama produk harus diisi');
            return false;
        }

        if (!groupProduk) {
            Notifications.error('Group produk harus dipilih');
            return false;
        }

        if (!hargaBeli || parseFloat(hargaBeli) < 0) {
            Notifications.error('Harga beli harus diisi dan tidak boleh negatif');
            return false;
        }

        if (!hargaJual || parseFloat(hargaJual) < 0) {
            Notifications.error('Harga jual harus diisi dan tidak boleh negatif');
            return false;
        }

        // Validasi stok khusus untuk inventory aktif
        if (inventory) {
            if (!stok || parseInt(stok) < 0) {
                Notifications.error('Stok harus diisi dan tidak boleh negatif ketika inventory aktif');
                return false;
            }
        }

        return true;
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Produk' : 'Tambah Produk';
        
        // Reset file state
        this.selectedFile = null;
        this.imagePreviewUrl = item ? item.foto_url : null;
        this.currentProductId = item ? item.id : null;

        // Determine initial stock value and inventory status
        const hasInventory = item ? item.inventory : false;
        const stockValue = item ? (hasInventory ? item.stok : '') : 0;

        const groupOptions = this.groupProducts.map(gp => 
            `<option value="${this.escapeHtml(gp.group)}" ${item && item.group_produk === gp.group ? 'selected' : ''}>${this.escapeHtml(gp.group)}</option>`
        ).join('');

        const outletOptions = this.outlets.map(outlet => 
            `<option value="${this.escapeHtml(outlet.outlet)}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>${this.escapeHtml(outlet.outlet)}</option>`
        ).join('');

        const content = `
            <div class="space-y-4">
                <form id="product-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
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
                                Nama Produk <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="nama_produk" 
                                value="${item ? this.escapeHtml(item.nama_produk) : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                placeholder="Masukkan nama produk"
                                maxlength="100"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Group Produk <span class="text-red-500">*</span>
                            </label>
                            <select 
                                name="group_produk" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                            >
                                <option value="">Pilih Group</option>
                                ${groupOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Stok <span id="stok-required" class="text-red-500 ${!hasInventory ? 'hidden' : ''}">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="stok" 
                                value="${stockValue}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${!hasInventory ? 'bg-gray-100 cursor-not-allowed' : ''}"
                                ${!hasInventory ? 'readonly' : 'required'}
                                id="stok-input"
                                min="0"
                                placeholder="${!hasInventory ? 'Unlimited' : 'Masukkan stok'}"
                            >
                            <p id="stok-helper" class="text-xs ${!hasInventory ? 'text-gray-500' : 'text-green-600'} mt-1">
                                ${!hasInventory ? 'Stok unlimited (inventory non-aktif)' : 'Wajib diisi ketika inventory aktif'}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Harga Beli <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="harga_beli" 
                                value="${item ? item.harga_beli : 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Harga Jual <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="harga_jual" 
                                value="${item ? item.harga_jual : 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Komisi</label>
                            <input 
                                type="number" 
                                name="komisi" 
                                value="${item ? item.komisi : 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                min="0"
                                step="0.01"
                                placeholder="0"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Point</label>
                            <input 
                                type="number" 
                                name="point" 
                                value="${item ? item.point : 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                min="0"
                                placeholder="0"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    name="inventory" 
                                    ${hasInventory ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    id="inventory-checkbox"
                                    onchange="window.products.toggleStockInput()"
                                >
                                <span class="ml-2 text-sm text-gray-700">Inventory (Stock Management)</span>
                            </label>
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    name="redeemable" 
                                    ${item && item.redeemable ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                >
                                <span class="ml-2 text-sm text-gray-700">Redeemable</span>
                            </label>
                        </div>
                    </div>

                    <!-- File Upload Section -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Foto Produk</label>
                        <div class="space-y-3">
                            <!-- File Input -->
                            <input 
                                type="file" 
                                id="foto_file"
                                name="foto_file" 
                                accept="image/*"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onchange="window.products.handleFileSelect(event)"
                            >
                            
                            <!-- Image Preview -->
                            <div id="image-preview-container" class="${this.imagePreviewUrl ? '' : 'hidden'}">
                                <div class="border border-gray-300 rounded-md p-3 bg-gray-50">
                                    <p class="text-sm text-gray-600 mb-2">Preview:</p>
                                    <div class="flex items-center space-x-4">
                                        <img id="image-preview" src="${this.imagePreviewUrl || ''}" 
                                             alt="Preview" class="w-20 h-20 object-cover rounded-md border">
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-600">File akan diupload ke Supabase Storage</p>
                                            <button type="button" id="remove-image-btn" 
                                                    onclick="window.products.removeImage()"
                                                    class="mt-2 text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                                                Hapus Gambar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-500">
                                Format yang didukung: JPEG, PNG, GIF, WebP. Maksimal 5MB.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select 
                            name="status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            <option value="active" ${item && item.status === 'active' ? 'selected' : ''}>🟢 Aktif</option>
                            <option value="inactive" ${item && item.status === 'inactive' ? 'selected' : ''}>🔴 Nonaktif</option>
                        </select>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <p class="text-xs text-gray-500">
                            <span class="text-red-500">*</span> Menandakan field yang wajib diisi
                        </p>
                    </div>
                </form>
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
                        this.validateAndUpdate(item.id);
                    } else {
                        this.validateAndSave();
                    }
                },
                primary: true
            }
        ];

        modal.createModal(title, content, buttons, { 
            size: 'max-w-2xl',
            customClass: 'product-modal'
        });
        
        // Update preview after modal is created
        setTimeout(() => this.updateImagePreview(), 100);
        
        // Initialize stock input state
        setTimeout(() => this.toggleStockInput(), 150);
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Validate and save new product
    async validateAndSave() {
        if (!this.validateForm()) {
            return;
        }
        await this.save();
    }

    // Validate and update product
    async validateAndUpdate(id) {
        if (!this.validateForm()) {
            return;
        }
        await this.update(id);
    }

    // Save new product
    async save() {
        try {
            const form = document.getElementById('product-form');
            const formData = new FormData(form);
            
            // Create data object
            const data = {
                outlet: formData.get('outlet'),
                nama_produk: formData.get('nama_produk'),
                group_produk: formData.get('group_produk'),
                stok: parseInt(formData.get('stok')) || 0,
                harga_beli: parseFloat(formData.get('harga_beli')) || 0,
                harga_jual: parseFloat(formData.get('harga_jual')) || 0,
                komisi: parseFloat(formData.get('komisi')) || 0,
                point: parseFloat(formData.get('point')) || 0,
                inventory: formData.get('inventory') === 'on',
                redeemable: formData.get('redeemable') === 'on',
                status: formData.get('status')
            };

            // Handle inventory logic
            if (data.inventory) {
                // Inventory AKTIF - gunakan stok yang diinput user
                if (data.stok <= 0) {
                    Notifications.error('Stok harus diisi ketika inventory aktif');
                    return;
                }
            } else {
                // Inventory NONAKTIF - set stok NULL (unlimited)
                data.stok = null;
            }

            console.log('Saving product data:', data);

            // Upload image if selected
            if (this.selectedFile) {
                console.log('Uploading new image...');
                const fotoUrl = await this.uploadImage(this.selectedFile);
                data.foto_url = fotoUrl;
                console.log('Image uploaded, URL:', fotoUrl);
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('produk')
                .insert([data])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Produk berhasil ditambahkan!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Save product error:', error);
            Notifications.error('Gagal menambah produk: ' + error.message);
        }
    }

    // Edit product
    edit(id) {
        console.log('Editing product:', id);
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            console.log('Found item for editing:', item);
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            Notifications.error('Data tidak ditemukan untuk diedit');
        }
    }

    // Update product
    async update(id) {
        try {
            const form = document.getElementById('product-form');
            const formData = new FormData(form);
            
            // Create data object
            const data = {
                outlet: formData.get('outlet'),
                nama_produk: formData.get('nama_produk'),
                group_produk: formData.get('group_produk'),
                stok: parseInt(formData.get('stok')) || 0,
                harga_beli: parseFloat(formData.get('harga_beli')) || 0,
                harga_jual: parseFloat(formData.get('harga_jual')) || 0,
                komisi: parseFloat(formData.get('komisi')) || 0,
                point: parseFloat(formData.get('point')) || 0,
                inventory: formData.get('inventory') === 'on',
                redeemable: formData.get('redeemable') === 'on',
                status: formData.get('status')
            };

            // Handle inventory logic
            if (data.inventory) {
                // Inventory AKTIF - gunakan stok yang diinput user
                if (data.stok <= 0) {
                    Notifications.error('Stok harus diisi ketika inventory aktif');
                    return;
                }
            } else {
                // Inventory NONAKTIF - set stok NULL (unlimited)
                data.stok = null;
            }

            console.log('Updating product data:', data);

            // Upload new image if selected
            if (this.selectedFile) {
                console.log('Uploading new image for update...');
                
                // Delete old image if exists
                const oldItem = this.currentData.find(d => d.id === id);
                if (oldItem && oldItem.foto_url) {
                    await this.deleteImage(oldItem.foto_url);
                }
                
                // Upload new image
                const fotoUrl = await this.uploadImage(this.selectedFile);
                data.foto_url = fotoUrl;
                console.log('New image uploaded, URL:', fotoUrl);
            }

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('produk')
                .update(data)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Produk berhasil diupdate!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Update product error:', error);
            Notifications.error('Gagal mengupdate produk: ' + error.message);
        }
    }

    // Delete product
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
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Produk?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus produk <strong>"${this.escapeHtml(item.nama_produk)}"</strong> dari outlet <strong>"${this.escapeHtml(item.outlet)}"</strong>. 
                    ${item.foto_url ? 'Foto produk juga akan dihapus dari storage.' : ''}
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
            console.log('Confirming delete for:', id);
            const item = this.currentData.find(d => d.id === id);
            
            Helpers.showLoading();

            // Delete image from storage if exists
            if (item && item.foto_url) {
                await this.deleteImage(item.foto_url);
            }

            const { error } = await supabase
                .from('produk')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Produk berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting product:', error);
            
            if (error.code === '23503') {
                Notifications.error('Tidak dapat menghapus produk karena masih digunakan di transaksi lain');
            } else {
                Notifications.error('Gagal menghapus produk: ' + error.message);
            }
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing products data...');
        await this.loadData();
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up products module...');
        this.isInitialized = false;
        this.table = null;
    }
}

// Initialize products globally - FIXED VERSION
let products = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for products module...');
    
    // Hanya inisialisasi jika di halaman yang memiliki products
    if (document.getElementById('products-table')) {
        console.log('🔄 Initializing products module from DOM...');
        products = new Products();
        window.products = products;
        
        // Tunggu app.js selesai inisialisasi
        setTimeout(() => {
            if (window.app && typeof window.app.initModule === 'function') {
                console.log('✅ App ready, products module registered');
            }
        }, 100);
    }
});

// Export untuk compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Products;
}
