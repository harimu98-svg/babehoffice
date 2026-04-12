// Dashboard Module - FULL VERSION WITH PAGINATION
class Dashboard {
    constructor() {
        this.stats = {
            totalProducts: 0,
            totalEmployees: 0,
            totalMembers: 0,
            totalOutlets: 0,
            todaySales: 0,
            monthlySales: 0
        };
        
        // Pagination state for members
        this.memberPagination = {
            currentPage: 0,
            pageSize: 20,
            totalPages: 0,
            totalRecords: 0,
            searchTerm: ''
        };
    }

    // Initialize module
    async init() {
        console.log('Initializing Dashboard module');
        await this.loadStats();
        this.initCharts();
        this.bindEvents();
        
        // Initialize member module if on members page
        if (document.getElementById('members-table-body')) {
            await this.initMemberModule();
        }
        
        console.log('Dashboard module initialized');
    }

    // ==================== HELPER FUNCTIONS ====================

    // Get date range for current month
    getCurrentMonthRange() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return {
            start: startOfMonth.toISOString().split('T')[0],
            end: endOfMonth.toISOString().split('T')[0]
        };
    }

    // Get today's date range
    getTodayRange() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        return {
            start: todayStr,
            end: todayStr
        };
    }

    // Generic paginated query - fetches ALL data matching criteria
    async fetchAllWithPagination(table, selectColumns = '*', filters = {}, maxRecords = 100000) {
        let allData = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        try {
            while (hasMore && from < maxRecords) {
                let query = supabase
                    .from(table)
                    .select(selectColumns)
                    .range(from, from + pageSize - 1);

                // Apply filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        // Handle operators like gte, lte, eq, like
                        const [operator, val] = Object.entries(value)[0];
                        if (operator === 'like') {
                            query = query.like(key, val);
                        } else {
                            query = query[operator](key, val);
                        }
                    } else if (value !== undefined && value !== null) {
                        query = query.eq(key, value);
                    }
                });

                const { data, error } = await query;

                if (error) {
                    console.error(`Pagination error at offset ${from}:`, error);
                    break;
                }

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += pageSize;
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }

            return { data: allData, error: null, count: allData.length };
        } catch (error) {
            console.error(`Error in paginated fetch for ${table}:`, error);
            return { data: [], error, count: 0 };
        }
    }

    // Format currency
    formatCurrency(value) {
        if (typeof Helpers !== 'undefined' && Helpers.formatCurrency) {
            return Helpers.formatCurrency(value);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Format date WIB
    formatDateWIB(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        if (typeof Notifications !== 'undefined') {
            if (type === 'success' && Notifications.success) {
                Notifications.success(message);
            } else if (type === 'error' && Notifications.error) {
                Notifications.error(message);
            } else if (type === 'warning' && Notifications.warning) {
                Notifications.warning(message);
            }
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    // ==================== MAIN DASHBOARD STATS ====================

    // Load dashboard statistics
    async loadStats() {
        try {
            if (typeof Helpers !== 'undefined' && Helpers.showLoading) {
                Helpers.showLoading();
            }

            // 1. Load total products (count only - fastest)
            const { count: productsCount, error: productsError } = await supabase
                .from('produk')
                .select('*', { count: 'exact', head: true });

            if (!productsError) {
                this.stats.totalProducts = productsCount || 0;
                const elem = document.getElementById('total-products');
                if (elem) elem.textContent = this.stats.totalProducts.toLocaleString();
            }

            // 2. Load total employees
            const { count: employeesCount, error: employeesError } = await supabase
                .from('karyawan')
                .select('*', { count: 'exact', head: true });

            if (!employeesError) {
                this.stats.totalEmployees = employeesCount || 0;
                const elem = document.getElementById('total-employees');
                if (elem) elem.textContent = this.stats.totalEmployees.toLocaleString();
            }

            // 3. Load total members (with pagination for accuracy)
            const membersResult = await this.fetchAllWithPagination('membercard', 'id');
            if (!membersResult.error) {
                this.stats.totalMembers = membersResult.count;
                const elem = document.getElementById('total-members');
                if (elem) elem.textContent = this.stats.totalMembers.toLocaleString();
            }

            // 4. Load total outlets
            const { count: outletsCount, error: outletsError } = await supabase
                .from('outlet')
                .select('*', { count: 'exact', head: true });

            if (!outletsError) {
                this.stats.totalOutlets = outletsCount || 0;
                const elem = document.getElementById('total-outlets');
                if (elem) elem.textContent = this.stats.totalOutlets.toLocaleString();
            }

            // 5. Load TODAY'S SALES
            await this.loadTodaySales();

            // 6. Load MONTHLY SALES (with pagination)
            await this.loadMonthlySales();

            // 7. Load recent transactions
            await this.loadRecentTransactions();

            if (typeof Helpers !== 'undefined' && Helpers.hideLoading) {
                Helpers.hideLoading();
            }

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            if (typeof Helpers !== 'undefined' && Helpers.hideLoading) {
                Helpers.hideLoading();
            }
            this.showNotification('Gagal memuat statistik dashboard', 'error');
        }
    }

    // Load today's sales
    async loadTodaySales() {
        try {
            const todayRange = this.getTodayRange();
            
            const { data: todaySales, error: todayError } = await supabase
                .from('transaksi_detail')
                .select('amount')
                .eq('status', 'completed')
                .eq('order_date', todayRange.start);

            if (!todayError && todaySales) {
                this.stats.todaySales = todaySales.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                
                const elem = document.getElementById('today-sales');
                if (elem) {
                    elem.textContent = this.formatCurrency(this.stats.todaySales);
                }
                console.log('Today sales total:', this.stats.todaySales, 'from', todaySales.length, 'transactions');
            } else {
                console.error('Error loading today sales:', todayError);
            }
        } catch (error) {
            console.error('Error in loadTodaySales:', error);
        }
    }

    // Load monthly sales with pagination
    async loadMonthlySales() {
        try {
            const monthRange = this.getCurrentMonthRange();
            console.log('Fetching monthly sales from:', monthRange.start, 'to:', monthRange.end);
            
            let allSales = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('transaksi_detail')
                    .select('amount, order_date')
                    .eq('status', 'completed')
                    .gte('order_date', monthRange.start)
                    .lte('order_date', monthRange.end)
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) {
                    console.error('Monthly sales pagination error:', error);
                    break;
                }

                if (data && data.length > 0) {
                    allSales = [...allSales, ...data];
                    page++;
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }

                // Safety break
                if (page > 100) break;
            }

            if (allSales.length > 0) {
                this.stats.monthlySales = allSales.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                
                const elem = document.getElementById('monthly-sales');
                if (elem) {
                    elem.textContent = this.formatCurrency(this.stats.monthlySales);
                }
                console.log('Monthly sales total:', this.stats.monthlySales, 'from', allSales.length, 'transactions');
            } else {
                console.log('No monthly sales data found');
                const elem = document.getElementById('monthly-sales');
                if (elem) elem.textContent = this.formatCurrency(0);
            }
        } catch (error) {
            console.error('Error in loadMonthlySales:', error);
        }
    }

    // ==================== RECENT TRANSACTIONS ====================

    // Load recent transactions
    async loadRecentTransactions() {
        try {
            const { data: transactions, error } = await supabase
                .from('transaksi_detail')
                .select('*')
                .eq('status', 'completed')
                .order('order_date', { ascending: false })
                .limit(10);

            if (!error && transactions) {
                this.displayRecentTransactions(transactions);
            } else {
                console.error('Error loading recent transactions:', error);
            }
        } catch (error) {
            console.error('Error in loadRecentTransactions:', error);
        }
    }

    // Display recent transactions
    displayRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Belum ada transaksi</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = transactions.map(transaction => `
            <div class="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${this.escapeHtml(transaction.customer_name || 'Walk-in Customer')}</p>
                        <p class="text-xs text-gray-500">${this.escapeHtml(transaction.order_no || '-')} • ${this.formatDateWIB(transaction.order_date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">${this.formatCurrency(transaction.amount || 0)}</p>
                    <p class="text-xs text-gray-500 capitalize">${this.escapeHtml(transaction.payment_type || '-')}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    // ==================== MEMBER MODULE WITH PAGINATION ====================

    // Initialize member module
    async initMemberModule() {
        console.log('Initializing Member module with pagination');
        this.memberPagination = {
            currentPage: 0,
            pageSize: 20,
            totalPages: 0,
            totalRecords: 0,
            searchTerm: ''
        };
        
        await this.loadMembers();
        this.bindMemberEvents();
    }

    // Load members with pagination
    async loadMembers(page = 0) {
        try {
            this.memberPagination.currentPage = page;
            
            let query = supabase
                .from('membercard')
                .select('*', { count: 'exact' })
                .range(
                    page * this.memberPagination.pageSize, 
                    (page + 1) * this.memberPagination.pageSize - 1
                )
                .order('created_at', { ascending: false });

            // Apply search filter if exists
            if (this.memberPagination.searchTerm) {
                query = query.or(
                    `name.ilike.%${this.memberPagination.searchTerm}%,` +
                    `email.ilike.%${this.memberPagination.searchTerm}%,` +
                    `phone.ilike.%${this.memberPagination.searchTerm}%,` +
                    `code.ilike.%${this.memberPagination.searchTerm}%`
                );
            }

            const { data, error, count } = await query;

            if (error) throw error;

            this.memberPagination.totalRecords = count || 0;
            this.memberPagination.totalPages = Math.ceil((count || 0) / this.memberPagination.pageSize);
            
            this.displayMembers(data || []);
            this.renderMemberPagination();

        } catch (error) {
            console.error('Error loading members:', error);
            this.showNotification('Gagal memuat data member', 'error');
        }
    }

    // Display members in table
    displayMembers(members) {
        const container = document.getElementById('members-table-body');
        if (!container) return;

        if (!members || members.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        Tidak ada data member
                    </td>
                </tr>
            `;
            return;
        }

        const membersHTML = members.map(member => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-4">${this.escapeHtml(member.code || '-')}</td>
                <td class="py-3 px-4 font-medium">${this.escapeHtml(member.name || '-')}</td>
                <td class="py-3 px-4">${this.escapeHtml(member.email || '-')}</td>
                <td class="py-3 px-4">${this.escapeHtml(member.phone || '-')}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${member.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                </td>
                <td class="py-3 px-4">
                    <button onclick="dashboard.viewMember('${member.id}')" 
                        class="text-blue-600 hover:text-blue-800 mr-2">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                    <button onclick="dashboard.editMember('${member.id}')" 
                        class="text-yellow-600 hover:text-yellow-800 mr-2">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="dashboard.deleteMember('${member.id}')" 
                        class="text-red-600 hover:text-red-800">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = membersHTML;
    }

    // Render pagination controls
    renderMemberPagination() {
        const container = document.getElementById('member-pagination');
        if (!container) return;

        if (this.memberPagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = this.memberPagination.currentPage;
        const totalPages = this.memberPagination.totalPages;
        
        let paginationHTML = '<div class="flex justify-center items-center space-x-2 mt-4">';
        
        // Previous button
        paginationHTML += `
            <button 
                class="px-3 py-1 rounded ${currentPage === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                ${currentPage === 0 ? 'disabled' : ''}
                onclick="dashboard.goToMemberPage(${currentPage - 1})">
                &laquo; Previous
            </button>
        `;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }

        if (startPage > 0) {
            paginationHTML += `<button class="px-3 py-1 rounded bg-gray-200" onclick="dashboard.goToMemberPage(0)">1</button>`;
            if (startPage > 1) paginationHTML += `<span class="px-2">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button 
                    class="px-3 py-1 rounded ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
                    onclick="dashboard.goToMemberPage(${i})">
                    ${i + 1}
                </button>
            `;
        }

        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) paginationHTML += `<span class="px-2">...</span>`;
            paginationHTML += `<button class="px-3 py-1 rounded bg-gray-200" onclick="dashboard.goToMemberPage(${totalPages - 1})">${totalPages}</button>`;
        }

        // Next button
        paginationHTML += `
            <button 
                class="px-3 py-1 rounded ${currentPage === totalPages - 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                ${currentPage === totalPages - 1 ? 'disabled' : ''}
                onclick="dashboard.goToMemberPage(${currentPage + 1})">
                Next &raquo;
            </button>
        `;

        // Info text
        const startRecord = currentPage * this.memberPagination.pageSize + 1;
        const endRecord = Math.min((currentPage + 1) * this.memberPagination.pageSize, this.memberPagination.totalRecords);
        
        paginationHTML += `
            <div class="ml-4 text-sm text-gray-600">
                Menampilkan ${startRecord} - ${endRecord} dari ${this.memberPagination.totalRecords} data
            </div>
        `;

        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
    }

    // Go to specific member page
    async goToMemberPage(page) {
        if (page < 0 || page >= this.memberPagination.totalPages) return;
        await this.loadMembers(page);
    }

    // Search members
    async searchMembers() {
        const searchInput = document.getElementById('member-search');
        this.memberPagination.searchTerm = searchInput ? searchInput.value : '';
        this.memberPagination.currentPage = 0;
        await this.loadMembers(0);
    }

    // Clear member search
    async clearMemberSearch() {
        const searchInput = document.getElementById('member-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.memberPagination.searchTerm = '';
        this.memberPagination.currentPage = 0;
        await this.loadMembers(0);
    }

    // View member detail
    async viewMember(memberId) {
        try {
            const { data, error } = await supabase
                .from('membercard')
                .select('*')
                .eq('id', memberId)
                .single();

            if (error) throw error;

            // Show member detail modal or alert
            alert(`Member Detail:\nNama: ${data.name}\nEmail: ${data.email}\nTelepon: ${data.phone}\nStatus: ${data.is_active ? 'Aktif' : 'Non-Aktif'}`);
        } catch (error) {
            console.error('Error viewing member:', error);
            this.showNotification('Gagal memuat detail member', 'error');
        }
    }

    // Edit member
    async editMember(memberId) {
        // Redirect to edit page or open modal
        window.location.href = `/member/edit.html?id=${memberId}`;
    }

    // Delete member
    async deleteMember(memberId) {
        if (confirm('Apakah Anda yakin ingin menghapus member ini?')) {
            try {
                const { error } = await supabase
                    .from('membercard')
                    .delete()
                    .eq('id', memberId);

                if (error) throw error;

                this.showNotification('Member berhasil dihapus');
                await this.loadMembers(this.memberPagination.currentPage);
                await this.loadStats(); // Refresh dashboard stats
            } catch (error) {
                console.error('Error deleting member:', error);
                this.showNotification('Gagal menghapus member', 'error');
            }
        }
    }

    // Bind member events
    bindMemberEvents() {
        const searchInput = document.getElementById('member-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchMembers();
                }
            });
        }

        const searchBtn = document.getElementById('member-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchMembers());
        }

        const clearBtn = document.getElementById('member-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearMemberSearch());
        }
    }

    // ==================== CHARTS ====================

    // Initialize charts (placeholder for future implementation)
    initCharts() {
        console.log('Charts would be initialized here');
        // You can add Chart.js or other chart library here
    }

    // ==================== EVENT BINDING ====================

    // Bind events
    bindEvents() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    // Refresh dashboard
    async refreshDashboard() {
        await this.loadStats();
        this.showNotification('Dashboard diperbarui');
    }

    // ==================== EXPORT FUNCTIONS ====================

    // Export dashboard data to CSV
    async exportDashboardData() {
        try {
            const monthRange = this.getCurrentMonthRange();
            const { data, error } = await supabase
                .from('transaksi_detail')
                .select('order_date, order_no, customer_name, amount, payment_type, status')
                .eq('status', 'completed')
                .gte('order_date', monthRange.start)
                .lte('order_date', monthRange.end);

            if (error) throw error;

            // Convert to CSV
            const headers = ['Tanggal', 'No Order', 'Customer', 'Amount', 'Payment Type', 'Status'];
            const rows = data.map(item => [
                item.order_date,
                item.order_no,
                item.customer_name,
                item.amount,
                item.payment_type,
                item.status
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_export_${monthRange.start}_to_${monthRange.end}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('Data berhasil diekspor');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Gagal mengekspor data', 'error');
        }
    }
}

// Initialize dashboard globally
let dashboard = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
    
    // Expose to window for onclick handlers
    window.dashboard = dashboard;
});

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}
