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
        console.warn(`X Feed Simulator: Primary timeline selector "${timelineSelector}" not found. Attempting fallback (less reliable).`);
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

    // Adding "Switch back to my feed" button
    const switchBackButton = document.createElement('button');
    switchBackButton.textContent = 'Switch back to my original X feed';
    switchBackButton.style.display = 'block';
    switchBackButton.style.margin = '10px auto 20px auto';
    switchBackButton.style.padding = '10px 15px';
    switchBackButton.style.backgroundColor = '#1DA1F2'; // Twitter blue
    switchBackButton.style.color = 'white';
    switchBackButton.style.border = 'none';
    switchBackButton.style.borderRadius = '20px'; // Pill shape
    switchBackButton.style.cursor = 'pointer';
    switchBackButton.style.fontSize = '15px';
    switchBackButton.style.fontWeight = 'bold';
    switchBackButton.onclick = function() {
        location.reload(); // Simple page reload
    };
    timelineElement.appendChild(switchBackButton);

    // Adding a heading to indicate it's a simulated feed, including the feedType
    const feedHeader = document.createElement('h2');
    feedHeader.textContent = `Simulated X Feed (${feedType || 'Following'} - via Extension)`; 
    feedHeader.style.textAlign = "center";
    feedHeader.style.padding = "0px 0px 20px 0px"; 
    feedHeader.style.color = "#1DA1F2"; 
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
        noTweetsMessage.style.textAlign = "center";
        noTweetsMessage.style.padding = "20px";
        timelineElement.appendChild(noTweetsMessage);
        console.log("X Feed Simulator: No mock tweets to render.");
    }
}

function createTweetElement(tweet) {
    const tweetContainer = document.createElement('div');
    tweetContainer.style.border = '1px solid #e1e8ed';
    tweetContainer.style.padding = '10px 15px';
    tweetContainer.style.marginBottom = '10px';
    tweetContainer.style.backgroundColor = 'white';
    tweetContainer.style.borderRadius = '8px';

    const avatarImg = document.createElement('img');
    // Using placehold.co for fallback, consistent with MOCK_TWEET_DATA
    avatarImg.src = tweet.author_avatar || 'https://placehold.co/48x48/cccccc/000000/png?text=N/A'; 
    avatarImg.alt = `${tweet.author_name || 'Unknown Author'}'s avatar`; 
    avatarImg.style.width = '48px';
    avatarImg.style.height = '48px';
    avatarImg.style.borderRadius = '50%';
    avatarImg.style.marginRight = '10px';
    avatarImg.style.float = 'left';

    const contentDiv = document.createElement('div');
    contentDiv.style.overflow = 'hidden';

    const authorInfoDiv = document.createElement('div');
    authorInfoDiv.style.marginBottom = '5px';

    const authorNameSpan = document.createElement('span');
    authorNameSpan.textContent = tweet.author_name || 'Unknown Author';
    authorNameSpan.style.fontWeight = 'bold';
    authorNameSpan.style.marginRight = '5px';
    authorNameSpan.style.color = '#14171a';

    const authorHandleSpan = document.createElement('span');
    authorHandleSpan.textContent = tweet.author_handle || '@unknown';
    authorHandleSpan.style.color = '#657786';

    authorInfoDiv.appendChild(authorNameSpan);
    authorInfoDiv.appendChild(authorHandleSpan);

    const tweetTextP = document.createElement('p');
    tweetTextP.textContent = tweet.text || '(No text content)';
    tweetTextP.style.margin = '0';
    tweetTextP.style.lineHeight = '1.4';
    tweetTextP.style.color = '#14171a';
    tweetTextP.style.whiteSpace = 'pre-wrap';

    contentDiv.appendChild(authorInfoDiv);
    contentDiv.appendChild(tweetTextP);

    tweetContainer.appendChild(avatarImg);
    tweetContainer.appendChild(contentDiv);
    
    const clearDiv = document.createElement('div');
    clearDiv.style.clear = 'both';
    tweetContainer.appendChild(clearDiv);

    return tweetContainer;
}