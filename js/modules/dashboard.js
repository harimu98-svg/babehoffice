// Dashboard Module - FULL PERBAIKAN
// - Pagination untuk monthly sales & today sales
// - Count menggunakan head:true untuk akurasi
// - Limit 10 untuk recent transactions (aman)
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

    // Helper method untuk fetch data dengan pagination
    async fetchWithPagination(tableName, selectColumns, filterCallback, orderColumn = null, orderAscending = false) {
        let allData = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
            let query = supabase
                .from(tableName)
                .select(selectColumns)
                .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (orderColumn) {
                query = query.order(orderColumn, { ascending: orderAscending });
            }
            
            if (filterCallback) {
                query = filterCallback(query);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            if (data && data.length > 0) {
                allData = [...allData, ...data];
                page++;
            }
            
            if (!data || data.length < pageSize) {
                hasMore = false;
            }
        }
        
        return allData;
    }

    // Initialize module
    async init() {
        console.log('Initializing Dashboard module');
        await this.loadStats();
        this.initCharts();
        this.bindEvents();
        console.log('Dashboard module initialized');
    }

    // Load dashboard statistics - FULL PERBAIKAN
    async loadStats() {
        try {
            Helpers.showLoading();

            // ========== 1. TOTAL PRODUCTS ==========
            // ✅ Menggunakan head:true untuk count akurat
            const { count: productsCount, error: productsError } = await supabase
                .from('produk')
                .select('*', { count: 'exact', head: true });

            if (!productsError) {
                this.stats.totalProducts = productsCount || 0;
                document.getElementById('total-products').textContent = productsCount || 0;
                console.log(`Total Products: ${productsCount}`);
            } else {
                console.error('Error loading products count:', productsError);
            }

            // ========== 2. TOTAL EMPLOYEES ==========
            const { count: employeesCount, error: employeesError } = await supabase
                .from('karyawan')
                .select('*', { count: 'exact', head: true });

            if (!employeesError) {
                this.stats.totalEmployees = employeesCount || 0;
                document.getElementById('total-employees').textContent = employeesCount || 0;
                console.log(`Total Employees: ${employeesCount}`);
            } else {
                console.error('Error loading employees count:', employeesError);
            }

            // ========== 3. TOTAL MEMBERS ==========
            const { count: membersCount, error: membersError } = await supabase
                .from('membercard')
                .select('*', { count: 'exact', head: true });

            if (!membersError) {
                this.stats.totalMembers = membersCount || 0;
                document.getElementById('total-members').textContent = membersCount || 0;
                console.log(`Total Members: ${membersCount}`);
            } else {
                console.error('Error loading members count:', membersError);
            }

            // ========== 4. TOTAL OUTLETS ==========
            const { count: outletsCount, error: outletsError } = await supabase
                .from('outlet')
                .select('*', { count: 'exact', head: true });

            if (!outletsError) {
                this.stats.totalOutlets = outletsCount || 0;
                document.getElementById('total-outlets').textContent = outletsCount || 0;
                console.log(`Total Outlets: ${outletsCount}`);
            } else {
                console.error('Error loading outlets count:', outletsError);
            }

            // ========== 5. TODAY'S SALES (dengan pagination) ==========
            const today = new Date().toISOString().split('T')[0];
            
            const todaySalesData = await this.fetchWithPagination(
                'transaksi_detail',
                'amount',
                (query) => query
                    .eq('order_date', today)
                    .eq('status', 'completed'),
                null,
                false
            );
            
            this.stats.todaySales = todaySalesData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            document.getElementById('today-sales').textContent = Helpers.formatCurrency(this.stats.todaySales);
            console.log(`Today's Sales: ${todaySalesData.length} records, total: ${this.stats.todaySales}`);

            // ========== 6. MONTHLY SALES (dengan pagination) ==========
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            
            const monthlySalesData = await this.fetchWithPagination(
                'transaksi_detail',
                'amount',
                (query) => query
                    .gte('order_date', startOfMonth)
                    .eq('status', 'completed'),
                null,
                false
            );
            
            this.stats.monthlySales = monthlySalesData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            document.getElementById('monthly-sales').textContent = Helpers.formatCurrency(this.stats.monthlySales);
            console.log(`Monthly Sales: ${monthlySalesData.length} records, total: ${this.stats.monthlySales}`);

            // ========== 7. LOAD RECENT TRANSACTIONS ==========
            // ✅ Aman karena limit 10
            await this.loadRecentTransactions();

            Helpers.hideLoading();

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            Helpers.hideLoading();
            Notifications.error('Gagal memuat data dashboard: ' + error.message);
        }
    }

    // Load recent transactions - AMAN (limit 10)
    async loadRecentTransactions() {
        try {
            const { data: transactions, error } = await supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(10);

            if (!error && transactions) {
                this.displayRecentTransactions(transactions);
            } else if (error) {
                console.error('Error loading recent transactions:', error);
            }
        } catch (error) {
            console.error('Error loading recent transactions:', error);
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
                        <p class="text-xs text-gray-500">${transaction.order_no} • ${Helpers.formatDateTimeWIB(transaction.order_date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">${Helpers.formatCurrency(transaction.amount)}</p>
                    <p class="text-xs text-gray-500 capitalize">${transaction.payment_type}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    // Initialize charts (placeholder for future implementation)
    initCharts() {
        console.log('Charts would be initialized here');
        // Anda bisa menambahkan Chart.js atau library chart lainnya di sini
    }

    // Bind events
    bindEvents() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            // Hapus event listener lama untuk menghindari duplikasi
            const newRefreshBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
            newRefreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    // Refresh dashboard
    async refreshDashboard() {
        console.log('Refreshing dashboard...');
        await this.loadStats();
        Notifications.success('Dashboard diperbarui');
    }

    // Get stats (untuk digunakan modul lain jika perlu)
    getStats() {
        return { ...this.stats };
    }
}

// Initialize dashboard globally
let dashboard = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!window.dashboardInstance) {
        dashboard = new Dashboard();
        window.dashboardInstance = dashboard;
    } else {
        dashboard = window.dashboardInstance;
    }
    
    // Initialize dashboard jika container ada
    if (document.getElementById('total-products')) {
        setTimeout(() => {
            dashboard.init();
        }, 100);
    }
});
