function updateSyncStatus(status) {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;

    if (status === 'online') {
        statusEl.className = 'sync-status online';
        statusEl.title = 'Sincronizado com a nuvem';
        statusEl.innerHTML = '<i class="ph-fill ph-cloud-check" style="color: #10b981;"></i>';
    } else if (status === 'syncing') {
        statusEl.className = 'sync-status syncing';
        statusEl.title = 'Sincronizando...';
        statusEl.innerHTML = '<i class="ph ph-arrows-clockwise" style="color: var(--primary); animation: spin 2s linear infinite;"></i>';
    } else {
        statusEl.className = 'sync-status offline';
        statusEl.title = 'Desconectado do servidor ou sem login';
        statusEl.innerHTML = '<i class="ph-fill ph-cloud-slash" style="color: var(--danger); opacity: 0.6;"></i>';
    }
}

// CSS para o spinner
if (!document.getElementById('sync-style')) {
    const style = document.createElement('style');
    style.id = 'sync-style';
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
