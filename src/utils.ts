export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzphzP7NCpZy5lpXZPgTr6EgEBTnKhaHGTHLGX4VQ_uvW27zKP7x52YkkpEjr0Ri0A3/exec';

export const formatToDDMMYYYY = (dateStr: any) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
        const parts = dateStr.split('T')[0].split('-');
        if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch(e) {
        return dateStr;
    }
};

export const getSavedPermissions = () => {
    try {
        const saved = localStorage.getItem('recruitOps_permissions_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Force restrict daily_data and daily_stats edits for Staff
            if (parsed.daily_data && parsed.daily_data.edit) {
                parsed.daily_data.edit = ['Superadmin', 'Admin'];
            }
            if (parsed.daily_stats && parsed.daily_stats.edit) {
                parsed.daily_stats.edit = ['Superadmin', 'Admin'];
            }
            // Allow Staff to view User accounts so they can access profile photos and material posting
            if (parsed.users && parsed.users.view) {
                parsed.users.view = ['Superadmin', 'Admin', 'Staff'];
            }
            return parsed;
        }
    } catch (e) {}
    return {
        dashboard: { name: 'Dashboard', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 1, icon: 'ph-squares-four', category: 'Overview' },
        performance: { name: 'Performance', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 2, icon: 'ph-medal', category: 'Performance' },
        daily_data: { name: 'Daily Data', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 3, icon: 'ph-address-book', category: 'Management' },
        daily_stats: { name: 'Daily Stats', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 4, icon: 'ph-chart-bar', category: 'Management' },
        payroll: { name: 'Payroll', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 5, icon: 'ph-currency-circle-dollar', category: 'Management' },
        users: { name: 'User Accounts', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin', 'Staff'], orderIndex: 6, icon: 'ph-user-gear', category: 'Management' },
        settings: { name: 'Settings', view: ['Superadmin', 'Admin', 'Staff'], edit: ['Superadmin', 'Admin'], orderIndex: 7, icon: 'ph-gear', category: 'System' }
    };
};

export const hasViewAccess = (pageId: string, role: string) => {
    if (!role) return false;
    const r = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (r === 'Superadmin') return true;
    const perms: any = getSavedPermissions();
    const pagePerms = perms[pageId];
    if (!pagePerms) return true;
    return pagePerms.view.map((x: string) => x.toLowerCase()).includes(r.toLowerCase());
};

export const hasEditAccess = (pageId: string, role: string) => {
    if (!role) return false;
    const r = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (r === 'Superadmin') return true;
    const perms: any = getSavedPermissions();
    const pagePerms = perms[pageId];
    if (!pagePerms) return false;
    return pagePerms.edit.map((x: string) => x.toLowerCase()).includes(r.toLowerCase());
};
