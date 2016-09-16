var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';

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

    var photoEl = document.getElementById('lightbox-photo');
    photoEl.setAttribute('src', getPhotoUrl(photo, 'z'));
}

function onCloseLightbox() {
    document.body.className = '';
}

function createThumbnailEl(photo) {
    var photoEl = document.createElement('img');
    photoEl.setAttribute('src', getPhotoUrl(photo, 'q'));
    photoEl.className = 'thumbnail';

    // Invisible until image is fully loaded
    onImageLoad(photoEl, function() {
        // NOTE: setTimeout(0) so that images fade in even when cached
        setTimeout(function() {
            photoEl.className += ' thumbnail-visible';
        }, 0);
    });

    var overlayTextEl = document.createElement('div');
    overlayTextEl.className = 'thumbnail-overlay-text';
    overlayTextEl.innerText = 'View';

    var overlayEl = document.createElement('div');
    overlayEl.className = 'thumbnail-overlay';
    overlayEl.appendChild(overlayTextEl);

    var wrapperEl = document.createElement('div');
    wrapperEl.className = 'thumbnail-wrapper';
    wrapperEl.appendChild(photoEl);
    wrapperEl.appendChild(overlayEl);
    wrapperEl.onclick = function() { onOpenLightbox(photo); }

    return wrapperEl;
}

function initLightboxHandlers() {
    var lightboxBgEl = document.getElementById('lightbox-background');
    lightboxBgEl.onclick = onCloseLightbox;
}

window.onload = function() {
    requestPhotoset('72157639990929493', function(response) {
        var photos = response.photoset.photo;
        var photosContainer = document.getElementById('photos-container');
        var photosEls = photos.map(createThumbnailEl);

        for (var photoEl of photosEls) {
            photosContainer.appendChild(photoEl);
        }
    }, function(errorStatus) {
        alert('there was an error!'); // TODO
    });

    initLightboxHandlers();
};
