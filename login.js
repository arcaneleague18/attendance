/**
 * login.js
 * --------
 * Handles login form submission, credential validation against localStorage,
 * user session, and safe user message display.
 *
 * SECURITY: Do NOT store sensitive passwords in localStorage in production!
 * TODO: Replace password storage with secure authentication for production use.
 */

// Helper function to sanitize text to prevent XSS
function sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Attach submit event handler to login form.
 * Prevents default submission and triggers login logic.
 */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission to handle login via JavaScript
        login();
    });
}

/**
 * Handles the login process: validates input, checks credentials against localStorage,
 * displays sanitized messages, and redirects on success.
 *
 * SECURITY: Only safe to use in a demo environment. In production, never store passwords in localStorage.
 */
function login() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const messageElem = document.getElementById('message');

    if (!usernameInput || !passwordInput || !messageElem) {
        // Required elements not found; cannot proceed.
        return;
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
        users = JSON.parse(localStorage.getItem('users')) || [];
    } catch (e) {
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
