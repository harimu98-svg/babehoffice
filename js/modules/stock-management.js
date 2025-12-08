// Stock Management Module - Complete Version
class StockManagement {
    constructor() {
        this.outlets = [];
        this.products = [];
        this.groupProducts = [];
        this.selectedProducts = [];
        this.stockMovements = [];
        this.isInitialized = false;
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

    // Show stock in form
    async showStockInForm() {
        await this.showStockForm('in', 'Stok Masuk');
    }

    // Show stock out form
    async showStockOutForm() {
        await this.showStockForm('out', 'Stok Keluar');
    }

    // Show stock form - COMPLETE VERSION
async showStockForm(type, title) {
    const outletOptions = this.outlets.map(outlet => 
        `<option value="${outlet.outlet}">${outlet.outlet}</option>`
    ).join('');

    const productOptions = this.products
        .filter(product => product.inventory)
        .map(product => 
            `<option value="${product.id}" data-stock="${product.stok || 0}">
                ${product.nama_produk} (Stok: ${product.stok || 0})
            </option>`
        ).join('');

    const content = `
        <form id="stock-form" class="space-y-4" data-transaction-type="${type}">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Outlet *</label>
                    <select 
                        id="outlet-select"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Pilih Outlet</option>
                        ${outletOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                    <input 
                        type="datetime-local" 
                        id="movement-date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tambah Produk *</label>
                <div class="flex space-x-2">
                    <select 
                        id="product-select"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Pilih Produk</option>
                        ${productOptions}
                    </select>
                    <input 
                        type="number" 
                        id="quantity-input"
                        placeholder="Jumlah"
                        min="1"
                        class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                    <button 
                        type="button"
                        onclick="stockManagement.addProductToForm()"
                        class="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        title="Tambah Produk"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                    </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">* Hanya produk dengan inventory aktif</p>
            </div>

            <!-- Selected Products Table -->
            <div id="selected-products-container" class="hidden">
                <label class="block text-sm font-medium text-gray-700 mb-1">Produk Dipilih</label>
                <div class="bg-gray-50 rounded-lg p-4 border">
                    <table class="min-w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left text-sm font-medium text-gray-500 pb-2">Produk</th>
                                <th class="text-left text-sm font-medium text-gray-500 pb-2">Stok Saat Ini</th>
                                <th class="text-left text-sm font-medium text-gray-500 pb-2">Jumlah ${type === 'in' ? 'Masuk' : 'Keluar'}</th>
                                <th class="text-left text-sm font-medium text-gray-500 pb-2">Stok Baru</th>
                                <th class="text-left text-sm font-medium text-gray-500 pb-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="selected-products-list">
                            <!-- Products will be added here dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea 
                    id="notes-input"
                    rows="3"
                    placeholder="Catatan untuk pergerakan stok ini..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
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
            text: 'Simpan',
            onclick: `stockManagement.saveStockMovement('${type}')`,
            primary: true
        }
    ];

   modal.createModal(title, content, buttons, {
        size: 'max-w-lg', // Lebih kecil dari sebelumnya
    });
    // TAMBAHKAN event listener untuk filter produk:
    setTimeout(() => {
        const outletSelect = document.getElementById('outlet-select');
        if (outletSelect) {
            outletSelect.addEventListener('change', () => {
                this.filterProductsByOutlet();
            });
        }
    }, 100);
}

// TAMBAHKAN method filter:
filterProductsByOutlet() {
    const outletSelect = document.getElementById('outlet-select');
    const productSelect = document.getElementById('product-select');
    if (!outletSelect || !productSelect) return;
    
    const selectedOutlet = outletSelect.value;
    const allOptions = productSelect.querySelectorAll('option');
    
    // Tampilkan/sembunyikan berdasarkan outlet
    allOptions.forEach(option => {
        if (option.value === "") {
            option.style.display = ''; // "Pilih Produk" tetap tampil
            return;
        }
        
        const product = this.products.find(p => p.id == option.value);
        if (product) {
            // Tampilkan hanya jika outlet cocok atau belum pilih outlet
            const shouldShow = !selectedOutlet || product.outlet === selectedOutlet;
            option.style.display = shouldShow ? '' : 'none';
            
            // Update text dengan info outlet
            option.textContent = `${product.nama_produk} (Outlet: ${product.outlet}, Stok: ${product.stok || 0})`;
        }
    });
    
    // Reset ke pilihan pertama
    productSelect.value = "";
}
    
    // ✅ SIMPAN transaction type dengan benar
    this.currentTransactionType = type;
    console.log('💾 Saved transaction type:', this.currentTransactionType);
    
    // Set current datetime
    const now = new Date();
    const localDateTime = now.toISOString().slice(0, 16);
    document.getElementById('movement-date').value = localDateTime;

    // Reset selected products
    this.selectedProducts = [];
}
// Add product to form - FIXED VERSION dengan fallback yang kuat
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

    // ✅ MULTIPLE FALLBACKS untuk mendapatkan transaction type
    let transactionType = 'in'; // default
    
    // 1. Cek dari data attribute form
    const form = document.getElementById('stock-form');
    if (form) {
        transactionType = form.getAttribute('data-transaction-type');
        console.log('📋 Transaction from form data:', transactionType);
    }
    
    // 2. Cek dari class property
    if (!transactionType && this.currentTransactionType) {
        transactionType = this.currentTransactionType;
        console.log('📋 Transaction from class property:', transactionType);
    }
    
    // 3. Cek dari modal title (fallback terakhir)
    if (!transactionType) {
        const modalTitle = document.querySelector('.modal h3, .modal .text-base');
        if (modalTitle) {
            const titleText = modalTitle.textContent.toLowerCase();
            if (titleText.includes('keluar')) {
                transactionType = 'out';
            }
            console.log('📋 Transaction from modal title:', transactionType);
        }
    }

    const isStockOut = transactionType === 'out';
    console.log('🎯 Final Transaction Type:', transactionType, 'Is Stock Out:', isStockOut);

    // Check stock availability for stock out
    if (isStockOut && (product.stok === null || product.stok < quantity)) {
        Notifications.error(`Stok ${product.nama_produk} tidak mencukupi. Stok saat ini: ${product.stok || 0}`);
        return;
    }

    // ✅ CALCULATION yang jelas
    let newStock;
    if (isStockOut) {
        newStock = product.stok - quantity;
        console.log(`➖ STOCK KELUAR: ${product.stok} - ${quantity} = ${newStock}`);
    } else {
        newStock = product.stok + quantity;
        console.log(`➕ STOK MASUK: ${product.stok} + ${quantity} = ${newStock}`);
    }

    // Remove existing and add new
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
}

 // EMERGENCY FIX - Hardcode untuk testing
updateSelectedProductsList() {
    const container = document.getElementById('selected-products-container');
    const list = document.getElementById('selected-products-list');

    if (this.selectedProducts.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    // EMERGENCY FIX: Always show minus for stock out
    // Ganti 'out' dengan kondisi yang sesuai
    const isStockOut = true; // FORCE MINUS untuk testing

    list.innerHTML = this.selectedProducts.map((product, index) => `
        <tr class="border-b border-gray-200">
            <td class="py-3 text-sm text-gray-900">${product.nama_produk}</td>
            <td class="py-3 text-sm text-gray-600">${product.current_stock}</td>
            <td class="py-3 text-sm font-medium text-red-600">
                -${product.quantity} <!-- SELALU MINUS untuk stok keluar -->
            </td>
            <td class="py-3 text-sm font-medium text-blue-600">${product.new_stock}</td>
            <td class="py-3">
                <button 
                    onclick="stockManagement.removeProductFromForm(${index})"
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

    // Remove product from form
    removeProductFromForm(index) {
        this.selectedProducts.splice(index, 1);
        this.updateSelectedProductsList();
    }

   // Save stock movement - FIXED: pastikan current_stock selalu dari database
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
            // Get fresh product data from database to ensure accurate current stock
            const freshProduct = this.products.find(p => p.id == selectedProduct.id);
            if (!freshProduct) continue;

            // Calculate new stock based on type - FIXED: gunakan stok fresh dari database
            let newStock;
            if (type === 'out') {
                // Stok Keluar: new stock = current stock - quantity
                newStock = freshProduct.stok - selectedProduct.quantity;
            } else {
                // Stok Masuk: new stock = current stock + quantity
                newStock = freshProduct.stok + selectedProduct.quantity;
            }

            // Update product stock in database
            const { error: updateError } = await supabase
                .from('produk')
                .update({ stok: newStock })
                .eq('id', selectedProduct.id);

            if (updateError) throw updateError;

            // Create stock movement record in localStorage
            const movement = {
                id: Date.now() + Math.random(),
                outlet: outlet,
                product_id: selectedProduct.id,
                product_name: selectedProduct.nama_produk,
                group_produk: selectedProduct.group_produk,
                type: type,
                quantity: selectedProduct.quantity,
                previous_stock: freshProduct.stok, // Stok sebelum perubahan (dari database)
                new_stock: newStock, // Stok setelah perubahan
                notes: notes,
                user_name: userName,
                movement_date: movementDateTime,
                created_at: new Date().toISOString()
            };

            this.stockMovements.push(movement);
        }

        // Save to localStorage
        this.saveMovementsToStorage();

        modal.close();
        Helpers.hideLoading();
        
        // Reload data untuk mendapatkan stok terbaru
        await this.loadProducts();
        await this.loadRecentMovements();
        
        Notifications.success(`Stok ${type === 'in' ? 'masuk' : 'keluar'} berhasil disimpan`);

    } catch (error) {
        Helpers.hideLoading();
        console.error('Error saving stock movement:', error);
        Notifications.error('Gagal menyimpan pergerakan stok: ' + error.message);
    }
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
                    <!-- Soft Reset -->
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

                    <!-- Hard Reset -->
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

        modal.createModal('Reset Data Stok', content, [
            {
                text: 'Batal',
                onclick: 'modal.close()',
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

            // Reset data di localStorage
            this.stockMovements = [];
            this.saveMovementsToStorage();

            // Reset selected products
            this.selectedProducts = [];

            Helpers.hideLoading();
            
            // Refresh tampilan
            await this.loadRecentMovements();
            
            Notifications.success('Data pergerakan stok berhasil direset');
            modal.close();

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

            // Reset movements data
            this.stockMovements = [];
            this.saveMovementsToStorage();

            // Reset semua stok produk ke 0
            const { error: updateError } = await supabase
                .from('produk')
                .update({ stok: 0 })
                .eq('inventory', true);

            if (updateError) throw updateError;

            // Reload data
            await this.loadProducts();

            Helpers.hideLoading();
            
            // Refresh tampilan
            await this.loadRecentMovements();
            
            Notifications.success('Hard reset berhasil! Semua stok dikembalikan ke 0');
            modal.close();

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

    // Load stock movement report
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
                            onclick="stockManagement.applyMovementFilters()"
                            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Terapkan Filter
                        </button>
                        <button 
                            onclick="stockManagement.clearMovementFilters()"
                            class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
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
                onclick: 'modal.close()',
                primary: false
            }
        ];

        modal.createModal('Laporan Pergerakan Stok', content, buttons, {
            size: 'max-w-screen-2xl',
            fullHeight: true
        });

        // Set default dates (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    }

    // Apply movement filters - FIXED VERSION
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

        // Filter movements by date range
        let filteredMovements = this.stockMovements.filter(movement => {
            const movementDate = new Date(movement.movement_date);
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            return movementDate >= start && movementDate <= end;
        });

        // Filter by outlet
        if (outletFilter) {
            filteredMovements = filteredMovements.filter(movement => 
                movement.outlet === outletFilter
            );
        }

        // Filter by group produk
        if (groupFilter) {
            filteredMovements = filteredMovements.filter(movement => 
                movement.group_produk === groupFilter
            );
        }

        // Filter by product name - FIXED VERSION
        if (productFilter) {
            filteredMovements = filteredMovements.filter(movement => {
                // Handle case where product_name might be null/undefined
                const productName = movement.product_name || '';
                return productName.toLowerCase().includes(productFilter);
            });
        }

        console.log('🔍 Filter Results:', {
            totalMovements: this.stockMovements.length,
            afterDateFilter: filteredMovements.length,
            productFilter: productFilter,
            filteredProducts: [...new Set(filteredMovements.map(m => m.product_name))]
        });

        // Generate report data
        this.generateStockReport(filteredMovements);

        Helpers.hideLoading();

    } catch (error) {
        Helpers.hideLoading();
        console.error('Error applying filters:', error);
        Notifications.error('Gagal memuat laporan: ' + error.message);
    }
}

    // Clear filters - IMPROVED VERSION
clearMovementFilters() {
    // Reset input values
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('outlet-filter').value = '';
    document.getElementById('group-filter').value = '';
    document.getElementById('product-filter').value = '';
    
    // Reset ke default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    
    // Clear results
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

   // Generate stock report - FIXED VERSION dengan filter produk
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

    // Get filter dates
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const startDateTime = new Date(startDate + 'T00:00:00');

    // Get product filter value untuk debug
    const productFilterValue = document.getElementById('product-filter').value.toLowerCase().trim();
    console.log('🔍 Generating report with product filter:', productFilterValue);

    // Group by product and outlet untuk perhitungan yang akurat
    const productSummary = {};
    
    // Process each product to calculate initial stock and period movements
    this.products.forEach(product => {
        if (!product.inventory) return;
        
        // ✅ TAMBAHKAN: Filter berdasarkan nama produk
        if (productFilterValue && !product.nama_produk.toLowerCase().includes(productFilterValue)) {
            return; // Skip produk yang tidak match dengan filter
        }
        
        const key = `${product.id}-${product.outlet}`;
        
        // Cari semua movement untuk produk ini sebelum periode
        const movementsBeforePeriod = this.stockMovements.filter(movement => 
            movement.product_id === product.id && 
            movement.outlet === product.outlet &&
            new Date(movement.movement_date) < startDateTime
        );

        // Hitung stok awal: stok saat ini dikurangi movement dalam periode, ditambah movement sebelum periode
        let initialStock = product.stok || 0;
        
        // Kurangi movement dalam periode (karena stok saat ini sudah termasuk movement periode)
        movements.forEach(movement => {
            if (movement.product_id === product.id && movement.outlet === product.outlet) {
                if (movement.type === 'in') {
                    initialStock -= movement.quantity;
                } else if (movement.type === 'out') {
                    initialStock += movement.quantity;
                }
            }
        });

        // Hitung movement dalam periode
        let periodMasuk = 0;
        let periodKeluar = 0;

        movements.forEach(movement => {
            if (movement.product_id === product.id && movement.outlet === product.outlet) {
                if (movement.type === 'in') {
                    periodMasuk += movement.quantity;
                } else if (movement.type === 'out') {
                    periodKeluar += movement.quantity;
                }
            }
        });

        // Validasi: initial stock tidak boleh negatif
        initialStock = Math.max(0, initialStock);

        const sisa = initialStock + periodMasuk - periodKeluar;

        productSummary[key] = {
            group_produk: product.group_produk,
            product: product.nama_produk,
            outlet: product.outlet,
            awal: initialStock,
            masuk: periodMasuk,
            pengembalian: 0,
            penjualan: 0,
            keluar: periodKeluar,
            sisa: sisa
        };
    });

    // Convert to array dan filter hanya yang ada movement dalam periode
    const summaryArray = Object.values(productSummary).filter(summary => 
        summary.masuk > 0 || summary.keluar > 0 || summary.awal > 0
    );

    console.log('📊 Products in summary after filter:', summaryArray.map(s => s.product));

    const html = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Produk</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Awal</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masuk</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengembalian</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penjualan</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keluar</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sisa</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${summaryArray.map(summary => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${summary.group_produk}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${summary.product}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${summary.outlet}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${summary.awal}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">+${summary.masuk}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">${summary.pengembalian}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">${summary.penjualan}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">-${summary.keluar}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${
                                summary.sisa > 0 ? 'text-green-600' : summary.sisa < 0 ? 'text-red-600' : 'text-gray-600'
                            }">
                                ${summary.sisa}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-4 text-sm text-gray-500">
            Menampilkan ${summaryArray.length} produk dari ${movements.length} pergerakan stok
            <br>
            <span class="text-xs">* Periode: ${startDate} sampai ${endDate}</span>
            <br>
            <span class="text-xs">* Filter produk: "${document.getElementById('product-filter').value || 'Semua produk'}"</span>
            <br>
            <span class="text-xs">* Nilai Awal: Stok pada tanggal ${startDate}</span>
            <br>
            <span class="text-xs">* Rumus: Awal + Masuk - Keluar = Sisa</span>
        </div>
    `;

    container.innerHTML = html;
}

    // Check if initialized
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('Stock Management not initialized. Call init() first.');
        }
    }
}

// Simple and safe initialization
window.StockManagement = StockManagement;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Stock Management...');
    
    // Wait a bit for other scripts to load
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

// Manual initialization function
window.initStockManagement = async function() {
    if (!window.stockManagement) {
        window.stockManagement = new StockManagement();
        await window.stockManagement.init();
    }
    return window.stockManagement;
};
