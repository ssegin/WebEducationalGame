document.addEventListener('DOMContentLoaded', () => {
    // Elements for Event Management
    const eventForm = document.getElementById('eventForm');
    const eventListUL = document.getElementById('eventList');
    const eventStorageKey = 'timelineEvents'; // Using the consistent key for events
    let editingEventIndex = null; // null indicates 'add mode', a number indicates 'edit mode' for that event index

    const eventFormHeading = document.getElementById('eventFormHeading');
    const saveEventButton = document.getElementById('saveEventButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    // Input fields will be fetched inside functions where they are needed or can be made global too
    // const yearInput = document.getElementById('eventYear');
    // const descriptionInput = document.getElementById('eventDescription');
    // const tagsInput = document.getElementById('eventTags');

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
            let eventHtml = `<span><strong>${event.year} AD:</strong> ${event.description}`;
            if (event.tags && event.tags.length > 0) {
                eventHtml += `<br><small><em>Tags: ${event.tags.join(', ')}</em></small>`;
            }
            eventHtml += `</span>`;

            listItem.innerHTML = `
                ${eventHtml}
                <div>
                    <button class="edit-btn event-edit-btn" data-index="${index}" style="margin-right: 5px;">Edit</button>
                    <button class="delete-btn event-delete-btn" data-index="${index}">Delete</button>
                </div>
            `;
            eventListUL.appendChild(listItem);
        });
        addDeleteEventButtonListeners();
        addEditEventButtonListeners(); // Call the new function
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
            const tagsInput = document.getElementById('eventTags');

            const year = parseInt(yearInput.value);
            const description = descriptionInput.value.trim();
            const tagsString = tagsInput.value.trim();
            const tags = tagsString === '' ? [] : tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            if (isNaN(year) || description === '') {
                alert('Please enter a valid year and description.');
                return;
            }

            let events = getEventsFromStorage(); // Get current events

            if (editingEventIndex !== null) {
                // ---- UPDATE EXISTING EVENT ----
                if (editingEventIndex >= 0 && editingEventIndex < events.length) {
                    events[editingEventIndex].year = year;
                    events[editingEventIndex].description = description;
                    events[editingEventIndex].tags = tags;
                }
                // Re-sort to maintain consistency, especially if year might change
                events.sort((a, b) => a.year - b.year);
                saveEventsToStorage(events);
                editingEventIndex = null; // Reset edit mode
            } else {
                // ---- ADD NEW EVENT (existing logic refined) ----
                const newEvent = { year, description, tags };
                events.push(newEvent);
                events.sort((a, b) => a.year - b.year); // Sort after adding new
                saveEventsToStorage(events);
            }

            // ---- COMMON ACTIONS AFTER ADD/UPDATE ----
            // Reset UI to 'add mode'
            if(eventFormHeading) eventFormHeading.textContent = 'Add New Event';
            if(saveEventButton) saveEventButton.textContent = 'Save Event';
            if(cancelEditButton) cancelEditButton.style.display = 'none';

            loadEvents(); // Refresh the list of events
            eventForm.reset(); // Clear the form fields
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

    // Define addEditEventButtonListeners inside DOMContentLoaded to access scoped variables
    function addEditEventButtonListeners() {
        if (!eventListUL) return;
        const editButtons = eventListUL.querySelectorAll('.edit-btn.event-edit-btn');

        const yearInput = document.getElementById('eventYear');
        const descriptionInput = document.getElementById('eventDescription');
        const tagsInput = document.getElementById('eventTags');
        // eventFormHeading, saveEventButton, cancelEditButton are already defined in this scope
        // eventForm is also already defined in this scope

        editButtons.forEach(button => {
            if (button.dataset.listenerAttached === 'true') return;

            button.addEventListener('click', (e) => {
                const indexToEdit = parseInt(e.target.getAttribute('data-index'));
                editingEventIndex = indexToEdit; // Correctly sets the scoped variable

                const events = getEventsFromStorage(); // Uses the scoped function
                const eventToEdit = events[indexToEdit];

                if (eventToEdit) {
                    yearInput.value = eventToEdit.year;
                    descriptionInput.value = eventToEdit.description;
                    tagsInput.value = eventToEdit.tags ? eventToEdit.tags.join(', ') : '';

                    if(eventFormHeading) eventFormHeading.textContent = 'Edit Event';
                    if(saveEventButton) saveEventButton.textContent = 'Update Event';
                    if(cancelEditButton) cancelEditButton.style.display = 'inline-block';

                    if(eventForm) eventForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
            button.dataset.listenerAttached = 'true';
        });
    }

    // Add event listener for the Cancel Edit button
    if (cancelEditButton && eventForm) {
        cancelEditButton.addEventListener('click', () => {
            editingEventIndex = null; // Exit edit mode

            // Reset UI elements to 'add mode'
            if (eventFormHeading) eventFormHeading.textContent = 'Add New Event';
            if (saveEventButton) saveEventButton.textContent = 'Save Event';
            if (cancelEditButton) cancelEditButton.style.display = 'none'; // Hide cancel button itself

            eventForm.reset(); // Clear form fields
        });
    }
});
