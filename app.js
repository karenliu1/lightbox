var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';

var PHOTOS_CONTAINER, LIGHTBOX_BG_EL, LIGHTBOX_PHOTO_EL;

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

    LIGHTBOX_PHOTO_EL.setAttribute('src', getPhotoUrl(photo, 'z'));
    addClass(LIGHTBOX_BG_EL, 'is-loading');

    // Animate first photo in, hide the spinner
    onImageLoad(LIGHTBOX_PHOTO_EL, function() {
        addClass(LIGHTBOX_PHOTO_EL, 'is-visible');
        removeClass(LIGHTBOX_BG_EL, 'is-loading');
    });
}

function onCloseLightbox() {
    currentPhotoIndex = null;

    removeClass(document.body, 'lightbox-open');

    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible');
    LIGHTBOX_PHOTO_EL.src = '';
}

function onPrevPhoto() {
    currentPhotoIndex -= 1; // TODO: boundary checks

    // Set the src to the next photo
    var photo = photos[currentPhotoIndex];
    LIGHTBOX_PHOTO_EL.setAttribute('src', getPhotoUrl(photo, 'z'));

    // Make the photo invisible and the spinner visible
    addClass(LIGHTBOX_BG_EL, 'is-loading');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-left');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-right');

    // On image load, animate the first photo in and hide the spinner
    onImageLoad(LIGHTBOX_PHOTO_EL, function() {
        addClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-left');
        removeClass(LIGHTBOX_BG_EL, 'is-loading');
    });
}

function onNextPhoto() {
    currentPhotoIndex += 1; // TODO: boundary checks

    // Set the src to the next photo
    var photo = photos[currentPhotoIndex];
    LIGHTBOX_PHOTO_EL.setAttribute('src', getPhotoUrl(photo, 'z'));

    // Make the photo invisible and the spinner visible
    addClass(LIGHTBOX_BG_EL, 'is-loading');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-left');
    removeClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-right');

    // On image load, animate the first photo in and hide the spinner
    onImageLoad(LIGHTBOX_PHOTO_EL, function() {
        addClass(LIGHTBOX_PHOTO_EL, 'is-visible-from-right');
        removeClass(LIGHTBOX_BG_EL, 'is-loading');
    });
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
    PHOTOS_CONTAINER = document.getElementById('photos-container');
    LIGHTBOX_PHOTO_EL = document.getElementById('lightbox-photo');
    LIGHTBOX_BG_EL = document.getElementById('lightbox-background');

    requestPhotoset('72157639990929493', function(response) {
        photos = response.photoset.photo;
        var photosEls = photos.map(createThumbnailEl);

        for (var photoEl of photosEls) {
            PHOTOS_CONTAINER.appendChild(photoEl);
        }
    }, function(errorStatus) {
        alert('there was an error!'); // TODO
    });

    initAppHandlers();
};
