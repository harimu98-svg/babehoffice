// Stock Management Module - MODIFIED VERSION
// ✅ Data disimpan ke stok_update dengan struktur sama seperti app.js
// ✅ Langsung approved tanpa approval flow
// ✅ Update produk.stok dengan filter nama_produk + outlet
// ✅ Laporan dari tabel stok_update (bukan localStorage)

class StockManagement {
    constructor() {
        this.outlets = [];
        this.products = [];
        this.groupProducts = [];
        this.selectedProducts = [];
        this.isInitialized = false;
        this.currentTransactionType = 'in';
        this.modalContainer = null;
    }

    // Initialize module
    async init() {
        console.log('Initializing Stock Management module (Modified Version)');
        await this.loadOutlets();
        await this.loadProducts();
        await this.loadGroupProducts();
        await this.loadRecentMovements();
        this.isInitialized = true;
        console.log('✅ Stock Management module initialized');
    }

    // ========== MODAL CUSTOM METHODS ==========

    createCustomModal(title, content, buttons = [], options = {}) {
        this.closeCustomModal();

        const { 
            size = 'max-w-md',
            backdropClose = true
        } = options;

        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 stock-custom-backdrop">
                <div class="bg-white rounded-lg shadow-xl w-full ${size} max-h-[90vh] overflow-hidden flex flex-col">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                        <button type="button" class="stock-modal-close text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="px-6 py-4 flex-1 overflow-y-auto">
                        ${content}
                    </div>
                    
                    <!-- Footer -->
                    ${buttons.length > 0 ? `
                    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                        ${buttons.map(btn => `
                            <button 
                                type="button"
                                class="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    btn.primary 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }"
                                data-action="${btn.primary ? 'submit' : 'cancel'}"
                            >
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.modalContainer = document.createElement('div');
        this.modalContainer.innerHTML = modalHTML;
        document.body.appendChild(this.modalContainer);

        this.setupCustomModalEvents(buttons, backdropClose);
    }

    setupCustomModalEvents(buttons, backdropClose) {
        if (!this.modalContainer) return;

        const closeBtn = this.modalContainer.querySelector('.stock-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCustomModal());
        }

        if (backdropClose) {
            const backdrop = this.modalContainer.querySelector('.stock-custom-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) {
                        this.closeCustomModal();
                    }
                });
            }
        }

        const actionBtns = this.modalContainer.querySelectorAll('button[data-action]');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const buttonConfig = buttons[index];
                if (buttonConfig && buttonConfig.onclick) {
                    buttonConfig.onclick();
                } else {
                    this.closeCustomModal();
                }
            });
        });

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeCustomModal();
            }
        };
        document.addEventListener('keydown', handleEsc);
        this.modalContainer._escHandler = handleEsc;
    }

    closeCustomModal() {
        if (this.modalContainer) {
            if (this.modalContainer._escHandler) {
                document.removeEventListener('keydown', this.modalContainer._escHandler);
            }
            this.modalContainer.remove();
            this.modalContainer = null;
        }
    }

    // ========== DATA LOADING METHODS ==========

    async loadOutlets() {
        if (window.app && window.app.getOutlets) {
            this.outlets = window.app.getOutlets();
        } else {
            try {
                const { data, error } = await supabase
                    .from('karyawan')
                    .select('outlet')
                    .not('outlet', 'is', null)
                    .order('outlet', { ascending: true });

                if (!error) {
                    const uniqueOutlets = [...new Set(data.map(o => o.outlet))].filter(Boolean);
                    this.outlets = uniqueOutlets.map(outlet => ({ outlet }));
                }
            } catch (error) {
                console.error('Error loading outlets:', error);
                this.outlets = [];
            }
        }
    }

    async loadProducts() {
        try {
            const { data, error } = await supabase
                .from('produk')
                .select('*')
                .order('nama_produk', { ascending: true });

            if (error) throw error;

            this.products = data || [];
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

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

    // ========== LOAD RECENT MOVEMENTS ==========
    async loadRecentMovements() {
        try {
            const { data: movements, error } = await supabase
                .from('stok_update')
                .select('*')
                .eq('approval_status', 'approved')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error loading recent movements:', error);
                this.renderRecentMovements([]);
                return;
            }

            this.renderRecentMovements(movements || []);
            
        } catch (error) {
            console.error('Error loading recent movements:', error);
            this.renderRecentMovements([]);
        }
    }

    // ========== RENDER RECENT MOVEMENTS ==========
    renderRecentMovements(movements) {
        const container = document.getElementById('recent-stock-movements');
        if (!container) {
            console.log('Container recent-stock-movements tidak ditemukan');
            return;
        }

        if (!movements || movements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-box-open text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">Belum ada pergerakan stok</p>
                    <p class="text-sm text-gray-400 mt-2">
                        Gunakan "Stok Masuk" atau "Stok Keluar" untuk menambah data
                    </p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Outlet
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Jenis
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nama Produk
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Group Produk
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stok Awal
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Perubahan
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stok Akhir
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Disetujui Oleh
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${movements.map(movement => {
                            const tanggal = movement.tanggal ? 
                                new Date(movement.tanggal).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                }) : '-';
                            
                            const jenisBadge = movement.stok_type === 'masuk' 
                                ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">MASUK</span>'
                                : '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">KELUAR</span>';
                            
                            const perubahanClass = movement.qty_change > 0 ? 'text-green-600' : 'text-red-600';
                            const perubahanSign = movement.qty_change > 0 ? '+' : '';
                            const perubahanText = `${perubahanSign}${movement.qty_change}`;
                            
                            const statusBadge = movement.approval_status === 'approved' 
                                ? '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">APPROVED</span>'
                                : '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">PENDING</span>';
                            
                            return `
                                <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ${tanggal}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ${movement.outlet || '-'}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                                        ${jenisBadge}
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-900">
                                        <div class="font-medium max-w-xs">${movement.nama_produk || '-'}</div>
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ${movement.group_produk || '-'}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        ${movement.qty_before || 0}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm font-bold ${perubahanClass}">
                                        ${perubahanText}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-bold">
                                        ${movement.qty_after || 0}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                                        ${statusBadge}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ${movement.updated_by || '-'}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ${movement.approved_by || '-'}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        Menampilkan <span class="font-semibold">${movements.length}</span> pergerakan stok terbaru
                    </div>
                    <button 
                        onclick="stockManagement.refreshRecentMovements()"
                        class="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center"
                    >
                        <i class="fas fa-sync-alt mr-1"></i> Refresh
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    async refreshRecentMovements() {
        try {
            const container = document.getElementById('recent-stock-movements');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-3"></i>
                        <p class="text-gray-500">Memuat data terbaru...</p>
                    </div>
                `;
            }
            
            await this.loadRecentMovements();
            Notifications.success('Data pergerakan stok diperbarui');
            
        } catch (error) {
            console.error('Error refreshing movements:', error);
            Notifications.error('Gagal memuat data terbaru');
        }
    }

    // ========== STOCK FORM METHODS ==========

    async showStockInForm() {
        await this.showStockForm('in', 'Stok Masuk');
    }

    async showStockOutForm() {
        await this.showStockForm('out', 'Stok Keluar');
    }

    async showStockForm(type, title) {
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        const content = `
            <style>
                .stock-modal-content {
                    max-width: 100%;
                    overflow-x: hidden;
                }
                
                .product-option {
                    padding: 10px 8px;
                    border-bottom: 1px solid #f1f1f1;
                    line-height: 1.4;
                    white-space: normal;
                    font-size: 14px;
                }
                
                .compact-table {
                    font-size: 13px;
                }
                
                .compact-table td {
                    padding: 8px 6px;
                    vertical-align: top;
                }
                
                .compact-table .product-cell {
                    max-width: 200px;
                    min-width: 150px;
                }
            </style>
            
            <div class="stock-modal-content space-y-6">
                <!-- Outlet & Date -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Outlet *</label>
                        <select 
                            id="outlet-select"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                        >
                            <option value="">Pilih Outlet</option>
                            ${outletOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal *</label>
                        <input 
                            type="datetime-local" 
                            id="movement-date"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                            value="${new Date().toISOString().slice(0, 16)}"
                        >
                    </div>
                </div>

                <!-- Product Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Produk *</label>
                    <div class="mb-4">
                        <select 
                            id="product-select"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors product-option-container"
                        >
                            <option value="">Pilih Produk</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1.5">* Hanya produk dengan inventory aktif</p>
                    </div>
                    
                    <!-- Quantity Input & Add Button -->
                    <div class="flex items-center space-x-3">
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah ${type === 'in' ? 'Masuk' : 'Keluar'}</label>
                            <input 
                                type="number" 
                                id="quantity-input"
                                placeholder="Masukkan jumlah"
                                min="1"
                                value="1"
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                        </div>
                        <div class="pt-6">
                            <button 
                                type="button"
                                class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                id="add-product-btn"
                            >
                                Tambah
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Selected Products Table -->
                <div id="selected-products-container" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Produk Dipilih</label>
                    <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full compact-table">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="text-left text-xs font-medium text-gray-600 py-3 px-4">Produk</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Outlet</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Stok Saat Ini</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Jumlah</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Stok Baru</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="selected-products-list" class="divide-y divide-gray-200">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Notes -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
                    <textarea 
                        id="notes-input"
                        rows="3"
                        placeholder="Catatan untuk pergerakan stok ini..."
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    ></textarea>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: () => this.closeCustomModal(),
                primary: false
            },
            {
                text: 'Simpan',
                onclick: () => this.saveStockMovement(type),
                primary: true
            }
        ];

        this.createCustomModal(title, content, buttons, {
            size: 'max-w-2xl',
        });

        this.initializeStockForm(type);
    }

    initializeStockForm(type) {
        this.currentTransactionType = type;
        this.selectedProducts = [];
        
        setTimeout(() => {
            this.setupStockFormEvents();
            this.updateProductSelectOptions();
        }, 100);
    }

    setupStockFormEvents() {
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addProductToForm());
        }
        
        const outletSelect = document.getElementById('outlet-select');
        if (outletSelect) {
            outletSelect.addEventListener('change', () => {
                this.filterProductsByOutlet();
            });
        }
        
        const quantityInput = document.getElementById('quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addProductToForm();
                }
            });
        }
    }

    filterProductsByOutlet() {
        const outletSelect = document.getElementById('outlet-select');
        const productSelect = document.getElementById('product-select');
        
        if (!outletSelect || !productSelect) return;
        
        const selectedOutlet = outletSelect.value;
        const options = productSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === "") return;
            
            const productOutlet = option.getAttribute('data-outlet');
            if (productOutlet) {
                const isVisible = !selectedOutlet || productOutlet === selectedOutlet;
                option.style.display = isVisible ? '' : 'none';
            }
        });
        
        productSelect.value = "";
    }

    updateProductSelectOptions() {
        const productSelect = document.getElementById('product-select');
        if (!productSelect) return;

        const inventoryProducts = this.products.filter(p => p.inventory);
        
        let options = '<option value="">Pilih Produk</option>';
        inventoryProducts.forEach(product => {
            const displayName = product.nama_produk.length > 30 
                ? product.nama_produk.substring(0, 30) + '...' 
                : product.nama_produk;
                
            options += `
                <option value="${product.id}" 
                        data-nama="${product.nama_produk}"
                        data-outlet="${product.outlet}"
                        data-stock="${product.stok || 0}">
                    ${displayName} (${product.outlet} - Stok: ${product.stok || 0})
                </option>
            `;
        });

        productSelect.innerHTML = options;
    }

    async addProductToForm() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity-input');
        const outletSelect = document.getElementById('outlet-select');
        
        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);
        const outlet = outletSelect.value;

        if (!productId || !quantity || quantity <= 0) {
            Notifications.error('Pilih produk dan masukkan jumlah yang valid');
            return;
        }

        if (!outlet) {
            Notifications.error('Pilih outlet terlebih dahulu');
            return;
        }

        const selectedOption = productSelect.selectedOptions[0];
        const productName = selectedOption.getAttribute('data-nama');
        const productOutlet = selectedOption.getAttribute('data-outlet');
        const currentStock = parseInt(selectedOption.getAttribute('data-stock') || 0);

        if (productOutlet !== outlet) {
            Notifications.error(`Produk ini tersedia di outlet ${productOutlet}, bukan ${outlet}`);
            return;
        }

        const isStockOut = this.currentTransactionType === 'out';
        if (isStockOut && quantity > currentStock) {
            Notifications.error(`Stok tidak mencukupi. Stok saat ini: ${currentStock}`);
            return;
        }

        const newStock = isStockOut ? 
            currentStock - quantity : 
            currentStock + quantity;

        const productFromDB = this.products.find(p => p.id == productId);
        if (!productFromDB) {
            Notifications.error('Data produk tidak ditemukan');
            return;
        }

        const existingIndex = this.selectedProducts.findIndex(p => 
            p.id == productId && p.outlet === outlet
        );

        if (existingIndex !== -1) {
            const existing = this.selectedProducts[existingIndex];
            const totalQty = existing.quantity + quantity;
            
            if (isStockOut && totalQty > currentStock) {
                Notifications.error(`Total stok keluar (${totalQty}) melebihi stok saat ini (${currentStock})`);
                return;
            }
            
            this.selectedProducts[existingIndex].quantity = totalQty;
            this.selectedProducts[existingIndex].new_stock = isStockOut ? 
                currentStock - totalQty : 
                currentStock + totalQty;
        } else {
            this.selectedProducts.push({
                id: productId,
                nama_produk: productName,
                group_produk: productFromDB.group_produk || '',
                outlet: outlet,
                current_stock: currentStock,
                quantity: quantity,
                new_stock: newStock
            });
        }

        this.updateSelectedProductsList();
        
        productSelect.value = '';
        quantityInput.value = '1';
        quantityInput.focus();
    }

    updateSelectedProductsList() {
        const container = document.getElementById('selected-products-container');
        const list = document.getElementById('selected-products-list');

        if (this.selectedProducts.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        const isStockOut = this.currentTransactionType === 'out';

        list.innerHTML = this.selectedProducts.map((product, index) => {
            const namaProduk = product.nama_produk || '';
            const displayName = namaProduk.length > 30 
                ? namaProduk.substring(0, 30) + '...' 
                : namaProduk;

            return `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 px-4">
                        <div class="product-name-line">
                            <span class="font-medium text-gray-900">${displayName}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            Group: ${product.group_produk || '-'}
                        </div>
                    </td>
                    <td class="py-3 px-2 text-center text-sm text-gray-700">
                        ${product.outlet}
                    </td>
                    <td class="py-3 px-2 text-center text-sm text-gray-700">
                        ${product.current_stock}
                    </td>
                    <td class="py-3 px-2 text-center text-sm font-medium ${isStockOut ? 'text-red-600' : 'text-green-600'}">
                        ${isStockOut ? '-' : '+'}${product.quantity}
                    </td>
                    <td class="py-3 px-2 text-center text-sm font-medium text-blue-600">
                        ${product.new_stock}
                    </td>
                    <td class="py-3 px-2 text-center">
                        <button 
                            onclick="stockManagement.removeProductFromForm(${index})"
                            class="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    removeProductFromForm(index) {
        this.selectedProducts.splice(index, 1);
        this.updateSelectedProductsList();
    }

    // ========== SAVE STOCK MOVEMENT ==========
    async saveStockMovement(type) {
        try {
            const outletSelect = document.getElementById('outlet-select');
            const movementDate = document.getElementById('movement-date');
            const notesInput = document.getElementById('notes-input');

            const outlet = outletSelect.value;
            const movementDateTime = movementDate.value;
            const notes = notesInput.value;

            if (!outlet) {
                Notifications.error('Pilih outlet terlebih dahulu');
                return;
            }

            if (this.selectedProducts.length === 0) {
                Notifications.error('Tambah minimal satu produk');
                return;
            }

            const user = Auth.getCurrentUser();
            const userName = user ? (user.nama_karyawan || user.user_metadata?.display_name || user.email || 'User') : 'User';

            Helpers.showLoading();

            for (const selectedProduct of this.selectedProducts) {
                const { data: freshProduct, error: fetchError } = await supabase
                    .from('produk')
                    .select('*')
                    .eq('nama_produk', selectedProduct.nama_produk)
                    .eq('outlet', outlet)
                    .single();

                if (fetchError) {
                    console.error(`Error fetching product ${selectedProduct.nama_produk}:`, fetchError);
                    Notifications.error(`Produk ${selectedProduct.nama_produk} tidak ditemukan di outlet ${outlet}`);
                    continue;
                }

                if (!freshProduct) {
                    Notifications.error(`Produk ${selectedProduct.nama_produk} tidak ditemukan di outlet ${outlet}`);
                    continue;
                }

                const qtyBefore = freshProduct.stok || 0;
                const quantity = selectedProduct.quantity;
                
                const stokType = type === 'in' ? 'masuk' : 'keluar';
                
                const qtyChange = type === 'in' ? quantity : -quantity;
                const qtyAfter = qtyBefore + qtyChange;

                if (type === 'out' && qtyAfter < 0) {
                    Notifications.error(`Stok tidak mencukupi! ${selectedProduct.nama_produk}: Stok saat ini ${qtyBefore}, butuh ${quantity}`);
                    continue;
                }

                const { error: updateError } = await supabase
                    .from('produk')
                    .update({ 
                        stok: qtyAfter,
                        updated_at: new Date().toISOString()
                    })
                    .eq('nama_produk', selectedProduct.nama_produk)
                    .eq('outlet', outlet);

                if (updateError) {
                    console.error(`Error updating product ${selectedProduct.nama_produk}:`, updateError);
                    Notifications.error(`Gagal update stok produk ${selectedProduct.nama_produk}`);
                    continue;
                }

                const movementData = {
                    tanggal: movementDateTime.split('T')[0],
                    outlet: outlet,
                    stok_type: stokType,
                    updated_by: userName,
                    nama_produk: selectedProduct.nama_produk,
                    group_produk: freshProduct.group_produk || '',
                    qty_before: qtyBefore,
                    qty_change: qtyChange,
                    qty_after: qtyAfter,
                    approval_status: 'approved',
                    approved_by: userName,
                    rejection_reason: null,
                    notes: notes,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase
                    .from('stok_update')
                    .insert([movementData]);

                if (insertError) {
                    console.error(`Error inserting movement for ${selectedProduct.nama_produk}:`, insertError);
                    Notifications.error(`Gagal menyimpan history ${selectedProduct.nama_produk}`);
                    continue;
                }

                const productIndex = this.products.findIndex(p => 
                    p.id === freshProduct.id || 
                    (p.nama_produk === freshProduct.nama_produk && p.outlet === freshProduct.outlet)
                );
                if (productIndex !== -1) {
                    this.products[productIndex].stok = qtyAfter;
                }
            }

            this.closeCustomModal();
            Helpers.hideLoading();
            
            await this.loadProducts();
            await this.loadRecentMovements();
            
            Notifications.success(`Stok ${type === 'in' ? 'masuk' : 'keluar'} berhasil disimpan`);

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving stock movement:', error);
            Notifications.error('Gagal menyimpan pergerakan stok: ' + error.message);
        }
    }

    // ========== STOCK MOVEMENT REPORT ==========

    async showStockMovement() {
        await this.loadStockMovementReport();
    }

    async loadStockMovementReport() {
        const groupOptions = this.groupProducts.map(group => 
            `<option value="${group.group}">${group.group}</option>`
        ).join('');

        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        const content = `
            <div class="space-y-6">
                <!-- Filters -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter Laporan Pergerakan Stok</h3>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <!-- Outlet -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                            <select 
                                id="outlet-filter"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Outlet</option>
                                ${outletOptions}
                            </select>
                        </div>
                        
                        <!-- Tanggal Mulai -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                            <input 
                                type="date" 
                                id="start-date"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                        </div>
                        
                        <!-- Tanggal Akhir -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                            <input 
                                type="date" 
                                id="end-date"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                        </div>

                        <!-- Group Produk -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Group Produk</label>
                            <select 
                                id="group-filter"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Group</option>
                                ${groupOptions}
                            </select>
                        </div>
                        
                        <!-- Nama Produk -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                            <input 
                                type="text" 
                                id="product-filter"
                                placeholder="Cari produk..."
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end space-x-2">
                        <button 
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            id="apply-filter-btn"
                        >
                            Terapkan Filter
                        </button>
                        <button 
                            class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                            id="clear-filter-btn"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <!-- Results -->
                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-800">Laporan Pergerakan Stok</h3>
                                <p class="text-sm text-gray-500 mt-1">Data dari tabel stok_update & transaksi_detail</p>
                            </div>
                            <button 
                                id="export-report-btn"
                                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                            >
                                <i class="fas fa-file-export mr-2"></i>
                                Export Excel
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div id="movement-report-results">
                            <div class="text-center py-8">
                                <p class="text-gray-500">Gunakan filter untuk menampilkan laporan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Tutup',
                onclick: () => this.closeCustomModal(),
                primary: false
            }
        ];

        this.createCustomModal('Laporan Pergerakan Stok', content, buttons, {
            size: 'max-w-screen-2xl',
            fullHeight: true
        });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startDateElem = document.getElementById('start-date');
        const endDateElem = document.getElementById('end-date');
        
        if (startDateElem) startDateElem.value = startDate.toISOString().split('T')[0];
        if (endDateElem) endDateElem.value = endDate.toISOString().split('T')[0];
        
        setTimeout(() => {
            const applyBtn = document.getElementById('apply-filter-btn');
            const clearBtn = document.getElementById('clear-filter-btn');
            const exportBtn = document.getElementById('export-report-btn');
            
            if (applyBtn) applyBtn.onclick = () => this.applyMovementFilters();
            if (clearBtn) clearBtn.onclick = () => this.clearMovementFilters();
            if (exportBtn) exportBtn.onclick = () => this.exportStockReport();
        }, 100);
    }

    async applyMovementFilters() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const outletFilter = document.getElementById('outlet-filter').value;
            const groupFilter = document.getElementById('group-filter').value;
            const productFilter = document.getElementById('product-filter').value.toLowerCase().trim();

            if (!startDate || !endDate) {
                Notifications.error('Pilih tanggal mulai dan tanggal akhir');
                return;
            }

            Helpers.showLoading();

            let query = supabase
                .from('stok_update')
                .select('*')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate)
                .eq('approval_status', 'approved')
                .order('tanggal', { ascending: false })
                .order('created_at', { ascending: false });

            if (outletFilter) {
                query = query.eq('outlet', outletFilter);
            }

            if (groupFilter) {
                query = query.eq('group_produk', groupFilter);
            }

            const { data: movements, error } = await query;

            if (error) {
                throw error;
            }

            let filteredMovements = movements || [];
            if (productFilter) {
                filteredMovements = filteredMovements.filter(movement =>
                    movement.nama_produk.toLowerCase().includes(productFilter)
                );
            }

            await this.generateStockReportFromDatabase(filteredMovements);
            Helpers.hideLoading();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error applying filters:', error);
            Notifications.error('Gagal memuat laporan: ' + error.message);
        }
    }

    clearMovementFilters() {
        const elements = ['start-date', 'end-date', 'outlet-filter', 'group-filter', 'product-filter'];
        elements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startDateElem = document.getElementById('start-date');
        const endDateElem = document.getElementById('end-date');
        
        if (startDateElem) startDateElem.value = startDate.toISOString().split('T')[0];
        if (endDateElem) endDateElem.value = endDate.toISOString().split('T')[0];
        
        const container = document.getElementById('movement-report-results');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Gunakan filter untuk menampilkan laporan</p>
                </div>
            `;
        }
        
        Notifications.info('Filter telah direset');
    }

    // ========== GENERATE STOCK REPORT ==========
    async generateStockReportFromDatabase(movements) {
        const container = document.getElementById('movement-report-results');
        if (!container) return;

        if (!movements || movements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Tidak ada data pergerakan stok untuk periode yang dipilih</p>
                </div>
            `;
            return;
        }

        Helpers.showLoading();

        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const outletFilter = document.getElementById('outlet-filter').value;
            const groupFilter = document.getElementById('group-filter').value;
            const productFilter = document.getElementById('product-filter').value.toLowerCase().trim();

            let productsQuery = supabase
                .from('produk')
                .select('id, nama_produk, group_produk, outlet, stok')
                .eq('inventory', true);

            if (outletFilter) {
                productsQuery = productsQuery.eq('outlet', outletFilter);
            }
            
            if (groupFilter) {
                productsQuery = productsQuery.eq('group_produk', groupFilter);
            }

            const { data: currentProducts, error: productsError } = await productsQuery;
            if (productsError) throw productsError;

            let salesQuery = supabase
                .from('transaksi_detail')
                .select('item_name, qty, outlet, order_date')
                .gte('order_date', startDate)
                .lte('order_date', endDate)
                .eq('status', 'completed');

            if (outletFilter) {
                salesQuery = salesQuery.eq('outlet', outletFilter);
            }

            const { data: salesData, error: salesError } = await salesQuery;
            if (salesError) {
                console.warn('Error fetching sales data:', salesError.message);
            }

            let returnsQuery = supabase
                .from('transaksi_detail')
                .select('item_name, qty, outlet, order_date')
                .gte('order_date', startDate)
                .lte('order_date', endDate)
                .eq('status', 'cancelled');

            if (outletFilter) {
                returnsQuery = returnsQuery.eq('outlet', outletFilter);
            }

            const { data: returnsData, error: returnsError } = await returnsQuery;
            if (returnsError) {
                console.warn('Error fetching returns data:', returnsError.message);
            }

            const productSummary = {};
            
            currentProducts.forEach(product => {
                if (productFilter && !product.nama_produk.toLowerCase().includes(productFilter)) {
                    return;
                }
                
                const key = `${product.id}-${product.outlet}`;
                
                let totalMasuk = 0;
                let totalKeluar = 0;
                
                movements.forEach(movement => {
                    if (movement.nama_produk === product.nama_produk && movement.outlet === product.outlet) {
                        if (movement.stok_type === 'masuk') {
                            totalMasuk += Math.abs(movement.qty_change);
                        } else if (movement.stok_type === 'keluar') {
                            totalKeluar += Math.abs(movement.qty_change);
                        }
                    }
                });
                
                let totalPenjualan = 0;
                if (salesData) {
                    salesData.forEach(sale => {
                        if (sale.item_name === product.nama_produk && sale.outlet === product.outlet) {
                            totalPenjualan += sale.qty || 0;
                        }
                    });
                }
                
                let totalPengembalian = 0;
                if (returnsData) {
                    returnsData.forEach(returnItem => {
                        if (returnItem.item_name === product.nama_produk && returnItem.outlet === product.outlet) {
                            totalPengembalian += returnItem.qty || 0;
                        }
                    });
                }
                
                // ⭐⭐ PERHITUNGAN AWAL YANG BENAR: ⭐⭐
                // awal = stok_sekarang + keluar + penjualan - masuk - pengembalian
                let awal = (product.stok || 0) + totalKeluar + totalPenjualan - totalMasuk - totalPengembalian;
                awal = Math.max(0, awal);

                // ⭐⭐ HITUNG SISA: ⭐⭐
                const sisa = awal + totalMasuk + totalPengembalian - totalKeluar - totalPenjualan;
                const sisaFinal = Math.max(0, sisa);

                // ⭐⭐ FILTER: Hanya tampilkan jika ada nilai di salah satu kolom ⭐⭐
                const hasData = totalMasuk > 0 || totalKeluar > 0 || totalPenjualan > 0 || totalPengembalian > 0 || awal > 0;
                
                if (hasData) {
                    productSummary[key] = {
                        group_produk: product.group_produk || '-',
                        product: product.nama_produk,
                        outlet: product.outlet,
                        awal: Math.round(awal),
                        masuk: totalMasuk,
                        pengembalian: totalPengembalian,
                        penjualan: totalPenjualan,
                        keluar: totalKeluar,
                        sisa: Math.round(sisaFinal)
                    };
                }
            });

            const summaryArray = Object.values(productSummary);

            summaryArray.sort((a, b) => {
                if (a.group_produk !== b.group_produk) {
                    return a.group_produk.localeCompare(b.group_produk);
                }
                return a.product.localeCompare(b.product);
            });

            const totals = {
                awal: summaryArray.reduce((sum, item) => sum + item.awal, 0),
                masuk: summaryArray.reduce((sum, item) => sum + item.masuk, 0),
                pengembalian: summaryArray.reduce((sum, item) => sum + item.pengembalian, 0),
                penjualan: summaryArray.reduce((sum, item) => sum + item.penjualan, 0),
                keluar: summaryArray.reduce((sum, item) => sum + item.keluar, 0),
                sisa: summaryArray.reduce((sum, item) => sum + item.sisa, 0)
            };

            // Simpan data untuk export
            this.currentReportData = {
                summary: summaryArray,
                totals: totals,
                filters: {
                    startDate,
                    endDate,
                    outletFilter,
                    groupFilter,
                    productFilter
                }
            };

            const html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Group Produk
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Outlet
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Awal
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Masuk
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pengembalian
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Penjualan
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Keluar
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sisa
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${summaryArray.map(summary => {
                                const isStockLow = summary.sisa <= 10;
                                const isStockOut = summary.sisa <= 0;
                                
                                return `
                                    <tr class="hover:bg-gray-50 ${isStockLow ? 'bg-yellow-50' : ''} ${isStockOut ? 'bg-red-50' : ''}">
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            ${summary.group_produk}
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-900">
                                            <div class="font-medium">${summary.product}</div>
                                            ${isStockLow ? 
                                                `<span class="text-xs text-yellow-600">⚠️ Stok rendah</span>` : 
                                                ''}
                                            ${isStockOut ? 
                                                `<span class="text-xs text-red-600">⛔ Stok habis</span>` : 
                                                ''}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            ${summary.outlet}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ${summary.awal}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                                            +${summary.masuk}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">
                                            ${summary.pengembalian > 0 ? `+${summary.pengembalian}` : '0'}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">
                                            ${summary.penjualan > 0 ? `-${summary.penjualan}` : '0'}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                                            -${summary.keluar}
                                        </td>
                                        <td class="px-4 py-3 whitespace-nowrap text-sm font-bold ${
                                            summary.sisa > 10 ? 'text-green-600' : 
                                            summary.sisa > 0 ? 'text-yellow-600' : 
                                            'text-red-600'
                                        }">
                                            ${summary.sisa}
                                            ${summary.sisa <= 10 ? 
                                                `<span class="ml-1 text-xs">${summary.sisa <= 0 ? '⛔' : '⚠️'}</span>` : 
                                                ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot class="bg-gray-50">
                            <tr class="font-semibold">
                                <td class="px-4 py-3 text-sm text-gray-900" colspan="3">TOTAL</td>
                                <td class="px-4 py-3 text-sm text-gray-900">${totals.awal}</td>
                                <td class="px-4 py-3 text-sm text-green-600">+${totals.masuk}</td>
                                <td class="px-4 py-3 text-sm text-blue-600">${totals.pengembalian > 0 ? `+${totals.pengembalian}` : '0'}</td>
                                <td class="px-4 py-3 text-sm text-orange-600">${totals.penjualan > 0 ? `-${totals.penjualan}` : '0'}</td>
                                <td class="px-4 py-3 text-sm text-red-600">-${totals.keluar}</td>
                                <td class="px-4 py-3 text-sm font-bold ${
                                    totals.sisa > 0 ? 'text-green-600' : 
                                    totals.sisa < 0 ? 'text-red-600' : 'text-gray-600'
                                }">
                                    ${totals.sisa}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="text-sm text-green-800 font-medium">Total Masuk</div>
                        <div class="text-2xl font-bold text-green-600">+${totals.masuk}</div>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="text-sm text-blue-800 font-medium">Total Pengembalian</div>
                        <div class="text-2xl font-bold text-blue-600">+${totals.pengembalian}</div>
                    </div>
                    
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div class="text-sm text-orange-800 font-medium">Total Penjualan</div>
                        <div class="text-2xl font-bold text-orange-600">-${totals.penjualan}</div>
                    </div>
                    
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div class="text-sm text-gray-800 font-medium">Sisa Stok</div>
                        <div class="text-2xl font-bold ${
                            totals.sisa > 0 ? 'text-green-600' : 
                            totals.sisa < 0 ? 'text-red-600' : 'text-gray-600'
                        }">${totals.sisa}</div>
                    </div>
                </div>
                
                <div class="mt-4 text-sm text-gray-500">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p><strong>Informasi Laporan:</strong></p>
                            <ul class="text-xs list-disc pl-5 mt-1 space-y-1">
                                <li>Periode: ${startDate} sampai ${endDate}</li>
                                <li>Total produk: ${summaryArray.length}</li>
                                <li>Total pergerakan: ${movements.length}</li>
                                <li>Hanya menampilkan produk dengan data</li>
                            </ul>
                        </div>
                        <div>
                            <p><strong>Filter Aktif:</strong></p>
                            <ul class="text-xs list-disc pl-5 mt-1 space-y-1">
                                ${outletFilter ? `<li>Outlet: ${outletFilter}</li>` : ''}
                                ${groupFilter ? `<li>Group: ${groupFilter}</li>` : ''}
                                ${productFilter ? `<li>Produk: "${productFilter}"</li>` : ''}
                            </ul>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
            Helpers.hideLoading();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error generating report:', error);
            Notifications.error('Gagal membuat laporan: ' + error.message);
            
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-3"></i>
                        <p class="text-red-700 font-medium">Gagal memuat laporan</p>
                        <p class="text-sm text-red-600 mt-1">${error.message}</p>
                        <button 
                            onclick="stockManagement.loadStockMovementReport()"
                            class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                            <i class="fas fa-redo mr-1"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // ========== EXPORT STOCK REPORT ==========
    async exportStockReport() {
        try {
            if (!this.currentReportData || !this.currentReportData.summary || this.currentReportData.summary.length === 0) {
                Notifications.error('Tidak ada data untuk diexport');
                return;
            }

            Helpers.showLoading();

            const { summary, totals, filters } = this.currentReportData;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const outletFilter = document.getElementById('outlet-filter').value;
            
            const fileName = `Laporan_Stok_${startDate}_${endDate}_${outletFilter || 'Semua'}_${new Date().getTime()}.xlsx`;

            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Data untuk sheet
            const exportData = [
                // Header
                ['LAPORAN PERGERAKAN STOK'],
                [`Periode: ${startDate} s/d ${endDate}`],
                [`Outlet: ${outletFilter || 'Semua Outlet'}`],
                [''],
                // Column headers
                ['Group Produk', 'Product', 'Outlet', 'Awal', 'Masuk', 'Pengembalian', 'Penjualan', 'Keluar', 'Sisa', 'Status'],
                // Data rows
                ...summary.map(item => [
                    item.group_produk,
                    item.product,
                    item.outlet,
                    item.awal,
                    item.masuk,
                    item.pengembalian,
                    item.penjualan,
                    item.keluar,
                    item.sisa,
                    item.sisa <= 0 ? 'HABIS' : item.sisa <= 10 ? 'RENDAH' : 'NORMAL'
                ]),
                [''],
                // Totals
                ['TOTAL', '', '', totals.awal, totals.masuk, totals.pengembalian, totals.penjualan, totals.keluar, totals.sisa, '']
            ];

            const ws = XLSX.utils.aoa_to_sheet(exportData);
            
            // Styling (basic)
            const wscols = [
                {wch: 15}, // Group Produk
                {wch: 30}, // Product
                {wch: 15}, // Outlet
                {wch: 8},  // Awal
                {wch: 8},  // Masuk
                {wch: 12}, // Pengembalian
                {wch: 10}, // Penjualan
                {wch: 8},  // Keluar
                {wch: 8},  // Sisa
                {wch: 10}  // Status
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Stok');
            
            // Export file
            XLSX.writeFile(wb, fileName);
            
            Helpers.hideLoading();
            Notifications.success(`Laporan berhasil diexport: ${fileName}`);

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error exporting report:', error);
            Notifications.error('Gagal mengexport laporan: ' + error.message);
        }
    }

    // ========== TIDAK ADA LAGI FUNGSI RESET & EXPORT DATA ==========
    // Fungsi-fungsi berikut dihapus:
    // - showResetOptions()
    // - resetStockMovements()
    // - hardResetStockData()
    // - dan tombol-tombol terkait di UI

    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Stock Management not initialized. Call init() first.');
        }
    }
}

// Initialize
window.StockManagement = StockManagement;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Stock Management (Modified)...');
    
    setTimeout(async () => {
        try {
            if (!window.stockManagement) {
                window.stockManagement = new StockManagement();
                await window.stockManagement.init();
                console.log('✅ Stock Management (Modified) initialized successfully');
            }
        } catch (error) {
            console.error('❌ Stock Management initialization failed:', error);
        }
    }, 1000);
});

window.initStockManagement = async function() {
    if (!window.stockManagement) {
        window.stockManagement = new StockManagement();
        await window.stockManagement.init();
    }
    return window.stockManagement;
};
