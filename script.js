document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('main-container');
    const contentWrapper = document.getElementById('content-wrapper'); // Used to get full scrollable width
    const scrollbarThumb = document.getElementById('scrollbar-thumb');
    const scrollbarContainer = document.getElementById('scrollbar-container');

    function updateScrollbar() {
        // scrollWidth of mainContainer might not be what we want if overflow-x is hidden.
        // We should use the contentWrapper's width for total scrollable content.
        // However, mainContainer.scrollLeft is what we control.
        // Let's assume mainContainer's scrollWidth is correctly reflecting contentWrapper's width
        // due to the structure, or if not, we might need to use contentWrapper.scrollWidth.
        // For now, we'll use mainContainer.scrollWidth and mainContainer.clientWidth.
        // This implies that mainContainer itself must be the element that has effective scrollWidth.
        // With overflow-x: hidden on main-container, its scrollWidth might be just its clientWidth.
        // The actual element that scrolls is content-wrapper, but we are listening to scroll events on main-container.
        // Let's make mainContainer the scrollable element for JS, and hide its bar with CSS.
        // This means main-container needs overflow-x: scroll internally, but CSS hides the bar.
        // The current style.css has overflow-x: hidden for main-container.
        // This needs mainContainer.scrollLeft to be programmatically changed.
        // The scroll event on mainContainer will only fire if it's actually scrollable (overflow: scroll or auto)
        // OR if its scrollLeft property is changed programmatically, which is what we do.

        const scrollableWidth = mainContainer.scrollWidth - mainContainer.clientWidth;
        if (scrollableWidth <= 0) {
            scrollbarThumb.style.width = '0px'; // Hide thumb if not scrollable
            return;
        }

        const scrollPercentage = mainContainer.scrollLeft / scrollableWidth;

        // Thumb width relative to the visible portion of the scrollbar container
        const thumbWidth = Math.max(20, scrollbarContainer.clientWidth * (mainContainer.clientWidth / mainContainer.scrollWidth)); // Min width 20px

        scrollbarThumb.style.width = `${thumbWidth}px`;
        const thumbPosition = scrollPercentage * (scrollbarContainer.clientWidth - thumbWidth);
        scrollbarThumb.style.left = `${thumbPosition}px`;
    }

    // Listen for scroll events on mainContainer
    // This event fires when mainContainer.scrollLeft changes
    mainContainer.addEventListener('scroll', updateScrollbar);

    // Initial update
    // We need to ensure mainContainer has its scrollWidth correctly set up first.
    // This can be tricky if its overflow is hidden.
    // A slight delay or ensuring content is loaded might be needed for accurate scrollWidth.
    requestAnimationFrame(updateScrollbar);


    let isDragging = false;
    let startX;
    let startScrollLeft;

    scrollbarThumb.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent text selection and other default behaviors
        isDragging = true;
        startX = e.clientX;
        startScrollLeft = mainContainer.scrollLeft;
        scrollbarThumb.style.backgroundColor = '#333';
        document.body.style.cursor = 'grabbing'; // Indicate dragging
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const deltaX = e.clientX - startX;
        // How much the thumb has moved as a percentage of the scrollbar track
        const scrollableTrackWidth = scrollbarContainer.clientWidth - scrollbarThumb.offsetWidth;

        if (scrollableTrackWidth === 0) return; // Avoid division by zero

        // Calculate how much mainContainer should scroll
        // The change in scrollLeft should be proportional to how much the thumb moved relative to the track
        const scrollDelta = (deltaX / scrollableTrackWidth) * (mainContainer.scrollWidth - mainContainer.clientWidth);
        mainContainer.scrollLeft = startScrollLeft + scrollDelta;
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            scrollbarThumb.style.backgroundColor = '#555';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
        }
    });

    scrollbarContainer.addEventListener('click', (e) => {
        if (e.target === scrollbarContainer) { // Clicked on container, not thumb
            const rect = scrollbarContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left; // X position relative to container
            const thumbWidth = scrollbarThumb.offsetWidth;

            // Calculate desired scroll position as if the middle of the thumb was clicked
            const desiredThumbLeft = clickX - thumbWidth / 2;
            const scrollableTrackWidth = scrollbarContainer.clientWidth - thumbWidth;

            if (scrollableTrackWidth <= 0) return;

            const scrollPercentage = Math.min(1, Math.max(0, desiredThumbLeft / scrollableTrackWidth));
            mainContainer.scrollLeft = scrollPercentage * (mainContainer.scrollWidth - mainContainer.clientWidth);
        }
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(updateScrollbar);
    });
});
