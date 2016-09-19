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
