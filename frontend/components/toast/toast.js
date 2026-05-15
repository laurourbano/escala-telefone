function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ph-info';
    if (type === 'success') icon = 'ph-check-circle';
    if (type === 'error') icon = 'ph-warning-circle';
    if (type === 'warning') icon = 'ph-warning';

    if (!title) {
        if (type === 'success') title = 'Sucesso';
        else if (type === 'error') title = 'Erro';
        else if (type === 'warning') title = 'Atenção';
        else title = 'Informação';
    }

    toast.innerHTML = `
        <i class="ph-fill ${icon}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Force reflow
    toast.offsetHeight;

    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}
