/**
 * attendance.js
 * -------------
 * Handles subject management, attendance tracking, and user session features.
 *
 * Improvements:
 * - Input sanitization to prevent XSS when updating DOM with user-provided data.
 * - Safe localStorage access and validation.
 * - Consistent comments, improved variable naming, and DOM existence checks.
 *
 * SECURITY WARNING: Do NOT use localStorage for sensitive user data (e.g., passwords) in production.
 * TODO: Replace localStorage with secure backend storage for sensitive data in production.
 */

// Helper function to sanitize text for DOM insertion (prevents XSS)
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load subjects from localStorage safely
let subjects = [];
try {
    const stored = localStorage.getItem('subjects');
    if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            subjects = parsed;
        }
    }
} catch (e) {
    subjects = [];
}

/**
 * Updates the subjects table and dropdown based on the current subjects array.
 * Safely attaches event listeners for dynamic elements.
 * Note: All DOM insertions of user-provided data are sanitized.
 */
function updateTable() {
    const tableElem = document.getElementById('subjectTable');
    const subjectSelect = document.getElementById('selectedSubject');
    if (!tableElem || !subjectSelect) return;

    const tableBody = tableElem.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    tableBody.innerHTML = '';
    subjectSelect.innerHTML = '';

    subjects.forEach((subject, index) => {
        const row = tableBody.insertRow();
        // SECURITY: Sanitize user-provided subject names and types
        row.insertCell(0).innerHTML = sanitizeHTML(subject.name);
        row.insertCell(1).innerHTML = sanitizeHTML(subject.type);

        // Total Hours with increment and decrement buttons
        const totalHoursCell = row.insertCell(2);
        totalHoursCell.textContent = '';
        const decTotalBtn = document.createElement('button');
        decTotalBtn.className = 'btn small-btn';
        decTotalBtn.textContent = '-';
        decTotalBtn.addEventListener('click', function() {
            changeTotalHours(index, -1);
        });
        totalHoursCell.appendChild(decTotalBtn);
        totalHoursCell.appendChild(document.createTextNode(` ${subject.totalHours} `));
        const incTotalBtn = document.createElement('button');
        incTotalBtn.className = 'btn small-btn';
        incTotalBtn.textContent = '+';
        incTotalBtn.addEventListener('click', function() {
            changeTotalHours(index, 1);
        });
        totalHoursCell.appendChild(incTotalBtn);

        // Attended Hours with increment and decrement buttons
        const attendedHoursCell = row.insertCell(3);
        attendedHoursCell.textContent = '';
        const decAttBtn = document.createElement('button');
        decAttBtn.className = 'btn small-btn';
        decAttBtn.textContent = '-';
        decAttBtn.addEventListener('click', function() {
            changeAttendedHours(index, -1);
        });
        attendedHoursCell.appendChild(decAttBtn);
        attendedHoursCell.appendChild(document.createTextNode(` ${subject.attendedHours} `));
        const incAttBtn = document.createElement('button');
        incAttBtn.className = 'btn small-btn';
        incAttBtn.textContent = '+';
        incAttBtn.addEventListener('click', function() {
            changeAttendedHours(index, 1);
        });
        attendedHoursCell.appendChild(incAttBtn);

        // Attendance percentage
        row.insertCell(4).textContent = `${isFinite(subject.attendancePercentage) ? subject.attendancePercentage.toFixed(2) : '0.00'}%`;

        // Remove button with confirmation
        const actionsCell = row.insertCell(5);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'btn';
        removeButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove this subject?')) {
                subjects.splice(index, 1);
                localStorage.setItem('subjects', JSON.stringify(subjects));
                updateTable();
                updateOverallAttendance();
            }
        });
        actionsCell.appendChild(removeButton);

        // Populate subject selection dropdown for adding classes
        const option = document.createElement('option');
        option.value = index;
        // SECURITY: Sanitize subject name
        option.innerHTML = sanitizeHTML(subject.name);
        subjectSelect.appendChild(option);
    });

    updateOverallAttendance();
}

/**
 * Adds or updates a subject. Validates input fields for correctness and sanitizes input.
 * - If subject with same name exists, updates its details.
 * - Otherwise, adds a new subject.
 */
function addSubject() {
    const nameElem = document.getElementById('subjectName');
    const typeElem = document.getElementById('subjectType');
    const totalHoursElem = document.getElementById('totalHours');
    const attendedHoursElem = document.getElementById('attendedHours');

    if (!nameElem || !typeElem || !totalHoursElem || !attendedHoursElem) {
        alert('Form is not fully loaded.');
        return;
    }

    const nameRaw = nameElem.value.trim();
    const typeRaw = typeElem.value;
    const totalHoursRaw = totalHoursElem.value;
    const attendedHoursRaw = attendedHoursElem.value;
    // SECURITY: Sanitize all user inputs before DOM insertions
    const name = sanitizeHTML(nameRaw);
    const type = sanitizeHTML(typeRaw);
    const totalHours = Number(totalHoursRaw);
    const attendedHours = Number(attendedHoursRaw);

    if (name === '' || !isFinite(totalHours) || !isFinite(attendedHours) || totalHoursRaw === '' || attendedHoursRaw === '') {
        alert('Please fill in all fields correctly.');
        return;
    }
    if (attendedHours > totalHours) {
        alert('Not valid: Attended hours cannot be more than total hours.');
        return;
    }

    // Check if subject already exists (by sanitized name)
    let existingSubject = subjects.find(subject => subject.name === name);
    if (existingSubject) {
        existingSubject.type = type;
        existingSubject.totalHours = totalHours;
        existingSubject.attendedHours = attendedHours;
        existingSubject.attendancePercentage = totalHours === 0 ? 0 : (attendedHours / totalHours) * 100;
    } else {
        subjects.push({
            name,
            type,
            totalHours,
            attendedHours,
            attendancePercentage: totalHours === 0 ? 0 : (attendedHours / totalHours) * 100
        });
    }

    localStorage.setItem('subjects', JSON.stringify(subjects));
    updateTable();
    const formElem = document.getElementById('subjectForm');
    if (formElem) formElem.reset();
}

/**
 * Changes the attended hours for a subject, ensuring values remain valid.
 * @param {number} index - Index of the subject in the subjects array.
 * @param {number} change - +1 for increment, -1 for decrement.
 */
function changeAttendedHours(index, change) {
    const subject = subjects[index];
    if (!subject) return;
    const increment = change > 0 ? 1.5 : 0.5;
    let newValue = subject.attendedHours + (increment * change);
    newValue = Math.max(0, newValue);

    if (newValue > subject.totalHours) {
        alert('Not valid: Attended hours cannot be more than total hours.');
        return;
    }
    subject.attendedHours = newValue;
    subject.attendancePercentage = subject.totalHours === 0 ? 0 : (subject.attendedHours / subject.totalHours) * 100;
    localStorage.setItem('subjects', JSON.stringify(subjects));
    updateTable();
}

/**
 * Changes the total hours for a subject, ensuring values remain valid.
 * @param {number} index - Index of the subject in the subjects array.
 * @param {number} change - +1 for increment, -1 for decrement.
 */
function changeTotalHours(index, change) {
    const subject = subjects[index];
    if (!subject) return;
    const increment = change > 0 ? 1.5 : 0.5;
    let newValue = subject.totalHours + (increment * change);
    newValue = Math.max(0, newValue);
    if (subject.attendedHours > newValue) {
        alert('Not valid: Attended hours cannot be more than total hours.');
        return;
    }
    subject.totalHours = newValue;
    subject.attendancePercentage = subject.totalHours === 0 ? 0 : (subject.attendedHours / subject.totalHours) * 100;
    localStorage.setItem('subjects', JSON.stringify(subjects));
    updateTable();
}

/**
 * Adds a class to the selected subject, adjusting total hours based on subject type.
 * Validates inputs for correctness.
 *
 * Note: For labs, class duration is 2 hours. For theory, 1.5 hours.
 */
function addClass() {
    const subjectSelectElem = document.getElementById('selectedSubject');
    const classDateElem = document.getElementById('classDate');
    if (!subjectSelectElem || !classDateElem) {
        alert('Class form is not fully loaded.');
        return;
    }
    const subjectIndexRaw = subjectSelectElem.value;
    const subjectIndex = Number(subjectIndexRaw);
    const classDate = classDateElem.value;

    if (!isFinite(subjectIndex) || subjectIndexRaw === '' || !classDate) {
        alert('Please select a subject and enter a class date.');
        return;
    }

    const subject = subjects[subjectIndex];
    if (!subject) {
        alert('Selected subject is invalid.');
        return;
    }

    // Adjust hours based on subject type (theory or lab)
    let classDuration = subject.type === 'lab' ? 2 : 1.5;
    if (!isFinite(classDuration) || classDuration <= 0) classDuration = 1.5;
    subject.totalHours += classDuration;
    subject.attendancePercentage = subject.totalHours === 0 ? 0 : (subject.attendedHours / subject.totalHours) * 100;

    localStorage.setItem('subjects', JSON.stringify(subjects));
    updateTable();
    const classFormElem = document.getElementById('classForm');
    const addClassSection = document.getElementById('addClassSection');
    if (classFormElem) classFormElem.reset();
    if (addClassSection) addClassSection.style.display = 'none';
}

/**
 * Updates the overall attendance percentage based on all subjects.
 */
function updateOverallAttendance() {
    const elem = document.getElementById('overallAttendance');
    if (!elem) return;
    const totalHours = subjects.reduce((sum, subject) => sum + (isFinite(subject.totalHours) ? subject.totalHours : 0), 0);
    const totalAttended = subjects.reduce((sum, subject) => sum + (isFinite(subject.attendedHours) ? subject.attendedHours : 0), 0);
    const overallPercentage = totalHours > 0 ? (totalAttended / totalHours) * 100 : 0;
    elem.textContent = `${overallPercentage.toFixed(2)}%`;
}

/**
 * Handles Enter key navigation in the subject form inputs.
 * Moves focus to the next input, or submits the form.
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const inputs = Array.from(document.querySelectorAll('#subjectForm input'));
        const currentIndex = inputs.indexOf(event.target);
        const nextIndex = currentIndex + 1;
        if (nextIndex < inputs.length) {
            inputs[nextIndex].focus();
        } else {
            addSubject();
        }
    }
}

// Attach keydown event listeners to input fields (only once on DOMContentLoaded for safety)
document.addEventListener('DOMContentLoaded', function() {
    const subjectName = document.getElementById('subjectName');
    const totalHours = document.getElementById('totalHours');
    const attendedHours = document.getElementById('attendedHours');
    if (subjectName) subjectName.addEventListener('keydown', handleEnterKey);
    if (totalHours) totalHours.addEventListener('keydown', handleEnterKey);
    if (attendedHours) attendedHours.addEventListener('keydown', handleEnterKey);
});

// Initialize the table and welcome text on page load
document.addEventListener('DOMContentLoaded', updateTable);
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        // SECURITY: Sanitize username before DOM insertion
        if (username) {
            welcomeMessage.innerHTML = sanitizeHTML(`Welcome, ${username}`);
        } else {
            welcomeMessage.textContent = 'Welcome!';
        }
    }
});

/**
 * Logs the user out, removes username from localStorage, and redirects to login page.
 */
function logout() {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// NOTE: <marquee> is deprecated in HTML. Consider replacing with CSS/JS animations in future.
