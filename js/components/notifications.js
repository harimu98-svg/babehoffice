// Notifications component
class Notifications {
    constructor() {
        this.container = null;
        this.init();
    }

    // Initialize notifications container
    init() {
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    // Show notification
    show(message, type = 'info', duration = 5000) {
        const types = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
        };

        const icons = {
            info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
            error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };

        const notification = document.createElement('div');
        notification.className = `flex items-center p-4 rounded-lg shadow-lg text-white transform translate-x-full transition-transform duration-300 ${types[type]}`;
        notification.innerHTML = `
            <div class="flex-shrink-0">
                ${icons[type]}
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <button class="ml-auto flex-shrink-0" onclick="this.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.add('translate-x-full');
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, duration);
        }

        return notification;
    }

    // Shortcut methods
    static info(message, duration = 5000) {
        if (!window.notifications) {
            window.notifications = new Notifications();
        }
        return window.notifications.show(message, 'info', duration);
    }

    static success(message, duration = 5000) {
        if (!window.notifications) {
            window.notifications = new Notifications();
        }
        return window.notifications.show(message, 'success', duration);
    }

    static warning(message, duration = 5000) {
        if (!window.notifications) {
            window.notifications = new Notifications();
        }
        return window.notifications.show(message, 'warning', duration);
    }

    static error(message, duration = 5000) {
        if (!window.notifications) {
            window.notifications = new Notifications();
        }
        return window.notifications.show(message, 'error', duration);
    }
}

// Initialize notifications globally
window.Notifications = Notifications;