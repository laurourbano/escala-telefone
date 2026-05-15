function isPersonUnavailable(person, dateStr) {
    if (person.status === 'disponivel') return false;
    if (person.unavailabilityStart && person.unavailabilityEnd) {
        return dateStr >= person.unavailabilityStart && dateStr <= person.unavailabilityEnd;
    } else if (person.unavailabilityStart) {
        return dateStr >= person.unavailabilityStart;
    } else if (person.unavailabilityEnd) {
        return dateStr <= person.unavailabilityEnd;
    }
    return true;
}
