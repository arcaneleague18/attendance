/**
 * login.js
 * --------
 * Handles login form submission, credential validation against localStorage,
 * user session, and safe user message display.
 *
 * SECURITY: Do NOT store sensitive passwords in localStorage in production!
 * TODO: Replace password storage with secure authentication for production use.
 */

/**
 * Sanitizes a string for safe DOM insertion to prevent XSS attacks.
 * @param {string} text - The text to sanitize.
 * @returns {string} Sanitized HTML string.
 */
function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handles the login process: validates input, checks credentials against localStorage,
 * displays sanitized messages, and redirects on success.
 *
 * SECURITY: Only safe to use in a demo environment. In production, never store passwords in localStorage.
 * @returns {void}
 */
function login() {
    /**
     * Ensure #username is of type "text" and #password is of type "password" for accessibility/security.
     * This runtime check ensures that even if the HTML is misconfigured, we enforce expected types here.
     * It does NOT guarantee security, but is a good hardening step.
     */
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageElem = document.getElementById('message');

    if (!usernameInput || !passwordInput || !messageElem) {
        // Required elements not found; cannot proceed.
        return;
    }

    // Defensive: Enforce correct input types for security/accessibility
    if (usernameInput.type !== 'text') {
        usernameInput.type = 'text';
    }
    if (passwordInput.type !== 'password') {
        passwordInput.type = 'password';
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous messages
    messageElem.textContent = '';

    if (username === '' || password === '') {
        // Use .innerHTML with sanitized text (safe)
        messageElem.innerHTML = sanitize('Please enter both username and password.');
        return;
    }

    // Check credentials in localStorage (NOT recommended for production)
    let users = [];
    try {
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
            users = JSON.parse(usersStr);
            if (!Array.isArray(users)) {
                users = [];
            }
        }
    } catch (e) {
        // Optionally log error for debugging (never expose sensitive info to users)
        // console.error('Failed to parse users from localStorage:', e);
        users = [];
    }
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        // Store the username and redirect (try-catch to be robust against quota errors)
        try {
            localStorage.setItem('username', username);
        } catch (e) {
            // Could not save to localStorage (possibly quota exceeded)
            messageElem.innerHTML = sanitize('Unable to complete login. Please try again.');
            return;
        }
        window.location.href = 'attendance.html'; // Update with your actual tracker page URL
    } else {
        // Use .innerHTML with sanitized text (safe)
        messageElem.innerHTML = sanitize('Invalid username or password.');
    }
}

/**
 * Attaches submit event handler to the login form.
 * Prevents default submission and triggers login logic.
 * This block runs immediately when login.js is loaded.
 *
 * TODO: Add unit tests for login form event and credential validation logic.
 */
(function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission to handle login via JavaScript
            login();
        });
    }
    // Accessibility: Focus username input on page load if available
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }
})();
