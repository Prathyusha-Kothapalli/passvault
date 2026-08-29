class VaultAnalyzer {
    static evaluatePassword(password) {
        if (!password) return { score: 0, label: 'Empty' };
        let score = 0;
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return { score, label: labels[score] || 'Strong' };
    }
}
if (typeof module !== 'undefined') module.exports = VaultAnalyzer;