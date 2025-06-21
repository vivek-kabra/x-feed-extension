// --- Supabase and Backend Configuration ---
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; 
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKEND_URL = 'http://localhost:5000'; 


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
        alert("Sign up successful! Please check your email to confirm (if email confirmation is enabled in Supabase). You can now attempt to log in.");
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

        if (myXHandleInput) myXHandleInput.value = statusData.owner_x_handle || '';
        if (makePublicToggle) makePublicToggle.checked = statusData.is_public || false;
        if (myDisplayNameInput && statusData.display_name) myDisplayNameInput.value = statusData.display_name;

    } catch (error) {
        console.error("Error fetching sharing status from backend:", error);
    }
}

async function extractXCookies() {
    try {
        const getCookie = (name) => new Promise((resolve, reject) => {
            chrome.cookies.get({ url: "https://x.com", name: name }, cookie => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(cookie);
                }
            });
        });

        const authTokenCookie = await getCookie("auth_token");
        const ct0Cookie = await getCookie("ct0");

        if (!authTokenCookie || !ct0Cookie) {
            throw new Error("Could not retrieve X.com auth_token or ct0. Ensure you are logged into X.com in this browser.");
        }
        return { auth_token: authTokenCookie.value, ct0: ct0Cookie.value };
    } catch (error) {
        console.error("Error extracting X cookies:", error);
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
            ct0: xCookies.ct0
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
    console.log("handleViewFeedByHandle called. Full implementation in Stage 2.");
    alert("Viewing feed by handle - functionality to be fully connected in Stage 2.");
}

displayViewedAccounts(); 