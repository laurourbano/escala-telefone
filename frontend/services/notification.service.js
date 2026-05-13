function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    if (!state.currentUser) {
        badge.style.display = 'none';
        return;
    }
    const pending = state.notifications.filter(n =>
        n.toId === state.currentUser.id && n.status === 'pending'
    );
    if (pending.length > 0) {
        badge.style.display = 'flex';
        badge.innerText = pending.length;
    } else {
        badge.style.display = 'none';
    }
}

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

function openSwapModal(myShiftId, date) {
    if (!state.currentUser) return;
    const shift = state.shifts.find(shift => shift.id === myShiftId);
    if (!shift) return;

    document.getElementById('swap-my-shift-id').value = myShiftId;
    document.getElementById('swap-my-date').value = date;
    document.getElementById('swap-my-details').innerText = `${shift.name} (${shift.time}) em ${formatDate(date)}`;

    const targetPersonSelect = document.getElementById('swap-target-person');
    targetPersonSelect.innerHTML = '<option value="">Selecione um colega...</option>' +
        state.people
            .filter(person => person.id !== state.currentUser.id)
            .map(person => `<option value="${person.id}">${person.name}</option>`)
            .join('');

    document.getElementById('swap-target-shift').innerHTML = '<option value="">Selecione o turno do colega...</option>';
    document.getElementById('swap-target-shift').disabled = true;
    document.getElementById('modal-swap').classList.add('active');
}

function updateSwapTargetShifts(colleagueId) {
    const targetShiftSelect = document.getElementById('swap-target-shift');
    targetShiftSelect.innerHTML = '<option value="">Selecione o turno do colega...</option>';
    targetShiftSelect.disabled = !colleagueId;

    if (!colleagueId) return;

    const days = getWorkingDays();
    const options = [];

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const peopleInShift = state.schedule[key] || [];
            if (peopleInShift.includes(colleagueId)) {
                options.push({ shiftId: shift.id, date: day, label: `${shift.name} (${shift.time}) - ${formatDate(day)}` });
            }
        });
    });

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = `${opt.shiftId}|${opt.date}`;
        option.textContent = opt.label;
        targetShiftSelect.appendChild(option);
    });
}

function handleSwapRequest(event) {
    event.preventDefault();
    const myShiftId = document.getElementById('swap-my-shift-id').value;
    const myDate = document.getElementById('swap-my-date').value;
    const targetPersonId = document.getElementById('swap-target-person').value;
    const targetShiftRaw = document.getElementById('swap-target-shift').value;

    if (!targetPersonId || !targetShiftRaw) {
        alert('Selecione um colega e um turno para troca.');
        return;
    }

    const [targetShiftId, targetDate] = targetShiftRaw.split('|');

    state.notifications.push({
        id: generateId(),
        fromId: state.currentUser.id,
        fromName: state.currentUser.name,
        toId: targetPersonId,
        myShiftId,
        myDate,
        targetShiftId,
        targetDate,
        status: 'pending',
        timestamp: new Date().toISOString()
    });

    saveState();
    alert('Solicitação de troca enviada!');
    document.getElementById('modal-swap').classList.remove('active');
    updateNotificationBadge();
}

function acceptSwap(notificationId) {
    const notification = state.notifications.find(notif => notif.id === notificationId);
    if (!notification) return;

    const myKey = `${notification.targetShiftId}-${notification.targetDate}`;
    const theirKey = `${notification.myShiftId}-${notification.myDate}`;

    state.schedule[myKey] = (state.schedule[myKey] || []).filter(id => id !== state.currentUser.id);
    state.schedule[myKey].push(notification.fromId);

    state.schedule[theirKey] = (state.schedule[theirKey] || []).filter(id => id !== notification.fromId);
    state.schedule[theirKey].push(state.currentUser.id);

    notification.status = 'accepted';
    saveState();
    renderNotifications();
    updateNotificationBadge();
    renderPersonalSchedule(state.currentUser.id);
    renderScheduleBoard();
    alert("Troca realizada com sucesso!");
}

function rejectSwap(notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    notification.status = 'rejected';
    saveState();
    renderNotifications();
    updateNotificationBadge();
}
