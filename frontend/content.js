console.log("X Feed Simulator: content.js loaded and waiting for data...");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "displayFeed") {
        console.log(`X Feed Simulator: content.js received action 'displayFeed' for feedType: '${request.feedType}'. Data:`, request.data);
        renderCustomFeed(request.data, request.feedType); 

        sendResponse({ 
            status: "success", 
            message: "Custom feed rendering initiated and data received by content.js." 
        });
    }
    return true; 
});

function renderCustomFeed(tweets, feedType) {
    console.log(`X Feed Simulator: Rendering custom '${feedType}' feed with tweets:`, tweets);

    const timelineSelector = '[aria-label="Timeline: Your Home Timeline"]'; 
    let timelineElement = document.querySelector(timelineSelector);

    if (!timelineElement) {
        console.warn(`X Feed Simulator: Primary timeline selector "${timelineSelector}" not found. Attempting fallback.`);
        const primaryColumn = document.querySelector('div[data-testid="primaryColumn"]');
        if (primaryColumn) {
            timelineElement = primaryColumn.querySelector('section > div > div'); 
        }
        if (!timelineElement) { 
            console.error("X Feed Simulator: Could not find the main timeline element on the page. Cannot render custom feed.");
            alert("X Feed Simulator: Could not find the Twitter timeline element to replace.");
            return;
         }
    }
    
    console.log("X Feed Simulator: Found timeline element:", timelineElement);

    timelineElement.innerHTML = ''; 
    console.log("X Feed Simulator: Cleared existing timeline content.");

    const switchBackButton = document.createElement('button');
    switchBackButton.textContent = 'Switch back to my original X feed';
    switchBackButton.className = 'sim-switch-back-button'; // Assign class
    switchBackButton.onclick = function() {
        location.reload();
    };
    timelineElement.appendChild(switchBackButton);

    const feedHeader = document.createElement('h2');
    feedHeader.textContent = `Simulated X Feed (${feedType || 'Following'} - via Extension)`; 
    feedHeader.className = 'sim-feed-header'; // Assign class
    timelineElement.appendChild(feedHeader);

    if (tweets && tweets.length > 0) {
        tweets.forEach(tweet => {
            const tweetElement = createTweetElement(tweet);
            timelineElement.appendChild(tweetElement);
        });
        console.log("X Feed Simulator: Finished rendering custom feed.");
    } else {
        const noTweetsMessage = document.createElement('p');
        noTweetsMessage.textContent = "No tweets to display in the simulated feed."; 
        noTweetsMessage.style.textAlign = "center"; // Keeping some basic inline style for this simple element
        noTweetsMessage.style.padding = "20px";
        timelineElement.appendChild(noTweetsMessage);
        console.log("X Feed Simulator: No mock tweets to render.");
    }
}

function createTweetElement(tweet) {
    const tweetContainer = document.createElement('div');
    tweetContainer.className = 'sim-tweet-container'; // Use class

    const avatarImg = document.createElement('img');
    avatarImg.src = tweet.author_avatar || 'https://placehold.co/48x48/cccccc/000000/png?text=N/A'; 
    avatarImg.alt = `${tweet.author_name || 'Unknown Author'}'s avatar`; 
    avatarImg.className = 'sim-tweet-avatar'; 

    const contentDiv = document.createElement('div');
    contentDiv.className = 'sim-tweet-content'; 

    const authorInfoDiv = document.createElement('div');
    authorInfoDiv.className = 'sim-tweet-author-info'; 

    const authorNameSpan = document.createElement('span');
    authorNameSpan.textContent = tweet.author_name || 'Unknown Author';
    authorNameSpan.className = 'sim-tweet-author-name'; 

    const authorHandleSpan = document.createElement('span');
    authorHandleSpan.textContent = tweet.author_handle || '@unknown';
    authorHandleSpan.className = 'sim-tweet-author-handle'; 

    authorInfoDiv.appendChild(authorNameSpan);
    authorInfoDiv.appendChild(authorHandleSpan);

    const tweetTextP = document.createElement('p');
    tweetTextP.textContent = tweet.text || '(No text content)';
    tweetTextP.className = 'sim-tweet-text';

    contentDiv.appendChild(authorInfoDiv);
    contentDiv.appendChild(tweetTextP);

    tweetContainer.appendChild(avatarImg);
    tweetContainer.appendChild(contentDiv);
    
    const clearDiv = document.createElement('div');
    clearDiv.className = 'sim-tweet-clear'; 
    tweetContainer.appendChild(clearDiv);

    return tweetContainer;
}