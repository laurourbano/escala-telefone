const { toTitleCase, generateEmail, calculateDefaultEndDate, getFirstName } = require('./frontend/shared/utils');
const fs = require('fs');
const path = require('path');

function loadBrowserFunction(relativePath, functionName) {
    const code = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
    return eval(`${code}\n${functionName};`);
}

describe('EscalaAI Logic Tests', () => {
    test('toTitleCase should format names correctly', () => {
        expect(toTitleCase('LAURO URBANO')).toBe('Lauro Urbano');
        expect(toTitleCase('lauro urbano')).toBe('Lauro Urbano');
    });

    test('generateEmail should format institutional emails correctly', () => {
        expect(generateEmail('Lauro Urbano')).toBe('lauro.urbano@crf-pr.org.br');
        expect(generateEmail('Lauro')).toBe('lauro@crf-pr.org.br');
    });

    test('getFirstName should extract the first name correctly', () => {
        expect(getFirstName('Lauro Urbano')).toBe('Lauro');
        expect(getFirstName('João da Silva')).toBe('João');
    });

    test('calculateDefaultEndDate should return 5 business days range', () => {
        expect(calculateDefaultEndDate('2026-05-11')).toBe('2026-05-15');
    });

    test('acceptSwap should exchange employees between scheduled shifts', () => {
        const acceptSwap = loadBrowserFunction('./frontend/services/notifications/acceptSwap.js', 'acceptSwap');

        global.state = {
            currentUser: { id: 'person-b' },
            notifications: [{
                id: 'notif-1',
                fromId: 'person-a',
                toId: 'person-b',
                myShiftId: 'shift-morning',
                myDate: '2026-05-11',
                targetShiftId: 'shift-night',
                targetDate: '2026-05-12',
                status: 'pending'
            }],
            schedule: {
                'shift-morning-2026-05-11': ['person-a'],
                'shift-night-2026-05-12': ['person-b']
            }
        };
        global.saveState = jest.fn();
        global.renderNotifications = jest.fn();
        global.updateNotificationBadge = jest.fn();
        global.renderPersonalSchedule = jest.fn();
        global.renderScheduleBoard = jest.fn();
        global.showToast = jest.fn();
        global.hasScheduleConflict = jest.fn(() => false);

        acceptSwap('notif-1');

        expect(global.state.schedule['shift-morning-2026-05-11']).toEqual(['person-b']);
        expect(global.state.schedule['shift-night-2026-05-12']).toEqual(['person-a']);
        expect(global.state.notifications[0].status).toBe('accepted');
    });

    test('acceptSwap should block swaps with schedule conflicts', () => {
        const acceptSwap = loadBrowserFunction('./frontend/services/notifications/acceptSwap.js', 'acceptSwap');

        global.state = {
            currentUser: { id: 'person-b' },
            notifications: [{
                id: 'notif-1',
                fromId: 'person-a',
                toId: 'person-b',
                myShiftId: 'shift-morning',
                myDate: '2026-05-11',
                targetShiftId: 'shift-night',
                targetDate: '2026-05-12',
                status: 'pending'
            }],
            schedule: {
                'shift-morning-2026-05-11': ['person-a'],
                'shift-night-2026-05-12': ['person-b']
            }
        };
        global.saveState = jest.fn();
        global.showToast = jest.fn();
        global.hasScheduleConflict = jest.fn(() => true);

        acceptSwap('notif-1');

        expect(global.state.schedule['shift-morning-2026-05-11']).toEqual(['person-a']);
        expect(global.state.schedule['shift-night-2026-05-12']).toEqual(['person-b']);
        expect(global.state.notifications[0].status).toBe('pending');
        expect(global.showToast).toHaveBeenCalledWith(expect.stringContaining('bloqueada'), 'error');
    });
});
