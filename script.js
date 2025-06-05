document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const eventDisplay = document.getElementById('event-display');

    const periodStorageKey = 'timelinePeriods';
    const eventStorageKey = 'timelineEvents';

    let allPeriods = [];
    let allEvents = [];
    let currentPeriodIndex = 0; // Default to the first period

    // --- UTILITY: BC/AD Year Formatting ---
    function formatYear(year) {
        if (year === undefined || year === null) return "N/A";
        if (year < 0) return `${Math.abs(year)} BC`;
        if (year === 0) return `1 BC`; // Common convention, as there's no year 0
        return `${year} AD`;
    }

    // --- DATA LOADING ---
    function loadData() {
        const periodsJson = localStorage.getItem(periodStorageKey);
        allPeriods = periodsJson ? JSON.parse(periodsJson) : [];
        allPeriods.sort((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);

        const eventsJson = localStorage.getItem(eventStorageKey);
        allEvents = eventsJson ? JSON.parse(eventsJson) : [];
        allEvents.sort((a,b) => a.year - b.year);

        if (allPeriods.length === 0) {
            allPeriods = [{
                name: "Default Period (No Periods Defined)",
                startYear: new Date().getFullYear() - 5, // Default to a small recent range
                endYear: new Date().getFullYear() + 5
            }];
        }
        currentPeriodIndex = Math.max(0, Math.min(currentPeriodIndex, allPeriods.length - 1));
    }

    // --- UI UPDATE FUNCTIONS ---
    function updatePageDisplays() {
        if (allPeriods.length === 0) { // Should be handled by default period creation
            currentTimeDisplay.textContent = "No periods available.";
            eventDisplay.innerHTML = "<p>Please define periods and events in the admin page.</p>";
            updateThumbAppearance();
            return;
        }

        const selectedPeriod = allPeriods[currentPeriodIndex];

        if (currentTimeDisplay) {
            currentTimeDisplay.innerHTML = `
                <strong>Period:</strong> ${selectedPeriod.name}
                <em>(${formatYear(selectedPeriod.startYear)} - ${formatYear(selectedPeriod.endYear)})</em>
            `;
        }

        if (eventDisplay) {
            const eventsInPeriod = allEvents.filter(event =>
                event.year >= selectedPeriod.startYear && event.year <= selectedPeriod.endYear
            );

            if (eventsInPeriod.length > 0) {
                let eventsHtml = `<h3>Events in ${selectedPeriod.name}:</h3><ul>`;
                eventsInPeriod.forEach(event => {
                    eventsHtml += `<li><strong>${formatYear(event.year)}:</strong> ${event.description}</li>`;
                });
                eventsHtml += `</ul>`;
                eventDisplay.innerHTML = eventsHtml;
            } else {
                eventDisplay.innerHTML = `<p>No specific events recorded for the period: ${selectedPeriod.name}.</p>`;
            }
        }
        updateThumbAppearance();
    }

    function updateThumbAppearance() {
        const totalPeriods = allPeriods.length;
        if (totalPeriods === 0) {
            scrollbarThumb.style.width = '0%';
            scrollbarThumb.style.left = '0%';
            return;
        }

        const thumbWidthPercentage = Math.max(5, 100 / totalPeriods); // Each slot is (100/total)%, min 5%
        scrollbarThumb.style.width = `${thumbWidthPercentage}%`;

        const thumbPositionPercentage = currentPeriodIndex * (100 / totalPeriods);
        scrollbarThumb.style.left = `${thumbPositionPercentage}%`;
    }

    // --- SCROLLBAR INTERACTION ---
    let isDragging = false;

    function handleScrollbarInteraction(clientX) {
        const rect = scrollbarContainer.getBoundingClientRect();
        const scrollbarWidth = rect.width;
        if (scrollbarWidth <= 0) return; // Avoid division by zero or NaN

        let clickX = clientX - rect.left;
        let positionPercentage = (clickX / scrollbarWidth) * 100;
        positionPercentage = Math.max(0, Math.min(positionPercentage, 99.99)); // Clamp (99.99 to avoid index out of bounds with floor)

        if (allPeriods.length > 0) {
            const slotWidthPercentage = 100 / allPeriods.length;
            const newIndex = Math.floor(positionPercentage / slotWidthPercentage);
            currentPeriodIndex = Math.min(newIndex, allPeriods.length - 1);
        } else {
            currentPeriodIndex = 0;
        }

        updatePageDisplays();
    }

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        scrollbarThumb.style.backgroundColor = '#333';
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        // Optional: update on mousedown if desired, otherwise wait for mousemove/up
        // handleScrollbarInteraction(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        handleScrollbarInteraction(e.clientX);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // updatePageDisplays(); // Typically already called by the last mousemove
        }
    });

    scrollbarContainer.addEventListener('click', (e) => {
        // Prevent click from re-triggering if it was part of a drag ending on the container
        if (e.target === scrollbarThumb && isDragging) return;
        if (scrollbarThumb.contains(e.target) && isDragging) return; // if click is on thumb during drag

        handleScrollbarInteraction(e.clientX);
    });

    // --- WINDOW RESIZE & STORAGE LISTENER ---
    window.addEventListener('resize', () => {
        updateThumbAppearance();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === periodStorageKey || e.key === eventStorageKey) {
            const oldPeriodName = (allPeriods.length > 0 && currentPeriodIndex < allPeriods.length)
                                ? allPeriods[currentPeriodIndex].name : null;

            loadData();

            if (oldPeriodName) {
                const newIdx = allPeriods.findIndex(p => p.name === oldPeriodName);
                currentPeriodIndex = (newIdx !== -1) ? newIdx : 0;
            } else {
                currentPeriodIndex = 0;
            }
            updatePageDisplays();
        }
    });

    // --- INITIALIZATION ---
    loadData();
    updatePageDisplays();
});
