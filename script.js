document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const eventDisplay = document.getElementById('event-display');

    const eventStorageKey = 'timelineEvents';

    let allEvents = [];
    let eventYears = new Set(); // Declare eventYears globally within DOMContentLoaded
    let currentEventIndex = 0; // Added global variable
    let startYear = -10;
    let endYear = 10;
    let currentYear = startYear;
    let currentMonth = null; // Added for month preservation
    let isAppInitialized = false; // Replaces isFirstLoad
    let rafScheduled = false; // For requestAnimationFrame in mousemove

    // --- UTILITY: BC/AD Year Formatting ---
    function formatYear(year) { // Keep this if used elsewhere, or replace uses with formatYearMonth
        if (year === undefined || year === null) return "N/A";
        const yearNum = Math.round(year); // Ensure we work with rounded numbers for display
        if (yearNum < 0) return `${Math.abs(yearNum)} BC`;
        if (yearNum === 0) return `1 BC`; // Or handle as per convention
        return `${yearNum} AD`;
    }

    function formatYearMonth(year, month) {
        const yearNum = Math.round(year); // Should already be an integer
        let yearStr;

        if (yearNum < 0) yearStr = `${Math.abs(yearNum)} BC`;
        else if (yearNum === 0) yearStr = `1 BC`; // Or other convention for year 0
        else yearStr = `${yearNum} AD`;

        if (month && month >= 1 && month <= 12) {
            // Simple month number to string. Could extend to month names.
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
            // return `${yearStr} ${monthNames[month - 1]}`; // Using English month names
            return `${yearStr} ${month}월`; // Using Korean month indication as per example
        }
        return yearStr;
    }

    // --- DATA LOADING AND TIME RANGE DETERMINATION ---
    function loadEventsAndSetRange() {
        const eventsJson = localStorage.getItem(eventStorageKey);
        allEvents = eventsJson ? JSON.parse(eventsJson) : [];
        // Sort by year, then by month
        allEvents.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            const monthA = a.month == null ? 0 : a.month;
            const monthB = b.month == null ? 0 : b.month;
            return monthA - monthB;
        });

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
                // Try to find an event that matches the currentYear and currentMonth
                let idx = allEvents.findIndex(event =>
                    event.year === currentYear &&
                    (event.month == null ? 0 : event.month) === (currentMonth == null ? 0 : currentMonth)
                );

                if (idx === -1) { // If exact year/month not found, try finding just by year
                    idx = allEvents.findIndex(event => event.year === currentYear);
                }

                if (idx !== -1) {
                    targetIndex = idx;
                }
                // If still not found, targetIndex remains 0 (first event of the sorted list)
            }
            currentEventIndex = targetIndex;
            currentYear = allEvents[currentEventIndex].year;
            currentMonth = allEvents[currentEventIndex].month; // Set currentMonth
            if (!isAppInitialized) {
                isAppInitialized = true; // Set after first successful setup
            }
        } else {
            currentEventIndex = 0;
            currentYear = startYear; // `startYear` is 0 if no events
            currentMonth = null;     // No events, so no month
            // isAppInitialized remains false or its current state if no events to initialize with
        }
    }

    // --- UI UPDATE FUNCTIONS ---
    function updateCurrentYearDisplayDOM() { // No longer takes yearToDisplay argument
        if (!currentTimeDisplay || allEvents.length === 0) {
            currentTimeDisplay.textContent = "Time: N/A"; // Default if no events
            return;
        }
        const currentEvent = allEvents[currentEventIndex];
        currentTimeDisplay.textContent = `Time: ${formatYearMonth(currentEvent.year, currentEvent.month)}`;
    }

    function updateEventDisplayDOM() { // No longer takes yearToFilter argument
        if (!eventDisplay || allEvents.length === 0) {
            eventDisplay.innerHTML = "<p>No event selected.</p>";
            return;
        }

        const selectedEvent = allEvents[currentEventIndex];
        const targetYear = selectedEvent.year;
        const targetMonth = selectedEvent.month; // Will be null/undefined if not set

        const periodEventsFiltered = allEvents.filter(event => {
            if (event.year !== targetYear) return false;
            if (targetMonth != null) { // Selected event has a specific month
                return event.month === targetMonth;
            } else { // Selected event is a year-level event (no month)
                return true; // Show all events for that year
            }
        });

        if (periodEventsFiltered.length === 0) {
            eventDisplay.innerHTML = "<p>No events found for this period (unexpected).</p>";
            return;
        }

        let htmlContent = `<h3>Events in ${formatYearMonth(targetYear, targetMonth)}:</h3>`;
        htmlContent += "<ul>";

        periodEventsFiltered.forEach(event => {
            let eventDateStr = formatYearMonth(event.year, event.month);
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

    function updateThumbAppearance() {
        const scrollbarContainerWidth = scrollbarContainer.offsetWidth;
        const thumbWidthPercentage = 3; // Or a more dynamic calculation if needed
        let thumbActualWidth = (thumbWidthPercentage / 100) * scrollbarContainerWidth;

        if (allEvents.length === 0) {
            scrollbarThumb.style.width = '0px'; // Or minimal width, effectively hidden
            scrollbarThumb.style.left = '0%';
            return;
        }

        // Ensure thumb width doesn't exceed container if only one event
        if (allEvents.length <= 1) {
             // Fixed small width for single/no events to avoid full bar.
            scrollbarThumb.style.width = `${thumbWidthPercentage}%`;
            scrollbarThumb.style.left = '0%';
        } else {
            scrollbarThumb.style.width = `${thumbWidthPercentage}%`;
            // Calculate position based on currentEventIndex
            // The effective track width for the thumb's left edge to move along
            const trackWidth = scrollbarContainerWidth - thumbActualWidth;
            let positionPercentage = 0;
            if (allEvents.length > 1) { // Avoid division by zero if only one event
                positionPercentage = currentEventIndex / (allEvents.length - 1);
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
        if (!isDragging) return;
        e.preventDefault();

        if (allEvents.length === 0) { // No events, nothing to drag to
            return;
        }

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarActualWidth = rect.width; // Total width of the scrollbar container

        const thumbWidthPercentage = 3; // Keep consistent with updateThumbAppearance
        const thumbActualWidth = (thumbWidthPercentage / 100) * scrollbarActualWidth;
        const draggableTrackWidth = scrollbarActualWidth - thumbActualWidth;

        let positionPercentage = 0;
        if (draggableTrackWidth > 0) {
            let mouseXOnTrack = e.clientX - rect.left - (thumbActualWidth / 2);
            positionPercentage = Math.max(0, Math.min(1, mouseXOnTrack / draggableTrackWidth));
        } else if (allEvents.length > 1) {
            positionPercentage = (e.clientX - rect.left < scrollbarActualWidth / 2) ? 0 : 1;
        }

        if (allEvents.length > 1) {
            let newIndex = Math.round(positionPercentage * (allEvents.length - 1));
            currentEventIndex = Math.max(0, Math.min(allEvents.length - 1, newIndex));
        } else {
            currentEventIndex = 0;
        }

        currentYear = allEvents[currentEventIndex].year;
        currentMonth = allEvents[currentEventIndex].month;

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

        if (allEvents.length === 0) { // No events, nothing to click to
            return;
        }

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarWidth = rect.width;
        if (scrollbarWidth === 0) return;

        let clickX = e.clientX - rect.left;
        let positionPercentage = Math.max(0, Math.min(1, clickX / scrollbarWidth));

        if (allEvents.length > 1) {
            let newIndex = Math.round(positionPercentage * (allEvents.length - 1));
            currentEventIndex = Math.max(0, Math.min(allEvents.length - 1, newIndex));
        } else {
            currentEventIndex = 0;
        }

        currentYear = allEvents[currentEventIndex].year;
        currentMonth = allEvents[currentEventIndex].month; // Update currentMonth

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
    loadEventsAndSetRange();
    updatePageForCurrentYear();
    updateThumbAppearance(); // Explicitly call after initial load
});
