document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const eventDisplay = document.getElementById('event-display');

    const eventStorageKey = 'timelineEvents';

    let allEvents = [];
    let eventYears = new Set(); // Declare eventYears globally within DOMContentLoaded
    let startYear = -10;
    let endYear = 10;
    let currentYear = startYear;
    let isFirstLoad = true;

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
            let minYear = allEvents[0].year;
            let maxYear = allEvents[allEvents.length - 1].year;

            const yearSpan = maxYear - minYear;
            const padding = Math.max(10, Math.floor(yearSpan * 0.1));

            startYear = minYear - padding;
            endYear = maxYear + padding;

            if (endYear - startYear < 20) {
                const mid = Math.round((startYear + endYear) / 2);
                startYear = mid - 10;
                endYear = mid + 10;
            }
            if (startYear === endYear) { // Ensure not identical
                endYear += 10;
            }
        } else {
            startYear = -10;
            endYear = 10;
        }

        if (isFirstLoad) {
            currentYear = startYear;
            isFirstLoad = false;
        } else {
            // Clamp currentYear to the new range if it's outside
            currentYear = Math.max(startYear, Math.min(endYear, currentYear));
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
        const totalYearSpan = endYear - startYear;
        if (totalYearSpan <= 0) {
             scrollbarThumb.style.width = '3%'; // Default small width
             scrollbarThumb.style.left = '0%';
            return;
        }

        // Ensure currentYear is within bounds for percentage calculation
        const boundedCurrentYear = Math.max(startYear, Math.min(currentYear, endYear));
        const yearPercentageOffset = (boundedCurrentYear - startYear) / totalYearSpan;

        const thumbWidthPercentage = 3;
        scrollbarThumb.style.width = `${thumbWidthPercentage}%`;

        const maxThumbLeftPercentage = 100 - thumbWidthPercentage;
        const thumbPositionPercentage = yearPercentageOffset * maxThumbLeftPercentage;

        scrollbarThumb.style.left = `${Math.max(0, Math.min(thumbPositionPercentage, maxThumbLeftPercentage))}%`;
    }

    // --- Combined Update Function ---
    function updatePageForCurrentYear() {
        // currentYear can be fractional during drag, round for display logic
        const displayYear = Math.round(currentYear);
        updateCurrentYearDisplayDOM(displayYear);
        updateEventDisplayDOM(displayYear);
        updateThumbAppearance(); // Thumb appearance uses the potentially fractional currentYear
    }

    // --- SCROLLBAR INTERACTION ---
    let isDragging = false;
    let dragStartYearValue;
    let dragMouseStartX;

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        dragStartYearValue = currentYear; // Store the precise fractional year
        dragMouseStartX = e.clientX;
        scrollbarThumb.style.backgroundColor = '#333';
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const totalYearSpan = endYear - startYear;
        if (totalYearSpan <= 0) return;

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarWidth = rect.width;
        if (scrollbarWidth === 0) return; // Avoid division by zero

        const mouseDeltaX = e.clientX - dragMouseStartX;
        const yearDelta = (mouseDeltaX / scrollbarWidth) * totalYearSpan;
        let rawYearFromMouse = dragStartYearValue + yearDelta;

        if (eventYears.size > 0) {
            const sortedEventYears = Array.from(eventYears).sort((a, b) => a - b);

            // Find the closest event year
            currentYear = sortedEventYears.reduce((prev, curr) => {
                return (Math.abs(curr - rawYearFromMouse) < Math.abs(prev - rawYearFromMouse) ? curr : prev);
            });

            // Ensure currentYear is not outside the overall start/end range,
            // although snapping to an event year should generally keep it within a valid sub-range.
            currentYear = Math.max(startYear, Math.min(endYear, currentYear));

        } else {
            // If no event years, behave as before (allow dragging freely within start/end range)
            currentYear = Math.max(startYear, Math.min(endYear, rawYearFromMouse));
        }

        updatePageForCurrentYear();
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
        if (e.target === scrollbarThumb || scrollbarThumb.contains(e.target)) return;

        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarWidth = rect.width;
        if (scrollbarWidth === 0) return;

        let clickX = e.clientX - rect.left;
        let positionPercentage = (clickX / scrollbarWidth);
        positionPercentage = Math.max(0, Math.min(positionPercentage, 1));

        let rawClickedYear = startYear + (positionPercentage * (endYear - startYear));

        if (eventYears.size > 0) {
            const sortedEventYears = Array.from(eventYears).sort((a, b) => a - b);

            currentYear = sortedEventYears.reduce((prev, curr) => {
                return (Math.abs(curr - rawClickedYear) < Math.abs(prev - rawClickedYear) ? curr : prev);
            });
        } else {
            currentYear = rawClickedYear;
        }

        // Ensure currentYear is within the overall start/end range.
        currentYear = Math.max(startYear, Math.min(endYear, currentYear));

        updatePageForCurrentYear();
    });

    // --- WINDOW RESIZE & STORAGE LISTENER ---
    window.addEventListener('resize', () => {
        updateThumbAppearance();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === eventStorageKey) {
            const previousCurrentYear = currentYear;
            isFirstLoad = true; // This will force currentYear to be startYear after load if it's out of new range
            loadEventsAndSetRange();

            if (previousCurrentYear >= startYear && previousCurrentYear <= endYear) {
                currentYear = previousCurrentYear;
                isFirstLoad = false; // Undo the reset if previous year is still valid
            }
            updatePageForCurrentYear();
        }
    });

    // --- INITIALIZATION ---
    loadEventsAndSetRange();
    updatePageForCurrentYear();
});
