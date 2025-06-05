document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const eventDisplay = document.getElementById('event-display'); // New element for displaying events
    const storageKey = 'timelineEvents'; // Same key as in admin.js

    let events = [];
    let startYear = 1000; // Default start year
    let endYear = 2000;   // Default end year
    let currentYear = startYear;

    // --- Event Loading and Time Range Determination ---
    function loadEventsAndSetRange() {
        const eventsJson = localStorage.getItem(storageKey);
        events = eventsJson ? JSON.parse(eventsJson) : [];

        if (events.length > 0) {
            // Sort by year to easily find min/max
            events.sort((a, b) => a.year - b.year);
            startYear = events[0].year;
            endYear = events[events.length - 1].year;

            // Add some padding to the range if only one event year exists or range too small
            if (startYear === endYear) {
                startYear -= 10;
                endYear += 10;
            }
             // Ensure a minimum span for the timeline for usability
            if (endYear - startYear < 20) {
                const mid = Math.round((startYear + endYear) / 2);
                startYear = mid - 10;
                endYear = mid + 10;
            }

        } else {
            // Default range if no events
            startYear = 1000;
            endYear = 2000;
        }
        currentYear = startYear; // Start at the beginning of the determined range
    }

    // --- UI Update Functions ---
    function updateCurrentYearDisplay(yearToDisplay) {
        // currentYear is updated globally first, then display reflects it
        currentYear = Math.round(yearToDisplay);
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = `Time: ${currentYear} AD`;
        }
    }

    function updateEventDisplay(yearToDisplay) {
        if (!eventDisplay) return;
        // Use the globally updated currentYear for finding events
        const eventsForYear = events.filter(event => event.year === currentYear);

        if (eventsForYear.length > 0) {
            let htmlContent = `<h3>Events in ${currentYear} AD:</h3><ul>`;
            eventsForYear.forEach(event => {
                htmlContent += `<li>${event.description}</li>`;
            });
            htmlContent += `</ul>`;
            eventDisplay.innerHTML = htmlContent;
        } else {
            eventDisplay.innerHTML = `<p>No specific events recorded for ${currentYear} AD.</p>`;
        }
    }

    function updateThumbAppearance() {
        const totalYears = endYear - startYear;
        // Ensure currentYear is within the dynamic range before calculating percentage
        const boundedCurrentYear = Math.max(startYear, Math.min(currentYear, endYear));

        if (totalYears <= 0) {
             scrollbarThumb.style.width = '0px';
             scrollbarThumb.style.left = '0px';
            return;
        }

        const yearPercentage = (boundedCurrentYear - startYear) / totalYears;
        const thumbWidth = Math.max(30, scrollbarContainer.clientWidth * 0.05); // 5% or 30px min
        scrollbarThumb.style.width = `${thumbWidth}px`;

        const scrollableTrackWidth = Math.max(0, scrollbarContainer.clientWidth - thumbWidth);
        const thumbPosition = yearPercentage * scrollableTrackWidth;

        const boundedThumbPosition = Math.max(0, Math.min(thumbPosition, scrollableTrackWidth));
        scrollbarThumb.style.left = `${boundedThumbPosition}px`;
    }

    // --- Combined Update Function ---
    function updateDisplayForYear(year) {
        updateCurrentYearDisplay(year); // This updates global currentYear
        updateEventDisplay();         // This uses global currentYear
        updateThumbAppearance();      // This uses global currentYear and range
    }

    // --- Initialization ---
    loadEventsAndSetRange();
    updateDisplayForYear(currentYear); // Initial display based on loaded events/defaults

    // --- Scrollbar Interaction Logic ---
    let isDragging = false;
    let dragStartX;
    let thumbStartLeft; // Store initial offsetLeft of the thumb

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        dragStartX = e.clientX;
        thumbStartLeft = scrollbarThumb.offsetLeft;
        scrollbarThumb.style.backgroundColor = '#333';
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const deltaX = e.clientX - dragStartX;
        const thumbWidth = scrollbarThumb.offsetWidth;
        const scrollableTrackWidth = Math.max(0, scrollbarContainer.clientWidth - thumbWidth);

        if (scrollableTrackWidth <= 0) return;

        let newThumbLeft = thumbStartLeft + deltaX;
        newThumbLeft = Math.max(0, Math.min(newThumbLeft, scrollableTrackWidth));

        const positionPercentage = newThumbLeft / scrollableTrackWidth;
        const newYear = startYear + (positionPercentage * (endYear - startYear));

        // Update thumb's visual position directly for smoothness during drag
        scrollbarThumb.style.left = `${newThumbLeft}px`;

        // Only update the year display and events if the rounded year actually changes
        if (Math.round(newYear) !== currentYear) {
            updateCurrentYearDisplay(newYear); // This updates global currentYear
            updateEventDisplay();              // This uses global currentYear
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // Snap to the final year and update thumb appearance precisely based on currentYear
            // currentYear would have been updated during the last mousemove
            updateThumbAppearance();
        }
    });

    scrollbarContainer.addEventListener('click', (e) => {
        if (e.target === scrollbarThumb || scrollbarThumb.contains(e.target)) return;


        const rect = scrollbarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        // Use the calculated thumb width for consistency
        const thumbWidth = Math.max(30, scrollbarContainer.clientWidth * 0.05);
        const scrollableTrackWidth = Math.max(0, scrollbarContainer.clientWidth - thumbWidth);

        if (scrollableTrackWidth <= 0) return;

        let desiredThumbLeft = clickX - thumbWidth / 2; // Center thumb on click
        desiredThumbLeft = Math.max(0, Math.min(desiredThumbLeft, scrollableTrackWidth));

        const positionPercentage = desiredThumbLeft / scrollableTrackWidth;
        const newYear = startYear + (positionPercentage * (endYear - startYear));

        updateDisplayForYear(newYear);
    });

    window.addEventListener('resize', () => {
        // Recalculate thumb width and position on resize based on current year and new range
        updateThumbAppearance();
    });

    // Listen for storage changes from other tabs/windows (e.g. admin page)
    window.addEventListener('storage', (e) => {
        if (e.key === storageKey) {
            loadEventsAndSetRange(); // Reload events
            updateDisplayForYear(currentYear); // Update display, keeping current year if possible or resetting to startYear
        }
    });
});
