var TRANSITION_PHOTO_MS = 400;
var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';
var DEFAULT_PHOTOSET_ID = '72157639990929493';

var PHOTOS_CONTAINER_EL, LIGHTBOX_CONTAINER_EL, LIGHTBOX_PHOTO_EL,
    LIGHTBOX_TITLE_EL, LIGHTBOX_LEFT_ARROW_EL, LIGHTBOX_RIGHT_ARROW_EL, MESSAGE_EL;

var photos = [];
var currentPhotoIndex = null;

// Animation timeouts from lightbox actions. Clear all of these when closing the lightbox.
var lightboxTimeouts = [];

// Gets the value assigned to the key in the URL's search string (e.g. ?photoset_id=1234)
function getUrlSearchValue(key) {
    var queries = window.location.search
        .slice(1) // Remove leading `?`
        .split('&'); // Split into array of key-values
    for (var query of queries) {
        var pair = query.split('=');
        if (pair.length === 2 && pair[0] === key) {
            return pair[1];
        }
    }
    return null;
}

function showMessage(message) {
    MESSAGE_EL.innerText = message;
    addClass(MESSAGE_EL, 'is-visible');
}

function hideMessage() {
    removeClass(MESSAGE_EL, 'is-visible');
}

// Modified from http://stackoverflow.com/a/22119674/4794892
function findAncestor(element, className) {
    while (element && !element.classList.contains(className)) {
        element = element.parentElement;
    }
    return element;
}

function applyToChildrenWithClass(element, className, callback) {
    var children = element.children;
    var matchedChildren = [];
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.className && child.className.indexOf(className) !== -1) {
            matchedChildren.push(child);
        }
    }

    // Call callbacks at the end, in case callback modifies element.children
    matchedChildren.forEach(callback);
}

function registerLightboxTimeout(callback, timeout) {
    lightboxTimeouts.push(setTimeout(callback, timeout));
}

function addClass(element, className) {
    element.className += ' ' + className;
}

function removeClass(element, className) {
    element.className = element.className
        .split(' ')
        .filter(function(cn) { return cn !== className; })
        .join(' ')
        .trim();
}

function getPhotoUrl(photo, options) {
    return 'https://farm' + photo.farm + '.staticflickr.com/' +
        photo.server + '/' + photo.id + '_' + photo.secret + '_' + options + '.jpg';
}

function requestPhotoset(photosetID, resolve, reject) {
    var photosetUrl = FLICKR_HOST +
        '?method=flickr.photosets.getPhotos' +
        '&api_key=' + FLICKR_API_KEY +
        '&photoset_id=' + photosetID +
        '&format=json&nojsoncallback=1';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', photosetUrl, true);
    xhr.send();
    xhr.onload = function() {
        if (this.status >= 200 && this.status < 300) {
            resolve(JSON.parse(xhr.response));
        } else {
            reject(xhr.statusText);
        }
    };
}

function onImageLoad(imageEl, callback) {
    if (imageEl.complete) {
        callback();
    } else {
        imageEl.onload = function() {
            callback();

            // Clear onLoad, according to http://stackoverflow.com/a/52597/4794892
            imageEl.onload = function() {};
        }
    }
}

function onOpenLightbox(photo, index) {
    currentPhotoIndex = index;

    addClass(document.body, 'lightbox-open');

    addPhotoElement(photo, 'enter');
}

function onCloseLightbox() {
    currentPhotoIndex = null;

    removeClass(document.body, 'lightbox-open');

    // Clear all timeouts
    lightboxTimeouts.forEach(function(timeout) { clearTimeout(timeout); });
    lightboxTimeouts = [];

    // Remove all photo elements
    applyToChildrenWithClass(LIGHTBOX_CONTAINER_EL, 'lightbox-photo', function(child) {
        LIGHTBOX_CONTAINER_EL.removeChild(child);
    });
}

function animatePhotoOut(element, animationClass) {
    addClass(element, animationClass);

    // Hide the title while photo is animating out
    applyToChildrenWithClass(element, 'lightbox-photo-title', function(child) {
        removeClass(child, 'is-visible');
    });

    registerLightboxTimeout(function() {
        LIGHTBOX_CONTAINER_EL.removeChild(element);
    }, TRANSITION_PHOTO_MS);
}

function addPhotoElement(photo, transitionClassName) {
    // Create img tag element
    var photoImgEl = document.createElement('img');
    addClass(photoImgEl, 'lightbox-photo-img');
    photoImgEl.setAttribute('src', getPhotoUrl(photo, 'z'));

    // Create border element (matches image size, shows a placeholder box while
    // img is loading)
    var photoBorderEl = document.createElement('div');
    addClass(photoBorderEl, 'lightbox-photo-border');
    photoBorderEl.appendChild(photoImgEl);

    // Set the current title to this photo
    var photoTitleEl = document.createElement('div');
    addClass(photoTitleEl, 'lightbox-photo-title');
    photoTitleEl.innerText = photo.title;

    // Create wrapper element (positioned absolutely so they stack while animating)
    var photoEl = document.createElement('div');
    addClass(photoEl, 'lightbox-photo');
    addClass(photoEl, 'is-loading');
    addClass(photoEl, transitionClassName);
    photoEl.appendChild(photoBorderEl);
    photoEl.appendChild(photoTitleEl);

    // Add wrapper element to lightbox
    LIGHTBOX_CONTAINER_EL.appendChild(photoEl);

    // Once the photo animates into place, show the title
    registerLightboxTimeout(function() {
        addClass(photoTitleEl, 'is-visible');
    }, TRANSITION_PHOTO_MS);

    // Once the photo loads, show it and hide the spinner
    onImageLoad(photoImgEl, function() {
        addClass(photoEl, 'is-visible');
        removeClass(photoEl, 'is-loading');
    });
}

function onPrevPhoto() {
    if (currentPhotoIndex === 0) { return; }
    currentPhotoIndex -= 1;
    var photo = photos[currentPhotoIndex];

    // Remove old photo element
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-right');

    addPhotoElement(photo, 'enter-left');
}

function onNextPhoto() {
    if (currentPhotoIndex + 1 === photos.length) { return; }
    currentPhotoIndex += 1;
    var photo = photos[currentPhotoIndex];

    // Remove old photo element
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-left');

    addPhotoElement(photo, 'enter-right');
}

function onKeyDown(e) {
    // Do nothing if lightbox is closed
    if (currentPhotoIndex === null) { return; }

    switch (e.keyCode) {
        case 27: // esc
            return onCloseLightbox();
        case 37: // left arrow
            return onPrevPhoto();
        case 39: // right arrow
            return onNextPhoto();
    }
}

function createThumbnailEl(photo, index) {
    var photoEl = document.createElement('img');
    photoEl.setAttribute('src', getPhotoUrl(photo, 'q'));
    addClass(photoEl, 'thumbnail');

    var wrapperEl = document.createElement('div');
    addClass(wrapperEl, 'thumbnail-wrapper is-loading');
    wrapperEl.appendChild(photoEl);
    wrapperEl.onclick = function() { onOpenLightbox(photo, index); }
    // TODO: reduce number of click handlers?

    onImageLoad(photoEl, function() {
        addClass(photoEl, 'is-visible');
        removeClass(wrapperEl, 'is-loading');
    });

    return wrapperEl;
}

function initAppHandlers() {
    LIGHTBOX_CONTAINER_EL.onclick = function(event) {
        // If clicking on the photo itself, go to next photo
        if (findAncestor(event.target, 'lightbox-photo-img') !== null) {
            onNextPhoto();
        } else {
            onCloseLightbox();
        }
    }
    LIGHTBOX_LEFT_ARROW_EL.onclick = function(event) {
        event.stopPropagation();
        onPrevPhoto();
    }
    LIGHTBOX_RIGHT_ARROW_EL.onclick = function(event) {
        event.stopPropagation();
        onNextPhoto();
    }
    document.addEventListener('keydown', onKeyDown, false);
}

window.onload = function() {
    PHOTOS_CONTAINER_EL = document.getElementById('photos-container');
    LIGHTBOX_CONTAINER_EL = document.getElementById('lightbox-container');
    LIGHTBOX_PHOTO_EL = document.getElementById('lightbox-photo');
    LIGHTBOX_TITLE_EL = document.getElementById('lightbox-title');
    LIGHTBOX_LEFT_ARROW_EL = document.getElementById('lightbox-left-arrow');
    LIGHTBOX_RIGHT_ARROW_EL = document.getElementById('lightbox-right-arrow');
    MESSAGE_EL = document.getElementById('message');

    var photoSetId = getUrlSearchValue('photoset') || DEFAULT_PHOTOSET_ID;

    requestPhotoset(photoSetId, function(response) {
        if (response.stat === 'fail') {
            if (response.code === 1) {
                showMessage('The photoset was not found.');
            } else {
                showMessage('There was a problem loading the photoset.');
            }
            return;
        }

        hideMessage(); // It was successful; hide any error messages

        photos = response.photoset.photo;
        var photosEls = photos.map(createThumbnailEl);

        for (var photoEl of photosEls) {
            PHOTOS_CONTAINER_EL.appendChild(photoEl);
        }
    }, function(errorStatus) {
        showMessage('There was a problem loading the photoset.');
    });

    initAppHandlers();
};
