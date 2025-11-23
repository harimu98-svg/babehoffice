// Modal component - FIXED VERSION
class Modal {
    constructor() {
        this.modal = null;
    }

    // Enhanced createModal dengan fix backdrop
    createModal(title, content, buttons = [], options = {}) {
        const { 
            size = 'max-w-md', 
            fullHeight = false,
            customClass = ''
        } = options;

        const heightClass = fullHeight ? 'max-h-[90vh] h-[90vh]' : 'max-h-[85vh]';
        const contentHeight = fullHeight ? 'calc(90vh - 100px)' : 'calc(85vh - 100px)';

        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop" 
                 style="pointer-events: none;"> <!-- INI YANG DIPERBAIKI -->
                <div class="bg-white rounded-lg shadow-xl w-full ${size} ${heightClass} overflow-hidden flex flex-col ${customClass} modal-content"
                     style="pointer-events: auto;">
                    <div class="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex justify-between items-center">
                        <h3 class="text-base font-semibold text-gray-800">${title}</h3>
                        <button onclick="modal.close()" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="px-4 py-3 flex-1 overflow-y-auto" style="max-height: ${contentHeight}">
                        ${content}
                    </div>
                    ${buttons.length > 0 ? `
                    <div class="px-4 py-3 border-t border-gray-200 flex justify-end space-x-2 flex-shrink-0">
                        ${buttons.map(btn => `
                            <button 
                                onclick="${btn.onclick}"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    btn.primary 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                                }"
                            >
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement);

        this.modal = modalElement;
        
        // Close modal when clicking backdrop - FIXED
        modalElement.querySelector('.modal-backdrop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });

        return modalElement;
    }

    // Show confirmation modal
    showConfirm(message, onConfirm, onCancel = null) {
        const content = `<p class="text-gray-600">${message}</p>`;
        const buttons = [
            {
                text: 'Batal',
                onclick: `modal.close(); ${onCancel ? onCancel : ''}`,
                primary: false
            },
            {
                text: 'Ya, Konfirmasi',
                onclick: `modal.close(); ${onConfirm}`,
                primary: true
            }
        ];

        const modal = this.createModal('Konfirmasi', content, buttons);
        modal.id = 'confirm-modal';
    }

    // Close modal
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    // Show alert
    showAlert(message, type = 'info') {
        const types = {
            info: 'bg-blue-100 text-blue-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800'
        };

        const alertHTML = `
            <div class="fixed top-4 right-4 ${types[type]} px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg">&times;</button>
                </div>
            </div>
        `;

        const alertElement = document.createElement('div');
        alertElement.innerHTML = alertHTML;
        document.body.appendChild(alertElement);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertElement.parentElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Global modal instance
const modal = new Modal();