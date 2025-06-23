const SUPABASE_URL = 'https://attyqvxrfjsczgpygjwr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dHlxdnhyZmpzY3pncHlnandyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MzE1NjQsImV4cCI6MjA2NjEwNzU2NH0.MNuS8Z4oo4pHceMftahYLYpDSf1s7orUmHeHNXJnld8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKEND_URL = 'http://127.0.0.1:5000'; 


document.addEventListener('DOMContentLoaded', async function() {
    console.log("Popup DOM fully loaded and parsed");

    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const signUpButton = document.getElementById('signUpButton');
    const logoutButton = document.getElementById('logoutButton');
    const authErrorEl = document.getElementById('authError');

    const myXHandleInput = document.getElementById('myXHandleInput');
    const myDisplayNameInput = document.getElementById('myDisplayNameInput');
    const makePublicToggle = document.getElementById('makePublicToggle');
    const saveShareSettingsButton = document.getElementById('saveShareSettingsButton');
    const shareErrorEl = document.getElementById('shareError');
    const shareSuccessEl = document.getElementById('shareSuccess');

    const viewFeedButton = document.getElementById('viewFeedButton');

    if (loginButton) loginButton.addEventListener('click', handleLogin);
    if (signUpButton) signUpButton.addEventListener('click', handleSignUp);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (saveShareSettingsButton) saveShareSettingsButton.addEventListener('click', saveShareSettings);

    if (viewFeedButton) viewFeedButton.addEventListener('click', handleViewFeedByHandle);

    await checkUserSession(); 

    displayViewedAccounts(); 
});

function updateAuthUI(user) {
    const authSection = document.getElementById('authSection');
    const sharingSection = document.getElementById('sharingSection');
    const viewerSection = document.getElementById('viewerSection'); 
    const savedAccountsSection = document.getElementById('savedAccountsSection'); 
    const currentUserEmailEl = document.getElementById('currentUserEmail');

    if (user) {
        if (authSection) authSection.style.display = 'none';
        if (sharingSection) sharingSection.style.display = 'block';
        if (currentUserEmailEl) currentUserEmailEl.textContent = user.email;
        fetchSharingStatus(); 
    } else {
        if (authSection) authSection.style.display = 'block';
        if (sharingSection) sharingSection.style.display = 'none';
        if (currentUserEmailEl) currentUserEmailEl.textContent = '';
    }

    if (viewerSection) viewerSection.style.display = 'block'; 
    if (savedAccountsSection) savedAccountsSection.style.display = 'block';
}

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    updateAuthUI(session ? session.user : null);
}

async function handleSignUp() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const authErrorEl = document.getElementById('authError');
    if(authErrorEl) authErrorEl.style.display = 'none';

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        console.error("Sign up error:", error);
        if(authErrorEl) {
            authErrorEl.textContent = `Sign up failed: ${error.message}`;
            authErrorEl.style.display = 'block';
        }
    } else {
        console.log("Sign up successful, user:", data.user);
        alert("Sign up successful! Please check your email to confirm your account.");
        // Clear form
        document.getElementById('emailInput').value = '';
        document.getElementById('passwordInput').value = '';
    }
}

async function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const authErrorEl = document.getElementById('authError');
    if(authErrorEl) authErrorEl.style.display = 'none';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error("Login error:", error);
        if(authErrorEl) {
            authErrorEl.textContent = `Login failed: ${error.message}`;
            authErrorEl.style.display = 'block';
        }
    } else {
        console.log("Login successful, user:", data.user);
        updateAuthUI(data.user);
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Logout error:", error);
        alert(`Logout failed: ${error.message}`);
    } else {
        console.log("Logout successful");
        updateAuthUI(null);
        const myXHandleInput = document.getElementById('myXHandleInput');
        const myDisplayNameInput = document.getElementById('myDisplayNameInput');
        const makePublicToggle = document.getElementById('makePublicToggle');
        if (myXHandleInput) myXHandleInput.value = '';
        if (myDisplayNameInput) myDisplayNameInput.value = '';
        if (makePublicToggle) makePublicToggle.checked = false;
    }
}

async function fetchSharingStatus() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        console.log("Not logged in, cannot fetch sharing status.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/check_share_status`, {
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) { 
            console.warn("Could not fetch sharing status or no settings found.", response.status);
            return;
        }
        const statusData = await response.json();
        const myXHandleInput = document.getElementById('myXHandleInput');
        const makePublicToggle = document.getElementById('makePublicToggle');
        const myDisplayNameInput = document.getElementById('myDisplayNameInput');
        console.log("Sharing status data:", statusData);
        if (myXHandleInput) myXHandleInput.value = statusData.owner_x_handle || '';
        if (makePublicToggle) {
            if (typeof statusData.is_public==='boolean'){
                makePublicToggle.checked = statusData.is_public;
            }
            else{
                makePublicToggle.checked = true;
            }
        }
        if (myDisplayNameInput && statusData.display_name) myDisplayNameInput.value = statusData.display_name;

    } catch (error) {
        console.error("Error fetching sharing status from backend:", error);
    }
}


async function extractXCookies() {
    try {
        const allCookies = await new Promise((resolve, reject) => {
            chrome.cookies.getAll({ domain: "x.com" }, cookies => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(cookies);
                }
            });
        });

        if (!allCookies) {
            throw new Error("Failed to query cookies for x.com.");
        }
        
        const authTokenCookie = allCookies.find(c => c.name === "auth_token");
        const ct0Cookie = allCookies.find(c => c.name === "ct0");

        if (!authTokenCookie) {
            throw new Error("Could not find the 'auth_token' cookie. Please ensure you are logged into X.com.");
        }
        if (!ct0Cookie) {
            throw new Error("Could not find the 'ct0' cookie, even after fetching all cookies.");
        }

        console.log('ct0 extracted:', ct0Cookie.value);
        return { 
            auth_token: authTokenCookie.value, 
            ct0: ct0Cookie.value
        };

    } catch (error) {
        console.error("Error during cookie extraction:", error);
        alert(`Error extracting X cookies: ${error.message}`);
        return null; 
    }
}



async function saveShareSettings() {
    const shareErrorEl = document.getElementById('shareError');
    const shareSuccessEl = document.getElementById('shareSuccess');
    if (shareErrorEl) shareErrorEl.style.display = 'none';
    if (shareSuccessEl) shareSuccessEl.style.display = 'none';

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        alert("You must be logged in to save sharing settings.");
        return;
    }

    const myXHandle = document.getElementById('myXHandleInput').value.trim();
    const myDisplayName = document.getElementById('myDisplayNameInput').value.trim();
    const isPublic = document.getElementById('makePublicToggle').checked;

    if (!myXHandle) {
        if (shareErrorEl) {
             shareErrorEl.textContent = "Your X Handle (e.g. @yourhandle) is required.";
             shareErrorEl.style.display = 'block';
        }
        return;
    }

    let endpointUrl = '';
    let payload = {};

    if (isPublic) {
        const xCookies = await extractXCookies();
        if (!xCookies) return;

        endpointUrl = `${BACKEND_URL}/share_feed`;
        payload = {
            owner_x_handle: myXHandle.startsWith('@') ? myXHandle.substring(1) : myXHandle,
            owner_display_name: myDisplayName,
            auth_token: xCookies.auth_token,
            ct0_token: xCookies.ct0
        };
    } else {
        endpointUrl = `${BACKEND_URL}/unshare_feed`;
        payload = { 
            owner_x_handle: myXHandle.startsWith('@') ? myXHandle.substring(1) : myXHandle
        };
    }

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error || `Server error: ${response.status}`);
        
        if(shareSuccessEl) {
            shareSuccessEl.textContent = `Sharing settings saved! Your feed is now ${isPublic ? 'public' : 'private'}.`;
            shareSuccessEl.style.display = 'block';
        }
        alert(`Sharing settings saved! Your feed is now ${isPublic ? 'public' : 'private'}.`);
    } catch (error) {
        console.error(`Error ${isPublic ? 'sharing' : 'unsharing'} feed:`, error);
        if (shareErrorEl) {
            shareErrorEl.textContent = `Failed to save settings: ${error.message}`;
            shareErrorEl.style.display = 'block';
        }
    }
}


function displayViewedAccounts() {
    const accountListDiv = document.getElementById('account-list');
    if (!accountListDiv) { 
        return; 
    }
    accountListDiv.innerHTML = ''; 
    
    chrome.storage.local.get({ viewedAccounts: [] }, function(result) { 
        const accountsToDisplay = result.viewedAccounts;
        console.log("Viewed accounts retrieved for display:", accountsToDisplay);

        if (!accountsToDisplay || accountsToDisplay.length === 0) {
            accountListDiv.textContent = 'No recently viewed accounts.'; return;
        }
        const ul = document.createElement('ul');
        ul.className = 'accounts-ul';
        accountsToDisplay.forEach(account => {
            const li = document.createElement('li');
            li.className = 'account-item';
            const accountNameSpan = document.createElement('span');
            accountNameSpan.className = 'account-name';
            accountNameSpan.textContent = account.name || account.handle; 

            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.className = 'view-button';
            viewButton.dataset.accountHandle = account.handle; 
            viewButton.addEventListener('click', handleViewFeedByHandle);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.dataset.viewedAccountId = account.id; 
            deleteButton.addEventListener('click', handleDeleteViewedAccount);

            li.appendChild(accountNameSpan);
            li.appendChild(viewButton);
            li.appendChild(deleteButton);
            ul.appendChild(li);
        });
        accountListDiv.appendChild(ul);
    });
}

function handleDeleteViewedAccount(event) {
    const accountIdToDelete = event.target.dataset.viewedAccountId;
    if (!accountIdToDelete) {
        console.error("No account ID found on delete button for viewed account.");
        return;
    }
    if (!confirm("Are you sure you want to remove this account from your viewed list?")) {
        return;
    }
    chrome.storage.local.get({ viewedAccounts: [] }, function(result) {
        let accounts = result.viewedAccounts;
        const updatedAccounts = accounts.filter(account => account.id !== accountIdToDelete);
        chrome.storage.local.set({ viewedAccounts: updatedAccounts }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error deleting viewed account:", chrome.runtime.lastError.message);
            } else {
                console.log("Viewed account deleted successfully:", accountIdToDelete);
                displayViewedAccounts(); 
            }
        });
    });
}


async function handleViewFeedByHandle(event) {
    console.log("View action triggered.");

    const loadingIndicator = document.getElementById('loadingIndicator');
    const viewErrorEl = document.getElementById('viewError');
    const viewFriendHandleInput = document.getElementById('viewFriendHandleInput');
    const feedTypeSelect = document.getElementById('feedType');

    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (viewErrorEl) {
        viewErrorEl.textContent = '';
        viewErrorEl.style.display = 'none';
    }

    let targetHandle = '';
    if (event.target.dataset.accountHandle) {
        targetHandle = event.target.dataset.accountHandle;
        console.log(`Viewing handle from saved list: ${targetHandle}`);
    } else {
        targetHandle = viewFriendHandleInput.value.trim();
        console.log(`Viewing handle from input field: ${targetHandle}`);
    }

    if (!targetHandle) {
        alert('Please enter an X handle to view.');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        return;
    }

    const selectedFeedType = feedTypeSelect.value;
    const endpoint = selectedFeedType === 'ForYou' ? '/get_for_you_feed' : '/get_following_feed';
    const fullApiUrl = `${BACKEND_URL}${endpoint}`;
    
    const cleanTargetHandle = targetHandle.startsWith('@') ? targetHandle.substring(1) : targetHandle;

    console.log(`Fetching from API: ${fullApiUrl} for handle: ${cleanTargetHandle}`);

    try {
        const response = await fetch(fullApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_x_handle: cleanTargetHandle })
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `Server returned status ${response.status}`);
        }

        console.log("Successfully received data from backend:", responseData);

        saveViewedAccount(targetHandle);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id) {
                throw new Error("Could not find active tab to inject script.");
            }
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, () => {
                chrome.tabs.sendMessage(activeTab.id, {
                    action: "displayFeed",
                    feedType: selectedFeedType,
                    data: responseData
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Message port closed error (often ignorable):", chrome.runtime.lastError.message);
                    } else {
                        console.log("Response from content script:", response);
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error viewing feed:', error);
        if (viewErrorEl) {
            viewErrorEl.textContent = `Error: ${error.message}`;
            viewErrorEl.style.display = 'block';
        }
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function saveViewedAccount(handle) {
    chrome.storage.local.get({ viewedAccounts: [] }, (data) => {
        let accounts = data.viewedAccounts;
        handle=handle.startsWith('@') ? handle:'@'+handle;

        const isDuplicate = accounts.some(acc => acc.handle === handle);
        if (isDuplicate) {
            console.log(`Handle '${handle}' already exists in viewed history. Not saving again.`);
            return;
        }

        const newAccount = {
            id: 'viewed_' + Date.now(),
            handle: handle,
            name: handle 
        };

        accounts.unshift(newAccount); 

        if (accounts.length > 10) {
            accounts = accounts.slice(0, 10);
        }

        chrome.storage.local.set({ viewedAccounts: accounts }, () => {
            console.log(`Saved '${handle}' to viewed accounts history.`);
            displayViewedAccounts(); 
        });
    });
}

displayViewedAccounts(); 