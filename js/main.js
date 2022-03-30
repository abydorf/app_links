/**
 * show an element
 * @param {Object} HTML element to show
 */
function show(element) {
    element.classList.remove('u__hidden');
    element.classList.add('u__shown')
}

/**
 * hide an element
 * @param {Object} HTML element to hide
 */
function hide(element) {
    element.classList.remove('u__shown');
    element.classList.add('u__hidden')
}

/**
 * render elements into DOM
 * @param template HTML or simple string to render
 * @param {object} node HTML element as object to render template into
 */
function render(template, node) {
    node.innerHTML = template;
}

/**
 * generate the HTML for the different link areas by tag
 * @param {object} tags tags available
 * @returns {HTML} html for whole tags area
 */
function getTagsHTML(tags) {
    let html = '';
    for (let i = 0; i < tags.length; i++) {
        html += `<dl class="tags ${tags[i].data.name}" data-tagid="${tags[i].ref['@ref'].id}">
            <dt>${tags[i].data.name}</dt>
            <dd>${renderLoadingIndicator()}</dd>
        </dl>`;
    }
    return html;
}

/**
 * generate the HTML for the dropdown
 * @param {object} tags tags available
 * @returns {HTML} html for select including its dropdowns with tags
 */
function getDropdownValues(tags) {
    let html = '';
    const selectField = document.createElement('select');
    for (let i = 0; i < tags.length; i++) {
        html += `<option value='${tags[i].ref['@ref'].id}'>${tags[i].data.name}</option>`;
    }
    selectField.innerHTML = html;
    return selectField;
}

/**
 * generate the HTML for the links
 * @param {object} links links as object
 * @param {string} tagName name of the tag for replacing whole HTML in container
 * @returns {HTML} html for links
 */
function getLinksHTML(links, tagName) {
    let html = `<dt class="tags__title">${tagName}</dt>`;
    for (let i = 0; i < links.length; i++) {
        html += `<dd><a href="${links[i].url}">${links[i].title}</a></dd>`;
    }
    return html;
}

/**
 * to save the link in the database
 * @param {object} data the link data (url, title, tag reference) to be saved
 * @returns void
 */
function saveLink(data) {
    fetch(`/.netlify/functions/links/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
    });
    return false;
}

/**
 * return SVG for rendering a loading indicator
 */
function renderLoadingIndicator() {
    return '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 100 100" class="loading-indicator" style="height:30px;width:30px"><circle cx="50" cy="50" r="35" fill="none" stroke="#d1d1d1" stroke-dasharray="164.93361431 56.97787144" stroke-width="5"><animateTransform attributeName="transform" dur="1s" keyTimes="0;1" repeatCount="indefinite" type="rotate" values="0 50 50;360 50 50"/></circle></svg>';
}

(() => {

    const submitButton = document.querySelector('#add button');
    submitButton.addEventListener('click', function(e) {
        if (e.target.parentNode.querySelector('[type="url"]').validity.valid && e.target.parentNode.querySelector('[type="text"]').validity.valid) {
            let tags = [];
            tags.push(e.target.parentNode.querySelector('select').options[e.target.parentNode.querySelector('select').selectedIndex].value);
            let data = {
                'url': e.target.parentNode.querySelector('[type="url"]').value,
                'title': e.target.parentNode.querySelector('[type="text"]').value,
                'tag': tags
            }
            saveLink(data);
            return false;
        }
        return false;
    });

    async function getData() {
        let tags;
        await
            fetch(`/.netlify/functions/links/tags`)
                .then(response => response.json())
                .then(function(data) {
                    render(getTagsHTML(data.data), document.getElementById('content'));
                    document.getElementById('add').insertBefore(getDropdownValues(data.data), submitButton);
                    tags = data.data;
                });
        tags.forEach(function(tag) {
            let tagId = tag.ref['@ref'].id;
            let tagContainer;
            let tagName = tag.data.name;
            Array.from(document.querySelectorAll('[data-tagid]')).forEach(function(container) {
                if (container.dataset.tagid === tagId) {
                    tagContainer = container;
                    console.log(tagContainer)
                }
            });
            fetch(`/.netlify/functions/links?tagid=${tagId}`)
                .then(response => response.json())
                .then(function(data) {
                    let links = [];
                    for (let i = 0; i < data.data.length; i++) {
                        links.push({ 
                            'tagId': tagId,
                            'url': data.data[i].data.url,
                            'title': data.data[i].data.title
                        });
                    }
                    render(getLinksHTML(links, tagName), tagContainer);
                });
        });
    }

    getData()
        .catch(error => console.log(error));

})();