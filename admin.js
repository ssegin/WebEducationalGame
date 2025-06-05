document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('eventForm');
    const eventListUL = document.getElementById('eventList');
    const storageKey = 'timelineEvents';

    // Load events from local storage and display them
    function loadEvents() {
        const events = getEventsFromStorage();
        eventListUL.innerHTML = ''; // Clear current list

        if (events.length === 0) {
            eventListUL.innerHTML = '<li>No events yet.</li>';
            return;
        }

        events.forEach((event, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><strong>${event.year} AD:</strong> ${event.description}</span>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            eventListUL.appendChild(listItem);
        });
        addDeleteButtonListeners();
    }

    // Get events from local storage
    function getEventsFromStorage() {
        const eventsJson = localStorage.getItem(storageKey);
        return eventsJson ? JSON.parse(eventsJson) : [];
    }

    // Save events to local storage
    function saveEventsToStorage(events) {
        localStorage.setItem(storageKey, JSON.stringify(events));
    }

    // Handle form submission
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

        // Optional: Sort events by year before saving
        events.sort((a, b) => a.year - b.year);

        saveEventsToStorage(events);

        loadEvents(); // Reload the list
        eventForm.reset(); // Reset the form
    });

    // Add event listeners to delete buttons
    function addDeleteButtonListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToDelete = parseInt(e.target.getAttribute('data-index'));
                deleteEvent(indexToDelete);
            });
        });
    }

    // Delete an event
    function deleteEvent(index) {
        const events = getEventsFromStorage();
        if (index >= 0 && index < events.length) {
            events.splice(index, 1);
            saveEventsToStorage(events);
            loadEvents(); // Reload the list
        }
    }

    // Initial load of events when the page is ready
    loadEvents();
});
