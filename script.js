document.addEventListener('DOMContentLoaded', () => {
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');
    const currentTimeDisplay = document.getElementById('current-time-display');

    const startYear = 1000;
    const endYear = 2000;
    let currentYear = startYear;

    // Function to update the time display on the map
    function updateMapTime(year) {
        currentYear = Math.round(year); // Ensure integer years
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = `Time: ${currentYear} AD`;
        }
    }

    // Function to update the scrollbar thumb's visual position and width
    function updateThumbAppearance() {
        const totalYears = endYear - startYear;
        // Ensure currentYear is within bounds, can happen if start/endYear change later
        currentYear = Math.max(startYear, Math.min(endYear, currentYear));

        if (totalYears <= 0) {
            scrollbarThumb.style.width = '0px'; // Or hide it
            scrollbarThumb.style.left = '0px';
            return;
        }

        const yearPercentage = (currentYear - startYear) / totalYears;

        const thumbWidth = Math.max(30, scrollbarContainer.clientWidth * 0.1);
        scrollbarThumb.style.width = `${thumbWidth}px`;

        const scrollableTrackWidth = scrollbarContainer.clientWidth - thumbWidth;
        // Ensure scrollableTrackWidth is not negative if thumb is wider than container
        const effectiveScrollableTrackWidth = Math.max(0, scrollableTrackWidth);

        const thumbPosition = yearPercentage * effectiveScrollableTrackWidth;
        scrollbarThumb.style.left = `${Math.min(Math.max(0, thumbPosition), effectiveScrollableTrackWidth)}px`;
    }

    // Initial setup
    updateMapTime(startYear);
    // Defer initial thumb appearance update until after layout is stable
    requestAnimationFrame(() => {
        updateThumbAppearance();
    });


    let isDragging = false;
    let dragStartX;
    let thumbStartLeftProportion; // Store proportion to handle resizes during drag better

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        dragStartX = e.clientX;

        const thumbWidth = scrollbarThumb.offsetWidth;
        const scrollableTrackWidth = Math.max(0, scrollbarContainer.clientWidth - thumbWidth);

        if (scrollableTrackWidth > 0) {
            thumbStartLeftProportion = scrollbarThumb.offsetLeft / scrollableTrackWidth;
        } else {
            thumbStartLeftProportion = 0;
        }

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

        // Calculate new thumb left based on initial proportion and delta, then clamp
        // This approach makes the thumb move relative to its initial proportional spot + drag delta
        let newThumbLeft = (thumbStartLeftProportion * scrollableTrackWidth) + deltaX;
        newThumbLeft = Math.max(0, Math.min(newThumbLeft, scrollableTrackWidth));

        const positionPercentage = newThumbLeft / scrollableTrackWidth;
        const newYear = startYear + (positionPercentage * (endYear - startYear));

        updateMapTime(newYear); // Update time based on exact dragged position
        scrollbarThumb.style.left = `${newThumbLeft}px`; // Update thumb position directly
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // After dragging, currentYear is set. Update thumb based on this canonical value.
            requestAnimationFrame(updateThumbAppearance);
        }
    });

    scrollbarContainer.addEventListener('click', (e) => {
        if (e.target === scrollbarThumb || e.target.parentNode === scrollbarThumb) return;

        const rect = scrollbarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const thumbWidth = Math.max(30, scrollbarContainer.clientWidth * 0.1); // Recalculate expected thumb width
        const scrollableTrackWidth = Math.max(0, scrollbarContainer.clientWidth - thumbWidth);

        if (scrollableTrackWidth <= 0) return;

        let desiredThumbLeft = clickX - thumbWidth / 2;
        desiredThumbLeft = Math.max(0, Math.min(desiredThumbLeft, scrollableTrackWidth));

        const positionPercentage = desiredThumbLeft / scrollableTrackWidth;
        const newYear = startYear + (positionPercentage * (endYear - startYear));

        updateMapTime(newYear);
        requestAnimationFrame(updateThumbAppearance);
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(updateThumbAppearance);
    });
});
