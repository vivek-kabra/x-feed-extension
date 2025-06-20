

console.log("X Feed Simulator: content.js loaded and waiting for data...");

const SVG_ICONS = {
    comment: `<svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>`,
    repost: `<svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>`,
    like: `<svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>`,
    views: `<svg viewBox="0 0 24 24" aria-hidden="true"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>`
};

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

function formatTweetTimestamp(TimeStamp) {
    if (!TimeStamp) return '';
    const now = new Date();
    const tweetDate = new Date(TimeStamp);
    const diffInSeconds = Math.floor((now - tweetDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 1) { 
        return 'Just now'; 
    } else if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
        return `${diffInHours}h`;
    } else if (diffInDays < 7) { 
        
        const options = { month: 'short', day: 'numeric' };
        if (tweetDate.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric'; 
        }
        return tweetDate.toLocaleDateString(undefined, options);
    } else {
        const options = { month: 'short', day: 'numeric' };
        if (tweetDate.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric';
        }
        return tweetDate.toLocaleDateString(undefined, options);
    }
}

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

    // Hide the native "For you"/"Following" tabs
    const topTabsContainer = document.querySelector('[role="tablist"]');
    if (topTabsContainer) {
        topTabsContainer.style.display = 'none';
        console.log("X Feed Simulator: Hid the top tab navigation.");
    }


    timelineElement.innerHTML = ''; 
    console.log("X Feed Simulator: Cleared existing timeline content.");

    const switchBackButton = document.createElement('button');
    switchBackButton.textContent = 'Switch back to my original X feed';
    switchBackButton.style.display = 'block';
    switchBackButton.style.margin = '10px auto 20px auto';
    switchBackButton.style.padding = '10px 15px';
    switchBackButton.style.backgroundColor = '#1DA1F2';
    switchBackButton.style.color = 'white';
    switchBackButton.style.border = 'none';
    switchBackButton.style.borderRadius = '20px'; 
    switchBackButton.style.cursor = 'pointer';
    switchBackButton.style.fontSize = '15px';
    switchBackButton.style.fontWeight = 'bold';
    switchBackButton.onclick = function() {
        location.reload();
    };
    timelineElement.appendChild(switchBackButton);

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

function linkifyMentions(text) {
    const mentionRegex = /@(\w+)/g;
    
    return text.replace(mentionRegex, (match, username) => {
        return `<style>.sim-tweet-mention{color:#4a99e9;text-decoration:none}.sim-tweet-mention:hover{text-decoration:underline}</style><a href="https://x.com/${username}" target="_blank" rel="noopener noreferrer" class="sim-tweet-mention">${match}</a>`;

    });
}

function createTweetElement(tweet) {
    const tweetContainer = document.createElement('div');
    tweetContainer.className = 'sim-tweet-container'; 

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
    authorHandleSpan.textContent = '@'+tweet.author_handle || '@unknown';
    authorHandleSpan.className = 'sim-tweet-author-handle'; 

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'sim-tweet-timestamp';
    timestampSpan.textContent = ` · ${formatTweetTimestamp(tweet.created_at)}`;

    authorInfoDiv.appendChild(authorNameSpan);
    authorInfoDiv.appendChild(authorHandleSpan);
    authorInfoDiv.appendChild(timestampSpan);

    contentDiv.appendChild(authorInfoDiv);

    tweetContainer.appendChild(avatarImg);
    tweetContainer.appendChild(contentDiv);
    
    const clearDiv = document.createElement('div');
    clearDiv.className = 'sim-tweet-clear'; 
    tweetContainer.appendChild(clearDiv);

    const tweetTextElement = document.createElement('p');
    tweetTextElement.className = 'sim-tweet-text';
    let tweetText = tweet.text; 

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'custom-media-container'; 

    if (tweet.media && tweet.media.length > 0) {
        tweet.media.forEach(mediaItem => {
            tweetText = tweetText.replace(mediaItem.tco_url, '');

            if (mediaItem.type === 'photo') {
                const img = document.createElement('img');
                img.src = mediaItem.url;
                img.style.width = '100%'; 
                img.style.borderRadius = '16px';
                img.style.marginTop = '8px';
                mediaContainer.appendChild(img);
            } else if (mediaItem.type === 'video' || mediaItem.type === 'animated_gif') {
                const video = document.createElement('video');
                video.src = mediaItem.url;
                video.controls = true; 
                video.autoplay = false; 
                video.muted = true; 
                video.loop = (mediaItem.type === 'animated_gif');
                video.style.width = '100%';
                video.style.borderRadius = '16px';
                video.style.marginTop = '8px';
             mediaContainer.appendChild(video);
            }
        });
    }

    tweetTextElement.innerHTML= linkifyMentions(tweetText);

    const actionBar = document.createElement('div');
    actionBar.className = 'sim-tweet-action-bar';

    function createStatItem(svgString, count, actionClass) {
        const statItem = document.createElement('div');
        statItem.className = `sim-tweet-stat ${actionClass || ''}`;
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'sim-tweet-stat-icon';
        let cleanSvgString = svgString.replace(/class="[^"]*"/g, ''); 
        cleanSvgString = cleanSvgString.replace('<svg ', '<svg class="sim-stat-svg-icon" ');
        iconSpan.innerHTML = cleanSvgString; 
        
        const countSpan = document.createElement('span');
        countSpan.className = 'sim-tweet-stat-count';
        let displayCount = count || 0;

        if (count >= 1000000) {
            displayCount = (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            displayCount = (count / 1000).toFixed(1) + 'K';
        } else {
            displayCount = count.toString();
        }
        countSpan.textContent = displayCount;
        
        statItem.appendChild(iconSpan);
        statItem.appendChild(countSpan);
        return statItem;
    }
    
    actionBar.appendChild(createStatItem(SVG_ICONS.comment, tweet.reply_count, 'sim-action-reply'));
    actionBar.appendChild(createStatItem(SVG_ICONS.repost, tweet.repost_count, 'sim-action-repost'));
    actionBar.appendChild(createStatItem(SVG_ICONS.like, tweet.like_count, 'sim-action-like'));
    actionBar.appendChild(createStatItem(SVG_ICONS.views, tweet.view_count, 'sim-action-views'));

    contentDiv.appendChild(tweetTextElement); 
    contentDiv.appendChild(mediaContainer); 
    contentDiv.appendChild(actionBar);

    return tweetContainer;
}