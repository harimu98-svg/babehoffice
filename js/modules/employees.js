// Employees Module
class Employees {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.selectedFile = null;
        this.imagePreviewUrl = null;
        this.currentEmployeeId = null;
        
        // Bind methods to maintain 'this' context
        this.init = this.init.bind(this);
        this.loadData = this.loadData.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.edit = this.edit.bind(this);
        this.delete = this.delete.bind(this);
        this.save = this.save.bind(this);
        this.update = this.update.bind(this);
        this.confirmDelete = this.confirmDelete.bind(this);
    }

    // Initialize module
    async init() {
        console.log('Initializing Employees module');
        await this.loadData();
        this.initTable();
        this.bindEvents();
        console.log('Employees module initialized');
    }

    // Load data from Supabase
    async loadData() {
        try {
            Helpers.showLoading();
            
            const { data, error } = await supabase
                .from('karyawan')
                .select('*')
                .order('nama_karyawan', { ascending: true });

            if (error) throw error;

            this.currentData = data || [];
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal memuat data karyawan: ' + error.message);
            return [];
        }
    }

    // Initialize table dengan kolom foto
    initTable() {
        this.table = new DataTable('employees-table', {
            columns: [
                { 
                    title: 'Foto', 
                    key: 'photo_url',
                    formatter: (value) => {
                        if (!value) return '<span class="text-gray-400">-</span>';
                        return `
                            <img src="${value}" alt="Karyawan" class="w-10 h-10 object-cover rounded-full cursor-pointer" 
                                 onclick="employees.showImagePreview('${value}')">
                        `;
                    }
                },
                { title: 'Nama Karyawan', key: 'nama_karyawan' },
                { title: 'Outlet', key: 'outlet' },
                { title: 'Posisi', key: 'posisi' },
                { title: 'Nomor WA', key: 'nomor_wa' },
                { 
                    title: 'Role', 
                    key: 'role',
                    formatter: (value) => {
                        const roles = {
                            'admin': 'Admin',
                            'manager': 'Manager', 
                            'kasir': 'Kasir',
                            'pelayan': 'Pelayan'
                        };
                        return roles[value] || value;
                    }
                },
                { 
                    title: 'Status', 
                    key: 'status',
                    formatter: (value) => {
                        const isActive = value === 'active';
                        return `
                            <span class="px-2 py-1 text-xs rounded-full ${
                                isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }">
                                ${isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                        `;
                    }
                }
            ],
            actions: [
                {
                    text: 'Edit',
                    onclick: 'employees.edit',
                    color: 'blue'
                },
                {
                    text: 'Hapus',
                    onclick: 'employees.delete',
                    color: 'red'
                }
            ],
            searchable: true,
            pagination: true,
            pageSize: 10
        });

        this.table.init();
        this.table.updateData(this.currentData);
    }

    // Bind events
    bindEvents() {
        const addBtn = document.getElementById('add-employee');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showForm());
        }
    }

    // Upload image to Supabase Storage
    async uploadImage(file) {
        try {
            if (!file) return null;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `employees/${fileName}`;

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
            const filePath = `employees/${fileName}`;

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
                onclick: 'modal.close()',
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
                            onchange="employees.handleFileSelect(event)"
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
                                                onclick="employees.removeImage()"
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan</label>
                        <input 
                            type="text" 
                            name="nama_karyawan" 
                            value="${item ? item.nama_karyawan : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                        <input 
                            type="text" 
                            name="outlet" 
                            value="${item ? item.outlet : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                        <input 
                            type="text" 
                            name="posisi" 
                            value="${item ? item.posisi : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WA</label>
                        <input 
                            type="text" 
                            name="nomor_wa" 
                            value="${item ? item.nomor_wa : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">User Login</label>
                        <input 
                            type="text" 
                            name="user_login" 
                            value="${item ? item.user_login : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            value="${item ? item.password : ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            ${isEdit ? '' : 'required'}
                        >
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select 
                            name="role" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="active" ${item && item.status === 'active' ? 'selected' : ''}>Aktif</option>
                            <option value="inactive" ${item && item.status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Batal',
                onclick: 'modal.close()',
                primary: false
            },
            {
                text: isEdit ? 'Update' : 'Simpan',
                onclick: `employees.${isEdit ? 'update' : 'save'}('${item ? item.id : ''}')`,
                primary: true
            }
        ];

        modal.createModal(title, content, buttons);
        
        // Update preview after modal is created
        setTimeout(() => this.updateImagePreview(), 100);
    }

    // Save new employee dengan upload foto
    async save() {
        try {
            const form = document.getElementById('employee-form');
            const formData = new FormData(form);
            
            // Create data object
            const data = {
                nama_karyawan: formData.get('nama_karyawan'),
                outlet: formData.get('outlet'),
                posisi: formData.get('posisi'),
                nomor_wa: formData.get('nomor_wa'),
                user_login: formData.get('user_login'),
                password: formData.get('password'),
                role: formData.get('role'),
                status: formData.get('status')
            };

            // Upload image if selected
            if (this.selectedFile) {
                console.log('Uploading new employee image...');
                const photoUrl = await this.uploadImage(this.selectedFile);
                data.photo_url = photoUrl;
                console.log('Employee image uploaded, URL:', photoUrl);
            }

            console.log('Saving employee data:', data);

            Helpers.showLoading();

            const { error } = await supabase
                .from('karyawan')
                .insert([data]);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Karyawan berhasil ditambahkan');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Save employee error:', error);
            Notifications.error('Gagal menambah karyawan: ' + error.message);
        }
    }

    // Update employee dengan upload foto
    async update(id) {
        try {
            const form = document.getElementById('employee-form');
            const formData = new FormData(form);
            
            // Create data object
            const data = {
                nama_karyawan: formData.get('nama_karyawan'),
                outlet: formData.get('outlet'),
                posisi: formData.get('posisi'),
                nomor_wa: formData.get('nomor_wa'),
                user_login: formData.get('user_login'),
                role: formData.get('role'),
                status: formData.get('status')
            };

            // Handle password - only update if provided
            const password = formData.get('password');
            if (password) {
                data.password = password;
            }

            // Upload new image if selected
            if (this.selectedFile) {
                console.log('Uploading new image for employee update...');
                
                // Delete old image if exists
                const oldItem = this.currentData.find(d => d.id === parseInt(id));
                if (oldItem && oldItem.photo_url) {
                    await this.deleteImage(oldItem.photo_url);
                }
                
                // Upload new image
                const photoUrl = await this.uploadImage(this.selectedFile);
                data.photo_url = photoUrl;
                console.log('New employee image uploaded, URL:', photoUrl);
            }

            console.log('Updating employee data:', data);

            Helpers.showLoading();

            const { error } = await supabase
                .from('karyawan')
                .update(data)
                .eq('id', parseInt(id));

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            modal.close();
            await this.loadData();
            Notifications.success('Karyawan berhasil diupdate');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Update employee error:', error);
            Notifications.error('Gagal mengupdate karyawan: ' + error.message);
        }
    }

    // Delete employee dengan hapus foto juga
    async delete(id) {
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (item && item.photo_url) {
            modal.showConfirm(
                'Apakah Anda yakin ingin menghapus karyawan ini? Foto karyawan juga akan dihapus dari storage.',
                `employees.confirmDelete('${id}')`
            );
        } else {
            modal.showConfirm(
                'Apakah Anda yakin ingin menghapus karyawan ini?',
                `employees.confirmDelete('${id}')`
            );
        }
    }

    async confirmDelete(id) {
        try {
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

            await this.loadData();
            Notifications.success('Karyawan berhasil dihapus');

        } catch (error) {
            Helpers.hideLoading();
            Notifications.error('Gagal menghapus karyawan: ' + error.message);
        }
    }

    // Edit employee - PERBAIKI DENGAN CONVERT ID
    edit(id) {
        const numericId = parseInt(id);
        const item = this.currentData.find(d => d.id === numericId);
        if (item) {
            this.showForm(item);
        } else {
            console.error('Employee not found with ID:', numericId);
            Notifications.error('Data karyawan tidak ditemukan');
        }
    }
}

// Initialize employees globally
let employees = null;
document.addEventListener('DOMContentLoaded', () => {
    employees = new Employees();
    window.employees = employees;
});