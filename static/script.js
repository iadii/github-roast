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
    const btnCopy = document.getElementById('btn-copy');
    const btnShare = document.getElementById('btn-share');

    let currentRoastText = "";

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
            
            // Show results
            resultGrid.style.display = 'grid';
            
            // Start Typewriter Effect
            currentRoastText = data.roast;
            typewriterEffect(roastBody, data.roast);
            
        } catch (error) {
            showError(error.message);
            emptyState.style.display = 'block';
        } finally {
            setLoading(false);
        }
    });

    // --- Action Buttons ---

    btnCopy.addEventListener('click', () => {
        if (!currentRoastText) return;
        navigator.clipboard.writeText(currentRoastText).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = '✅ Copied!';
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
            }, 2000);
        });
    });

    btnShare.addEventListener('click', () => {
        if (!currentRoastText) return;
        const text = encodeURIComponent(`I just got roasted by AI on GitRoast! 🔥\n\n"${currentRoastText.substring(0, 100)}..."\n\nGet yours here: #GitRoast`);
        window.open(`https://x.com/intent/post?text=${text}`, '_blank');
    });

    // --- Helper Functions ---

    function typewriterEffect(element, text) {
        element.innerHTML = '<span class="cursor"></span>';
        const cursor = element.querySelector('.cursor');
        let index = 0;

        function type() {
            if (index < text.length) {
                const char = text.charAt(index);
                if (char === '\n') {
                    cursor.insertAdjacentHTML('beforebegin', '<br>');
                } else {
                    cursor.insertAdjacentText('beforebegin', char);
                }
                index++;
                setTimeout(type, 10); // Adjust speed here (lower is faster)
            } else {
                 // Keep cursor blinking at the end or remove it
                 // cursor.style.display = 'none'; 
            }
        }
        type();
    }

    function setLoading(isLoading) {
        button.disabled = isLoading;
        input.disabled = isLoading;
        
       
        button.textContent = 'Roast';
        
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
});
