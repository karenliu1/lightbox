var TRANSITION_FAST_MS = 200;
var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';

var PHOTOS_CONTAINER_EL, LIGHTBOX_CONTAINER_EL, LIGHTBOX_BG_EL, LIGHTBOX_PHOTO_EL;

var photos = [];
var currentPhotoIndex = null;

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

    addPhotoElement(photo);
}

function onCloseLightbox() {
    currentPhotoIndex = null;

    removeClass(document.body, 'lightbox-open');

    // Remove all photo elements
    for (var child of LIGHTBOX_CONTAINER_EL.children) {
        if (child.className && child.className.indexOf('lightbox-photo') !== -1) {
            LIGHTBOX_CONTAINER_EL.removeChild(child);
        }
    }
}

function animatePhotoOut(element, animationClass) {
    addClass(element, animationClass);

    // TODO: clear these timeouts on close
    setTimeout(function() {
        LIGHTBOX_CONTAINER_EL.removeChild(element);
    }, TRANSITION_FAST_MS);
}

// TODO: transition in from left or right or up
function addPhotoElement(photo) {
    // Create img tag element
    var photoImgEl = document.createElement('img');
    photoImgEl.setAttribute('src', getPhotoUrl(photo, 'z'));

    // Create wrapper element
    var photoEl = document.createElement('div');
    addClass(photoEl, 'lightbox-photo');
    addClass(photoEl, 'is-loading');
    photoEl.appendChild(photoImgEl);

    // Add wrapper element to lightbox
    LIGHTBOX_CONTAINER_EL.appendChild(photoEl);

    // Once the photo loads, show it and hide the spinner
    onImageLoad(photoImgEl, function() {
        addClass(photoEl, 'is-visible');
        removeClass(photoEl, 'is-loading');
    });
}

function onPrevPhoto() {
    currentPhotoIndex -= 1; // TODO: boundary checks
    var photo = photos[currentPhotoIndex];

    // Remove old photo element
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-right');

    addPhotoElement(photo);
}

function onNextPhoto() {
    currentPhotoIndex += 1; // TODO: boundary checks
    var photo = photos[currentPhotoIndex];

    // Remove old photo element
    animatePhotoOut(LIGHTBOX_CONTAINER_EL.lastElementChild, 'exit-left');

    addPhotoElement(photo);
}

function onKeyDown(e) {
    // TODO: do nothing if lightbox is closed or no photos have loaded

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

    onImageLoad(photoEl, function() {
        addClass(photoEl, 'is-visible');
        removeClass(wrapperEl, 'is-loading');
    });

    return wrapperEl;
}

function initAppHandlers() {
    LIGHTBOX_BG_EL.onclick = onCloseLightbox;
    document.addEventListener('keydown', onKeyDown, false);
}

window.onload = function() {
    PHOTOS_CONTAINER_EL = document.getElementById('photos-container');
    LIGHTBOX_CONTAINER_EL = document.getElementById('lightbox-container');
    LIGHTBOX_PHOTO_EL = document.getElementById('lightbox-photo');
    LIGHTBOX_BG_EL = document.getElementById('lightbox-background');

    requestPhotoset('72157639990929493', function(response) {
        photos = response.photoset.photo;
        var photosEls = photos.map(createThumbnailEl);

        for (var photoEl of photosEls) {
            PHOTOS_CONTAINER_EL.appendChild(photoEl);
        }
    }, function(errorStatus) {
        alert('there was an error!'); // TODO
    });

    initAppHandlers();
};
