let state = {
    people: [],
    shifts: [],
    schedule: {},
    config: {
        apiKey: '',
        openrouterKey: '',
        openrouterModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        geminiKey: '',
        provider: 'openrouter',
        serverUrl: 'https://escalai-backend.onrender.com',
        serverToken: ''
    },
    scheduleStartDate: '',
    scheduleEndDate: '',
    closedDates: [],
    currentUser: null,
    notifications: [],
    lastSchedule: {},
    shiftCounts: {},
    needsSync: false
};

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
