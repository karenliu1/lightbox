var FLICKR_HOST = 'https://api.flickr.com/services/rest/';
var FLICKR_API_KEY = '54ae5507d84488bba4a35fa02d93b6f2';

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

window.onload = function() {
    requestPhotoset('72157639990929493', function(response) {
        var photos = response.photoset.photo;
        var photosContainer = document.getElementById('photos-container');
        var photosHTML = photos.map(function(photo) {
            var photoURL = 'https://farm' + photo.farm + '.staticflickr.com/' +
                photo.server + '/' + photo.id + '_' + photo.secret + '_s.jpg';
            return '<img src="' + photoURL + '" class="thumbnail" />';
        }).slice(0, 8); // TODO remove cap
        photosContainer.innerHTML = photosHTML.join('\n');
    }, function(errorStatus) {
        alert('there was an error!'); // TODO
    });
};
