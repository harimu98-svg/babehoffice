// Products Module
class Products {
    constructor() {
        this.currentData = [];
        this.groupProducts = [];
        this.table = null;
        this.currentProductId = null;
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.outlets = [];
    }

    // Initialize module
    async init() {
        await this.loadOutlets();
        await this.loadGroupProducts();
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
        console.log('Products outlets:', this.outlets);
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
        } catch (error) {
            console.error('Error loading group products:', error);
            this.groupProducts = [];
        }
    }

    // Load data from Supabase dengan filter
    async loadData(filters = {}) {
        try {
            Helpers.showLoading();
            
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
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal memuat data produk: ' + error.message);
            return [];
        }
    }

    // Initialize table
    initTable() {
        this.table = new DataTable('products-table', {
            columns: [
                { title: 'Outlet', key: 'outlet' },
                { title: 'Nama Produk', key: 'nama_produk' },
                { title: 'Group Produk', key: 'group_produk' },
                { 
                    title: 'Foto', 
                    key: 'foto_url',
                    formatter: (value) => {
                        if (!value) return '<span class="text-gray-400">-</span>';
                        return `
                            <img src="${value}" alt="Produk" class="w-10 h-10 object-cover rounded-md cursor-pointer" 
                                 onclick="products.showImagePreview('${value}')">
                        `;
                    }
                },
                { 
                    title: 'Harga Jual', 
                    key: 'harga_jual',
                    type: 'currency'
                },
                { 
                    title: 'Stok', 
                    key: 'stok',
                    formatter: (value, row) => {
                        // Jika stok NULL atau inventory nonaktif, tampilkan Unlimited
                        if (value === null || value === undefined || !row.inventory) {
                            return `
                                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Unlimited
                                </span>
                            `;
                        }
                        return value || 0;
                    }
                },
                { 
                    title: 'Inventory', 
                    key: 'inventory',
                    formatter: (value) => value ? 
                        '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Aktif</span>' :
                        '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Nonaktif</span>'
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
                    onclick: 'products.edit',
                    color: 'blue'
                },
                {
                    text: 'Hapus',
                    onclick: 'products.delete',
                    color: 'red'
                }
            ],
            searchable: true,
            pagination: true,
            pageSize: 10,
	    searchInput: {
            enabled: true,
            placeholder: 'Cari produk...'
        }
        });

        this.table.init();
        this.table.updateData(this.currentData);
    }

    // Bind events dengan filter
    bindEvents() {
        // Add button event
        const addBtn = document.getElementById('add-product');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
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

        this.loadData(filters);
    }

    // Upload image to Supabase Storage
    async uploadImage(file) {
        try {
            if (!file) return null;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

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

            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `products/${fileName}`;

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
                <img src="${imageUrl}" alt="Preview Produk" class="max-w-full max-h-96 mx-auto rounded-lg">
                <div class="mt-4">
                    <a href="${imageUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                        Buka gambar di tab baru
                    </a>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Tutup',
                onclick: 'modal.close()',
                primary: false
            }
        ];

        modal.createModal('Preview Foto Produk', content, buttons);
    }

    // Toggle stock input based on inventory checkbox
    toggleStockInput() {
        const inventoryCheckbox = document.getElementById('inventory-checkbox');
        const stokInput = document.getElementById('stok-input');
        const stokHelper = document.getElementById('stok-helper');

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
            } else {
                // Inventory NONAKTIF - Stok Unlimited (NULL)
                stokInput.readOnly = true;
                stokInput.required = false;
                stokInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                stokInput.classList.remove('bg-white');
                stokInput.value = '';
                stokHelper.textContent = 'Stok unlimited (inventory non-aktif)';
                stokHelper.className = 'text-xs text-gray-500 mt-1';
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
            `<option value="${gp.group}" ${item && item.group_produk === gp.group ? 'selected' : ''}>${gp.group}</option>`
        ).join('');

        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>${outlet.outlet}</option>`
        ).join('');

        const content = `
            <form id="product-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
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
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nama Produk <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            name="nama_produk" 
                            value="${item ? item.nama_produk : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            placeholder="Masukkan nama produk"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Group Produk <span class="text-red-500">*</span>
                        </label>
                        <select 
                            name="group_produk" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="">Pilih Group</option>
                            ${groupOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Stok <span id="stok-required" class="text-red-500 ${!hasInventory ? 'hidden' : ''}">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="stok" 
                            value="${stockValue}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!hasInventory ? 'bg-gray-100 cursor-not-allowed' : ''}"
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Harga Beli <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="harga_beli" 
                            value="${item ? item.harga_beli : 0}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Harga Jual <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="harga_jual" 
                            value="${item ? item.harga_jual : 0}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Komisi</label>
                        <input 
                            type="number" 
                            name="komisi" 
                            value="${item ? item.komisi : 0}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                            placeholder="0"
                        >
                    </div>
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
                                onchange="products.toggleStockInput()"
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Foto Produk</label>
                    <div class="space-y-3">
                        <!-- File Input -->
                        <input 
                            type="file" 
                            id="foto_file"
                            name="foto_file" 
                            accept="image/*"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onchange="products.handleFileSelect(event)"
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
                                                onclick="products.removeImage()"
                                                class="mt-2 text-red-600 hover:text-red-800 text-sm font-medium">
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                        name="status" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="active" ${item && item.status === 'active' ? 'selected' : ''}>Aktif</option>
                        <option value="inactive" ${item && item.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
                    </select>
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
                onclick: `products.${isEdit ? 'validateAndUpdate' : 'validateAndSave'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
        
        // Update preview after modal is created
        setTimeout(() => this.updateImagePreview(), 100);
        
        // Initialize stock input state
        setTimeout(() => this.toggleStockInput(), 150);
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

            const { error } = await supabase
                .from('produk')
                .insert([data]);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Produk berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Save product error:', error);
            Notifications.error('Gagal menambah produk: ' + error.message);
        }
    }

     // Edit product
    edit(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            this.showForm(item);
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

            const { error } = await supabase
                .from('produk')
                .update(data)
                .eq('id', id);

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Produk berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Update product error:', error);
            Notifications.error('Gagal mengupdate produk: ' + error.message);
        }
    }

    // Delete product
    async delete(id) {
        const item = this.currentData.find(d => d.id === id);
        if (item && item.foto_url) {
            modal.showConfirm(
                'Apakah Anda yakin ingin menghapus produk ini? Foto produk juga akan dihapus dari storage.',
                `products.confirmDelete('${id}')`
            );
        } else {
            modal.showConfirm(
                'Apakah Anda yakin ingin menghapus produk ini?',
                `products.confirmDelete('${id}')`
            );
        }
    }

    async confirmDelete(id) {
        try {
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

            await this.loadData();
            Notifications.success('Produk berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menghapus produk: ' + error.message);
        }
    }
}

// Initialize products globally
let products = null;
document.addEventListener('DOMContentLoaded', () => {
    products = new Products();
    window.products = products;
});
