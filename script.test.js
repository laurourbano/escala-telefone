const { toTitleCase, generateEmail, calculateDefaultEndDate, getFirstName } = require('./script');

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
        // Monday -> Friday
        expect(calculateDefaultEndDate('2026-05-11')).toBe('2026-05-15');
    });
});
