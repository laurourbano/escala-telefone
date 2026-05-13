function renderScheduleBoard() {
    const days = getWorkingDays();
    const board = document.getElementById('schedule-board');
    board.innerHTML = '';

    if (days.length === 0) {
        board.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem;">Defina o período da escala para visualizar.</div>';
        return;
    }

    const numCols = days.length + 1;
    const grid = document.createElement('div');
    grid.className = 'schedule-grid';
    grid.style.gridTemplateColumns = `160px repeat(${days.length}, 1fr)`;

    // Header row
    const cornerHeader = document.createElement('div');
    cornerHeader.className = 'grid-header corner-header';
    cornerHeader.innerText = 'Turno / Dia';
    grid.appendChild(cornerHeader);

    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.innerText = formatDate(day);
        grid.appendChild(header);
    });

    // Shift rows
    const sortables = [];
    state.shifts.forEach(shift => {
        const label = document.createElement('div');
        label.className = 'grid-label';
        label.innerText = `${shift.name} (${shift.time})`;
        grid.appendChild(label);

        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            if (!state.schedule[dayKey]) state.schedule[dayKey] = [];

            const cell = document.createElement('div');
            cell.className = 'grid-cell dropzone-cell';

            const dropzone = document.createElement('div');
            dropzone.className = 'shift-dropzone';
            dropzone.dataset.shiftId = shift.id;
            dropzone.dataset.day = day;

            dropzone.innerHTML = state.schedule[dayKey].map(personId => {
                const person = state.people.find(p => p.id === personId);
                if (!person) return '';
                return `
                    <div class="scheduled-person" data-person-id="${person.id}">
                        ${getFirstName(person.name)}
                    </div>
                `;
            }).join('');

            cell.appendChild(dropzone);
            grid.appendChild(cell);
        });
    });

    scheduleBoard.appendChild(grid);

    document.querySelectorAll('.shift-dropzone').forEach(dropzone => {
        sortables.push(new Sortable(dropzone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function (event) {
                const personId = event.item.dataset.personId;
                const targetDay = event.to.dataset.day;
                const person = state.people.find(p => p.id === personId);
                if (!person) return;

                const isDoubleBooked = Array.from(document.querySelectorAll('.shift-dropzone'))
                    .filter(dz => dz.dataset.day === targetDay && dz !== event.to)
                    .some(dz => Array.from(dz.children).some(child => child.dataset.personId === personId));

                if (isDoubleBooked) {
                    event.from.appendChild(event.item);
                    alert('Esta pessoa já está escalada em outro turno neste dia.');
                    return;
                }

                const totalShifts = Array.from(document.querySelectorAll('.shift-dropzone'))
                    .reduce((count, dz) => count + Array.from(dz.children).filter(child => child.dataset.personId === personId).length, 0);

                if (totalShifts > person.maxShifts) {
                    event.from.appendChild(event.item);
                    alert(`${person.name} já atingiu o limite máximo de ${person.maxShifts} turno${person.maxShifts !== 1 ? 's' : ''}.`);
                    return;
                }

                updateScheduleFromDOM();
            }
        }));
    });

    validateSchedule();
}

function updateScheduleFromDOM() {
    const dropzones = document.querySelectorAll('.shift-dropzone');
    dropzones.forEach(dropzone => {
        const shiftId = dropzone.dataset.shiftId;
        const day = dropzone.dataset.day;
        const dayKey = `${shiftId}-${day}`;
        const peopleIds = Array.from(dropzone.children).map(child => child.dataset.personId);
        state.schedule[dayKey] = peopleIds;
    });
    saveState();
    validateSchedule();
    const selectedPersonId = document.getElementById('select-person-schedule').value;
    if (selectedPersonId) {
        renderPersonalSchedule(selectedPersonId);
    }
}

function validateSchedule() {
    let hasWarning = false;
    let hasError = false;

    document.querySelectorAll('.scheduled-person').forEach(element => {
        element.classList.remove('conflict-item', 'error-item');
    });

    const personShiftCount = {};
    const days = getWorkingDays();
    const personDays = {};
    const personSameDayErrors = new Set();

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            const scheduledIds = state.schedule[dayKey] || [];

            scheduledIds.forEach(personId => {
                if (!personDays[personId]) personDays[personId] = [];
                personDays[personId].push(day);
                const occurrences = personDays[personId].filter(date => date === day).length;
                if (occurrences > 1) {
                    personSameDayErrors.add(`${personId}-${day}`);
                }
            });
        });
    });

    state.shifts.forEach(shift => {
        days.forEach(day => {
            const dayKey = `${shift.id}-${day}`;
            const scheduledIds = state.schedule[dayKey] || [];

            if (scheduledIds.length > shift.capacity || (scheduledIds.length > 0 && scheduledIds.length < shift.capacity)) {
                hasWarning = true;
            }

            scheduledIds.forEach(personId => {
                personShiftCount[personId] = (personShiftCount[personId] || 0) + 1;
                const person = state.people.find(person => person.id === personId);

                if (person) {
                    if (isPersonUnavailable(person, day)) {
                        hasError = true;
                        highlightPerson(shift.id, day, personId, 'error-item');
                    }

                    if (person.preferredShifts.length > 0 && !person.preferredShifts.includes(shift.id)) {
                        hasWarning = true;
                        highlightPerson(shift.id, day, personId, 'conflict-item');
                    }
                }

                if (personSameDayErrors.has(`${personId}-${day}`)) {
                    hasError = true;
                    highlightPerson(shift.id, day, personId, 'error-item');
                }
            });
        });
    });

    for (let personId in personShiftCount) {
        const person = state.people.find(person => person.id === personId);
        if (person && personShiftCount[personId] > person.maxShifts) {
            hasError = true;
            state.shifts.forEach(shift => {
                days.forEach(date => {
                    if ((state.schedule[`${shift.id}-${date}`] || []).includes(personId)) highlightPerson(shift.id, date, personId, 'error-item');
                });
            });
        }
    }

    const statusElement = document.getElementById('validation-status');

    const unfilledPerDay = {};
    let totalUnfilled = 0;
    state.shifts.forEach(shift => {
        days.forEach(day => {
            const key = `${shift.id}-${day}`;
            const assigned = state.schedule[key] || [];
            const unfilled = Math.max(0, shift.capacity - assigned.length);
            unfilledPerDay[day] = (unfilledPerDay[day] || 0) + unfilled;
            totalUnfilled += unfilled;
        });
    });

    const maxUnfilledPerDay = Math.max(...Object.values(unfilledPerDay), 0);
    const defaultMaxShifts = 5;
    const minByDay = maxUnfilledPerDay;
    const minByTotal = Math.ceil(totalUnfilled / defaultMaxShifts);
    const missingEmployees = Math.max(minByDay, minByTotal);

    let statusHtml = '';
    if (hasError) {
        statusHtml = '<span class="status-badge warning" style="color: var(--danger); border-color: var(--danger); background: rgba(239,68,68,0.1)"><i class="ph ph-warning"></i> Conflitos (2 no mesmo dia / Excesso / Atestado)</span>';
    } else if (hasWarning) {
        statusHtml = '<span class="status-badge warning"><i class="ph ph-warning"></i> Distribuição Desbalanceada</span>';
    } else {
        statusHtml = '<span class="status-badge success"><i class="ph ph-check-circle"></i> Equilibrado</span>';
    }

    statusElement.innerHTML = statusHtml;

    if (totalUnfilled > 0) {
        statusElement.innerHTML += `<span class="status-badge warning" style="margin-left:8px"><i class="ph ph-users"></i> Faltam ~${missingEmployees} funcionário${missingEmployees !== 1 ? 's' : ''} (${totalUnfilled} vaga${totalUnfilled !== 1 ? 's' : ''})</span>`;
    }
}

function highlightPerson(shiftId, day, personId, className) {
    const dropzone = document.querySelector(`.shift-dropzone[data-shift-id="${shiftId}"][data-day="${day}"]`);
    if (dropzone) {
        const element = dropzone.querySelector(`.scheduled-person[data-person-id="${personId}"]`);
        if (element) element.classList.add(className);
    }
}
