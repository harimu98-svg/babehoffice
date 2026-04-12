// Dashboard Module
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
    }

    // Initialize module
    async init() {
        console.log('Initializing Dashboard module');
        await this.loadStats();
        this.initCharts();
        this.bindEvents();
        console.log('Dashboard module initialized');
    }

    // Helper: Get date range for current month
    getCurrentMonthRange() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Set end of month to 23:59:59
        endOfMonth.setHours(23, 59, 59, 999);
        
        return {
            start: startOfMonth.toISOString().split('T')[0],
            end: endOfMonth.toISOString().split('T')[0]
        };
    }

    // Helper: Get today's date range
    getTodayRange() {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endOfDay.setHours(23, 59, 59, 999);
        
        return {
            start: startOfDay.toISOString().split('T')[0],
            end: endOfDay.toISOString().split('T')[0]
        };
    }

    // Generic paginated query function
    async fetchAllData(table, selectColumns = '*', filters = {}) {
        let allData = [];
        let page = 0;
        const pageSize = 1000; // Adjust based on your needs
        let hasMore = true;

        try {
            while (hasMore) {
                let query = supabase
                    .from(table)
                    .select(selectColumns, { count: 'exact' })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                // Apply filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        // Handle operators like gte, lte, eq, etc.
                        const [operator, val] = Object.entries(value)[0];
                        query = query[operator](key, val);
                    } else {
                        query = query.eq(key, value);
                    }
                });

                const { data, error, count } = await query;

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                }
                
                // Check if we have more data
                hasMore = data && data.length === pageSize;
                page++;
                
                // Safety break to prevent infinite loop
                if (page > 100) break;
            }
            
            return { data: allData, error: null, count: allData.length };
        } catch (error) {
            console.error(`Error fetching all data from ${table}:`, error);
            return { data: [], error, count: 0 };
        }
    }

    // Load dashboard statistics with pagination
    async loadStats() {
        try {
            Helpers.showLoading();

            // Load total products with pagination
            const productsResult = await this.fetchAllData('produk');
            if (!productsResult.error) {
                this.stats.totalProducts = productsResult.count;
                document.getElementById('total-products').textContent = productsResult.count;
            }

            // Load total employees with pagination
            const employeesResult = await this.fetchAllData('karyawan');
            if (!employeesResult.error) {
                this.stats.totalEmployees = employeesResult.count;
                document.getElementById('total-employees').textContent = employeesResult.count;
            }

            // Load total members with pagination
            const membersResult = await this.fetchAllData('membercard');
            if (!membersResult.error) {
                this.stats.totalMembers = membersResult.count;
                document.getElementById('total-members').textContent = membersResult.count;
            }

            // Load total outlets with pagination
            const outletsResult = await this.fetchAllData('outlet');
            if (!outletsResult.error) {
                this.stats.totalOutlets = outletsResult.count;
                document.getElementById('total-outlets').textContent = outletsResult.count;
            }

            // Load today's sales with date range filter
            const todayRange = this.getTodayRange();
            const todaySalesResult = await this.fetchAllData('transaksi_detail', 'amount', {
                order_date: { gte: todayRange.start },
                status: 'completed'
            });
            
            if (!todaySalesResult.error) {
                // Also filter by end of day
                const filteredTodaySales = todaySalesResult.data.filter(item => 
                    item.order_date <= todayRange.end
                );
                this.stats.todaySales = filteredTodaySales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                document.getElementById('today-sales').textContent = Helpers.formatCurrency(this.stats.todaySales);
            }

            // Load monthly sales with proper date range (full month)
            const monthRange = this.getCurrentMonthRange();
            const monthlySalesResult = await this.fetchAllData('transaksi_detail', 'amount', {
                order_date: { gte: monthRange.start },
                status: 'completed'
            });
            
            if (!monthlySalesResult.error) {
                // Filter by end of month
                const filteredMonthlySales = monthlySalesResult.data.filter(item => 
                    item.order_date <= monthRange.end
                );
                this.stats.monthlySales = filteredMonthlySales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                document.getElementById('monthly-sales').textContent = Helpers.formatCurrency(this.stats.monthlySales);
            }

            // Load recent transactions with pagination (limit 10)
            await this.loadRecentTransactions();

            Helpers.hideLoading();

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            Helpers.hideLoading();
            Notifications?.error('Gagal memuat statistik dashboard');
        }
    }

    // Load recent transactions with pagination
    async loadRecentTransactions() {
        try {
            const pageSize = 10;
            const { data: transactions, error } = await supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .range(0, pageSize - 1);

            if (!error && transactions) {
                this.displayRecentTransactions(transactions);
            } else if (error) {
                console.error('Error loading recent transactions:', error);
            }
        } catch (error) {
            console.error('Error in loadRecentTransactions:', error);
        }
    }

    // Load paginated members (additional method for member list view)
    async loadMembersPaginated(page = 0, pageSize = 20, searchTerm = '') {
        try {
            let query = supabase
                .from('membercard')
                .select('*', { count: 'exact' })
                .range(page * pageSize, (page + 1) * pageSize - 1)
                .order('created_at', { ascending: false });

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: data || [],
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize)
            };
        } catch (error) {
            console.error('Error loading paginated members:', error);
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0
            };
        }
    }

    // Display paginated members in table
    displayPaginatedMembers(memberData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (memberData.data.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4">Tidak ada data member</td></tr>';
            return;
        }

        const membersHTML = memberData.data.map(member => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-4">${member.code || '-'}</td>
                <td class="py-3 px-4">${member.name || '-'}</td>
                <td class="py-3 px-4">${member.email || '-'}</td>
                <td class="py-3 px-4">${member.phone || '-'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${member.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                </td>
            </tr>
        `).join('');

        container.innerHTML = membersHTML;
        this.renderMemberPagination(memberData);
    }

    // Render pagination controls for members
    renderMemberPagination(memberData) {
        const paginationContainer = document.getElementById('member-pagination');
        if (!paginationContainer) return;

        if (memberData.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex justify-center space-x-2 mt-4">';
        
        // Previous button
        paginationHTML += `
            <button 
                class="px-3 py-1 rounded ${memberData.page === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                ${memberData.page === 0 ? 'disabled' : ''}
                onclick="dashboard.goToMemberPage(${memberData.page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(0, memberData.page - Math.floor(maxVisible / 2));
        let endPage = Math.min(memberData.totalPages - 1, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button 
                    class="px-3 py-1 rounded ${memberData.page === i ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
                    onclick="dashboard.goToMemberPage(${i})">
                    ${i + 1}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button 
                class="px-3 py-1 rounded ${memberData.page === memberData.totalPages - 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                ${memberData.page === memberData.totalPages - 1 ? 'disabled' : ''}
                onclick="dashboard.goToMemberPage(${memberData.page + 1})">
                Next
            </button>
        `;

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    // Go to specific member page
    async goToMemberPage(page) {
        const searchTerm = document.getElementById('member-search')?.value || '';
        const memberData = await this.loadMembersPaginated(page, 20, searchTerm);
        this.displayPaginatedMembers(memberData, 'members-table-body');
    }

    // Search members with pagination
    async searchMembers() {
        const searchTerm = document.getElementById('member-search')?.value || '';
        const memberData = await this.loadMembersPaginated(0, 20, searchTerm);
        this.displayPaginatedMembers(memberData, 'members-table-body');
    }

    // Initialize member module with pagination
    async initMemberModule() {
        const memberData = await this.loadMembersPaginated(0, 20);
        this.displayPaginatedMembers(memberData, 'members-table-body');
        
        // Bind search event
        const searchInput = document.getElementById('member-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchMembers());
        }
    }

    // Display recent transactions
    displayRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Belum ada transaksi hari ini</p>
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
                        <p class="text-sm font-medium text-gray-900">${transaction.customer_name || 'Walk-in Customer'}</p>
                        <p class="text-xs text-gray-500">${transaction.order_no || '-'} • ${Helpers.formatDateTimeWIB(transaction.order_date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">${Helpers.formatCurrency(transaction.amount)}</p>
                    <p class="text-xs text-gray-500 capitalize">${transaction.payment_type || '-'}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    // Initialize charts (placeholder for future implementation)
    initCharts() {
        console.log('Charts would be initialized here');
    }

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
        if (typeof Notifications !== 'undefined' && Notifications.success) {
            Notifications.success('Dashboard diperbarui');
        }
    }
}

// Initialize dashboard globally
let dashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
    
    // Initialize member module if on members page
    if (document.getElementById('members-table-body')) {
        dashboard.initMemberModule();
    }
});
