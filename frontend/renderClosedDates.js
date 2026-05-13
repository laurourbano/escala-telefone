function renderClosedDates() {
    closedDatesList.innerHTML = state.closedDates.map(function (date) {
        return '\
            <div class="badge" style="background: var(--bg-card-hover); border: 1px solid var(--border); color: var(--text-main); display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; padding: 0.25rem 0.5rem;">\
                ' + formatDate(date) + '\
                <button onclick="removeClosedDate(\'' + date + '\')" style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 0; line-height: 1;"><i class="ph ph-x"></i></button>\
            </div>\
        ';
    }).join('');
}
