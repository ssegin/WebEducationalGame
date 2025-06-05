document.addEventListener('DOMContentLoaded', () => {
    // Elements for Event Management
    const eventForm = document.getElementById('eventForm');
    const eventListUL = document.getElementById('eventList');
    const eventStorageKey = 'timelineEvents'; // Using the consistent key for events

    // --- Event Management Functions ---
    function loadEvents() {
        if (!eventListUL) return;
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
            `;
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
        // Query for delete buttons specifically for events, if specific class was used
        const deleteButtons = eventListUL.querySelectorAll('.delete-btn.event-delete-btn');
        deleteButtons.forEach(button => {
            // Simple check to prevent adding multiple listeners if function is called again
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
    loadEvents();
});
