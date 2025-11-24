// Modal component - SIMPLIFIED FIXED VERSION
class Modal {
    constructor() {
        this.modalElement = null;
    }

    createModal(title, content, buttons = [], options = {}) {
        // Close existing modal first
        this.close();

        const { size = 'max-w-md' } = options;

        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="modal-backdrop">
                <div class="bg-white rounded-lg shadow-xl w-full ${size} max-h-[85vh] overflow-hidden flex flex-col">
                    <!-- Header -->
                    <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 class="text-base font-semibold text-gray-800">${title}</h3>
                        <button type="button" id="modal-close-btn" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Content -->
                    <div class="px-4 py-3 flex-1 overflow-y-auto">
                        ${content}
                    </div>
                    
                    <!-- Footer -->
                    ${buttons.length > 0 ? `
                    <div class="px-4 py-3 border-t border-gray-200 flex justify-end space-x-2">
                        ${buttons.map(btn => `
                            <button 
                                type="button"
                                class="px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                    btn.primary 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }"
                                data-action="${btn.primary ? 'submit' : 'cancel'}"
                            >
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.modalElement = document.createElement('div');
        this.modalElement.innerHTML = modalHTML;
        document.body.appendChild(this.modalElement);

        // Add event listeners
        this.addEventListeners(buttons);
        
        return this.modalElement;
    }

    addEventListeners(buttons) {
        if (!this.modalElement) return;

        // Close button
        const closeBtn = this.modalElement.querySelector('#modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        const backdrop = this.modalElement.querySelector('#modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.close();
                }
            });
        }

        // Action buttons
        const actionBtns = this.modalElement.querySelectorAll('button[data-action]');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const buttonConfig = buttons[index];
                if (buttonConfig && buttonConfig.onclick) {
                    buttonConfig.onclick();
                } else {
                    this.close();
                }
            });
        });

        // ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', handleEsc);
        this.modalElement._escHandler = handleEsc;
    }

    close() {
        if (this.modalElement) {
            // Remove ESC event listener
            if (this.modalElement._escHandler) {
                document.removeEventListener('keydown', this.modalElement._escHandler);
            }
            
            this.modalElement.remove();
            this.modalElement = null;
        }
    }

    showConfirm(message, onConfirm, onCancel = null) {
        const content = `<p class="text-gray-600">${message}</p>`;
        const buttons = [
            {
                text: 'Batal',
                onclick: () => {
                    if (onCancel) onCancel();
                    this.close();
                },
                primary: false
            },
            {
                text: 'Ya, Konfirmasi',
                onclick: () => {
                    onConfirm();
                    this.close();
                },
                primary: true
            }
        ];

        this.createModal('Konfirmasi', content, buttons);
    }
}

// Global modal instance
const modal = new Modal();
