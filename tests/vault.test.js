const PasswordGenerator = require('../client/js/passwordGenerator');
const VaultAnalyzer = require('../client/js/vaultAnalyzer');

describe('PassVault Unit Tests', () => {
    test('PasswordGenerator creates correct length password', () => {
        const pass = PasswordGenerator.generate({ length: 20 });
        expect(pass.length).toBe(20);
    });

    test('VaultAnalyzer rates strong password', () => {
        const res = VaultAnalyzer.evaluatePassword('K9!m#P');
        expect(res.score).toBeGreaterThanOrEqual(4);
    });
});