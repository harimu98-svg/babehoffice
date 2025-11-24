// Members Module - FIXED VERSION
class Members {
    constructor() {
        this.currentData = [];
        this.table = null;
        this.outlets = [];
        this.isInitialized = false;
        console.log('Members class initialized');
    }

    // Initialize module
    async init() {
        if (this.isInitialized) {
            console.log('Members already initialized');
            return;
        }

        console.log('Initializing Members module...');
        try {
            await this.loadOutlets();
            await this.loadData();
            this.initTable();
            this.bindEvents();
            this.isInitialized = true;
            console.log('✅ Members module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Members:', error);
        }
    }

    // Load outlets from app
    async loadOutlets() {
        try {
            if (window.app && window.app.getOutlets) {
                this.outlets = window.app.getOutlets();
                console.log('Loaded outlets from app:', this.outlets);
            } else {
                // Fallback: load outlets directly
                const { data, error } = await supabase
                    .from('outlet')
                    .select('outlet')
                    .eq('status', 'active')
                    .order('outlet', { ascending: true });

                if (error) throw error;
                this.outlets = data || [];
                console.log('Loaded outlets directly:', this.outlets);
            }
        } catch (error) {
            console.error('Error loading outlets:', error);
            this.outlets = [];
        }
    }

    // Load data from Supabase dengan pagination
    async loadData(filters = {}) {
        try {
            Helpers.showLoading();
            console.log('Loading members data...', filters);
            
            const allData = [];
            let page = 1;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                let query = supabase
                    .from('membercard')
                    .select('*')
                    .range(from, to);

                // Apply filters
                if (filters.outlet) {
                    query = query.eq('outlet', filters.outlet);
                }
                if (filters.status) {
                    query = query.eq('status', filters.status);
                }

                const { data, error } = await query.order('nama', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    allData.push(...data);
                    
                    if (data.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }

            console.log('✅ Finished loading members:', {
                totalLoaded: allData.length,
                pages: page
            });

            this.currentData = allData;
            if (this.table) {
                this.table.updateData(this.currentData);
            }

            Helpers.hideLoading();
            return this.currentData;
        } catch (error) {
            Helpers.hideLoading();
            console.error('Error loading members:', error);
            Notifications.error('Gagal memuat data member: ' + error.message);
            return [];
        }
    }

    // Format date helper function
    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return dateString;
        }
    }

    // Initialize table
    initTable() {
        console.log('Initializing members table...');
        
        const columns = [
            { 
                title: 'Nama', 
                key: 'nama',
                formatter: (value) => `<span class="font-medium text-gray-900">${value || '-'}</span>`
            },
            { 
                title: 'Nomor WA', 
                key: 'nomorWA',
                formatter: (value) => value || '-'
            },
            { 
                title: 'ID Member', 
                key: 'id_member',
                formatter: (value) => value || '-'
            },
            { 
                title: 'Outlet', 
                key: 'outlet',
                formatter: (value) => `<span class="font-medium">${value || '-'}</span>`
            },
            { 
                title: 'Point', 
                key: 'point',
                formatter: (value) => value || 0
            },
            { 
                title: 'Berlaku', 
                key: 'berlaku',
                formatter: (value) => this.formatDate(value)
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

        this.table = new DataTable('members-table', {
            columns: columns,
            searchable: true,
            pagination: true,
            pageSize: 10,
            emptyMessage: 'Tidak ada data member',
            searchPlaceholder: 'Cari member...'
        });

        this.table.init();
        this.table.updateData(this.currentData);
        console.log('Members table initialized');
    }

    // Fallback table jika DataTable tidak tersedia
    renderFallbackTable() {
        const container = document.getElementById('members-table');
        if (!container) return;

        if (this.currentData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-2">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Tidak ada data member</p>
                    <button onclick="members.showForm()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Tambah Member Pertama
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
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor WA</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Member</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Point</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berlaku</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;

        this.currentData.forEach(item => {
            tableHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nama || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.nomorWA || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.id_member || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.outlet || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.point || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatDate(item.berlaku)}</td>
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
                    onclick="window.members.handleEdit('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="Edit Member"
                >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button 
                    onclick="window.members.handleDelete('${id}')" 
                    class="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="Hapus Member"
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
        console.log('Binding members events...');
        
        // Add button event
        const addBtn = document.getElementById('add-member');
        if (addBtn) {
            // Remove existing event listeners first
            addBtn.replaceWith(addBtn.cloneNode(true));
            const newAddBtn = document.getElementById('add-member');
            
            newAddBtn.addEventListener('click', () => {
                console.log('Add member button clicked');
                this.showForm();
            });
            console.log('Add button event bound');
        } else {
            console.error('Add button not found!');
        }

        // Filter events
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');
        const clearFilters = document.getElementById('clear-filters');

        if (outletFilter) {
            outletFilter.addEventListener('change', () => this.applyFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
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

    // Apply filters
    applyFilters() {
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');

        const filters = {
            outlet: outletFilter ? outletFilter.value : '',
            status: statusFilter ? statusFilter.value : ''
        };

        this.loadData(filters);
    }

    // Clear filters
    clearFilters() {
        const outletFilter = document.getElementById('outlet-filter');
        const statusFilter = document.getElementById('status-filter');

        if (outletFilter) outletFilter.value = '';
        if (statusFilter) statusFilter.value = '';

        this.loadData({ outlet: '', status: '' });
    }

    // Show form for add/edit
    showForm(item = null) {
        const isEdit = !!item;
        const title = isEdit ? 'Edit Member' : 'Tambah Member';
        
        console.log('Showing form for:', isEdit ? 'edit' : 'add', item);

        // Generate outlet options
        const outletOptions = this.outlets.map(outlet => 
            `<option value="${this.escapeHtml(outlet.outlet)}" ${item && item.outlet === outlet.outlet ? 'selected' : ''}>
                ${this.escapeHtml(outlet.outlet)}
            </option>`
        ).join('');

        const content = `
            <div class="space-y-4">
                <form id="member-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Nama Member <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="nama" 
                                value="${item ? this.escapeHtml(item.nama) : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                placeholder="Masukkan nama member"
                                maxlength="100"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Nomor WA <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="nomorWA" 
                                value="${item ? this.escapeHtml(item.nomorWA) : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                                placeholder="Contoh: 081234567890"
                                maxlength="20"
                            >
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ID Member
                            </label>
                            <input 
                                type="text" 
                                name="id_member" 
                                value="${item ? this.escapeHtml(item.id_member) : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Auto generate"
                                maxlength="50"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Outlet <span class="text-red-500">*</span>
                            </label>
                            <select 
                                name="outlet" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                required
                            >
                                <option value="">Pilih Outlet</option>
                                ${outletOptions}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Lahir
                            </label>
                            <input 
                                type="date" 
                                name="tanggal_lahir" 
                                value="${item && item.tanggal_lahir ? item.tanggal_lahir.split('T')[0] : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Berlaku Sampai
                            </label>
                            <input 
                                type="date" 
                                name="berlaku" 
                                value="${item && item.berlaku ? item.berlaku.split('T')[0] : ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                        <textarea 
                            name="alamat" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            rows="3"
                            placeholder="Masukkan alamat member"
                            maxlength="255"
                        >${item ? this.escapeHtml(item.alamat) : ''}</textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Point</label>
                            <input 
                                type="number" 
                                name="point" 
                                value="${item ? item.point : 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                min="0"
                                placeholder="0"
                            >
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
                                <p>Field dengan tanda <span class="text-red-500">*</span> wajib diisi.</p>
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
            customClass: 'member-modal'
        });

        // Auto-focus pada input pertama
        setTimeout(() => {
            const firstInput = document.querySelector('#member-form input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Escape HTML untuk prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Validate form
    validateForm() {
        const form = document.getElementById('member-form');
        if (!form) return false;

        const formData = new FormData(form);
        
        const nama = formData.get('nama');
        const nomorWA = formData.get('nomorWA');
        const outlet = formData.get('outlet');

        if (!nama || nama.trim() === '') {
            Notifications.error('Nama member harus diisi');
            return false;
        }

        if (!nomorWA || nomorWA.trim() === '') {
            Notifications.error('Nomor WA harus diisi');
            return false;
        }

        if (!outlet) {
            Notifications.error('Outlet harus dipilih');
            return false;
        }

        return true;
    }

    // Save new member
    async save() {
        try {
            console.log('Saving new member...');
            
            if (!this.validateForm()) {
                return;
            }

            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            
            const data = {
                nama: formData.get('nama').trim(),
                nomorWA: formData.get('nomorWA').trim(),
                id_member: formData.get('id_member')?.trim() || null,
                outlet: formData.get('outlet'),
                tanggal_lahir: formData.get('tanggal_lahir') || null,
                alamat: formData.get('alamat')?.trim() || null,
                berlaku: formData.get('berlaku') || null,
                point: parseInt(formData.get('point')) || 0,
                status: formData.get('status') || 'active'
            };

            console.log('Member data to save:', data);

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('membercard')
                .insert([data])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Save successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil ditambahkan!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error saving member:', error);
            Notifications.error('Gagal menambah member: ' + error.message);
        }
    }

    // Edit member
    edit(id) {
        console.log('Editing member:', id);
        const item = this.currentData.find(d => d.id === id);
        if (item) {
            console.log('Found item for editing:', item);
            this.showForm(item);
        } else {
            console.error('Item not found for editing:', id);
            Notifications.error('Data tidak ditemukan untuk diedit');
        }
    }

    // Update member
    async update(id) {
        try {
            console.log('Updating member:', id);
            
            if (!this.validateForm()) {
                return;
            }

            const form = document.getElementById('member-form');
            const formData = new FormData(form);
            
            const data = {
                nama: formData.get('nama').trim(),
                nomorWA: formData.get('nomorWA').trim(),
                id_member: formData.get('id_member')?.trim() || null,
                outlet: formData.get('outlet'),
                tanggal_lahir: formData.get('tanggal_lahir') || null,
                alamat: formData.get('alamat')?.trim() || null,
                berlaku: formData.get('berlaku') || null,
                point: parseInt(formData.get('point')) || 0,
                status: formData.get('status') || 'active'
            };

            console.log('Member data to update:', data);

            Helpers.showLoading();

            const { data: result, error } = await supabase
                .from('membercard')
                .update(data)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Update successful:', result);

            modal.close();
            await this.loadData();
            Notifications.success('Member berhasil diupdate!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error updating member:', error);
            Notifications.error('Gagal mengupdate member: ' + error.message);
        }
    }

    // Delete member
    delete(id) {
        console.log('Delete button clicked for ID:', id);
        
        const item = this.currentData.find(d => d.id === id);
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
                <h3 class="text-lg font-medium text-gray-900 mb-2">Hapus Member?</h3>
                <p class="text-sm text-gray-500 mb-4">
                    Anda akan menghapus member <strong>"${this.escapeHtml(item.nama)}"</strong>. Tindakan ini tidak dapat dibatalkan.
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
            Helpers.showLoading();

            const { error } = await supabase
                .from('membercard')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('Delete successful');
            await this.loadData();
            Notifications.success('Member berhasil dihapus!');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Error deleting member:', error);
            Notifications.error('Gagal menghapus member: ' + error.message);
        }
    }

    // Refresh data
    async refresh() {
        console.log('Refreshing members data...');
        await this.loadData();
    }

    // Export members to CSV
    async exportToCSV() {
        try {
            Helpers.showLoading();
            
            const { data, error } = await supabase
                .from('membercard')
                .select('*')
                .order('nama', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                Notifications.error('Tidak ada data member untuk diexport');
                return;
            }

            const headers = ['Nama', 'Nomor WA', 'ID Member', 'Outlet', 'Point', 'Status', 'Berlaku', 'Alamat'];
            const csvData = data.map(member => [
                `"${member.nama || ''}"`,
                `"${member.nomorWA || ''}"`,
                `"${member.id_member || ''}"`,
                `"${member.outlet || ''}"`,
                `"${member.point || 0}"`,
                `"${member.status || ''}"`,
                `"${member.berlaku || ''}"`,
                `"${member.alamat || ''}"`
            ]);

            const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Helpers.hideLoading();
            Notifications.success('Data member berhasil diexport');

        } catch (error) {
            Helpers.hideLoading();
            console.error('Export error:', error);
            Notifications.error('Gagal mengexport data: ' + error.message);
        }
    }

    // Cleanup
    cleanup() {
        console.log('Cleaning up members module...');
        this.isInitialized = false;
        this.table = null;
    }
}

// Initialize members globally
let members = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for members module...');
    
    // Hanya inisialisasi jika di halaman yang memiliki members
    if (document.getElementById('members-table')) {
        console.log('Initializing members module...');
        members = new Members();
        window.members = members;
        
        // Tunggu sedikit untuk memastikan app sudah terload
        setTimeout(() => {
            members.init();
        }, 100);
    }
});
