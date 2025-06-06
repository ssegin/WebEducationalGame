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
    let isAppInitialized = false; // Replaces isFirstLoad

    // --- UTILITY: BC/AD Year Formatting ---
    function formatYear(year) {
        if (year === undefined || year === null) return "N/A";
        const yearNum = Math.round(year); // Ensure we work with rounded numbers for display
        if (yearNum < 0) return `${Math.abs(yearNum)} BC`;
        if (yearNum === 0) return `1 BC`; // Or handle as per convention
        return `${yearNum} AD`;
    }

    // --- DATA LOADING AND TIME RANGE DETERMINATION ---
    function loadEventsAndSetRange() {
        const eventsJson = localStorage.getItem(eventStorageKey);
        allEvents = eventsJson ? JSON.parse(eventsJson) : [];
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
            if (isAppInitialized) { // If app has been initialized, try to maintain currentYear
                const idx = allEvents.findIndex(event => event.year === currentYear);
                if (idx !== -1) {
                    targetIndex = idx;
                }
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

    // --- UI UPDATE FUNCTIONS ---
    function updateCurrentYearDisplayDOM(yearToDisplay) {
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = formatYear(yearToDisplay);
        }
    }

    function updateEventDisplayDOM(yearToFilter) {
        if (!eventDisplay) return;
        const roundedYearToFilter = Math.round(yearToFilter);
        const eventsForYear = allEvents.filter(event => event.year === roundedYearToFilter);

        if (eventsForYear.length > 0) {
            let htmlContent = `<h3>Events in ${formatYear(roundedYearToFilter)}:</h3><ul>`;
            eventsForYear.forEach(event => {
                htmlContent += `<li>${event.description}</li>`;
            });
            htmlContent += `</ul>`;
            eventDisplay.innerHTML = htmlContent;
        } else {
            eventDisplay.innerHTML = `<p>No specific events recorded for ${formatYear(roundedYearToFilter)}.</p>`;
        }
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
        // currentYear is now always an integer derived from an event.
        updateCurrentYearDisplayDOM(currentYear);
        updateEventDisplayDOM(currentYear);
        // updateThumbAppearance(); // REMOVED from here
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

        updatePageForCurrentYear();
        // updateThumbAppearance(); // updatePageForCurrentYear already calls this.
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // currentYear is already updated, just ensure its final state is rendered
            // No need to round here if we want to keep fractional precision until next discrete action
            updatePageForCurrentYear();
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
