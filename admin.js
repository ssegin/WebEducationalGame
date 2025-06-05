document.addEventListener('DOMContentLoaded', () => {
    // Elements for Event Management
    const eventForm = document.getElementById('eventForm');
    const eventListUL = document.getElementById('eventList');
    const eventStorageKey = 'timelineEvents'; // Renamed for clarity

    // Elements for Period Management
    const periodForm = document.getElementById('periodForm');
    const periodListUL = document.getElementById('periodList');
    const periodStorageKey = 'timelinePeriods';

    // --- Period Management Functions ---
    function loadPeriods() {
        if (!periodListUL) return; // In case the element is not on the page
        const periods = getPeriodsFromStorage();
        periodListUL.innerHTML = '';

        if (periods.length === 0) {
            periodListUL.innerHTML = '<li>No periods defined yet.</li>';
            return;
        }

        periods.forEach((period, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><strong>${period.name}</strong> (${period.startYear} to ${period.endYear})</span>
                <button class="delete-btn period-delete-btn" data-index="${index}">Delete Period</button>
            `;
            periodListUL.appendChild(listItem);
        });
        addDeletePeriodButtonListeners();
    }

    function getPeriodsFromStorage() {
        const periodsJson = localStorage.getItem(periodStorageKey);
        return periodsJson ? JSON.parse(periodsJson) : [];
    }

    function savePeriodsToStorage(periods) {
        localStorage.setItem(periodStorageKey, JSON.stringify(periods));
    }

    if (periodForm) {
        periodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('periodName');
            const startYearInput = document.getElementById('periodStartYear');
            const endYearInput = document.getElementById('periodEndYear');

            const name = nameInput.value.trim();
            const startYear = parseInt(startYearInput.value);
            const endYear = parseInt(endYearInput.value);

            if (name === '' || isNaN(startYear) || isNaN(endYear)) {
                alert('Please enter a valid name and start/end years for the period.');
                return;
            }
            if (startYear > endYear) {
                alert('Start year cannot be after end year.');
                return;
            }

            const newPeriod = { name, startYear, endYear };
            const periods = getPeriodsFromStorage();
            periods.push(newPeriod);
            periods.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);

            savePeriodsToStorage(periods);
            loadPeriods();
            periodForm.reset();
        });
    }

    function addDeletePeriodButtonListeners() {
        if (!periodListUL) return;
        const deleteButtons = periodListUL.querySelectorAll('.delete-btn.period-delete-btn');
        deleteButtons.forEach(button => {
            if (button.dataset.listenerAttached === 'true') return;
            button.addEventListener('click', (e) => {
                const indexToDelete = parseInt(e.target.getAttribute('data-index'));
                deletePeriod(indexToDelete);
            });
            button.dataset.listenerAttached = 'true';
        });
    }

    function deletePeriod(index) {
        const periods = getPeriodsFromStorage();
        if (index >= 0 && index < periods.length) {
            periods.splice(index, 1);
            savePeriodsToStorage(periods);
            loadPeriods();
        }
    }

    // --- Event Management Functions (largely existing logic) ---
    function loadEvents() {
        if (!eventListUL) return; // In case the element is not on the page
        const events = getEventsFromStorage();
        eventListUL.innerHTML = '';

        if (events.length === 0) {
            eventListUL.innerHTML = '<li>No events yet.</li>';
            return;
        }

        events.forEach((event, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><strong>${event.year} AD:</strong> ${event.description}</span>
                <button class="delete-btn event-delete-btn" data-index="${index}">Delete Event</button>
            `; // Added 'event-delete-btn' for clarity
            eventListUL.appendChild(listItem);
        });
        addDeleteEventButtonListeners();
    }

    function getEventsFromStorage() {
        const eventsJson = localStorage.getItem(eventStorageKey);
        return eventsJson ? JSON.parse(eventsJson) : [];
    }

    function saveEventsToStorage(events) {
        localStorage.setItem(eventStorageKey, JSON.stringify(events));
    }

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const yearInput = document.getElementById('eventYear');
            const descriptionInput = document.getElementById('eventDescription');

            const year = parseInt(yearInput.value);
            const description = descriptionInput.value.trim();

            if (isNaN(year) || description === '') {
                alert('Please enter a valid year and description.');
                return;
            }

            const newEvent = { year, description };
            const events = getEventsFromStorage();
            events.push(newEvent);
            events.sort((a, b) => a.year - b.year);

            saveEventsToStorage(events);
            loadEvents();
            eventForm.reset();
        });
    }

    function addDeleteEventButtonListeners() {
        if (!eventListUL) return;
        const deleteButtons = eventListUL.querySelectorAll('.delete-btn.event-delete-btn');
        deleteButtons.forEach(button => {
            if (button.dataset.listenerAttached === 'true') return;
            button.addEventListener('click', (e) => {
                const indexToDelete = parseInt(e.target.getAttribute('data-index'));
                deleteEvent(indexToDelete);
            });
            button.dataset.listenerAttached = 'true';
        });
    }

    function deleteEvent(index) {
        const events = getEventsFromStorage();
        if (index >= 0 && index < events.length) {
            events.splice(index, 1);
            saveEventsToStorage(events);
            loadEvents();
        }
    }

    // Initial load when the page is ready
    loadPeriods();
    loadEvents();
});
