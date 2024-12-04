const log = {
    info: (...args) => {
        console.log('[MS]', ...args);
    },
    error: (...args) => {
        console.error('[MS]', ...args);
    },
};

// this is needed to avoid hiding the feed items that are already hidden by the website
const BLUESKY_HIDDEN_FEED_SELECTOR = '.r-hvic4v, [style*="display: none"]';

// Global constant: List of selectors to hide
const SELECTORS = {
    // notifications + user posts + any feed
    'bsky.app': `div:not(:has(.r-hvic4v *)) > div > div:is([data-testid*="FeedPage-feed"], [data-testid*="postsFeed"]) > div[data-testid*="-flatlist"] > div > div > div > div[data-testid]`,
    'linkedin.com': '.scaffold-finite-scroll__content > div > div[data-id^="urn:li:activity"]',
};

const POSTS_INCREMENT = 1;


const getPostSelector = () => {
    const host = getHost();
    for (const knownHost of Object.keys(SELECTORS)) {
        if (host === knownHost) {
            return SELECTORS[knownHost];
        }
    }
    return null;
}

const getHost = () => {
    return window.location.host.replace(/^www\./, '');
}

const isSupportedHost = () => {
    return getPostSelector() !== null;
}

// Global variable to set the number of records to display
let maxRecordsToDisplay = 0;

log.info('Script initialized');

// get the feed items that are visible
const getPotentialVisibleFeedItems = () => {
    log.info('updateFeedDisplay called');
    // Get all feed items that are not hidden by selectors
    let allFeedItems = Array.from(document.querySelectorAll(getPostSelector()))
        .filter(el => !el.dataset.hiddenBySelector)

    // filter out hidden stuff on bluesky.app
    if (getHost() === 'bsky.app') {
        allFeedItems = allFeedItems.filter((el) => !el.closest(BLUESKY_HIDDEN_FEED_SELECTOR));
    }

    // filter out the items that are not visible due to something else
    // const allFeedItemsVisible = allFeedItems.filter(el => window.getComputedStyle(el).display !== 'none');
    const allFeedItemsVisible = allFeedItems;

    return allFeedItemsVisible;
}

/**
 * Updates the feed to display up to 'maxRecordsToDisplay' items.
 */
function updateFeedDisplay() {
    const allFeedItemsVisible = getPotentialVisibleFeedItems();

    allFeedItemsVisible.forEach((el, index) => {
        // log.info('Processing feed item', index, "maxRecordsToDisplay", maxRecordsToDisplay, "is visible", index < maxRecordsToDisplay);
        if (index < maxRecordsToDisplay) {
            el.classList.remove('hidden-by-mindfulscroll');
            el.classList.add('visible-by-mindfulscroll');
        } else {
            el.classList.add('hidden-by-mindfulscroll');
        }
    });
}

/**
 * Creates and returns the 'Show More' button.
 */
function getCounterButton() {
    log.info('Creating Show More button');
    const button = document.createElement('button');
    button.id = 'showMoreButton';
    button.textContent = 'Show More';
    button.style.position = 'fixed';
    button.style.bottom = '300px';
    button.style.right = '300px';
    button.style.zIndex = '9999';
    button.style.cursor = 'move';
    button.style.backgroundColor = '#007bff';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '5px';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    button.style.userSelect = 'none';    // Prevent text selection during drag
    button.style.resize = 'none';        // Prevent resizing
    button.style.overflow = 'hidden';    // Hide overflow

    // Declare variables
    let isDragging = false;
    let mousedownTime = 0;
    let mouseupTime = 0;

    button.onclick = function(event) {
        let clickDuration = mouseupTime - mousedownTime;
        if (isDragging || clickDuration > 200) {
            // If dragging or long press, prevent click action
            event.preventDefault();
            return false;
        } else {
            maxRecordsToDisplay += POSTS_INCREMENT;
            updateFeedDisplay();
            updateButtonText();
        }
    };

    button.onmousedown = function(event) {
        event.preventDefault();

        isDragging = false;
        mousedownTime = Date.now();
        let startX = event.clientX;
        let startY = event.clientY;

        const rect = button.getBoundingClientRect();

        // Set 'left' and 'top' to the current position
        button.style.left = rect.left + 'px';
        button.style.top = rect.top + 'px';

        button.style.bottom = 'auto';
        button.style.right = 'auto';

        // Calculate the shift between mouse and button coordinates
        let shiftX = event.clientX - rect.left;
        let shiftY = event.clientY - rect.top;

        log.info('shiftX', shiftX, 'shiftY', shiftY, 'rect', rect);

        function moveAt(clientX, clientY) {
            button.style.top = clientY - shiftY + 'px';
            button.style.left = clientX - shiftX + 'px';
        }

        function onMouseMove(event) {
            if (!isDragging) {
                let dx = event.clientX - startX;
                let dy = event.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                }
            }
            moveAt(event.clientX, event.clientY);
        }

        // Move the button on mousemove
        document.addEventListener('mousemove', onMouseMove);

        // Remove the handlers on mouseup
        document.addEventListener('mouseup', function onMouseUp(event) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            mouseupTime = Date.now();  // Record the time when mouseup occurs
        });
    };

    button.ondragstart = function() {
        return false;
    };

    return button;
}

/**
 * Adds or updates the 'Show More' button.
 */
function addShowMoreButton() {
    log.info('addShowMoreButton called');
    const firstFeedItem = document.querySelector(getPostSelector());

    if (firstFeedItem) {
        // Check if the button already exists
        let button = document.getElementById('showMoreButton');
        if (!button) {
            button = getCounterButton();
            // Append the button to the body so it floats
            document.body.appendChild(button);
        }
        updateButtonText();
    } else {
        log.info('No feed items found, setting up observer');
        // No feed items found, set up an observer to wait for them
        waitForFeedItems();
    }
}

/**
 * Waits for feed items to be added to the DOM and then processes the feed.
 */
function waitForFeedItems() {
    const feedObserver = new MutationObserver((mutations, observer) => {
        const firstFeedItem = document.querySelector(getPostSelector());
        if (firstFeedItem) {
            log.info('Feed items found, processing feed');
            // Feed items are now available, process the feed
            observer.disconnect(); // Stop observing
            processFeed();
        }
    });

    // Observe the body for additions of feed items
    feedObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Updates the button text to reflect the current 'maxRecordsToDisplay' value.
 */
function updateButtonText() {
    log.info('updateButtonText called');
    const button = document.getElementById('showMoreButton');
    if (button) {
        button.textContent = `Show More (now: ${maxRecordsToDisplay})`;
    }
}

/**
 * Main function to process the feed.
 */
function processFeed() {
    log.info('processFeed called');
    updateFeedDisplay();
    addShowMoreButton();
}

/**
 * Resets the script by resetting variables and re-processing the feed.
 */
function resetScript() {
    if (!isSupportedHost()) {
        log.info('Unsupported host, exiting');
        return;
    }
    log.info('resetScript called');
    // Reset the maxRecordsToDisplay
    maxRecordsToDisplay = 0;
    // Clear any previous data attributes and classes
    const allFeedItems = document.querySelectorAll(getPostSelector());
    allFeedItems.forEach(el => {
        delete el.dataset.hiddenBySelector;
        el.classList.remove('hidden-by-mindfulscroll');
    });
    // Remove the Show More button if it exists
    const button = document.getElementById('showMoreButton');
    if (button) {
        button.remove();
    }
    // Re-run the script
    processFeed();
}

/**
 * Injects the CSS class into the page.
 */
function injectCSS() {
    log.info('injectCSS called');
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .hidden-by-mindfulscroll {
            // display: none !important;
            height: 0 !important;
            opacity: 0 !important;
        }
    `;
    document.head.appendChild(style);
}

// Observe the DOM for changes and re-run 'processFeed' when mutations occur
const observer = new MutationObserver(mutations => {
    // Check if new feed items are added or removed
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
            log.info('DOM mutation detected, processing feed');
            processFeed();
            break;
        }
    }
});

// Enhanced navigation detection
function onNavigation() {
    if (!isSupportedHost()) {
        log.info('Unsupported host, not doing anything');
        return;
    }
    const host = window.location.host.replace(/^www\./, '');

    log.info('Navigation detected, resetting script in 500ms');
    // setTimeout(resetScript, 500);
    resetScript();
}


if (isSupportedHost()) {
    // Initial run
    injectCSS();
    processFeed();

    observer.observe(document.body, { childList: true, subtree: true });
    // Listen to 'popstate' event for back/forward navigation
    window.addEventListener('popstate', onNavigation);

    // Override 'pushState' and 'replaceState' to detect SPA navigation
    (function(history) {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        history.pushState = function() {
            const result = pushState.apply(history, arguments);
            log.info('pushState called, resetting script');
            onNavigation();
            return result;
        };

        history.replaceState = function() {
            const result = replaceState.apply(history, arguments);
            log.info('replaceState called, resetting script');
            onNavigation();
            return result;
        };
    })(window.history);

    // Observe changes to the document title
    const titleElement = document.querySelector('title');
    if (titleElement) {
        const titleObserver = new MutationObserver(() => {
            log.info('Title change detected, resetting script');

            onNavigation();
        });
        titleObserver.observe(titleElement, { subtree: true, characterData: true, childList: true });
    }
}