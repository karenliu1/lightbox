var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';

var PHOTOS_CONTAINER, LIGHTBOX_BG_EL, LIGHTBOX_PHOTO_EL;

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

function onOpenLightbox(photo) {
    document.body.className = 'lightbox-open';

    LIGHTBOX_PHOTO_EL.setAttribute('src', getPhotoUrl(photo, 'z'));
    LIGHTBOX_BG_EL.className = 'is-loading';

    // Animate first photo in, hide the spinner
    onImageLoad(LIGHTBOX_PHOTO_EL, function() {
        LIGHTBOX_PHOTO_EL.className += ' is-visible';
        LIGHTBOX_BG_EL.className = '';
    });
}

function onCloseLightbox() {
    document.body.className = '';

    LIGHTBOX_PHOTO_EL.className = '';
    LIGHTBOX_PHOTO_EL.src = '';
}

function createThumbnailEl(photo) {
    var photoEl = document.createElement('img');
    photoEl.setAttribute('src', getPhotoUrl(photo, 'q'));
    photoEl.className = 'thumbnail';

    var wrapperEl = document.createElement('div');
    wrapperEl.className = 'thumbnail-wrapper is-loading';
    wrapperEl.appendChild(photoEl);
    wrapperEl.onclick = function() { onOpenLightbox(photo); }

    onImageLoad(photoEl, function() {
        photoEl.className += ' is-visible';
        wrapperEl.className = 'thumbnail-wrapper';
    });

    return wrapperEl;
}

function initLightboxHandlers() {
    LIGHTBOX_BG_EL.onclick = onCloseLightbox;
}

window.onload = function() {
    PHOTOS_CONTAINER = document.getElementById('photos-container');
    LIGHTBOX_PHOTO_EL = document.getElementById('lightbox-photo');
    LIGHTBOX_BG_EL = document.getElementById('lightbox-background');

    requestPhotoset('72157639990929493', function(response) {
        var photos = response.photoset.photo;
        var photosEls = photos.map(createThumbnailEl);

        for (var photoEl of photosEls) {
            PHOTOS_CONTAINER.appendChild(photoEl);
        }
    }, function(errorStatus) {
        alert('there was an error!'); // TODO
    });

    initLightboxHandlers();
};
