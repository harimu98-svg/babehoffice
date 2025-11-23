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

    // Load dashboard statistics
    async loadStats() {
        try {
            Helpers.showLoading();

            // Load total products
            const { data: products, error: productsError } = await supabase
                .from('produk')
                .select('*', { count: 'exact' });

            if (!productsError && products) {
                this.stats.totalProducts = products.length;
                document.getElementById('total-products').textContent = products.length;
            }

            // Load total employees
            const { data: employees, error: employeesError } = await supabase
                .from('karyawan')
                .select('*', { count: 'exact' });

            if (!employeesError && employees) {
                this.stats.totalEmployees = employees.length;
                document.getElementById('total-employees').textContent = employees.length;
            }

            // Load total members
            const { data: members, error: membersError } = await supabase
                .from('membercard')
                .select('*', { count: 'exact' });

            if (!membersError && members) {
                this.stats.totalMembers = members.length;
                document.getElementById('total-members').textContent = members.length;
            }

            // Load total outlets
            const { data: outlets, error: outletsError } = await supabase
                .from('outlet')
                .select('*', { count: 'exact' });

            if (!outletsError && outlets) {
                this.stats.totalOutlets = outlets.length;
                document.getElementById('total-outlets').textContent = outlets.length;
            }

            // Load today's sales
            const today = new Date().toISOString().split('T')[0];
            const { data: todaySales, error: todayError } = await supabase
                .from('transaksi_detail')
                .select('amount')
                .eq('order_date', today)
                .eq('status', 'completed');

            if (!todayError && todaySales) {
                this.stats.todaySales = todaySales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                document.getElementById('today-sales').textContent = Helpers.formatCurrency(this.stats.todaySales);
            }

            // Load monthly sales
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const { data: monthlySales, error: monthlyError } = await supabase
                .from('transaksi_detail')
                .select('amount')
                .gte('order_date', startOfMonth)
                .eq('status', 'completed');

            if (!monthlyError && monthlySales) {
                this.stats.monthlySales = monthlySales.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                document.getElementById('monthly-sales').textContent = Helpers.formatCurrency(this.stats.monthlySales);
            }

            // Load recent transactions
            await this.loadRecentTransactions();

            Helpers.hideLoading();

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            Helpers.hideLoading();
        }
    }

    // Load recent transactions
    async loadRecentTransactions() {
        try {
            const { data: transactions, error } = await supabase
                .from('transaksi_detail')
                .select('*')
                .order('order_date', { ascending: false })
                .limit(10);

            if (!error && transactions) {
                this.displayRecentTransactions(transactions);
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
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    // Refresh dashboard
    async refreshDashboard() {
        await this.loadStats();
        Notifications.success('Dashboard diperbarui');
    }
}

// Initialize dashboard globally
let dashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});