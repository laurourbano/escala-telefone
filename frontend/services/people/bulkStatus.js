function openBulkStatusModal() {
    const container = document.getElementById('bulk-status-list');
    container.innerHTML = '';
    
    // Create rows for each person
    const people = [...state.people].sort((a, b) => a.name.localeCompare(b.name));
    
    let html = '';
    people.forEach(p => {
        const isDisponivel = p.status === 'disponivel';
        const isFolga = p.status === 'folga';
        const isFerias = p.status === 'ferias';
        const isAtestado = p.status === 'atestado';
        
        // Use default 'disponivel' if they are something else like 'indisponivel' unless we want to map it
        const finalDisponivel = isDisponivel || (!isFolga && !isFerias && !isAtestado);

        html += `
            <div class="bulk-status-row" data-id="${p.id}" style="display: grid; grid-template-columns: 2fr 3.5fr 1fr 1fr; gap: 0.5rem; align-items: center; background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px;">
                <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${getFirstName(p.name)}</div>
                
                <div class="radio-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <label class="checkbox-label" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;"><input type="radio" name="status-${p.id}" value="disponivel" ${finalDisponivel ? 'checked' : ''}> Disponível</label>
                    <label class="checkbox-label" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;"><input type="radio" name="status-${p.id}" value="folga" ${isFolga ? 'checked' : ''}> Folga</label>
                    <label class="checkbox-label" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;"><input type="radio" name="status-${p.id}" value="ferias" ${isFerias ? 'checked' : ''}> Férias</label>
                    <label class="checkbox-label" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;"><input type="radio" name="status-${p.id}" value="atestado" ${isAtestado ? 'checked' : ''}> Atestado</label>
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <input type="date" class="bulk-start date-input" value="${p.unavailabilityStart || ''}" placeholder="Início" title="Data de Início" style="padding: 0.4rem; font-size: 0.8rem;">
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <input type="date" class="bulk-end date-input" value="${p.unavailabilityEnd || ''}" placeholder="Fim" title="Data de Fim" style="padding: 0.4rem; font-size: 0.8rem;">
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners to radio buttons to clear dates if disponivel is selected
    const rows = container.querySelectorAll('.bulk-status-row');
    rows.forEach(row => {
        const radios = row.querySelectorAll('input[type="radio"]');
        const startInput = row.querySelector('.bulk-start');
        const endInput = row.querySelector('.bulk-end');
        
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'disponivel') {
                    startInput.value = '';
                    endInput.value = '';
                }
            });
        });
    });
    
    document.getElementById('modal-bulk-status').classList.add('active');
}

function saveBulkStatus() {
    const container = document.getElementById('bulk-status-list');
    const rows = container.querySelectorAll('.bulk-status-row');
    
    let updatedCount = 0;
    
    rows.forEach(row => {
        const id = row.getAttribute('data-id');
        const statusEl = row.querySelector('input[type="radio"]:checked');
        if (!statusEl) return;
        
        const status = statusEl.value;
        const start = row.querySelector('.bulk-start').value;
        const end = row.querySelector('.bulk-end').value;
        
        const personIndex = state.people.findIndex(p => p.id === id);
        if (personIndex !== -1) {
            const p = state.people[personIndex];
            
            // Check if there are changes
            if (p.status !== status || p.unavailabilityStart !== start || p.unavailabilityEnd !== end) {
                // If they have 0 maxShifts or no preferredShifts, and we try to make them 'disponivel', 
                // the system logic in savePerson usually forces them to 'indisponivel'. 
                // We'll let them update, and if maxShifts=0 they will just have 'disponivel' but won't get shifts anyway.
                // It's better to respect the user's explicit bulk action.
                
                p.status = status;
                if (status === 'disponivel') {
                    p.unavailabilityStart = '';
                    p.unavailabilityEnd = '';
                } else {
                    p.unavailabilityStart = start;
                    p.unavailabilityEnd = end;
                }
                updatedCount++;
            }
        }
    });
    
    if (updatedCount > 0) {
        saveState();
        renderPeople();
        showToast(`${updatedCount} pessoas atualizadas com sucesso!`, 'success');
    }
    
    document.getElementById('modal-bulk-status').classList.remove('active');
}
