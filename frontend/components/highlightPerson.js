function highlightPerson(shiftId, day, personId, className) {
    var dropzone = document.querySelector('.shift-dropzone[data-shift-id="' + shiftId + '"][data-day="' + day + '"]');
    if (dropzone) {
        var element = dropzone.querySelector('.scheduled-person[data-person-id="' + personId + '"]');
        if (element) element.classList.add(className);
    }
}
