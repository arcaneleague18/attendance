/*
 * attendance.js
 * -------------
 * Handles subject management, attendance tracking, and user session features.
 * Improvements: safer event handling, localStorage validation, code documentation, security, and maintainability.
 */

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
 */
function updateTable() {
    const tableBody = document.getElementById('subjectTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    const subjectSelect = document.getElementById('selectedSubject');
    subjectSelect.innerHTML = '';

    subjects.forEach((subject, index) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = subject.name;
        row.insertCell(1).textContent = subject.type;

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
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });

    updateOverallAttendance();
}

/**
 * Adds or updates a subject. Validates input fields for correctness.
 */
function addSubject() {
    const name = document.getElementById('subjectName').value.trim();
    const type = document.getElementById('subjectType').value;
    const totalHoursRaw = document.getElementById('totalHours').value;
    const attendedHoursRaw = document.getElementById('attendedHours').value;
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
    document.getElementById('subjectForm').reset();
}

/**
 * Changes the attended hours for a subject, ensuring values remain valid.
 * @param {number} index - Index of the subject in the subjects array.
 * @param {number} change - +1 for increment, -1 for decrement.
 */
function changeAttendedHours(index, change) {
    const subject = subjects[index];
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
 */
function addClass() {
    const subjectIndexRaw = document.getElementById('selectedSubject').value;
    const subjectIndex = Number(subjectIndexRaw);
    const classDate = document.getElementById('classDate').value;

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
    document.getElementById('classForm').reset();
    document.getElementById('addClassSection').style.display = 'none';
}

/**
 * Updates the overall attendance percentage based on all subjects.
 */
function updateOverallAttendance() {
    const totalHours = subjects.reduce((sum, subject) => sum + (isFinite(subject.totalHours) ? subject.totalHours : 0), 0);
    const totalAttended = subjects.reduce((sum, subject) => sum + (isFinite(subject.attendedHours) ? subject.attendedHours : 0), 0);
    const overallPercentage = totalHours > 0 ? (totalAttended / totalHours) * 100 : 0;
    document.getElementById('overallAttendance').textContent = `${overallPercentage.toFixed(2)}%`;
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
    document.getElementById('subjectName').addEventListener('keydown', handleEnterKey);
    document.getElementById('totalHours').addEventListener('keydown', handleEnterKey);
    document.getElementById('attendedHours').addEventListener('keydown', handleEnterKey);
});

// Initialize the table and welcome text on page load
document.addEventListener('DOMContentLoaded', updateTable);
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (username) {
        welcomeMessage.textContent = `Welcome, ${username}`;
    } else {
        welcomeMessage.textContent = 'Welcome!';
    }
});

/**
 * Logs the user out, removes username from localStorage, and redirects to login page.
 */
function logout() {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
