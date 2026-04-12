// Dashboard Module - FIXED VERSION
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

    async init() {
        console.log('Initializing Dashboard module');
        await this.loadStats();
        this.initCharts();
        this.bindEvents();
        console.log('Dashboard module initialized');
    }

    // Load dashboard statistics - DIRECT QUERY (no complicated pagination)
    async loadStats() {
        try {
            if (typeof Helpers !== 'undefined' && Helpers.showLoading) {
                Helpers.showLoading();
            }

            // 1. Load total products (count only, no data fetching)
            const { count: productsCount, error: productsError } = await supabase
                .from('produk')
                .select('*', { count: 'exact', head: true });

            if (!productsError) {
                this.stats.totalProducts = productsCount || 0;
                const elem = document.getElementById('total-products');
                if (elem) elem.textContent = this.stats.totalProducts;
            }

            // 2. Load total employees
            const { count: employeesCount, error: employeesError } = await supabase
                .from('karyawan')
                .select('*', { count: 'exact', head: true });

            if (!employeesError) {
                this.stats.totalEmployees = employeesCount || 0;
                const elem = document.getElementById('total-employees');
                if (elem) elem.textContent = this.stats.totalEmployees;
            }

            // 3. Load total members
            const { count: membersCount, error: membersError } = await supabase
                .from('membercard')
                .select('*', { count: 'exact', head: true });

            if (!membersError) {
                this.stats.totalMembers = membersCount || 0;
                const elem = document.getElementById('total-members');
                if (elem) elem.textContent = this.stats.totalMembers;
            }

            // 4. Load total outlets
            const { count: outletsCount, error: outletsError } = await supabase
                .from('outlet')
                .select('*', { count: 'exact', head: true });

            if (!outletsError) {
                this.stats.totalOutlets = outletsCount || 0;
                const elem = document.getElementById('total-outlets');
                if (elem) elem.textContent = this.stats.totalOutlets;
            }

            // 5. Load TODAY'S SALES - FIXED
            const today = new Date().toISOString().split('T')[0];
            console.log('Fetching today sales for:', today);
            
            const { data: todaySales, error: todayError } = await supabase
                .from('transaksi_detail')
                .select('amount')
                .eq('status', 'completed')
                .eq('order_date', today);

            if (!todayError && todaySales) {
                this.stats.todaySales = todaySales.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                
                const elem = document.getElementById('today-sales');
                if (elem) {
                    elem.textContent = this.formatCurrency(this.stats.todaySales);
                }
                console.log('Today sales total:', this.stats.todaySales);
            } else {
                console.error('Error loading today sales:', todayError);
            }

            // 6. Load MONTHLY SALES - FIXED
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
            
            console.log('Fetching monthly sales from:', startOfMonth, 'to:', endOfMonth);
            
            const { data: monthlySales, error: monthlyError } = await supabase
                .from('transaksi_detail')
                .select('amount')
                .eq('status', 'completed')
                .gte('order_date', startOfMonth)
                .lte('order_date', endOfMonth);

            if (!monthlyError && monthlySales) {
                this.stats.monthlySales = monthlySales.reduce((sum, item) => {
                    return sum + (parseFloat(item.amount) || 0);
                }, 0);
                
                const elem = document.getElementById('monthly-sales');
                if (elem) {
                    elem.textContent = this.formatCurrency(this.stats.monthlySales);
                }
                console.log('Monthly sales total:', this.stats.monthlySales);
            } else {
                console.error('Error loading monthly sales:', monthlyError);
            }

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
        }
    }

    // Format currency helper (in case Helpers is not available)
    formatCurrency(value) {
        if (typeof Helpers !== 'undefined' && Helpers.formatCurrency) {
            return Helpers.formatCurrency(value);
        }
        // Fallback formatting
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

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

    // Helper: Escape HTML to prevent XSS
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

    // Initialize charts
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

// Initialize dashboard
let dashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
});
