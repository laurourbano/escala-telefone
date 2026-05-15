function isAdmin() {
    if (!state.currentUser) return false;
    if (generateEmail(state.currentUser.name) === 'lauro.urbano@crf-pr.org.br') return true;
    return state.currentUser.isAdmin === true;
}
