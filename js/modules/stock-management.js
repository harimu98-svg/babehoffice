// Stock Management Module - CUSTOM MODAL VERSION
class StockManagement {
    constructor() {
        this.outlets = [];
        this.products = [];
        this.groupProducts = [];
        this.selectedProducts = [];
        this.stockMovements = [];
        this.isInitialized = false;
        this.currentTransactionType = 'in';
        this.modalContainer = null;
    }

    // Initialize module
    async init() {
        console.log('Initializing Stock Management module');
        await this.loadOutlets();
        await this.loadProducts();
        await this.loadGroupProducts();
        this.loadMovementsFromStorage();
        await this.loadRecentMovements();
        this.isInitialized = true;
        console.log('Stock Management module initialized');
    }

    // ========== MODAL CUSTOM METHODS ==========

    // Create custom modal
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

        // Add event listeners
        this.setupCustomModalEvents(buttons, backdropClose);
    }

    // Setup modal events
    setupCustomModalEvents(buttons, backdropClose) {
        if (!this.modalContainer) return;

        // Close button
        const closeBtn = this.modalContainer.querySelector('.stock-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCustomModal());
        }

        // Backdrop click
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

        // Action buttons
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

        // ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeCustomModal();
            }
        };
        document.addEventListener('keydown', handleEsc);
        this.modalContainer._escHandler = handleEsc;
    }

    // Close custom modal
    closeCustomModal() {
        if (this.modalContainer) {
            if (this.modalContainer._escHandler) {
                document.removeEventListener('keydown', this.modalContainer._escHandler);
            }
            this.modalContainer.remove();
            this.modalContainer = null;
        }
    }

    // ========== STOCK FORM METHODS ==========

    // Show stock in form
    async showStockInForm() {
        await this.showStockForm('in', 'Stok Masuk');
    }

    // Show stock out form
    async showStockOutForm() {
        await this.showStockForm('out', 'Stok Keluar');
    }

    // Show stock form with CUSTOM MODAL
    async showStockForm(type, title) {
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${outlet.outlet}">${outlet.outlet}</option>`
        ).join('');

        // Get products for current outlet (will be filtered dynamically)
        const allProducts = this.products.filter(p => p.inventory);

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
                
                .product-option .product-name {
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 2px;
                    word-break: break-word;
                }
                
                .product-option .product-details {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .product-option .product-outlet {
                    color: #4b5563;
                }
                
                .product-option .product-stock {
                    color: #059669;
                    font-weight: 500;
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
                
                .product-name-line {
                    display: block;
                    line-height: 1.3;
                }
                
                .product-name-short {
                    font-weight: 500;
                    color: #1f2937;
                }
                
                .product-name-cont {
                    color: #4b5563;
                    font-size: 12px;
                    margin-top: 1px;
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
                            ${allProducts.map(product => this.formatProductOption(product)).join('')}
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
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Stok Saat Ini</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Jumlah</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Stok Baru</th>
                                        <th class="text-center text-xs font-medium text-gray-600 py-3 px-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="selected-products-list" class="divide-y divide-gray-200">
                                    <!-- Products will be added here dynamically -->
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
            size: 'max-w-2xl', // Lebar cukup untuk table
        });

        // Initialize
        this.initializeStockForm(type);
    }

    // Format product option with multi-line display
    formatProductOption(product) {
        const namaProduk = product.nama_produk || '';
        let displayName = namaProduk;
        let continuation = '';
        
        // Split nama produk jika lebih dari 30 karakter
        if (namaProduk.length > 30) {
            const splitIndex = this.findSplitIndex(namaProduk, 25);
            displayName = namaProduk.substring(0, splitIndex).trim();
            continuation = namaProduk.substring(splitIndex).trim();
        }
        
        return `
            <option value="${product.id}" 
                    data-stock="${product.stok || 0}" 
                    data-outlet="${product.outlet}"
                    data-nama="${namaProduk}"
                    class="product-option">
                <div class="product-name">${displayName}</div>
                ${continuation ? `<div class="product-name-cont">${continuation}</div>` : ''}
                <div class="product-details">
                    <span class="product-outlet">Outlet: ${product.outlet}</span>
                    <span class="ml-3 product-stock">Stok: ${product.stok || 0}</span>
                </div>
            </option>
        `;
    }

    // Helper to find split index
    findSplitIndex(text, maxLength) {
        if (!text || text.length <= maxLength) return text.length;
        
        // Cari spasi terdekat untuk split natural
        for (let i = maxLength; i > maxLength - 10 && i > 0; i--) {
            if (text.charAt(i) === ' ') return i;
        }
        
        return maxLength;
    }

    // Initialize stock form
    initializeStockForm(type) {
        // Set current transaction type
        this.currentTransactionType = type;
        
        // Set current datetime
        const now = new Date();
        const localDateTime = now.toISOString().slice(0, 16);
        const dateInput = document.getElementById('movement-date');
        if (dateInput) dateInput.value = localDateTime;

        // Reset selected products
        this.selectedProducts = [];
        
        // Setup event listeners
        setTimeout(() => {
            this.setupStockFormEvents();
        }, 100);
    }

    // Setup form event listeners
    setupStockFormEvents() {
        // Add product button
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addProductToForm());
        }
        
        // Filter products when outlet changes
        const outletSelect = document.getElementById('outlet-select');
        if (outletSelect) {
            outletSelect.addEventListener('change', () => {
                this.filterProductsByOutlet();
            });
        }
        
        // Add Enter key support for quantity input
        const quantityInput = document.getElementById('quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addProductToForm();
                }
            });
        }
        
        // Apply custom styles for select
        this.applyCustomSelectStyles();
    }

    // Apply custom styles for select (for multi-line display)
    applyCustomSelectStyles() {
        const styleId = 'stock-custom-select-styles';
        let style = document.getElementById(styleId);
        
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* Custom select styling for multi-line options */
                .product-option-container {
                    min-height: 44px;
                    line-height: 1.5;
                }
                
                /* Unfortunately, HTML in option tags doesn't render in most browsers */
                /* We'll handle display via JavaScript instead */
                #product-select option {
                    padding: 12px 10px !important;
                    line-height: 1.4 !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    font-size: 14px !important;
                    white-space: normal !important;
                    word-wrap: break-word !important;
                    min-height: 60px;
                    display: flex;
                    flex-direction: column;
                }
                
                /* Make select wider to accommodate text */
                #product-select {
                    min-width: 100%;
                    max-width: 100%;
                }
                
                /* Selected products table styling */
                #selected-products-list .product-cell {
                    max-width: 220px !important;
                }
                
                /* Remove horizontal scroll */
                .stock-modal-content {
                    max-width: 100%;
                    overflow-x: hidden !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Alternative: Create a custom dropdown if browser doesn't support HTML in options
        const productSelect = document.getElementById('product-select');
        if (productSelect) {
            // For browsers that don't support HTML in options, we'll use plain text
            const options = productSelect.querySelectorAll('option');
            options.forEach(option => {
                if (option.value) {
                    const product = this.products.find(p => p.id == option.value);
                    if (product) {
                        // Create compact text display
                        let displayText = product.nama_produk;
                        if (displayText.length > 25) {
                            displayText = displayText.substring(0, 25) + '...';
                        }
                        displayText += ` (${product.outlet} - Stok: ${product.stok || 0})`;
                        option.textContent = displayText;
                    }
                }
            });
        }
    }

    // Filter products by selected outlet
    filterProductsByOutlet() {
        const outletSelect = document.getElementById('outlet-select');
        const productSelect = document.getElementById('product-select');
        
        if (!outletSelect || !productSelect) return;
        
        const selectedOutlet = outletSelect.value;
        const options = productSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === "") return;
            
            const product = this.products.find(p => p.id == option.value);
            if (product) {
                const isVisible = !selectedOutlet || product.outlet === selectedOutlet;
                option.style.display = isVisible ? '' : 'none';
                
                if (isVisible) {
                    // Update display text
                    let displayText = product.nama_produk;
                    if (displayText.length > 25) {
                        displayText = displayText.substring(0, 25) + '...';
                    }
                    displayText += ` (${product.outlet} - Stok: ${product.stok || 0})`;
                    option.textContent = displayText;
                }
            }
        });
        
        productSelect.value = "";
    }

    // Add product to form
    addProductToForm() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity-input');
        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);

        if (!productId || !quantity || quantity <= 0) {
            Notifications.error('Pilih produk dan masukkan jumlah yang valid');
            return;
        }

        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        // Check stock for stock out
        const isStockOut = this.currentTransactionType === 'out';
        if (isStockOut && (product.stok === null || product.stok < quantity)) {
            Notifications.error(`Stok tidak mencukupi. Stok saat ini: ${product.stok || 0}`);
            return;
        }

        // Calculate new stock
        const newStock = isStockOut ? 
            product.stok - quantity : 
            product.stok + quantity;

        // Remove if exists and add new
        this.selectedProducts = this.selectedProducts.filter(p => p.id != productId);
        
        this.selectedProducts.push({
            id: product.id,
            nama_produk: product.nama_produk,
            group_produk: product.group_produk,
            outlet: product.outlet,
            current_stock: product.stok,
            quantity: quantity,
            new_stock: newStock
        });

        this.updateSelectedProductsList();
        
        // Reset inputs
        productSelect.value = '';
        quantityInput.value = '';
        quantityInput.focus();
    }

    // Update selected products list with multi-line display
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
            // Format product name for multi-line display
            let productNameHtml = '';
            const namaProduk = product.nama_produk || '';
            
            if (namaProduk.length > 30) {
                const splitIndex = this.findSplitIndex(namaProduk, 25);
                const line1 = namaProduk.substring(0, splitIndex).trim();
                const line2 = namaProduk.substring(splitIndex).trim();
                
                productNameHtml = `
                    <div class="product-name-line">
                        <span class="product-name-short">${line1}</span>
                    </div>
                    <div class="product-name-line">
                        <span class="product-name-cont">${line2}</span>
                    </div>
                `;
            } else {
                productNameHtml = `
                    <div class="product-name-line">
                        <span class="product-name-short">${namaProduk}</span>
                    </div>
                `;
            }

            return `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 px-4 product-cell">
                        ${productNameHtml}
                        <div class="text-xs text-gray-500 mt-1">
                            Outlet: ${product.outlet}
                        </div>
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

    // Remove product from form
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
            const userName = user ? (user.name || user.nama || 'System') : 'System';

            Helpers.showLoading();

            // Process each product
            for (const selectedProduct of this.selectedProducts) {
                const freshProduct = this.products.find(p => p.id == selectedProduct.id);
                if (!freshProduct) continue;

                // Calculate new stock
                let newStock;
                if (type === 'out') {
                    newStock = freshProduct.stok - selectedProduct.quantity;
                } else {
                    newStock = freshProduct.stok + selectedProduct.quantity;
                }

                // Update database
                const { error: updateError } = await supabase
                    .from('produk')
                    .update({ stok: newStock })
                    .eq('id', selectedProduct.id);

                if (updateError) throw updateError;

                // Create movement record
                const movement = {
                    id: Date.now() + Math.random(),
                    outlet: outlet,
                    product_id: selectedProduct.id,
                    product_name: selectedProduct.nama_produk,
                    group_produk: selectedProduct.group_produk,
                    type: type,
                    quantity: selectedProduct.quantity,
                    previous_stock: freshProduct.stok,
                    new_stock: newStock,
                    notes: notes,
                    user_name: userName,
                    movement_date: movementDateTime,
                    created_at: new Date().toISOString()
                };

                this.stockMovements.push(movement);
            }

            // Save to localStorage
            this.saveMovementsToStorage();

            this.closeCustomModal();
            Helpers.hideLoading();
            
            // Reload data
            await this.loadProducts();
            await this.loadRecentMovements();
            
            Notifications.success(`Stok ${type === 'in' ? 'masuk' : 'keluar'} berhasil disimpan`);

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving stock movement:', error);
            Notifications.error('Gagal menyimpan pergerakan stok: ' + error.message);
        }
    }

    // ========== OTHER METHODS (SAME AS BEFORE) ==========

    // Load outlets from app
    async loadOutlets() {
        if (window.app && window.app.getOutlets) {
            this.outlets = window.app.getOutlets();
        } else {
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
    }

    // Load products with inventory
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

    // Load group products
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

    // Load movements from localStorage
    loadMovementsFromStorage() {
        try {
            const stored = localStorage.getItem('stock_movements');
            this.stockMovements = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading movements from storage:', error);
            this.stockMovements = [];
        }
    }

    // Save movements to localStorage
    saveMovementsToStorage() {
        try {
            localStorage.setItem('stock_movements', JSON.stringify(this.stockMovements));
        } catch (error) {
            console.error('Error saving movements to storage:', error);
        }
    }

    // Load recent stock movements
    async loadRecentMovements() {
        try {
            const recentMovements = this.stockMovements
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            this.renderRecentMovements(recentMovements);
        } catch (error) {
            console.error('Error loading recent movements:', error);
            this.renderRecentMovements([]);
        }
    }

    // Render recent movements
    renderRecentMovements(movements) {
        const container = document.getElementById('recent-stock-movements');
        if (!container) return;

        if (movements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Belum ada pergerakan stok</p>
                    <p class="text-sm text-gray-400 mt-2">
                        Gunakan "Stok Masuk" atau "Stok Keluar" untuk menambah data
                    </p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${movements.map(movement => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${Helpers.formatDateWIB ? Helpers.formatDateWIB(movement.created_at) : new Date(movement.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${movement.outlet}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${movement.product_name}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        movement.type === 'in' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }">
                                        ${movement.type === 'in' ? 'MASUK' : 'KELUAR'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                    movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                                }">
                                    ${movement.type === 'in' ? '+' : '-'}${movement.quantity}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    ${movement.notes || '-'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    // Show reset options modal
    async showResetOptions() {
        const content = `
            <div class="space-y-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-yellow-800">Pilih Jenis Reset</h3>
                            <p class="text-sm text-yellow-700 mt-1">
                                Pilih opsi reset yang sesuai dengan kebutuhan Anda
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="stockManagement.resetStockMovements()">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-medium text-gray-900">Reset History Saja</h4>
                                <p class="text-sm text-gray-500 mt-1">
                                    Hapus data pergerakan stok, tapi stok produk tetap
                                </p>
                            </div>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>

                    <div class="border border-red-200 rounded-lg p-4 hover:bg-red-50 cursor-pointer" onclick="stockManagement.hardResetStockData()">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-medium text-red-900">Hard Reset (Berbahaya)</h4>
                                <p class="text-sm text-red-600 mt-1">
                                    Reset semua: history pergerakan + stok produk ke 0
                                </p>
                            </div>
                            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p class="text-xs text-blue-700">
                        💡 <strong>Tips:</strong> Sebaiknya export data terlebih dahulu sebelum reset
                    </p>
                </div>
            </div>
        `;

        this.createCustomModal('Reset Data Stok', content, [
            {
                text: 'Batal',
                onclick: () => this.closeCustomModal(),
                primary: false
            }
        ]);
    }

    // Reset stock movements data
    async resetStockMovements() {
        try {
            const confirmed = confirm(
                'RESET DATA PERGERAKAN STOK\n\n' +
                'Apakah Anda yakin ingin menghapus semua data pergerakan stok?\n\n' +
                '⚠️  PERINGATAN: Tindakan ini tidak dapat dibatalkan!\n' +
                '✅  Data stok produk tetap aman\n' +
                '🗑️  Hanya history pergerakan yang dihapus\n\n' +
                'Klik OK untuk lanjut, Cancel untuk batal.'
            );

            if (!confirmed) {
                console.log('Reset dibatalkan oleh user');
                return;
            }

            Helpers.showLoading();

            this.stockMovements = [];
            this.saveMovementsToStorage();
            this.selectedProducts = [];

            Helpers.hideLoading();
            
            await this.loadRecentMovements();
            
            Notifications.success('Data pergerakan stok berhasil direset');
            this.closeCustomModal();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error resetting stock movements:', error);
            Notifications.error('Gagal mereset data: ' + error.message);
        }
    }

    // Reset stock data including product stocks (HARD RESET)
    async hardResetStockData() {
        try {
            const confirmed = confirm(
                'HARD RESET - RESET SEMUA DATA STOK\n\n' +
                '⚠️  ⚠️  PERINGATAN SANGAT BERBAHAYA! ⚠️  ⚠️\n\n' +
                'Tindakan ini akan:\n' +
                '• Menghapus SEMUA data pergerakan stok\n' +
                '• Mengembalikan stok semua produk ke nilai 0\n' +
                '• TIDAK DAPAT DIBATALKAN!\n\n' +
                '💡 Hanya gunakan untuk testing atau awal sistem!\n\n' +
                'Klik OK untuk lanjut, Cancel untuk batal.'
            );

            if (!confirmed) {
                console.log('Hard reset dibatalkan oleh user');
                return;
            }

            Helpers.showLoading();

            this.stockMovements = [];
            this.saveMovementsToStorage();

            const { error: updateError } = await supabase
                .from('produk')
                .update({ stok: 0 })
                .eq('inventory', true);

            if (updateError) throw updateError;

            await this.loadProducts();

            Helpers.hideLoading();
            
            await this.loadRecentMovements();
            
            Notifications.success('Hard reset berhasil! Semua stok dikembalikan ke 0');
            this.closeCustomModal();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error in hard reset:', error);
            Notifications.error('Gagal hard reset: ' + error.message);
        }
    }

    // Show stock movement report
    async showStockMovement() {
        await this.loadStockMovementReport();
    }

    // Load stock movement report (using existing modal)
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
                        <h3 class="text-lg font-semibold text-gray-800">Laporan Pergerakan Stok</h3>
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

        // Set default dates
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startDateElem = document.getElementById('start-date');
        const endDateElem = document.getElementById('end-date');
        
        if (startDateElem) startDateElem.value = startDate.toISOString().split('T')[0];
        if (endDateElem) endDateElem.value = endDate.toISOString().split('T')[0];
        
        // Setup event listeners
        setTimeout(() => {
            const applyBtn = document.getElementById('apply-filter-btn');
            const clearBtn = document.getElementById('clear-filter-btn');
            
            if (applyBtn) applyBtn.onclick = () => this.applyMovementFilters();
            if (clearBtn) clearBtn.onclick = () => this.clearMovementFilters();
        }, 100);
    }

    // Apply movement filters
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

            let filteredMovements = this.stockMovements.filter(movement => {
                const movementDate = new Date(movement.movement_date);
                const start = new Date(startDate + 'T00:00:00');
                const end = new Date(endDate + 'T23:59:59');
                return movementDate >= start && movementDate <= end;
            });

            if (outletFilter) {
                filteredMovements = filteredMovements.filter(movement => 
                    movement.outlet === outletFilter
                );
            }

            if (groupFilter) {
                filteredMovements = filteredMovements.filter(movement => 
                    movement.group_produk === groupFilter
                );
            }

            if (productFilter) {
                filteredMovements = filteredMovements.filter(movement => {
                    const productName = movement.product_name || '';
                    return productName.toLowerCase().includes(productFilter);
                });
            }

            this.generateStockReport(filteredMovements);
            Helpers.hideLoading();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error applying filters:', error);
            Notifications.error('Gagal memuat laporan: ' + error.message);
        }
    }

    // Clear filters
    clearMovementFilters() {
        const elements = ['start-date', 'end-date', 'outlet-filter', 'group-filter', 'product-filter'];
        elements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        
        // Set default dates
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
                    <p class="text-sm text-gray-400 mt-2">
                        Pilih periode tanggal dan terapkan filter untuk melihat data
                    </p>
                </div>
            `;
        }
        
        Notifications.info('Filter telah direset');
    }

    // Generate stock report
    generateStockReport(movements) {
        const container = document.getElementById('movement-report-results');
        if (!container) return;

        if (movements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Tidak ada data pergerakan stok untuk periode yang dipilih</p>
                </div>
            `;
            return;
        }

        // ... [rest of generateStockReport method remains the same] ...
        // (Copy from previous version)
    }

    // Check if initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Stock Management not initialized. Call init() first.');
        }
    }
}

// Initialize
window.StockManagement = StockManagement;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Stock Management...');
    
    setTimeout(async () => {
        try {
            if (!window.stockManagement) {
                window.stockManagement = new StockManagement();
                await window.stockManagement.init();
                console.log('✅ Stock Management initialized successfully');
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
