// Constants
if (typeof ROLES === 'undefined') {
    const ROLES = {
        ADMIN: 'admin',
        MANAGER: 'manager',
        KASIR: 'kasir',
        PELAYAN: 'pelayan'
    };
}

if (typeof STATUS === 'undefined') {
    const STATUS = {
        ACTIVE: 'active',
        INACTIVE: 'inactive'
    };
}

if (typeof PAYMENT_TYPES === 'undefined') {
    const PAYMENT_TYPES = {
        CASH: 'cash',
        TRANSFER: 'transfer',
        DEBIT_CARD: 'debit_card',
        CREDIT_CARD: 'credit_card'
    };
}

if (typeof TABLE_NAMES === 'undefined') {
    const TABLE_NAMES = {
        KARYAWAN: 'karyawan',
        PRODUK: 'produk',
        GROUP_PRODUK: 'group_produk',
        MEMBERCARD: 'membercard',
        TRANSAKSI_DETAIL: 'transaksi detail',
        OUTLET: 'outlet'
    };
}