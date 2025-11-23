// Helper functions - harus didefinisikan pertama
class Helpers {
    // Format currency
    static formatCurrency(amount) {
        if (!amount) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Format date to WIB
    static formatDateWIB(date) {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    }

    // Format datetime to WIB
    static formatDateTimeWIB(date) {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return '-';
        }
    }

    // Get current WIB time
    static getCurrentWIB() {
        return new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta'
        });
    }

    // Show loading
    static showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
            console.log('Loading shown');
        }
    }

    // Hide loading
    static hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            console.log('Loading hidden');
        }
    }

    // Validate email
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Show error message
    static showError(message) {
        console.error('Error:', message);
        if (window.notifications) {
            window.notifications.show(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    // Show success message
    static showSuccess(message) {
        console.log('Success:', message);
        if (window.notifications) {
            window.notifications.show(message, 'success');
        } else {
            alert('Success: ' + message);
        }
    }
}