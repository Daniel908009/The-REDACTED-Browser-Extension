chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateCensoring"){
        window.location.reload();
    }
});

function getCharacterOffset(text, wordIndex) {
    let offset = 0;
    let words = text.split(" ");
    for (let i = 0; i < wordIndex && i < words.length; i++) {
        offset += words[i].length + 1;
    }
    return offset;
}

function censorPage() {
    observer.disconnect();
    const walker = document.createTreeWalker(document.body,
    NodeFilter.SHOW_TEXT,
    {
        acceptNode: function(node) {
            if(node.nodeValue.trim() === "") return NodeFilter.FILTER_REJECT;
            if(node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('censored')) {
                return NodeFilter.FILTER_REJECT;
            }
            const parent = node.parentNode;
            if (!parent){
                return NodeFilter.FILTER_REJECT;
            }
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'iframe', 'code', 'pre'].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
            }
            if (parent.classList && parent.classList.contains('censored')) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    }
    );
    let node;
    while (node = walker.nextNode()) {
        censorNode(node);
    }
    let imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
        if (Math.random() < 0.5) {
            processImage(img);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function processImage(img) {
    let div = document.createElement('div');
    div.style.position = "relative";
    div.style.display = "inline-block";
    img.parentNode.insertBefore(div, img);
    div.appendChild(img);
    let censorSpan = document.createElement("span");
    censorSpan.style.position = "absolute";
    let offsetTop, offsetLeft, width, height;
    let imagerect = img.getBoundingClientRect();
    offsetTop = Math.random() * (imagerect.height - imagerect.height / 3);
    offsetLeft = Math.random() * (imagerect.width - imagerect.width / 4);
    width = Math.random() * (imagerect.width - offsetLeft - imagerect.width / 4) + imagerect.width / 4;
    height = Math.random() * (imagerect.height - offsetTop - imagerect.height / 3) + imagerect.height / 3;
    censorSpan.style.top = offsetTop + "px";
    censorSpan.style.left = offsetLeft + "px";
    censorSpan.style.width = width + "px";
    censorSpan.style.height = height + "px";
    censorSpan.style.backgroundColor = "black";
    censorSpan.classList.add("censored");
    div.appendChild(censorSpan);
}

function censorNode(node) {
    const words = node.nodeValue.match(/\p{L}+/gu);
    if (!words) return;
    if (words.length == 1){
        if(Math.random() < 0.5) {
            placeSpan({ node, offset: 0, length: node.nodeValue.length });
        }
    }else {
        let numberOfCensoredWords = Math.floor(Math.random() * (words.length - 1)) + 1;
        let wordOffset = 0;
        if (numberOfCensoredWords < words.length) {
            wordOffset = Math.floor(Math.random() * (words.length - numberOfCensoredWords));
        }
        let offset = getCharacterOffset(node.nodeValue, wordOffset);
        let length = getCharacterOffset(node.nodeValue, wordOffset + numberOfCensoredWords) - offset - 1;
        if (length > 2) {
            placeSpan({ node, offset, length });
        }
    }
}

function placeSpan({ node, offset, length }) {
    let range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + length);
    let censorSpan = document.createElement("span");
    censorSpan.style.backgroundColor = "black";
    censorSpan.style.color = "black";
    censorSpan.textContent = node.nodeValue.substring(offset, offset + length);
    censorSpan.classList.add("censored");
    range.deleteContents();
    range.insertNode(censorSpan);
}

const observer = new MutationObserver((mutations) => {
    observer.disconnect();
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.nodeValue.trim() !== "" && node.parentNode) {
                    censorNode(node);
                }
            } else if (node.nodeType === node.ELEMENT_NODE && node.tagName === "IMG") {
                if (Math.random() < 0.5) {
                    node.addEventListener('load', () => {
                        if (!node.dataset.processed) {
                            processImage(node);
                            node.dataset.processed = "true";
                        }
                    });
                    if (node.complete) {
                        if (!node.dataset.processed) {
                            processImage(node);
                            node.dataset.processed = "true";
                        }
                    }
                }
            }else if (node.nodeType === Node.ELEMENT_NODE) {
                const walker = document.createTreeWalker(node,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            if(node.nodeValue.trim() === "") return NodeFilter.FILTER_REJECT;
                            if(node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('censored')) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            const parent = node.parentNode;
                            if (!parent){
                                return NodeFilter.FILTER_REJECT;
                            }
                            const tag = parent.tagName.toLowerCase();
                            if (['script', 'style', 'noscript', 'iframe', 'code', 'pre'].includes(tag)) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            if (parent.classList && parent.classList.contains('censored')) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );
                let textNode;
                while (textNode = walker.nextNode()) {
                    if (textNode.nodeValue.trim() !== "" && textNode.parentNode) {
                        censorNode(textNode);
                    }
                }
                const images = node.querySelectorAll('img');
                images.forEach(img => {
                    if (Math.random() < 0.5) {
                        img.addEventListener('load', () => {
                            if (!img.dataset.processed) {
                                processImage(img);
                                img.dataset.processed = "true";
                            }
                        });
                        if (img.complete) {
                            if (!img.dataset.processed) {
                                processImage(img);
                                img.dataset.processed = "true";
                            }
                        }
                    }
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
});


chrome.storage.sync.get('censoringEnabled', (data) => {
    if (data.censoringEnabled) {
        censorPage();
        observer.observe(document.body, { childList: true, subtree: true });
    }
});