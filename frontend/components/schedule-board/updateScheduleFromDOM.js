function updateScheduleFromDOM() {
    var dropzones = document.querySelectorAll('.shift-dropzone');
    dropzones.forEach(function (dropzone) {
        var shiftId = dropzone.dataset.shiftId;
        var day = dropzone.dataset.day;
        var dayKey = shiftId + '-' + day;
        var peopleIds = Array.from(dropzone.children).map(function (child) { return child.dataset.personId; });
        state.schedule[dayKey] = peopleIds;
    });
    saveState();
    validateSchedule();
    var selectedPersonId = document.getElementById('select-person-schedule').value;
    if (selectedPersonId) {
        renderPersonalSchedule(selectedPersonId);
    }
}
