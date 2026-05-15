let state = {
    people: JSON.parse(localStorage.getItem('escala_people')) || [],
    shifts: JSON.parse(localStorage.getItem('escala_shifts')) || [],
    schedule: JSON.parse(localStorage.getItem('escala_schedule')) || {},
    config: JSON.parse(localStorage.getItem('escala_config')) || { 
        apiKey: '', 
        openrouterKey: '', 
        openrouterModel: 'meta-llama/llama-4-maverick-17b-128e-instruct', 
        geminiKey: '', 
        provider: 'openrouter', 
        serverUrl: 'https://escalai-backend.onrender.com', 
        serverToken: '' 
    },
    scheduleStartDate: localStorage.getItem('escala_start_date') || '',
    scheduleEndDate: localStorage.getItem('escala_end_date') || '',
    closedDates: JSON.parse(localStorage.getItem('escala_closed_dates')) || [],
    currentUser: JSON.parse(localStorage.getItem('escala_current_user')) || null,
    notifications: JSON.parse(localStorage.getItem('escala_notifications')) || [],
    lastSchedule: JSON.parse(localStorage.getItem('escala_last_schedule')) || {},
    shiftCounts: JSON.parse(localStorage.getItem('escala_shift_counts')) || {},
    needsSync: localStorage.getItem('escala_needs_sync') === 'true' || false
};

if (state.people.length === 0 && state.shifts.length === 0) {
    state.people = [
        { id: 'p-admin', name: 'Admin', status: 'disponivel', maxShifts: 4, preferredShifts: [], password: '3820', isAdmin: true, unavailabilityStart: '', unavailabilityEnd: '' }
    ];
    state.shifts = [
        { id: 's-manha', name: 'Manhã', time: '08:00-12:00', capacity: 2 },
        { id: 's-tarde', name: 'Tarde', time: '13:00-17:00', capacity: 2 },
        { id: 's-noite', name: 'Noite', time: '18:00-22:00', capacity: 1 }
    ];
}

state.people.forEach(person => {
    if (!person.password) person.password = '3820';
    if (person.isAdmin === undefined) person.isAdmin = false;
    if (person.status === 'disponivel') {
        person.unavailabilityStart = '';
        person.unavailabilityEnd = '';
    }
});

if (!state.scheduleStartDate) {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    state.scheduleStartDate = nextMonday.toISOString().split('T')[0];
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    state.scheduleEndDate = nextFriday.toISOString().split('T')[0];
}

if (Object.keys(state.schedule).length > 0) {
    const firstKey = Object.keys(state.schedule)[0];
    if (firstKey.includes('-Segunda')) {
        state.schedule = {};
    }
}
