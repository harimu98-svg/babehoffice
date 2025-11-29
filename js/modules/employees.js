// Employees Module - FIXED VERSION (using group_products pattern)
class Employees {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.currentEmployeeId = null;
        this.isInitialized = false;
        console.log('Employees class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('Employees already initialized');
            return;
        }

        console.log('Initializing Employees module...');
        try {
            await this.loadData();
            this.initTable();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ Employees module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Employees:', error);
        }
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            console.log('Loading employees data...');
            
            const { data, error } = await supabase
                .from('karyawan')
                .select('*')
                .order('nama_karyawan', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            console.log('Loaded employees:', this.currentData);
            
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading employees data:', error);
            Notifications.error('Gagal memuat data karyawan: ' + error.message);
            return [];
        }
    }

    // Initialize table dengan kolom foto
    initTable() {
        console.log('Initializing employees table...');
        
        const columns = [
            { 
                title: 'Foto', 
                key: 'photo_url',
                formatter: (value) => {
                    if (!value) return '<span class="text-gray-400">-</span>';
                    return `
                        <img src="${value}" alt="Karyawan" class="w-10 h-10 object-cover rounded-full cursor-pointer" 
                             onclick="window.employees.showImagePreview('${value}')">
                    `;
                },
                width: '80px'
            },
            { 
                title: 'Nama Karyawan', 
                key: 'nama_karyawan',
                formatter: (value) => `<span class="font-medium text-gray-900">${value || '-'}</span>`
            },
            { 
                title: 'Outlet', 
                key: 'outlet',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Posisi', 
                key: 'posisi',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Nomor WA', 
                key: 'nomor_wa',
                formatter: (value) => `<span class="text-gray-700">${value || '-'}</span>`
            },
            { 
                title: 'Role', 
                key: 'role',
                formatter: (value) => {
                    const roles = {
                        'admin': '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Admin</span>',
                        'manager': '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Manager</span>', 
                        'kasir': '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Kasir</span>',
                        'pelayan': '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Pelayan</span>'
                    };
                    return roles[value] || `<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">${value}</span>`;
                }
            },
            { 
                title: 'Status', 
                key: 'status',
                formatter: (value) => {
                    const isActive = value === 'active';
                    return `
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }">
                            ${isActive ? '🟢 Aktif' : '🔴 Nonaktif'}
                        </span>
                    `;
                },
                width: '100px'
            },
            {
                title: 'Aksi',
                key: 'id',
                formatter: (id, row) => this.getActionButtons(id, row),
                width: '150px'
            }
        ];

        // Cek jika DataTable class tersedia
        if (typeof DataTable === 'undefined') {
            console.error('DataTable class not found!');
            this.renderFallbackTable();
            return;
        }

        this.table = new DataTable('employees-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            emptyMessage: 'Tidak ada data karyawan',
            searchPlaceholder: 'Cari karyawan...'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Employees table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('employees-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-2">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Tidak ada data karyawan</p>
                    <button onclick="window.employees.showForm()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Karyawan Pertama
                    </button>
                </div>
            `;
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Karyawan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posisi</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor WA</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        this.currentData.forEach(item => {
            const roleDisplay = {
                'admin': 'Admin',
                'manager': 'Manager', 
                'kasir': 'Kasir',
                'pelayan': 'Pelayan'
            }[item.role] || item.role;

            tableHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${item.photo_url ? 
                            `<img src="${item.photo_url}" alt="Karyawan" class="w-10 h-10 object-cover rounded-full">` : 
                            '<span class="text-gray-400">-</span>'
                        }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nama_karyawan || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.outlet || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.posisi || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.nomor_wa || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${roleDisplay}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            item.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }">
                            ${item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${this.getActionButtons(item.id, item)}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    // Get action buttons HTML
    getActionButtons(id, row) {
        return `
            <div class="flex space-x-2">
                <button 
                    onclick="window.employees.handleEdit('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="Edit Karyawan"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button 
                    onclick="window.employees.handleDelete('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Hapus Karyawan"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Hapus
                </button>
            </div>
        `;
    }

    // Bind events
    bindEvents() {
        console.log('Binding employees events...');
        
        // Add button event
        const addBtn = document.getElementById('add-employee');
        if (addBtn) {
            // Remove existing event listeners first
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-employee');
            
            newAddBtn.addEventListener('click', () => {
                console.log('Add employee button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add button not found!');
        }
    }

    // Handle edit - PUBLIC METHOD
    handleEdit(id) {
        console.log('Edit handled for:', id);
        this.edit(id);
    }

    // Handle delete - PUBLIC METHOD  
    handleDelete(id) {
        console.log('Delete handled for:', id);
        this.delete(id);
    }

    // Upload image to Supabase Storage
    async uploadImage(file) {
        try {
            if (!file) return null;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log('Uploading employee image to:', filePath);

            const { data, error } = await supabase.storage
                .from('fotokaryawan')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('fotokaryawan')
                .getPublicUrl(filePath);

            console.log('Employee image uploaded successfully:', publicUrl);
            return publicUrl;
        } catch (error) {
            console.error('Error uploading employee image:', error);
            throw new Error('Gagal mengupload gambar: ' + error.message);
        }
    }

    // Delete image from Supabase Storage
    async deleteImage(imageUrl) {
        try {
            if (!imageUrl) return;

            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
           const filePath = `${fileName}`;

            console.log('Deleting employee image:', filePath);

            const { error } = await supabase.storage
                .from('fotokaryawan')
                .remove([filePath]);

            if (error) {
                console.error('Error deleting employee image:', error);
            } else {
                console.log('Employee image deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting employee image:', error);
        }
    }

    // Handle file selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Notifications.error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Notifications.error('Ukuran file maksimal 5MB.');
            event.target.value = '';
            return;
        }

        this.selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreviewUrl = e.target.result;
            this.updateImagePreview();
        };
        reader.readAsDataURL(file);
    }

    // Update image preview
    updateImagePreview() {
        const previewContainer = document.getElementById('employee-image-preview-container');
        const previewImg = document.getElementById('employee-image-preview');
        const removeBtn = document.getElementById('remove-employee-image-btn');

        if (previewContainer && previewImg) {
            if (this.imagePreviewUrl) {
                previewImg.src = this.imagePreviewUrl;
                previewContainer.classList.remove('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
            } else {
                previewContainer.classList.add('hidden');
                if (removeBtn) removeBtn.classList.add('hidden');
            }
        }
    }

    // Remove selected image
    removeImage() {
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.updateImagePreview();
        
        // Reset file input
        const fileInput = document.getElementById('employee_photo_file');
        if (fileInput) fileInput.value = '';
    }

    // Show image preview in modal
    showImagePreview(imageUrl) {
        const content = `
            <div class="text-center">
                <img src="${imageUrl}" alt="Preview Foto Karyawan" class="max-w-full max-h-96 mx-auto rounded-lg">
                <div class="mt-4">
                    <a href="${imageUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                        Buka gambar di tab baru
                    </a>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Tutup',
                onclick: () => {
                    console.log('Close image preview clicked');
                    modal.close();
                },
                primary: false
            }
        ];

        modal.createModal('Preview Foto Karyawan', content, buttons);
    }

    // Show form for add/edit dengan upload foto
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Karyawan' : 'Tambah Karyawan';

        // Reset file state
        this.selectedFile = null;
        this.imagePreviewUrl = item ? item.photo_url : null;
        this.currentEmployeeId = item ? item.id : null;

        const content = `
            <div class="space-y-4">
                <form id="employee-form" class="space-y-4">
                    <!-- File Upload Section -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Foto Karyawan</label>
                        <div class="space-y-3">
                            <!-- File Input -->
                            <input 
                                type="file" 
                                id="employee_photo_file"
                                name="employee_photo_file" 
                                accept="image/*"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onchange="window.employees.handleFileSelect(event)"
                            >
                            
                            <!-- Image Preview -->
                            <div id="employee-image-preview-container" class="${this.imagePreviewUrl ? '' : 'hidden'}">
                                <div class="border border-gray-300 rounded-md p-3 bg-gray-50">
                                    <p class="text-sm text-gray-600 mb-2">Preview:</p>
                                    <div class="flex items-center space-x-4">
                                        <img id="employee-image-preview" src="${this.imagePreviewUrl || ''}" 
                                             alt="Preview" class="w-20 h-20 object-cover rounded-full border">
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-600">File akan diupload ke Supabase Storage</p>
                                            <button type="button" id="remove-employee-image-btn" 
                                                    onclick="window.employees.removeImage()"
                                                    class="mt-2 text-red-600 hover:text-red-800 text-sm font-medium">
                                                Hapus Gambar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-500">
                                Format yang didukung: JPEG, PNG, GIF, WebP. Maksimal 5MB.
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan *</label>
                            <input 
                                type="text" 
                                name="nama_karyawan" 
                                value="${this.escapeHtml(item ? item.nama_karyawan : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                maxlength="100"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Outlet *</label>
                            <input 
                                type="text" 
                                name="outlet" 
                                value="${this.escapeHtml(item ? item.outlet : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                maxlength="50"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                            <input 
                                type="text" 
                                name="posisi" 
                                value="${this.escapeHtml(item ? item.posisi : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                maxlength="50"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WA</label>
                            <input 
                                type="text" 
                                name="nomor_wa" 
                                value="${this.escapeHtml(item ? item.nomor_wa : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                maxlength="20"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">User Login *</label>
                            <input 
                                type="text" 
                                name="user_login" 
                                value="${this.escapeHtml(item ? item.user_login : '')}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                maxlength="50"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password ${isEdit ? '' : '*'}</label>
                            <input 
                                type="password" 
                                name="password" 
                                value=""
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                ${isEdit ? 'placeholder="Kosongkan jika tidak ingin mengubah"' : 'required'}
                                maxlength="100"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select 
                                name="role" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                <option value="pelayan" ${item && item.role === 'pelayan' ? 'selected' : ''}>Pelayan</option>
                                <option value="kasir" ${item && item.role === 'kasir' ? 'selected' : ''}>Kasir</option>
                                <option value="manager" ${item && item.role === 'manager' ? 'selected' : ''}>Manager</option>
                                <option value="admin" ${item && item.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                                name="status" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                                <option value="active" ${item && item.status === 'active' ? 'selected' : ''}>🟢 Aktif</option>
                                <option value="inactive" ${item && item.status === 'inactive' ? 'selected' : ''}>🔴 Nonaktif</option>
                            </select>
                        </div>
                    </div>
                </form>
                
                <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-blue-800">Informasi</h3>
                            <div class="mt-1 text-sm text-blue-700">
                                <p>Password hanya perlu diisi saat menambah karyawan baru. Untuk edit, kosongkan jika tidak ingin mengubah password.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: () => {
                    console.log('Cancel button clicked');
                    modal.close();
                },
                primary: false
            },
            {
                text: isEdit ? 'Update Data' : 'Simpan Data',
                onclick: () => {
                    console.log('Save button clicked');
                    if (isEdit) {
                        this.update(item.id);
                    } else {
                        this.save();
                    }
                },
                primary: true
            }
        ];

        // Create modal
        modal.createModal(title, content, buttons, { 
            size: 'max-w-2xl',
            customClass: 'employee-modal'
        });

        // Update preview after modal is created
        setTimeout(() => this.updateImagePreview(), 100);
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Save new employee dengan upload foto
    async save() {
        try {
            console.log('Saving new employee...');
            
            const form = document.getElementById('employee-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Form data:', data);

            // Validasi data
            if (!data.nama_karyawan || !data.outlet || !data.user_login || !data.password) {
                Notifications.error('Nama karyawan, outlet, user login, dan password harus diisi');
                return;
            }

            Helpers.showLoading();

            // Upload image if selected
            let photoUrl = null;
            if (this.selectedFile) {
                console.log('Uploading new employee image...');
                photoUrl = await this.uploadImage(this.selectedFile);
                console.log('Employee image uploaded, URL:', photoUrl);
            }

            const employeeData = {
                nama_karyawan: data.nama_karyawan.trim(),
                outlet: data.outlet.trim(),
                posisi: data.posisi.trim(),
                nomor_wa: data.nomor_wa.trim(),
                user_login: data.user_login.trim(),
                password: data.password,
                role: data.role || 'pelayan',
                status: data.status || 'active',
                photo_url: photoUrl
            };

            console.log('Saving employee data:', employeeData);

            const { data: result, error } = await supabase
                .from('karyawan')
                .insert([employeeData])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Save successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Karyawan berhasil ditambahkan!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving employee:', error);
            Notifications.error('Gagal menambah karyawan: ' + error.message);
        }
    }

    // Edit employee
    edit(id) {
        console.log('Editing employee:', id);
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (item) {
            console.log('Found item for editing:', item);
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            console.log('Current data:', this.currentData);
            Notifications.error('Data tidak ditemukan untuk diedit');
        }
    }

    // Update employee
    async update(id) {
        try {
            console.log('Updating employee:', id);
            
            const form = document.getElementById('employee-form');
            if (!form) {
                throw new Error('Form tidak ditemukan');
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            console.log('Update data:', data);

            // Validasi data
            if (!data.nama_karyawan || !data.outlet || !data.user_login) {
                Notifications.error('Nama karyawan, outlet, dan user login harus diisi');
                return;
            }

            Helpers.showLoading();

            // Upload new image if selected
            let photoUrl = null;
            if (this.selectedFile) {
                console.log('Uploading new image for employee update...');
                
                // Delete old image if exists
                const oldItem = this.currentData.find(d => d.id === parseInt(id));
                if (oldItem && oldItem.photo_url) {
                    await this.deleteImage(oldItem.photo_url);
                }
                
                // Upload new image
                photoUrl = await this.uploadImage(this.selectedFile);
                console.log('New employee image uploaded, URL:', photoUrl);
            }

            const employeeData = {
                nama_karyawan: data.nama_karyawan.trim(),
                outlet: data.outlet.trim(),
                posisi: data.posisi.trim(),
                nomor_wa: data.nomor_wa.trim(),
                user_login: data.user_login.trim(),
                role: data.role || 'pelayan',
                status: data.status || 'active'
            };

            // Only update password if provided
            if (data.password) {
                employeeData.password = data.password;
            }

            // Only update photo_url if new image was uploaded
            if (photoUrl) {
                employeeData.photo_url = photoUrl;
            }

            console.log('Updating employee data:', employeeData);

            const { data: result, error } = await supabase
                .from('karyawan')
                .update(employeeData)
                .eq('id', parseInt(id))
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Karyawan berhasil diupdate!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating employee:', error);
            Notifications.error('Gagal mengupdate karyawan: ' + error.message);
        }
    }

    // Delete employee
    delete(id) {
        console.log('Delete button clicked for ID:', id);
        
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (!item) {
            console.error('Item not found for deletion:', id);
            Notifications.error('Data tidak ditemukan');
            return;
        }

        console.log('Showing confirmation for:', item);
        
        const confirmMessage = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Karyawan?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus karyawan <strong>"${this.escapeHtml(item.nama_karyawan)}"</strong> dari outlet <strong>"${this.escapeHtml(item.outlet)}"</strong>. Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
        `;

        modal.showConfirm(
            confirmMessage,
            () => this.confirmDelete(id),
            () => console.log('Delete cancelled')
        );
    }

    async confirmDelete(id) {
        try {
            console.log('Confirming delete for:', id);
            const numericId = parseInt(id);
            const item = this.currentData.find(d => d.id === numericId);
            
            Helpers.showLoading();

            // Delete image from storage if exists
            if (item && item.photo_url) {
                await this.deleteImage(item.photo_url);
            }

            const { error } = await supabase
                .from('karyawan')
                .delete()
                .eq('id', numericId);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Karyawan berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting employee:', error);
            Notifications.error('Gagal menghapus karyawan: ' + error.message);
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing employees data...');
        await this.loadData();
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up employees module...');
        this.isInitialized = false;
        this.table = null;
    }
}

// Initialize employees globally
let employees = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for employees module...');
    
    // Hanya inisialisasi jika di halaman yang memiliki employees
    if (document.getElementById('employees-table')) {
        console.log('Initializing employees module...');
        employees = new Employees();
        window.employees = employees;
        
        // Tunggu sedikit untuk memastikan app sudah terload
        setTimeout(() => {
            employees.init();
        }, 100);
    }
});
