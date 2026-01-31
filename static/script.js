document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.search-bar');
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    const resultGrid = document.getElementById('result-grid');
    const emptyState = document.getElementById('empty-state');
    const flashContainer = document.getElementById('flash-container');
    
    // Profile Elements
    const avatar = document.getElementById('profile-avatar');
    const name = document.getElementById('profile-name');
    const usernameLink = document.getElementById('profile-username');
    const bio = document.getElementById('profile-bio');
    const followers = document.getElementById('stat-followers');
    const following = document.getElementById('stat-following');
    const repos = document.getElementById('stat-repos');
    const detailsContainer = document.getElementById('profile-details');
    
    // Roast Elements
    const roastBody = document.getElementById('roast-body');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = input.value.trim();
        if (!username) return;

        // Reset UI state
        setLoading(true);
        clearError();
        resultGrid.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            const response = await fetch('/roast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to roast user');
            }

            // Update UI with data
            updateProfile(data.profile);
            updateRoast(data.roast);
            
            // Show results
            resultGrid.style.display = 'grid';
            
        } catch (error) {
            showError(error.message);
            emptyState.style.display = 'block';
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Roasting...' : 'Roast';
        input.disabled = isLoading;
    }

    function showError(message) {
        flashContainer.innerHTML = `
            <div class="flash-message error">${message}</div>
        `;
    }

    function clearError() {
        flashContainer.innerHTML = '';
    }

    function updateProfile(profile) {
        avatar.src = profile.avatar_url;
        avatar.alt = profile.login;
        name.textContent = profile.name || profile.login;
        usernameLink.textContent = `@${profile.login}`;
        usernameLink.href = profile.html_url;
        
        if (profile.bio) {
            bio.innerHTML = `<p>${profile.bio}</p>`;
        } else {
            bio.innerHTML = `<p class="no-bio">No bio. Probably too busy writing spaghetti code.</p>`;
        }

        followers.textContent = profile.followers;
        following.textContent = profile.following;
        repos.textContent = profile.public_repos;

        // Build details HTML
        let detailsHtml = '';
        if (profile.company) {
            detailsHtml += `<div class="detail-row">🏢 ${profile.company}</div>`;
        }
        if (profile.location) {
            detailsHtml += `<div class="detail-row">📍 ${profile.location}</div>`;
        }
        if (profile.blog) {
            let blogUrl = profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`;
            detailsHtml += `<div class="detail-row">🔗 <a href="${blogUrl}" target="_blank">Website</a></div>`;
        }
        detailsContainer.innerHTML = detailsHtml;
    }

    function updateRoast(roastText) {
        // Convert newlines to <br>
        roastBody.innerHTML = roastText.replace(/\n/g, '<br>');
    }
});
