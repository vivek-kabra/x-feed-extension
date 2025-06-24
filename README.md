# X Feed Simulator

**View how your friend’s X (formerly Twitter) feed looks! This browser extension allows users to share their X feed perspective in a read-only mode, and for others to view those shared feeds.**

## Overview

This project is a browser extension that enables users to:
1.  **Share their X.com Feed:** Authenticated users can choose to make their X feed (either "Following" or "For You" timeline) publicly viewable by others through this extension. This involves the extension securely capturing their X.com session details and storing them with user consent via our backend.
2.  **View Shared Feeds:** Other users can then enter the X handle of a person who has shared their feed and view that person's timeline directly within their own X.com interface, replacing their own feed temporarily.
3.  **Read-Only & Secure:** Viewing is strictly read-only, ensuring no actions can be taken on behalf of the sharer. User X.com tokens are encrypted when stored.

## Features

*   **User Authentication:** Sharers authenticate using **Email and Password** (powered by Supabase Auth) to manage their sharing settings.
*   **Consent-Based Sharing:** Sharers have explicit control via a toggle to make their X feed public or private through this extension.
*   **X Handle Lookup:** Viewers can find and load a shared feed by entering the sharer's X handle.
*   **Feed Type Selection:** Viewers can choose to see either the "Following" or "For You" timeline of the shared feed.
*   **Rich Feed Display:** The simulated feed aims to replicate the X.com experience, showing:
    *   Tweet text with clickable `@mentions`.
    *   Author information (name, handle, avatar).
    *   Timestamps formatted relatively (e.g., "3h", "Oct 27").
    *   Tweet engagement stats (replies, reposts, likes, views) with icons.
    *   Embedded media (images, videos, GIFs).
    *   Themed display adapting to X.com's light or dark mode.
*   **Read-Only Viewing:** Ensures privacy and security for the sharer's account.
*   **"Switch Back" Functionality:** Easily revert to your own X feed with a single click.
*   **Recently Viewed List:** The extension locally saves handles of feeds you've successfully viewed for quick access.

## Tech Stack

*   **Frontend (Browser Extension):**
    *   HTML5, CSS3, JavaScript (Manifest V3)
*   **Backend:**
    *   Python
    *   Flask (for the API server)
    *   Flask-CORS (for handling Cross-Origin Resource Sharing)
    *   Twikit (Python library for interacting with X.com)
    *   Supabase Python Client (`supabase-py`) for server-side interaction with Supabase.
    *   `python-dotenv` (for environment variable management)
    *   `cryptography` (for encrypting/decrypting X.com tokens)
*   **Database & Auth Service:**
    *   Supabase (PostgreSQL database, Email/Password Authentication, Row Level Security)
    *   Supabase Client JS (`supabase-js`) for authentication and session management.

## Project Structure

```
x-feed-extension/
├── backend/
│   ├── app.py              # Flask backend application
│   ├── requirements.txt    # Backend Python dependencies
│   ├── .env.example        # Example environment variables for backend
│   ├── venv/               # Python virtual environment (ignored by git)
│   └── README.md           # Backend setup and API details
├── frontend/
│   ├── manifest.json       # Extension manifest file
│   ├── popup.html          # HTML for the extension popup
│   ├── popup.js            # JavaScript logic for the popup
│   ├── style.css           # CSS for the popup
│   ├── content.js          # Injects feed content into X.com page
│   ├── injected-styles.css # CSS for the injected feed content
│   ├── images/             # Extension icons (icon16.png, icon48.png, etc.)
│   ├── lib/                # Locally hosted libraries (e.g., supabase.min.js)
│   └── README.md           # Frontend setup and details
├── .gitignore
└── README.md               # This file (main project README)
```

## Setup and Installation

### Prerequisites
*   Google Chrome or a Chromium-based browser (for loading the extension).
*   Python 3.8+ (for the backend).
*   A Supabase project (sign up at [supabase.com](https://supabase.com)).

### 1. Backend Setup

Detailed instructions for setting up the backend can be found in `backend/README.md`. This typically involves:
*   Creating and configuring a Supabase project (including database tables, Row Level Security, and enabling the Email/Password authentication provider).
*   Cloning the repository.
*   Navigating to the `backend` directory.
*   Creating a Python virtual environment and installing dependencies from `requirements.txt`.
*   Creating a `.env` file based on `.env.example` and populating it with your Supabase credentials, encryption key, etc.
*   Running the Flask development server.

### 2. Frontend Setup

Detailed instructions for the frontend can be found in `frontend/README.md`. This typically involves:
*   Ensuring the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants at the top of `frontend/popup.js` are correctly set to point to your Supabase project.
*   Loading the unpacked extension into your browser:
    1.  Open Chrome and navigate to `chrome://extensions`.
    2.  Enable "Developer mode."
    3.  Click "Load unpacked."
    4.  Select the `frontend` directory from this project.

## Workflow Overview

**For Users Wishing to Share Their Feed (Sharers):**
1.  Open the extension popup.
2.  Sign up for a new account or log in using their Email and Password. This authentication is handled by Supabase.
3.  Once logged in, navigate to the "Share Your X Feed Settings" section.
4.  Enter their X.com handle and optionally a display name.
5.  Enable the toggle "Make my feed publicly viewable by handle."
6.  Click "Save Sharing Settings." The extension then securely processes their X.com session details with the backend, which stores them encrypted in the Supabase database and marks the feed as public.
7.  To stop sharing, the user can toggle sharing off and save.

**For Users Wishing to View a Shared Feed (Viewers):**
1.  Open the extension popup while on X.com.
2.  In the "View Friend's X Feed" section, enter the Sharer's X handle.
3.  Select the desired feed type ("Following" or "For You").
4.  Click "View Feed." The extension contacts the backend, which verifies if the target feed is public and then uses stored tokens to fetch and return the feed data.
5.  The `content.js` script renders this feed onto the X.com page.
6.  Viewed handles are saved locally in "Recently Viewed Accounts" for quick access.
7.  The "Switch back to my original X feed" button reloads the page to the user's own feed.

## Key Features Demonstrated
*   Secure sharer authentication (Email/Password via Supabase).
*   User consent mechanism for feed sharing.
*   Secure storage and retrieval of X.com tokens (encrypted in Supabase, managed by backend).
*   Viewing feeds by X handle.
*   Selection between "Following" and "For You" timelines.
*   Dynamic injection and rendering of a custom feed UI onto X.com.
*   Display of tweet text, author details, media (images/videos), formatted timestamps, and engagement statistics (replies, reposts, likes, views) with SVG icons.
*   Adaptive theming (light/dark mode) for the injected feed.
*   Local list of recently viewed accounts.

## Future Enhancements (Potential Ideas)
*   More robust error handling and user feedback.
*   Ability for sharers to approve specific viewers instead of just a public toggle.
*   More sophisticated UI/UX for the popup and injected feed.
*   Packaging for the Chrome Web Store.



