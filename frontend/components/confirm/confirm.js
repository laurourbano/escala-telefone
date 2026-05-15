function showConfirm({ title, message, type = 'danger', onConfirm, onCancel }) {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const iconEl = document.getElementById('confirm-icon-i');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');

    titleEl.textContent = title || 'Confirmar Ação';
    messageEl.textContent = message || 'Você tem certeza que deseja realizar esta ação?';
    
    // Set icon and button color based on type
    if (type === 'danger') {
        iconEl.className = 'ph-fill ph-warning-circle';
        iconEl.style.color = 'var(--danger)';
        btnOk.style.background = 'var(--danger)';
    } else {
        iconEl.className = 'ph-fill ph-question';
        iconEl.style.color = 'var(--primary)';
        btnOk.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
    }

    const closeModal = () => {
        modal.classList.remove('active');
        // Clean up listeners to avoid leaks
        btnOk.onclick = null;
        btnCancel.onclick = null;
    };

    btnOk.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };

    btnCancel.onclick = () => {
        closeModal();
        if (onCancel) onCancel();
    };

    modal.classList.add('active');
}
