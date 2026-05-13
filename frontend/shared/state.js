const generateId = () => Math.random().toString(36).substr(2, 9);

let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { apiKey: '', openrouterKey: '', openrouterModel: 'google/gemini-2.0-flash-exp', geminiKey: '', provider: 'openrouter', serverUrl: 'http://localhost:3001', serverToken: '' },
    scheduleStartDate: localStorage.getItem('escala_start_date') || '',
    scheduleEndDate: localStorage.getItem('escala_end_date') || '',
    closedDates: JSON.parse(localStorage.getItem('escala_closed_dates')) || [],
    currentUser: JSON.parse(localStorage.getItem('escala_current_user')) || null,
    notifications: JSON.parse(localStorage.getItem('escala_notifications')) || [],
    lastSchedule: JSON.parse(localStorage.getItem('escala_last_schedule')) || {},
    shiftCounts: JSON.parse(localStorage.getItem('escala_shift_counts')) || {}
};

function saveState() {
    localStorage.setItem('escala_people', JSON.stringify(state.people));
    localStorage.setItem('escala_shifts', JSON.stringify(state.shifts));
    localStorage.setItem('escala_schedule', JSON.stringify(state.schedule));
    localStorage.setItem('escala_config', JSON.stringify(state.config));
    localStorage.setItem('escala_start_date', state.scheduleStartDate);
    localStorage.setItem('escala_end_date', state.scheduleEndDate);
    localStorage.setItem('escala_closed_dates', JSON.stringify(state.closedDates));
    localStorage.setItem('escala_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('escala_last_schedule', JSON.stringify(state.lastSchedule));
    localStorage.setItem('escala_shift_counts', JSON.stringify(state.shiftCounts));
}

// Ensure defaults
state.people.forEach(person => {
    if (!person.password) person.password = '3820';
    if (person.isAdmin === undefined) person.isAdmin = false;
    if (person.status === 'disponivel') {
        person.unavailabilityStart = '';
        person.unavailabilityEnd = '';
    }
});
saveState();

if (!state.scheduleStartDate) {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    state.scheduleStartDate = nextMonday.toISOString().split('T')[0];
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    state.scheduleEndDate = nextFriday.toISOString().split('T')[0];
}

// Migration check for old schedule format
if (Object.keys(state.schedule).length > 0) {
    const firstKey = Object.keys(state.schedule)[0];
    if (firstKey.includes('-Segunda')) {
        state.schedule = {};
    }
}
