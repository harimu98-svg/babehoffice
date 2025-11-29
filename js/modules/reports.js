// ==================== FOOTER METHODS ====================

getFooterData() {
    if (!this.currentData || this.currentData.length === 0) {
        return null;
    }

    const footerData = {};
    const columns = this.getTableColumns();
    
    columns.forEach(col => {
        if (col.type === 'currency' || this.isNumericColumn(col.key)) {
            footerData[col.key] = this.currentData.reduce((sum, item) => {
                const value = parseFloat(item[col.key]) || 0;
                return sum + value;
            }, 0);
        } else {
            footerData[col.key] = 'TOTAL';
        }
    });

    return footerData;
}

isNumericColumn(key) {
    // Daftar kolom yang harus dianggap numeric meskipun tidak bertype currency
    const numericColumns = [
        'qty', 'jumlah_membercard', 'jumlah_transaksi', 'point', 'redeem_qty'
    ];
    
    return numericColumns.includes(key);
}

// Modifikasi method initTable() untuk menambahkan footer
initTable() {
    console.log('Initializing table for tab:', this.currentTab);
    
    const tableContainer = document.getElementById('reports-table');
    if (!tableContainer) {
        console.error('Table container #reports-table not found');
        setTimeout(() => this.initTable(), 100);
        return;
    }

    // Bersihkan container terlebih dahulu
    tableContainer.innerHTML = '';

    const columns = this.getTableColumns();
    const footerData = this.getFooterData();
    
    // Destroy table lama jika ada
    if (this.table && typeof this.table.destroy === 'function') {
        this.table.destroy();
    }
    
    this.table = new DataTable('reports-table', {
        columns: columns,
        searchable: true,
        pagination: true,
        pageSize: 15,
        footerData: footerData // Tambahkan footer data
    });

    this.table.init();
    this.table.updateData(this.currentData);
    this.tableInitialized = true;
    
    console.log('Table initialized successfully with footer');
}

// Modifikasi method updateTableForCurrentTab() untuk update footer
updateTableForCurrentTab() {
   
