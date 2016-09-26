var TRANSITION_PHOTO_MS = 400;
var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';
var DEFAULT_PHOTOSET_ID = '72157639990929493';
var SWIPE_DISTANCE_PX = 30; // How far you must move your finger to navigate

var PHOTOS_CONTAINER_EL, LIGHTBOX_CONTAINER_EL, LIGHTBOX_PHOTO_EL,
    LIGHTBOX_TITLE_EL, LIGHTBOX_LEFT_ARROW_EL, LIGHTBOX_RIGHT_ARROW_EL,
    MESSAGE_EL, LOADER_EL, PHOTOSET_TITLE_EL;

var photos = [];
var currentPhotoIndex = null;
var touchStartX = null;

// Animation timeouts from lightbox actions. Clear all of these when closing the lightbox.
var lightboxTimeouts = [];

function showMessage(message) {
    MESSAGE_EL.textContent = message;
    addClass(MESSAGE_EL, 'is-visible');
}

function hideMessage() {
    removeClass(MESSAGE_EL, 'is-visible');
}

function showLoader() {
    addClass(LOADER_EL, 'is-visible');
}

function hideLoader() {
    removeClass(LOADER_EL, 'is-visible');
}

function registerLightboxTimeout(callback, timeout) {
    lightboxTimeouts.push(setTimeout(callback, timeout));
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

// Prevents scrolling on mobile while the lightbox is open
function onTouchMoveLightbox(e) {
    e.preventDefault();
}

function onOpenLightbox(index) {
    currentPhotoIndex = index;
    addClass(document.body, 'lightbox-open');
    document.body.addEventListener('touchmove', onTouchMoveLightbox);
    addPhotoElement(photos[index], 'enter');
    showControls();
}

function onCloseLightbox() {
    currentPhotoIndex = null;
    removeClass(document.body, 'lightbox-open');
    document.body.removeEventListener('touchmove', onTouchMoveLightbox);

    // Clear all timeouts
    lightboxTimeouts.forEach(clearTimeout);
    lightboxTimeouts = [];

    // Remove all photo elements
    applyToChildrenWithClass(LIGHTBOX_CONTAINER_EL, 'lightbox-photo',
        LIGHTBOX_CONTAINER_EL.removeChild.bind(LIGHTBOX_CONTAINER_EL));
}

function animatePhotoOut(element, animationClass) {
    addClass(element, animationClass);

    // Hide the title while photo is animating out
    applyToChildrenWithClass(element, 'lightbox-photo-title', function(child) {
        removeClass(child, 'is-visible');
    });

    // Once animated out, remove from DOM
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

    // Create title/caption element
    var photoTitleEl = document.createElement('div');
    addClass(photoTitleEl, 'lightbox-photo-title');
    photoTitleEl.textContent = photo.title;

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
        removeClass(photoEl, 'is-loading');
    });
}

function showControls() {
    currentPhotoIndex === 0 ?
        removeClass(LIGHTBOX_LEFT_ARROW_EL, 'is-visible') :
        addClass(LIGHTBOX_LEFT_ARROW_EL, 'is-visible');
    currentPhotoIndex + 1 === photos.length ?
        removeClass(LIGHTBOX_RIGHT_ARROW_EL, 'is-visible') :
        addClass(LIGHTBOX_RIGHT_ARROW_EL, 'is-visible');
}

function onPrevPhoto() {
    if (currentPhotoIndex === 0) { return; }
    currentPhotoIndex -= 1;

    var photo = photos[currentPhotoIndex];
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-right'); // Remove old photo
    addPhotoElement(photo, 'enter-left');
    showControls();
}

function onNextPhoto() {
    if (currentPhotoIndex + 1 === photos.length) { return; }
    currentPhotoIndex += 1;

    var photo = photos[currentPhotoIndex];
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-left'); // Remove old photo
    addPhotoElement(photo, 'enter-right');
    showControls();
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

function onTouchStart(e) {
    // Do nothing if the lightbox is not open
    if (currentPhotoIndex === null) { return; }

    touchStartX = e.changedTouches[0].screenX;
}

function onTouchEnd(e) {
    // Do nothing if the lightbox is not open, or we don't have the start
    // position for some reason
    if (currentPhotoIndex === null || touchStartX === null) { return; }

    var touchEndX = e.changedTouches[0].screenX;
    if (touchEndX - touchStartX > SWIPE_DISTANCE_PX) {
        onPrevPhoto();
    } else if (touchStartX - touchEndX > SWIPE_DISTANCE_PX) {
        onNextPhoto();
    }

    touchStartX = null;
}

function createThumbnailEl(photo, index) {
    var photoEl = document.createElement('img');
    photoEl.setAttribute('src', getPhotoUrl(photo, 'q'));
    addClass(photoEl, 'thumbnail');

    var wrapperEl = document.createElement('button');
    addClass(wrapperEl, 'thumbnail-wrapper is-loading');
    wrapperEl.setAttribute('data-photo-index', index);
    wrapperEl.appendChild(photoEl);

    onImageLoad(photoEl, function() {
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
    PHOTOS_CONTAINER_EL.onclick = function(event) {
        // If clicking on a photo element, open that photo
        var thumbnailEl;
        if (thumbnailEl = findAncestor(event.target, 'thumbnail-wrapper')) {
            var index = parseInt(thumbnailEl.getAttribute('data-photo-index'));
            onOpenLightbox(index);
        }
    }
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('touchstart', onTouchStart, false);
    document.addEventListener('touchend', onTouchEnd, false);
}

window.onload = function() {
    PHOTOS_CONTAINER_EL = document.getElementById('photos-container');
    LIGHTBOX_CONTAINER_EL = document.getElementById('lightbox-container');
    LIGHTBOX_PHOTO_EL = document.getElementById('lightbox-photo');
    LIGHTBOX_TITLE_EL = document.getElementById('lightbox-title');
    LIGHTBOX_LEFT_ARROW_EL = document.getElementById('lightbox-left-arrow');
    LIGHTBOX_RIGHT_ARROW_EL = document.getElementById('lightbox-right-arrow');
    MESSAGE_EL = document.getElementById('message');
    LOADER_EL = document.getElementById('loader');
    PHOTOSET_TITLE_EL = document.getElementById('photoset-title');

    var photoSetId = getUrlSearchValue('photoset') || DEFAULT_PHOTOSET_ID;

    showLoader();
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
        hideLoader();

        PHOTOSET_TITLE_EL.textContent =
            response.photoset.title + ' by ' + response.photoset.ownername;

        photos = response.photoset.photo;
        var photosEls = photos.map(createThumbnailEl);
        photosEls.forEach(function(photoEl) {
            PHOTOS_CONTAINER_EL.appendChild(photoEl);
        });
    }, function(errorStatus) {
        showMessage('There was a problem loading the photoset.');
    });

    initAppHandlers();
};
