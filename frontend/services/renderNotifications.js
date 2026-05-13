function renderNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!state.currentUser) return;
    const myNotifications = state.notifications
        .filter(n => n.toId === state.currentUser.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (myNotifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nao ha novas notificacoes.</p></div>';
        return;
    }

    container.innerHTML = myNotifications.map(n => {
        const myShift = state.shifts.find(s => s.id === n.targetShiftId);
        const theirShift = state.shifts.find(s => s.id === n.myShiftId);

        return `
            <div class="notification-item">
                <div class="notification-content">
                    <p><strong>${getFirstName(n.fromName)}</strong> deseja trocar o turno dele de <strong>${theirShift ? theirShift.name : '?'} em ${formatDate(n.myDate)}</strong> pelo seu turno de <strong>${myShift ? myShift.name : '?'} em ${formatDate(n.targetDate)}</strong>.</p>
                </div>
                ${n.status === 'pending' ? `
                    <div class="notification-actions">
                        <button class="primary-btn" onclick="acceptSwap('${n.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Aceitar</button>
                        <button class="secondary-btn" onclick="rejectSwap('${n.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Recusar</button>
                    </div>
                ` : `<span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.7rem;">${n.status === 'accepted' ? 'Aceito' : 'Recusado'}</span>`}
            </div>
        `;
    }).join('');
}
