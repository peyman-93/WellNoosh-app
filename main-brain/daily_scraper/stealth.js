// stealth.js - Anti-detection script for web scraping

(() => {
    // Remove webdriver property
    if (navigator.webdriver) {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    }

    // Patch Chrome runtime
    if (window.chrome) {
        const original_csi = window.chrome.csi;
        if (original_csi) {
            window.chrome.csi = function() {
                if (arguments.length === 0) {
                    return original_csi.apply(this);
                }
                return;
            };
        }
    }

    // Override Function.prototype.toString
    const original_toString = Function.prototype.toString;
    Function.prototype.toString = function() {
        if (this === navigator.permissions.query) {
            return "function query() { [native code] }";
        }
        if (this === navigator.languages) {
            return "function languages() { [native code] }";
        }
        return original_toString.apply(this, arguments);
    };

    // Patch various detection methods
    const original_apply = Reflect.apply;
    Reflect.apply = function(target, thisArg, argumentsList) {
        if (target === navigator.plugins.refresh) {
            return;
        }
        return original_apply(target, thisArg, argumentsList);
    };

    // Randomize fingerprint-related functions
    const original_random = Math.random;
    Math.random = function() {
        const stack = new Error().stack;
        if (stack && (stack.includes('fingerprint') || stack.includes('canvas'))) {
            return 0.4 + original_random() * 0.2;
        }
        return original_random.apply(this, arguments);
    };

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
        get: function() {
            return ['en-US', 'en'];
        }
    });

    console.log('🥷 Stealth mode activated');
})();