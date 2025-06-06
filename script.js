document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const eventDisplay = document.getElementById('event-display');

    const eventStorageKey = 'timelineEvents';

    let allEvents = [];
    let eventYears = new Set(); // Declare eventYears globally within DOMContentLoaded
    let currentEventIndex = 0; // Index into allEvents
    let navigableEvents = [];
    let currentNavigableIndex = 0; // Index into navigableEvents
    let startYear = -10;
    let endYear = 10;
    let currentYear = startYear;
    let isAppInitialized = false; // Replaces isFirstLoad
    let rafScheduled = false; // For requestAnimationFrame in mousemove
    let activeTagFilter = null;

    // --- UTILITY: BC/AD Year Formatting ---
    function formatYear(year) { // Keep this if used elsewhere, or replace uses with formatYearMonth
        if (year === undefined || year === null) return "N/A";
        const yearNum = Math.round(year); // Ensure we work with rounded numbers for display
        if (yearNum < 0) return `${Math.abs(yearNum)} BC`;
        if (yearNum === 0) return `1 BC`; // Or handle as per convention
        return `${yearNum} AD`;
    }

    function formatYearMonth(year) { // month parameter removed
        const yearNum = Math.round(year);
        let yearStr;

        if (yearNum < 0) yearStr = `${Math.abs(yearNum)} BC`;
        else if (yearNum === 0) yearStr = `1 BC`; // Or other convention for year 0
        else yearStr = `${yearNum} AD`;

        // Remove all logic related to month names or adding month to yearStr
        return yearStr;
    }

    // --- DATA LOADING AND TIME RANGE DETERMINATION ---
    function loadEventsAndSetRange() {
        const eventsJson = localStorage.getItem(eventStorageKey);
        allEvents = eventsJson ? JSON.parse(eventsJson) : [];
        // Sort by year, then by month
        allEvents.sort((a, b) => a.year - b.year);

        // Populate eventYears
        eventYears.clear(); // Clear existing years
        allEvents.forEach(event => eventYears.add(event.year));

        if (allEvents.length > 0) {
            startYear = allEvents[0].year; // Min year from sorted events
            endYear = allEvents[allEvents.length - 1].year; // Max year from sorted events

            // If all events are in the same year, startYear will equal endYear. This is fine.
        } else {
            // Defaults if no events.
            startYear = 0;
            endYear = 0;
        }

        // Initialize currentEventIndex and currentYear based on allEvents
        if (allEvents.length > 0) {
            let targetIndex = 0;
            if (isAppInitialized) {
                // Try to find an event that matches the currentYear
                let idx = allEvents.findIndex(event => event.year === currentYear);

                if (idx !== -1) {
                    targetIndex = idx;
                }
                // If still not found, targetIndex remains 0 (first event of the sorted list)
            }
            currentEventIndex = targetIndex;
            currentYear = allEvents[currentEventIndex].year;
            if (!isAppInitialized) {
                isAppInitialized = true; // Set after first successful setup
            }
        } else {
            currentEventIndex = 0;
            currentYear = startYear; // `startYear` is 0 if no events
            // isAppInitialized remains false or its current state if no events to initialize with
        }
    }

    // --- DATA LOADING AND TIME RANGE DETERMINATION ---
    function updateNavigableEvents() {
        const previouslySelectedEvent = (currentEventIndex >= 0 && currentEventIndex < allEvents.length) ? allEvents[currentEventIndex] : null;
        const previousYear = currentYear;

        if (activeTagFilter) {
            navigableEvents = allEvents.filter(event => event.tags && event.tags.includes(activeTagFilter));
        } else {
            navigableEvents = [...allEvents]; // Shallow copy
        }

        if (navigableEvents.length === 0) {
            currentNavigableIndex = 0;
            // If no events are navigable (e.g. due to filter), currentYear and currentEventIndex might need adjustment.
            // Let's reflect that no event is selected from allEvents if navigableEvents is empty.
            // currentEventIndex = -1; // Or some indicator of no selection.
            // currentYear = startYear; // Fallback, or could be null.
            // Display functions should handle this state (e.g. "No events match filter").
            // For now, the impact on currentEventIndex and currentYear if navigableEvents is empty:
            // updateEventDisplayDOM should show a message. currentYear might remain.
            return;
        }

        let newNavigableIdx = -1;

        if (previouslySelectedEvent) {
            newNavigableIdx = navigableEvents.findIndex(event => event === previouslySelectedEvent);
        }

        if (newNavigableIdx === -1) {
            newNavigableIdx = navigableEvents.findIndex(event => event.year === previousYear);
        }

        if (newNavigableIdx === -1) {
            newNavigableIdx = 0;
        }

        currentNavigableIndex = newNavigableIdx;

        if (navigableEvents.length > 0 && currentNavigableIndex < navigableEvents.length) {
            const actualSelectedEvent = navigableEvents[currentNavigableIndex];
            currentYear = actualSelectedEvent.year;
            currentEventIndex = allEvents.findIndex(event => event === actualSelectedEvent);
             if (currentEventIndex === -1) { // Should not happen if navigableEvents is derived from allEvents
                console.error("Error: Selected navigable event not found in allEvents.");
                currentEventIndex = 0; // Fallback
            }
        } else {
            // This case should ideally be covered by navigableEvents.length === 0 check earlier
            // Or implies currentNavigableIndex is out of bounds, which shouldn't happen with above logic.
            // Reset to a default state if something went wrong.
            currentYear = startYear;
            currentEventIndex = 0;
            currentNavigableIndex = 0;
        }
    }

    // --- UI UPDATE FUNCTIONS ---
    function updateTagFilterDisplay() {
        const tagListContainer = document.getElementById('tag-list');
        const clearTagFilterButton = document.getElementById('clear-tag-filter');
        const tagFilterContainer = document.getElementById('tag-filter-container');

        if (!tagListContainer || !clearTagFilterButton || !tagFilterContainer) return;

        let uniqueTags = new Set();
        allEvents.forEach(event => {
            if (event.tags && Array.isArray(event.tags)) {
                event.tags.forEach(tag => uniqueTags.add(tag));
            }
        });

        tagListContainer.innerHTML = ''; // Clear previous tags
        if (uniqueTags.size === 0) {
            tagFilterContainer.style.display = 'none'; // Hide container if no tags
            clearTagFilterButton.style.display = 'none'; // Ensure clear button is also hidden
            // activeTagFilter = null; // Reset filter if no tags are available - NO, keep active filter
            return;
        }
        tagFilterContainer.style.display = 'block'; // Show container if tags exist


        uniqueTags.forEach(tag => {
            const tagElement = document.createElement('span'); // Or 'button'
            tagElement.classList.add('tag-filter-item'); // Add a class for styling
            tagElement.textContent = tag;
            tagElement.style.cursor = 'pointer';
            tagElement.style.marginRight = '5px'; // Basic styling
            tagElement.style.marginBottom = '5px'; // Basic styling for wrapping
            tagElement.style.display = 'inline-block'; // Ensure proper spacing and wrapping
            tagElement.style.padding = '2px 5px';
            tagElement.style.border = '1px solid #ccc';
            tagElement.style.borderRadius = '3px';

            if (tag === activeTagFilter) {
                tagElement.style.backgroundColor = '#007bff'; // Highlight active filter
                tagElement.style.color = 'white';
            }

            tagElement.addEventListener('click', () => {
                activeTagFilter = tag;
                updateNavigableEvents(); // Call this first
                updatePageForCurrentYear(); // Then update the page
                // clearTagFilterButton.style.display is handled by updateTagFilterDisplay via updatePageForCurrentYear
            });
            tagListContainer.appendChild(tagElement);
        });

        if(activeTagFilter){
            clearTagFilterButton.style.display = 'inline-block';
        } else {
            clearTagFilterButton.style.display = 'none';
        }
    }


    function updateCurrentYearDisplayDOM() {
        if (!currentTimeDisplay) return;

        if (navigableEvents.length === 0 || currentNavigableIndex < 0 || currentNavigableIndex >= navigableEvents.length) {
            currentTimeDisplay.textContent = "Time: N/A";
            return;
        }
        const currentNavigableEvent = navigableEvents[currentNavigableIndex];
        currentTimeDisplay.textContent = `Time: ${formatYearMonth(currentNavigableEvent.year)}`;
    }

    function updateEventDisplayDOM() {
        if (!eventDisplay) return;

        if (navigableEvents.length === 0 || currentNavigableIndex < 0 || currentNavigableIndex >= navigableEvents.length) {
            let message = "<p>No events available.</p>";
            if (activeTagFilter) {
                // If navigableEvents is empty AND a filter is active, it means no events matched the filter.
                message = `<p>No events found for tag: "${activeTagFilter}".</p>`;
            } else if (allEvents.length === 0) {
                // If navigableEvents is empty and no filter, but allEvents is also empty.
                message = "<p>No events have been added yet.</p>";
            }
            eventDisplay.innerHTML = message;
            return;
        }

        const selectedEvent = navigableEvents[currentNavigableIndex];
        const targetYear = selectedEvent.year;

        // Filter allEvents by targetYear. This shows all events for the selected year,
        // which might include events not matching the activeTagFilter if the user wants to see the year's context.
        // However, the primary list of events in the "event-display" should respect the activeTagFilter.
        // The current logic for finalFilteredEvents already does this.
        let yearFilteredEvents = allEvents.filter(event => event.year === targetYear);

        let finalFilteredEvents = yearFilteredEvents;
        if (activeTagFilter) {
            finalFilteredEvents = yearFilteredEvents.filter(event => {
                return event.tags && event.tags.includes(activeTagFilter);
            });
        }

        if (finalFilteredEvents.length === 0) {
            let message = ``;
            if (activeTagFilter) {
                message = `<p>No events found for ${formatYearMonth(targetYear)} with tag "${activeTagFilter}".</p>`;
            } else {
                // This case implies no events for the year at all, which should ideally not happen if selectedEvent is valid.
                // However, if allEvents was empty to begin with, this path might be taken.
                message = `<p>No events found for ${formatYearMonth(targetYear)}.</p>`;
            }
            // Construct header for context even if no events for the specific filter in this year
            let header = `<h3>Events in ${formatYearMonth(targetYear)}`;
            if (activeTagFilter) {
                header += ` (Tag: ${activeTagFilter})`;
            }
            header += `:</h3>`;
            eventDisplay.innerHTML = header + message;
        } else {
            let htmlContent = `<h3>Events in ${formatYearMonth(targetYear)}${activeTagFilter ? ` (Tag: ${activeTagFilter})` : ''}:</h3>`;
            htmlContent += "<ul>";

            finalFilteredEvents.forEach(event => {
                let eventDateStr = formatYearMonth(event.year);
                htmlContent += `<li>`;
                htmlContent += `<strong>${eventDateStr}:</strong> ${event.description}`;

                if (event.tags && Array.isArray(event.tags) && event.tags.length > 0) {
                    htmlContent += `<br><small><em>Tags: ${event.tags.join(', ')}</em></small>`;
                }
                htmlContent += `</li>`;
            });

            htmlContent += "</ul>";
            eventDisplay.innerHTML = htmlContent;
        }
    }

    function updateThumbAppearance() {
        const scrollbarContainerWidth = scrollbarContainer.offsetWidth;
        const thumbWidthPercentage = 3; // Or a more dynamic calculation if needed
        let thumbActualWidth = (thumbWidthPercentage / 100) * scrollbarContainerWidth;

        if (navigableEvents.length === 0) {
            scrollbarThumb.style.width = '0px';
            scrollbarThumb.style.left = '0%';
            return;
        }

        if (navigableEvents.length === 1) {
            scrollbarThumb.style.width = `${thumbWidthPercentage}%`;
            scrollbarThumb.style.left = '0%';
        } else {
            scrollbarThumb.style.width = `${thumbWidthPercentage}%`;
            // const trackWidth = scrollbarContainerWidth - thumbActualWidth; // Not directly used for left %
            let positionPercentage = 0;
            // Use currentNavigableIndex and navigableEvents.length
            if (navigableEvents.length > 1) { // Avoid division by zero
                 positionPercentage = currentNavigableIndex / (navigableEvents.length - 1);
            }
            scrollbarThumb.style.left = `${positionPercentage * (100 - thumbWidthPercentage)}%`;
        }
    }

    // --- Combined Update Function ---
    function updatePageForCurrentYear() {
        // currentYear is already set to allEvents[currentEventIndex].year
        // currentMonth (if needed) would be allEvents[currentEventIndex].month
        updateCurrentYearDisplayDOM(); // No longer passes currentYear
        updateEventDisplayDOM();   // No longer passes currentYear
        updateTagFilterDisplay(); // Add this call
    }

    // --- SCROLLBAR INTERACTION ---
    let isDragging = false;
    let dragStartEventIndex; // Renamed from dragStartYearValue
    let dragMouseStartX;

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        dragStartEventIndex = currentEventIndex; // Store the starting event index
        dragMouseStartX = e.clientX;
        scrollbarThumb.style.backgroundColor = '#333';
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || navigableEvents.length === 0) return;
        e.preventDefault();

        // if (allEvents.length === 0) { // No events, nothing to drag to // Replaced by navigableEvents check
        //     return;
        // }

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarActualWidth = rect.width; // Total width of the scrollbar container

        const thumbWidthPercentage = 3; // Keep consistent with updateThumbAppearance
        const thumbActualWidth = (thumbWidthPercentage / 100) * scrollbarActualWidth;
        const draggableTrackWidth = scrollbarActualWidth - thumbActualWidth;

        let positionPercentage = 0;
        if (draggableTrackWidth > 0) {
            let mouseXOnTrack = e.clientX - rect.left - (thumbActualWidth / 2);
            positionPercentage = Math.max(0, Math.min(1, mouseXOnTrack / draggableTrackWidth));
        } else if (navigableEvents.length > 1) { // Check navigableEvents
            positionPercentage = (e.clientX - rect.left < scrollbarActualWidth / 2) ? 0 : 1;
        }

        if (navigableEvents.length > 1) {
            let newIndex = Math.round(positionPercentage * (navigableEvents.length - 1));
            currentNavigableIndex = Math.max(0, Math.min(navigableEvents.length - 1, newIndex));
        } else {
            currentNavigableIndex = 0;
        }

        // Update currentYear and currentEventIndex based on the new currentNavigableIndex
        if (navigableEvents.length > 0) { // Should always be true if drag is active due to initial check
            const selectedEvent = navigableEvents[currentNavigableIndex];
            currentYear = selectedEvent.year;
            currentEventIndex = allEvents.findIndex(event => event === selectedEvent);
            if (currentEventIndex === -1) { // Should ideally not happen
                 console.error("Error: Drag selected navigable event not found in allEvents.");
                 currentEventIndex = 0; // Fallback
            }
        }
        // No else needed here as the initial check navigableEvents.length === 0 should prevent dragging.

        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(() => {
                updatePageForCurrentYear();
                updateThumbAppearance();
                rafScheduled = false; // Allow next frame to be scheduled
            });
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // updatePageForCurrentYear(); // REMOVED - Mousemove handles updates during drag.
        }
    });

    scrollbarContainer.addEventListener('click', (e) => {
        if (e.target === scrollbarThumb || scrollbarThumb.contains(e.target)) {
            return;
        }

        if (navigableEvents.length === 0) {
            return;
        }

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarWidth = rect.width;
        if (scrollbarWidth === 0) return;

        let clickX = e.clientX - rect.left;
        let positionPercentage = Math.max(0, Math.min(1, clickX / scrollbarWidth));

        if (navigableEvents.length > 1) {
            let newIndex = Math.round(positionPercentage * (navigableEvents.length - 1));
            currentNavigableIndex = Math.max(0, Math.min(navigableEvents.length - 1, newIndex));
        } else {
            currentNavigableIndex = 0;
        }

        // Update currentYear and currentEventIndex based on the new currentNavigableIndex
        if (navigableEvents.length > 0) { // Should be true if click is processed
            const selectedEvent = navigableEvents[currentNavigableIndex];
            currentYear = selectedEvent.year;
            currentEventIndex = allEvents.findIndex(event => event === selectedEvent);
            if (currentEventIndex === -1) { // Should ideally not happen
                 console.error("Error: Click selected navigable event not found in allEvents.");
                 currentEventIndex = 0; // Fallback
            }
        }
        // No else needed here as the initial check navigableEvents.length === 0 should prevent click processing.

        updatePageForCurrentYear();
        updateThumbAppearance();   // Explicitly call to ensure thumb updates, though updatePageForCurrentYear also calls it.
    });

    // --- WINDOW RESIZE & STORAGE LISTENER ---
    window.addEventListener('resize', () => {
        updateThumbAppearance();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === eventStorageKey) {
            // const previousCurrentYear = currentYear; // currentYear is already preserved by loadEventsAndSetRange if possible
            // isAppInitialized should correctly handle re-initialization logic within loadEventsAndSetRange
            loadEventsAndSetRange();
            updatePageForCurrentYear();
            updateThumbAppearance(); // Explicitly update thumb after storage event
        }
    });

    // --- INITIALIZATION ---
    const clearTagFilterButton = document.getElementById('clear-tag-filter');
    if (clearTagFilterButton) {
        clearTagFilterButton.addEventListener('click', () => {
            activeTagFilter = null;
            updateNavigableEvents(); // Call this first
            updatePageForCurrentYear(); // Then update the page
            // clearTagFilterButton.style.display is handled by updateTagFilterDisplay via updatePageForCurrentYear
        });
    }

    loadEventsAndSetRange();
    updateNavigableEvents();
    updatePageForCurrentYear();
    updateThumbAppearance();
    // updateTagFilterDisplay(); // updatePageForCurrentYear already calls updateTagFilterDisplay
});
