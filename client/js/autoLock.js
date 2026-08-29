class AutoLock {
    constructor(timeoutMinutes = 5, onLockCallback) {
        this.timeoutMs = timeoutMinutes * 60 * 1000;
        this.onLock = onLockCallback;
        this.timer = null;
    }
    resetTimer() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.onLock) this.onLock();
        }, this.timeoutMs);
    }
}
if (typeof module !== 'undefined') module.exports = AutoLock;