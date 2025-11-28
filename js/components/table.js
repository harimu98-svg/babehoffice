// Table component - ENTER KEY SEARCH ONLY dengan FOOTER SUPPORT
class DataTable {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            columns: [],
            data: [],
            actions: [],
            searchable: true,
            pagination: true,
            pageSize: 10,
            footerCallback: null, // TAMBAHKAN FOOTER CALLBACK
            ...options
        };
        this.currentPage = 1;
        this.filteredData = [];
        this.searchHandler = null;
        this.isInitialized = false;
        
        // Bind methods
        this.handleEnterKey = this.handleEnterKey.bind(this);
    }

    // Initialize table
    init() {
        if (!this.container) {
            console.error('Table container not found:', this.containerId);
            return;
        }
        
        if (this.isInitialized) {
            console.log('ℹ️ Table already initialized');
            return;
        }
        
        this.render();
        this.isInitialized = true;
        
        window.dataTable = this;
        console.log('✅ DataTable initialized:', this.container.id);
    }

    // Render table
    render() {
        if (!this.container) return;

        let html = '';

        // Search box - HANYA ENTER KEY
        if (this.options.searchable) {
            const searchId = `${this.container.id}-search`;
            
            html += `
                <div class="mb-4 data-table-search">
                    <div class="w-full">
                        <label for="${searchId}" class="block text-sm font-medium text-gray-700 mb-1">
                            Cari Data
                        </label>
                        <input 
                            type="text" 
                            id="${searchId}" 
                            placeholder="Ketik kata kunci lalu tekan Enter..." 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value=""
                        >
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Tekan Enter untuk memulai pencarian
                    </div>
                </div>
            `;
        }

        // Table
        html += `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                ${this.options.columns.map(col => `
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ${col.title}
                                    </th>
                                `).join('')}
                                ${this.options.actions.length > 0 ? `
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                ` : ''}
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${this.renderRows()}
                        </tbody>
                        ${this.renderFooter()} <!-- TAMBAHKAN FOOTER -->
                    </table>
                </div>
            </div>
        `;

        // Pagination
        if (this.options.pagination) {
            html += this.renderPagination();
        }

        this.container.innerHTML = html;

        // Setup search handler dengan delay
        setTimeout(() => {
            this.setupSearchHandler();
        }, 100);
    }

    // Render footer - METHOD BARU
    renderFooter() {
        if (!this.options.footerCallback) return '';
        
        try {
            const currentData = this.filteredData.length > 0 ? this.filteredData : this.options.data;
            const footerHTML = this.options.footerCallback(currentData);
            
            if (footerHTML && footerHTML.trim() !== '') {
                return footerHTML;
            }
        } catch (error) {
            console.error('Error rendering footer:', error);
        }
        
        return '';
    }

    // Setup search handler - HANYA ENTER KEY
    setupSearchHandler() {
        if (!this.options.searchable) return;
        
        const searchInput = document.getElementById(`${this.container.id}-search`);
        
        if (searchInput) {
            // Hapus event listener lama jika ada
            if (this.searchHandler) {
                searchInput.removeEventListener('keypress', this.searchHandler);
            }
            
            // Hanya handle Enter key
            this.searchHandler = this.handleEnterKey;
            searchInput.addEventListener('keypress', this.searchHandler);
            
            console.log('✅ Search handler setup (Enter key only)');
        } else {
            // Retry setelah delay
            setTimeout(() => this.setupSearchHandler(), 200);
        }
    }

    // Handle Enter key
    handleEnterKey(e) {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value;
            console.log('🔍 Executing search for:', searchTerm);
            this.executeSearch(searchTerm);
        }
    }

    // Execute search
    executeSearch(searchTerm) {
        this.search(searchTerm);
        
        // Tambahkan efek visual sementara pada input
        const searchInput = document.getElementById(`${this.container.id}-search`);
        if (searchInput) {
            searchInput.classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => {
                searchInput.classList.remove('ring-2', 'ring-blue-500');
            }, 500);
        }
    }

    // Render table rows
    renderRows() {
        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const dataToShow = this.filteredData.length > 0 ? 
            this.filteredData.slice(startIndex, endIndex) : 
            this.options.data.slice(startIndex, endIndex);

        if (dataToShow.length === 0) {
            const hasSearch = this.filteredData.length > 0;
            return `
                <tr>
                    <td colspan="${this.options.columns.length + (this.options.actions.length > 0 ? 1 : 0)}" 
                        class="px-6 py-8 text-center">
                        <div class="flex flex-col items-center justify-center text-gray-500">
                            <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${hasSearch ? 
                                    `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>` :
                                    `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>`
                                }
                            </svg>
                            <p class="text-lg font-medium mb-1">
                                ${hasSearch ? 'Data tidak ditemukan' : 'Tidak ada data'}
                            </p>
                            <p class="text-sm">
                                ${hasSearch ? 
                                    'Coba dengan kata kunci yang berbeda' : 
                                    'Tambahkan data baru untuk memulai'
                                }
                            </p>
                            ${hasSearch ? `
                                <button 
                                    onclick="window.dataTable.clearSearch()"
                                    class="mt-3 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                                >
                                    Tampilkan Semua Data
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }

        return dataToShow.map((row, index) => {
            const rowId = this.findRowId(row, index);
            
            return `
                <tr class="hover:bg-gray-50">
                    ${this.options.columns.map(col => `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${this.formatCell(row[col.key], col, row)}
                        </td>
                    `).join('')}
                    ${this.options.actions.length > 0 ? `
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            ${this.options.actions.map(action => `
                                <button 
                                    onclick="${action.onclick}('${rowId}')"
                                    class="ml-2 ${this.getButtonClass(action.color)}"
                                >
                                    ${action.text}
                                </button>
                            `).join('')}
                        </td>
                    ` : ''}
                </tr>
            `;
        }).join('');
    }

    // Helper untuk mencari ID row
    findRowId(row, index) {
        const possibleIdFields = [
            'id', 
            'id_produk', 'product_id',
            'id_karyawan', 'employee_id', 
            'id_member', 'member_id',
            'id_outlet', 'outlet_id',
            'id_group', 'group_id'
        ];
        
        for (const field of possibleIdFields) {
            if (row[field]) {
                return row[field];
            }
        }
        
        return index;
    }

    // Helper untuk class button
    getButtonClass(color) {
        const colorMap = {
            'red': 'text-red-600 hover:text-red-900',
            'blue': 'text-blue-600 hover:text-blue-900', 
            'green': 'text-green-600 hover:text-green-900',
            'yellow': 'text-yellow-600 hover:text-yellow-900',
            'purple': 'text-purple-600 hover:text-purple-900'
        };
        
        return colorMap[color] || 'text-blue-600 hover:text-blue-900';
    }

    // Format cell value
    formatCell(value, column, row = null) {
        if (column.formatter) {
            return column.formatter(value, row);
        }

        if (typeof value === 'boolean') {
            return value ? 
                '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ya</span>' :
                '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Tidak</span>';
        }

        if (column.type === 'currency') {
            return Helpers.formatCurrency(value);
        }

        if (column.type === 'date') {
            return Helpers.formatDateWIB(value);
        }

        if (value === null || value === undefined) {
            return '<span class="text-gray-400">-</span>';
        }

        return value;
    }

    // Render pagination
    renderPagination() {
        const totalData = this.filteredData.length > 0 ? this.filteredData.length : this.options.data.length;
        const totalPages = Math.ceil(totalData / this.options.pageSize);

        if (totalPages <= 1) return '';

        const maxVisiblePages = 10;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const visiblePages = [];
        for (let i = startPage; i <= endPage; i++) {
            visiblePages.push(i);
        }

        return `
            <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div class="flex justify-between sm:hidden">
                    <button 
                        onclick="window.dataTable.previousPage()"
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    >
                        Previous
                    </button>
                    <button 
                        onclick="window.dataTable.nextPage()"
                        ${this.currentPage === totalPages ? 'disabled' : ''}
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    >
                        Next
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Menampilkan 
                            <span class="font-medium">${((this.currentPage - 1) * this.options.pageSize) + 1}</span>
                            - 
                            <span class="font-medium">${Math.min(this.currentPage * this.options.pageSize, totalData)}</span>
                            dari 
                            <span class="font-medium">${totalData}</span>
                            hasil
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                                onclick="window.dataTable.previousPage()"
                                ${this.currentPage === 1 ? 'disabled' : ''}
                                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>

                            ${visiblePages.map(page => `
                                <button
                                    onclick="window.dataTable.goToPage(${page})"
                                    class="${this.currentPage === page ? 
                                        'z-10 bg-blue-50 border-blue-500 text-blue-600' : 
                                        'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    } relative inline-flex items-center px-3 py-2 border text-sm font-medium min-w-[40px] justify-center"
                                >
                                    ${page}
                                </button>
                            `).join('')}

                            <button
                                onclick="window.dataTable.nextPage()"
                                ${this.currentPage === totalPages ? 'disabled' : ''}
                                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    // Search function
    search(term) {
        if (!term || term.trim() === '') {
            this.filteredData = [];
            this.currentPage = 1;
            this.render();
            return;
        }

        const searchTerm = term.toLowerCase().trim();
        
        this.filteredData = this.options.data.filter(row => {
            return this.options.columns.some(col => {
                const value = row[col.key];
                if (value === null || value === undefined) return false;
                
                const stringValue = String(value).toLowerCase();
                return stringValue.includes(searchTerm);
            });
        });

        console.log('📊 Search results:', this.filteredData.length, 'items found for:', searchTerm);
        this.currentPage = 1;
        this.render();
    }

    // Pagination methods
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
        }
    }

    nextPage() {
        const totalData = this.filteredData.length > 0 ? this.filteredData.length : this.options.data.length;
        const totalPages = Math.ceil(totalData / this.options.pageSize);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.render();
    }

    // Update data
    updateData(newData) {
        this.options.data = newData;
        this.filteredData = [];
        this.currentPage = 1;
        this.render();
    }

    // Clear search
    clearSearch() {
        this.filteredData = [];
        this.currentPage = 1;
        
        const searchInput = document.getElementById(`${this.container.id}-search`);
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.render();
    }

    // Set footer callback - METHOD BARU
    setFooterCallback(callback) {
        this.options.footerCallback = callback;
        return this;
    }

    // Update options - METHOD BARU
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }

    // Destroy table
    destroy() {
        if (this.searchHandler) {
            const searchInput = document.getElementById(`${this.container.id}-search`);
            if (searchInput) {
                searchInput.removeEventListener('keypress', this.searchHandler);
            }
        }
        
        this.isInitialized = false;
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
