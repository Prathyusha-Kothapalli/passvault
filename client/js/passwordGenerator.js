class PasswordGenerator {
    static generate(options = {}) {
        const length = options.length || 16;
        const useSymbols = options.symbols !== false;
        const useNumbers = options.numbers !== false;
        
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (useNumbers) chars += '0123456789';
        if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
if (typeof module !== 'undefined') module.exports = PasswordGenerator;