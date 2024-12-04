/**
 * Delayed Gratification
 * 
 * Counter button that starts at 200 and remains constant until the counter is set to a value under 100.
 * When the counter is under or equal to 100, it starts counting down to -300.
 * If it's in the negative, social media apps are allowed.
 * 
 * On button click, the counter value is set to 30, then it starts the countdown to -300. When it reaches -300, it jumps back to 200.
 * So, I have to wait a certain amount of time before I can use social media apps.
 * 
 * The grey overlay is always active on social media sites when the counter is greater than or equal to 0, even if `lastClickedTime` is null.
 * 
 * (Interval is 1000ms in the final version.)
 */

// Constants
const START_VALUE = 200;
const THRESHOLD = 100;

const INTERVAL = 1000; // milliseconds

const MIN_VALUE = -300;
const CLICK_JUMP_VALUE = 30;

const log = {
    info: (...args) => {
        console.log('[DG]', ...args);
    },
    error: (...args) => {
        console.error('[DG]', ...args);
    }
};

// List of social media websites, including common ones and bsky.app
const SOCIAL_MEDIA_WEBSITES = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'youtube.com',
    'tiktok.com',
    'snapchat.com',
    'reddit.com',
    'pinterest.com',
    'bsky.app'
];

// allow specific reddit posts in case of eg. google search
const SOCIAL_MEDIA_ALLOW = [
    'reddit.com/r/.*/comments',
]

// Function to get the hostname and remove subdomain like www.
const getWebsite = () => {
    let hostname = window.location.hostname;
    if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
    }
    return hostname;
};

const getIsSocialMedia = () => {
    const currentWebsite = getWebsite();
    return SOCIAL_MEDIA_WEBSITES.includes(currentWebsite) && !SOCIAL_MEDIA_ALLOW.some((pattern) => new RegExp(pattern).test(window.location.href));
};

// Storage namespace for localStorage interactions
const storage = {
    // Function to set lastClickedTime to a specific value
    setLastClickedTime: (value) => {
        localStorage.setItem('DG_lastClickedTime', value.toString());
    },

    // Function to set lastClickedTime to now
    setLastClickedToNow: () => {
        storage.setLastClickedTime(Date.now());
    },

    // Function to get lastClickedTime
    getLastClickedTime: () => {
        const value = localStorage.getItem('DG_lastClickedTime');
        if (value === null) {
            return null;
        } else {
            return parseInt(value, 10);
        }
    },

    // Function to clear lastClickedTime
    clearLastClickedTime: () => {
        localStorage.removeItem('DG_lastClickedTime');
    }
};



// Function to add grey overlay
const addGreyOverlay = () => {
    // change the title to [Blocked]
    // to avoid showing notification count
    // in removeGreyOverlay function, this should be reversed
    if (!document.title.startsWith('[Blocked]')) {
        document.title = '[Blocked]' + '=====================' + document.title;
    }
    if (!document.getElementById('greyOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'greyOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(128, 128, 128, 1)'; // Solid grey
        overlay.style.zIndex = '9998'; // Behind the button
        document.body.appendChild(overlay);
    }
};

// Function to compute the counter value based on the elapsed time
const getCounterValue = () => {
    const lastClickedTime = storage.getLastClickedTime();

    // If lastClickedTime is null, counter stays at START_VALUE (200)
    if (lastClickedTime === null) {
        return START_VALUE;
    }

    const now = Date.now();
    let elapsedTime = now - lastClickedTime;

    let counter = CLICK_JUMP_VALUE - Math.floor(elapsedTime / INTERVAL);

    if (counter >= MIN_VALUE) {
        return counter;
    } else {
        // Counter has reached MIN_VALUE
        // Reset lastClickedTime to null so the counter returns to START_VALUE
        storage.clearLastClickedTime();
        return START_VALUE;
    }
};

/**
 * Creates and returns the counter button.
 */
const getCounterButton = () => {
    log.info('Creating Counter button');
    const button = document.createElement('button');
    button.id = 'counterButton';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.cursor = 'move';
    button.style.backgroundColor = '#007bff'; // Initial color
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '5px';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    button.style.userSelect = 'none';    // Prevent text selection during drag
    button.style.resize = 'none';        // Prevent resizing
    button.style.overflow = 'hidden';    // Hide overflow
    button.style.fontWeight = 'bold';    // Make text bold

    // Set initial text content
    button.textContent = getCounterValue();

    // Function to update counter and button text
    const updateCounter = () => {
        const counter = getCounterValue();
        button.textContent = counter;

        // Change the button color based on the counter value
        if (counter < 0) {
            button.style.backgroundColor = 'green';
        } else if (counter <= 100) {
            button.style.backgroundColor = '#FF8C00'; // Dark orange
        } else {
            button.style.backgroundColor = 'blue';
        }
    };

    // Function to remove grey overlay
    const removeGreyOverlay = () => {
        document.title = document.title.replace(/^\[Blocked\]=+/, '');
        const overlay = document.getElementById('greyOverlay');
        if (overlay) {
            overlay.parentNode.removeChild(overlay);
        }
    };

    // Interval function
    const countDown = () => {
        const counter = getCounterValue();

        // Update the button display
        updateCounter();

        // Check if the website is social media or not
        const currentWebsite = getWebsite();
        const isSocialMedia = getIsSocialMedia();

        if (isSocialMedia) {
            log.info('Current website is a social media site:', currentWebsite);

            // Overlay is active whenever counter >= 0
            if (counter >= 0) {
                addGreyOverlay();
            } else {
                removeGreyOverlay();
            }
        } else {
            log.info('Current website is not a social media site:', currentWebsite);
            // Ensure overlay is removed if not on a social media site
            removeGreyOverlay();
        }
    };

    // Start the interval when the button is created
    setInterval(countDown, INTERVAL);

    // Declare variables for dragging
    let isDragging = false;
    let mousedownTime = 0;
    let mouseupTime = 0;

    button.onclick = (event) => {
        let clickDuration = mouseupTime - mousedownTime;
        if (isDragging || clickDuration > 200) {
            // If dragging or long press, prevent click action
            event.preventDefault();
            return false;
        } else {
            // On click, set lastClickedTime to start counting down from CLICK_JUMP_VALUE
            storage.setLastClickedToNow();
            updateCounter();
        }
    };

    button.onmousedown = (event) => {
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

        const moveAt = (clientX, clientY) => {
            button.style.top = clientY - shiftY + 'px';
            button.style.left = clientX - shiftX + 'px';
        };

        const onMouseMove = (event) => {
            if (!isDragging) {
                let dx = event.clientX - startX;
                let dy = event.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                }
            }
            moveAt(event.clientX, event.clientY);
        };

        const onMouseUp = (event) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            mouseupTime = Date.now();  // Record the time when mouseup occurs
        };

        // Move the button on mousemove
        document.addEventListener('mousemove', onMouseMove);

        // Remove the handlers on mouseup
        document.addEventListener('mouseup', onMouseUp);
    };

    button.ondragstart = () => {
        return false;
    };

    // Initialize the counter display
    updateCounter();

    return button;
};

// add overlay as fast as possible if on social media site
if (getIsSocialMedia()) {
    addGreyOverlay();
}

const counterButton = getCounterButton();

// Add the button to the HTML tree
document.body.appendChild(counterButton);
