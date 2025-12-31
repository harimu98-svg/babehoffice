// Stock Management Module - VERSION DIPERBAIKI

class StockManagement {
    constructor() {
        this.outlets = [];
        this.products = [];
        this.groupProducts = [];
        this.selectedProducts = [];
        this.isInitialized = false;
        this.currentTransactionType = 'in';
        this.modalContainer = null;
        this.currentReportData = null;
    }

    // ========== INITIALIZE ==========
    async init() {
        console.log('Initializing Stock Management module');
        await this.loadOutlets();
        await this.loadProducts();
        await this.loadGroupProducts();
        await this.loadRecentMovements();
        this.isInitialized = true;
        console.log('✅ Stock Management module initialized');
    }

    // ========== MODAL METHODS ==========
    createCustomModal(title, content, buttons = [], options = {}) {
        this.closeCustomModal();

        const { size = 'max-w-md', backdropClose = true } = options;

        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 stock-custom-backdrop">
                <div class="bg-white rounded-lg shadow-xl w-full ${size} max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                        <button type="button" class="stock-modal-close text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="px-6 py-4 flex-1 overflow-y-auto">${content}</div>
                    ${buttons.length > 0 ? `
                    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                        ${buttons.map(btn => `
                            <button type="button" class="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                btn.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }" data-action="${btn.primary ? 'submit' : 'cancel'}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>` : ''}
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
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeCustomModal());

        if (backdropClose) {
            const backdrop = this.modalContainer.querySelector('.stock-custom-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) this.closeCustomModal();
                });
            }
        }

        document.querySelectorAll('button[data-action]').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const buttonConfig = buttons[index];
                if (buttonConfig?.onclick) buttonConfig.onclick();
                else this.closeCustomModal();
            });
        });

        const handleEsc = (e) => e.key === 'Escape' && this.closeCustomModal();
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

    // ========== DATA LOADING ==========
    async loadOutlets() {
        try {
            const { data, error } = await supabase
                .from('karyawan')
                .select('outlet')
                .not('outlet', 'is', null);
            
            if (!error) {
                const uniqueOutlets = [...new Set(data.map(o => o.outlet))].filter(Boolean);
                this.outlets = uniqueOutlets.map(outlet => ({ outlet }));
            }
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    async loadProducts() {
        try {
            const { data, error } = await supabase
                .from('produk')
                .select('*')
                .order('nama_produk');
            
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
                .order('group');
            
            if (error) throw error;
            this.groupProducts = data || [];
        } catch (error) {
            console.error('Error loading group products:', error);
            this.groupProducts = [];
        }
    }

    // ========== RECENT MOVEMENTS ==========
    async loadRecentMovements() {
        try {
            const { data: movements, error } = await supabase
                .from('stok_update')
                .select('*')
                .eq('approval_status', 'approved')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            this.renderRecentMovements(movements || []);
        } catch (error) {
            console.error('Error loading recent movements:', error);
            this.renderRecentMovements([]);
        }
    }

    renderRecentMovements(movements) {
        const container = document.getElementById('recent-stock-movements');
        if (!container) return;

        if (!movements?.length) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-box-open text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">Belum ada pergerakan stok</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok Awal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perubahan</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok Akhir</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${movements.map(movement => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    ${movement.tanggal ? new Date(movement.tanggal).toLocaleDateString('id-ID') : '-'}
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${movement.outlet || '-'}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm">
                                    <span class="px-2 py-1 text-xs rounded-full ${
                                        movement.stok_type === 'masuk' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }">
                                        ${movement.stok_type === 'masuk' ? 'MASUK' : 'KELUAR'}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900">
                                    <div class="font-medium">${movement.nama_produk || '-'}</div>
                                    <div class="text-xs text-gray-500">${movement.group_produk || '-'}</div>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">${movement.qty_before || 0}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-bold ${
                                    movement.qty_change > 0 ? 'text-green-600' : 'text-red-600'
                                }">
                                    ${movement.qty_change > 0 ? '+' : ''}${movement.qty_change}
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-bold">${movement.qty_after || 0}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${movement.updated_by || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-4 text-sm text-gray-500 text-center">
                Menampilkan ${movements.length} pergerakan stok terbaru
            </div>
        `;
    }

    // ========== STOCK FORM ==========
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
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Outlet *</label>
                        <select id="outlet-select" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                            <option value="">Pilih Outlet</option>${outletOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal *</label>
                        <input type="datetime-local" id="movement-date" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                               value="${new Date().toISOString().slice(0, 16)}" required>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Produk *</label>
                    <select id="product-select" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Pilih outlet terlebih dahulu</option>
                    </select>
                    <div id="product-count-info" class="text-xs text-gray-500 mt-1 hidden">
                        <span id="available-products-count">0</span> produk tersedia di outlet ini
                    </div>
                    <p class="text-xs text-gray-500 mt-1.5">* Hanya produk dengan inventory aktif</p>
                </div>

                <div class="flex items-center space-x-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah ${type === 'in' ? 'Masuk' : 'Keluar'}</label>
                        <input type="number" id="quantity-input" placeholder="Masukkan jumlah" min="1" value="1" 
                               class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="pt-6">
                        <button type="button" id="add-product-btn" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            Tambah
                        </button>
                    </div>
                </div>

                <div id="selected-products-container" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Produk Dipilih</label>
                    <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="text-left py-3 px-4">Produk</th>
                                        <th class="text-center py-3 px-2">Outlet</th>
                                        <th class="text-center py-3 px-2">Stok Saat Ini</th>
                                        <th class="text-center py-3 px-2">Jumlah</th>
                                        <th class="text-center py-3 px-2">Stok Baru</th>
                                        <th class="text-center py-3 px-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="selected-products-list" class="divide-y divide-gray-200"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
                    <textarea id="notes-input" rows="3" placeholder="Catatan..." 
                              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
            </div>
        `;

        this.createCustomModal(title, content, [
            { text: 'Batal', onclick: () => this.closeCustomModal(), primary: false },
            { text: 'Simpan', onclick: () => this.saveStockMovement(type), primary: true }
        ], { size: 'max-w-2xl' });

        this.initializeStockForm(type);
    }

    initializeStockForm(type) {
        this.currentTransactionType = type;
        this.selectedProducts = [];
        
        setTimeout(() => {
            this.setupStockFormEvents();
            // Tidak perlu langsung update, tunggu user pilih outlet
        }, 100);
    }

    setupStockFormEvents() {
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.addProductToForm());
        document.getElementById('outlet-select')?.addEventListener('change', () => {
            this.updateProductSelectOptions();
            this.clearProductSelection();
        });
        document.getElementById('quantity-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addProductToForm();
            }
        });
    }

    clearProductSelection() {
        this.selectedProducts = [];
        this.updateSelectedProductsList();
        document.getElementById('product-select').value = '';
        document.getElementById('quantity-input').value = '1';
    }

    updateProductSelectOptions() {
        const select = document.getElementById('product-select');
        const outletSelect = document.getElementById('outlet-select');
        
        if (!select || !outletSelect) return;

        const selectedOutlet = outletSelect.value;
        
        // Filter produk berdasarkan outlet yang dipilih
        let filteredProducts = this.products.filter(p => p.inventory);
        
        // Jika outlet sudah dipilih, filter produk untuk outlet tersebut
        if (selectedOutlet) {
            filteredProducts = filteredProducts.filter(p => p.outlet === selectedOutlet);
        }
        
        if (filteredProducts.length === 0) {
            select.innerHTML = `
                <option value="">${selectedOutlet ? `Tidak ada produk di outlet ${selectedOutlet}` : 'Pilih outlet terlebih dahulu'}</option>
            `;
        } else {
            select.innerHTML = '<option value="">Pilih Produk</option>' + filteredProducts.map(product => 
                `<option value="${product.id}" 
                        data-nama="${product.nama_produk}" 
                        data-outlet="${product.outlet}" 
                        data-stock="${product.stok || 0}">
                    ${product.nama_produk.length > 30 ? product.nama_produk.substring(0, 30) + '...' : product.nama_produk} 
                    (Stok: ${product.stok || 0})
                </option>`
            ).join('');
        }

        // Update product count info
        const countInfo = document.getElementById('product-count-info');
        const countSpan = document.getElementById('available-products-count');

        if (countInfo && countSpan) {
            if (selectedOutlet) {
                countSpan.textContent = filteredProducts.length;
                countInfo.classList.remove('hidden');
            } else {
                countInfo.classList.add('hidden');
            }
        }
    }

    async addProductToForm() {
        const productSelect = document.getElementById('product-select');
        const quantityInput = document.getElementById('quantity-input');
        const outletSelect = document.getElementById('outlet-select');
        
        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);
        const outlet = outletSelect.value;

        // Validasi outlet dipilih
        if (!outlet) {
            Notifications.error('Pilih outlet terlebih dahulu');
            return;
        }

        // Validasi produk dipilih
        if (!productId) {
            Notifications.error('Pilih produk terlebih dahulu');
            return;
        }

        // Validasi jumlah valid
        if (!quantity || quantity <= 0 || isNaN(quantity)) {
            Notifications.error('Masukkan jumlah yang valid');
            return;
        }

        const selectedOption = productSelect.selectedOptions[0];
        const productName = selectedOption.getAttribute('data-nama');
        const productOutlet = selectedOption.getAttribute('data-outlet');
        const currentStock = parseInt(selectedOption.getAttribute('data-stock') || 0);

        // Validasi outlet produk sesuai (seharusnya sudah terfilter)
        if (productOutlet !== outlet) {
            Notifications.error(`Produk tidak tersedia di outlet ${outlet}. Pilih produk yang sesuai.`);
            return;
        }

        const isStockOut = this.currentTransactionType === 'out';
        if (isStockOut && quantity > currentStock) {
            Notifications.error(`Stok tidak mencukupi. Stok saat ini: ${currentStock}`);
            return;
        }

        const newStock = isStockOut ? currentStock - quantity : currentStock + quantity;
        const productFromDB = this.products.find(p => p.id == productId);
        
        if (!productFromDB) {
            Notifications.error('Data produk tidak ditemukan');
            return;
        }

        const existingIndex = this.selectedProducts.findIndex(p => p.id == productId && p.outlet === outlet);
        
        if (existingIndex !== -1) {
            const existing = this.selectedProducts[existingIndex];
            const totalQty = existing.quantity + quantity;
            
            if (isStockOut && totalQty > currentStock) {
                Notifications.error(`Total stok keluar (${totalQty}) melebihi stok saat ini (${currentStock})`);
                return;
            }
            
            this.selectedProducts[existingIndex].quantity = totalQty;
            this.selectedProducts[existingIndex].new_stock = isStockOut ? currentStock - totalQty : currentStock + totalQty;
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

        list.innerHTML = this.selectedProducts.map((product, index) => `
            <tr class="hover:bg-gray-50">
                <td class="py-3 px-4">
                    <div class="font-medium">${product.nama_produk}</div>
                    <div class="text-xs text-gray-500">${product.group_produk || '-'}</div>
                </td>
                <td class="py-3 px-2 text-center">${product.outlet}</td>
                <td class="py-3 px-2 text-center">${product.current_stock}</td>
                <td class="py-3 px-2 text-center font-medium ${isStockOut ? 'text-red-600' : 'text-green-600'}">
                    ${isStockOut ? '-' : '+'}${product.quantity}
                </td>
                <td class="py-3 px-2 text-center font-medium text-blue-600">${product.new_stock}</td>
                <td class="py-3 px-2 text-center">
                    <button onclick="stockManagement.removeProductFromForm(${index})" 
                            class="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded">
                        Hapus
                    </button>
                </td>
            </tr>
        `).join('');
    }

    removeProductFromForm(index) {
        this.selectedProducts.splice(index, 1);
        this.updateSelectedProductsList();
    }

    // ========== SAVE STOCK MOVEMENT ==========
    async saveStockMovement(type) {
        try {
            const outlet = document.getElementById('outlet-select')?.value;
            const movementDateTime = document.getElementById('movement-date')?.value;
            const notes = document.getElementById('notes-input')?.value;

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
                const { data: freshProduct } = await supabase
                    .from('produk')
                    .select('*')
                    .eq('nama_produk', selectedProduct.nama_produk)
                    .eq('outlet', outlet)
                    .single();

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

                await supabase.from('produk').update({ 
                    stok: qtyAfter,
                    updated_at: new Date().toISOString()
                }).eq('nama_produk', selectedProduct.nama_produk).eq('outlet', outlet);

                await supabase.from('stok_update').insert([{
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
                }]);

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

    // ========== STOCK REPORT ==========
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
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter Laporan</h3>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                            <select id="outlet-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Outlet</option>${outletOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                            <input type="date" id="start-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                            <input type="date" id="end-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Group Produk</label>
                            <select id="group-filter" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="">Semua Group</option>${groupOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                            <input type="text" id="product-filter" placeholder="Cari produk..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end space-x-2">
                        <button id="apply-filter-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Terapkan Filter
                        </button>
                        <button id="clear-filter-btn" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Reset
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Laporan Pergerakan Stok</h3>
                            <p class="text-sm text-gray-500 mt-1">Data dari tabel stok_update & transaksi_detail</p>
                        </div>
                        <button id="export-report-btn" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center">
                            <i class="fas fa-file-export mr-2"></i>Export CSV
                        </button>
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

        this.createCustomModal('Laporan Pergerakan Stok', content, [
            { text: 'Tutup', onclick: () => this.closeCustomModal(), primary: false }
        ], { size: 'max-w-screen-2xl', fullHeight: true });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
        
        setTimeout(() => {
            document.getElementById('apply-filter-btn').onclick = () => this.applyMovementFilters();
            document.getElementById('clear-filter-btn').onclick = () => this.clearMovementFilters();
            document.getElementById('export-report-btn').onclick = () => this.exportStockReport();
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
                .eq('approval_status', 'approved');

            if (outletFilter) query = query.eq('outlet', outletFilter);
            if (groupFilter) query = query.eq('group_produk', groupFilter);

            const { data: movements, error } = await query;
            if (error) throw error;

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
        ['start-date', 'end-date', 'outlet-filter', 'group-filter', 'product-filter'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
        
        document.getElementById('movement-report-results').innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500">Gunakan filter untuk menampilkan laporan</p>
            </div>
        `;
        
        Notifications.info('Filter telah direset');
    }

    // ========== GENERATE REPORT ==========
    async generateStockReportFromDatabase(movements) {
        const container = document.getElementById('movement-report-results');
        if (!container) return;

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

            if (outletFilter) productsQuery = productsQuery.eq('outlet', outletFilter);
            if (groupFilter) productsQuery = productsQuery.eq('group_produk', groupFilter);

            const { data: currentProducts, error: productsError } = await productsQuery;
            if (productsError) throw productsError;

            let salesQuery = supabase
                .from('transaksi_detail')
                .select('item_name, qty, outlet, order_date')
                .gte('order_date', startDate)
                .lte('order_date', endDate)
                .eq('status', 'completed');

            if (outletFilter) salesQuery = salesQuery.eq('outlet', outletFilter);

            const { data: salesData } = await salesQuery;

            let returnsQuery = supabase
                .from('transaksi_detail')
                .select('item_name, qty, outlet, order_date')
                .gte('order_date', startDate)
                .lte('order_date', endDate)
                .eq('status', 'cancelled');

            if (outletFilter) returnsQuery = returnsQuery.eq('outlet', outletFilter);

            const { data: returnsData } = await returnsQuery;

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
                
                // ⭐⭐ PERHITUNGAN AWAL ⭐⭐
                let awal = (product.stok || 0) + totalKeluar + totalPenjualan - totalMasuk - totalPengembalian;
                awal = Math.max(0, awal);

                // ⭐⭐ HITUNG SISA ⭐⭐
                const sisa = awal + totalMasuk + totalPengembalian - totalKeluar - totalPenjualan;
                const sisaFinal = Math.max(0, sisa);

                // ⭐⭐ FILTER: Hanya tampilkan jika ada data aktif ⭐⭐
                const hasActiveData = totalMasuk > 0 || totalKeluar > 0 || totalPenjualan > 0 || totalPengembalian > 0;
                
                if (hasActiveData) {
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
                if (a.group_produk !== b.group_produk) return a.group_produk.localeCompare(b.group_produk);
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

            // Simpan untuk export
            this.currentReportData = { summary: summaryArray, totals, filters: { startDate, endDate, outletFilter } };

            // Render table
            container.innerHTML = this.renderReportTable(summaryArray, totals, { startDate, endDate, outletFilter, movements });
            Helpers.hideLoading();

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error generating report:', error);
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
                        <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-3"></i>
                        <p class="text-red-700 font-medium">Gagal memuat laporan</p>
                        <p class="text-sm text-red-600 mt-1">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }

    renderReportTable(summaryArray, totals, filters) {
        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Produk</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Awal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masuk</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengembalian</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penjualan</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keluar</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sisa</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${summaryArray.map(summary => {
                            const isStockLow = summary.sisa <= 10;
                            const isStockOut = summary.sisa <= 0;
                            return `
                                <tr class="hover:bg-gray-50 ${isStockLow ? 'bg-yellow-50' : ''} ${isStockOut ? 'bg-red-50' : ''}">
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${summary.group_produk}</td>
                                    <td class="px-4 py-3 text-sm text-gray-900">
                                        <div class="font-medium">${summary.product}</div>
                                        ${isStockLow ? '<span class="text-xs text-yellow-600">⚠️ Rendah</span>' : ''}
                                        ${isStockOut ? '<span class="text-xs text-red-600">⛔ Habis</span>' : ''}
                                    </td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${summary.outlet}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">${summary.awal}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">+${summary.masuk}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">${summary.pengembalian > 0 ? `+${summary.pengembalian}` : '0'}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-medium">${summary.penjualan > 0 ? `-${summary.penjualan}` : '0'}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">-${summary.keluar}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm font-bold ${
                                        summary.sisa > 10 ? 'text-green-600' : 
                                        summary.sisa > 0 ? 'text-yellow-600' : 'text-red-600'
                                    }">${summary.sisa}</td>
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
                            }">${totals.sisa}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mt-4 text-sm text-gray-500">
                <p>Periode: ${filters.startDate} sampai ${filters.endDate} | 
                   Total: ${summaryArray.length} produk | 
                   Pergerakan: ${filters.movements?.length || 0}</p>
            </div>
        `;
    }

    // ========== EXPORT CSV ==========
    async exportStockReport() {
        try {
            if (!this.currentReportData?.summary?.length) {
                Notifications.error('Tidak ada data untuk diexport');
                return;
            }

            const { summary, totals } = this.currentReportData;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const outletFilter = document.getElementById('outlet-filter').value;
            
            // Create CSV content
            let csv = 'LAPORAN PERGERAKAN STOK\n';
            csv += `Periode: ${startDate} s/d ${endDate}\n`;
            csv += `Outlet: ${outletFilter || 'Semua Outlet'}\n`;
            csv += `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;
            
            csv += 'Group Produk,Product,Outlet,Awal,Masuk,Pengembalian,Penjualan,Keluar,Sisa,Status\n';
            
            summary.forEach(item => {
                const status = item.sisa <= 0 ? 'HABIS' : item.sisa <= 10 ? 'RENDAH' : 'NORMAL';
                csv += `"${item.group_produk}","${item.product}","${item.outlet}",${item.awal},${item.masuk},${item.pengembalian},${item.penjualan},${item.keluar},${item.sisa},"${status}"\n`;
            });
            
            csv += '\n';
            csv += 'TOTAL,,,,,,,,,\n';
            csv += `"","","",${totals.awal},${totals.masuk},${totals.pengembalian},${totals.penjualan},${totals.keluar},${totals.sisa},""\n`;
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `Laporan_Stok_${startDate}_${endDate}_${outletFilter || 'Semua'}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Notifications.success('Laporan berhasil diexport');

        } catch (error) {
            console.error('Error exporting report:', error);
            Notifications.error('Gagal mengexport laporan: ' + error.message);
        }
    }

    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Stock Management not initialized. Call init() first.');
        }
    }
}

// Initialize
window.StockManagement = StockManagement;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        try {
            if (!window.stockManagement) {
                window.stockManagement = new StockManagement();
                await window.stockManagement.init();
                console.log('✅ Stock Management initialized');
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
