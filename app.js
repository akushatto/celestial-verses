
        // STARFIELD
        const cv = document.getElementById('starfield'), ctx = cv.getContext('2d');
        let W, H, stars = [];
        function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; initStars() }
        function initStars() {
            stars = [];
            for (let i = 0; i < 220; i++) {
                stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + .3, o: Math.random() * .8 + .1, s: Math.random() * .4 + .05, t: Math.random() * Math.PI * 2, speed: Math.random() * .15 + .02 });
            }
        }
        function drawStars() {
            if (!document.hidden) {
                ctx.clearRect(0, 0, W, H);
                stars.forEach(s => {
                    s.t += s.speed * .02;
                    const flicker = s.o + Math.sin(s.t) * 0.15;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, flicker)})`; ctx.fill();
                });
            }
            requestAnimationFrame(drawStars);
        }
        window.addEventListener('resize', resize);
        resize(); drawStars();

        // 3D TILT ON CARDS
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - .5;
                const y = (e.clientY - r.top) / r.height - .5;
                card.style.transform = `translateY(-8px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
                card.style.setProperty('--mx', e.clientX - r.left + 'px');
                card.style.setProperty('--my', e.clientY - r.top + 'px');
                card.querySelector('.poem-card::before');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });

        // SUN RAYS
        const sunSys = document.getElementById('sunSys');
        if(sunSys) sunSys.innerHTML = '<div class="sun-core"></div>';
        for (let i = 0; i < 12; i++) {
            const ray = document.createElement('div');
            ray.className = 'ray';
            const angle = (i / 12) * 360;
            const len = 30 + Math.random() * 20;
            ray.style.cssText = `width:${len}px;left:80px;top:79px;transform:rotate(${angle}deg);opacity:${.4 + Math.random() * .4}`;
            if(sunSys) sunSys.appendChild(ray);
        }

        // FLOATING PARTICLES
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            const colors = ['#c9a84c', '#b8cfe8', '#d4c5f0', '#2dd4bf', '#ffd43b'];
            p.style.cssText = `
    width:${size}px;height:${size}px;
    left:${Math.random() * 100}vw;
    background:${colors[Math.floor(Math.random() * colors.length)]};
    animation-duration:${8 + Math.random() * 12}s;
    animation-delay:${Math.random() * 10}s;
    --dx:${(Math.random() - 0.5) * 200}px;
  `;
            document.body.appendChild(p);
        }

        // PARALLAX ON SCROLL
        const navEl = document.querySelector('nav');
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            const heroInner = document.querySelector('.hero-inner');
            if (heroInner) {
                heroInner.style.transform = `translateY(${y * .3}px) rotateX(2deg)`;
            }
            if (y > 50) {
                navEl.classList.add('scrolled');
            } else {
                navEl.classList.remove('scrolled');
            }
        });

        // SCROLL ANIMATIONS
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section-title, .section-sub, .divider, .poem-card, .moon-art, .sun-art, .eclipse-art, .space-art, .cosmos-divider, .poem-form').forEach(el => {
            el.classList.add('fade-up');
            observer.observe(el);
        });

        // CUSTOM POEMS LOGIC
        const poemForm = document.getElementById('customPoemForm');
        const poemGrid = document.getElementById('customPoemGrid');
        const publicPoemGrid = document.getElementById('publicPoemGrid');
        const submitBtn = document.getElementById('submitBtn');
        const loginBtn = document.getElementById('loginBtn');
        const userStatsWrap = document.getElementById('userStatsWrap');
        
        let currentUser = localStorage.getItem('celestialVerses_user') || null;
        let customPoems = [];
        let publicPoems = [];
        const API_BASE = window.location.origin;

        async function loadPoems() {
            if (currentUser) {
                try {
                    const res = await fetch(`${API_BASE}/poems?username=${encodeURIComponent(currentUser)}`);
                    if (res.ok) {
                        customPoems = await res.json();
                        renderPoems();
                        updateUserStats();
                    }
                } catch (e) { console.error(e); }
            } else {
                customPoems = [];
                renderPoems();
            }
        }

        async function loadPublicPoems() {
            try {
                const res = await fetch(`${API_BASE}/public-poems`);
                if (res.ok) {
                    publicPoems = await res.json();
                    renderPublicPoems();
                    initConstellationMap();
                }
            } catch (e) { console.error(e); }
        }

        async function updateUserStats() {
            if (!currentUser) return;
            try {
                const res = await fetch(`${API_BASE}/user-stats?username=${encodeURIComponent(currentUser)}`);
                if (res.ok) {
                    const stats = await res.json();
                    document.getElementById('userStats').textContent = `${stats.count} Poems · ${stats.stars} Stars`;
                    userStatsWrap.style.display = 'flex';
                    
                    // Titles based on count
                    let title = "Stardust Wanderer";
                    if(stats.count >= 5) title = "Nova Architect";
                    if(stats.count >= 15) title = "Galaxy Weaver";
                    if(stats.count >= 30) title = "Universal Sage";
                    document.getElementById('userBadge').textContent = title;
                }
            } catch(e) {}
        }

        function updateAuthUI() {
            if (currentUser) {
                loginBtn.textContent = `Logout (${currentUser})`;
                poemForm.style.display = 'flex';
                userStatsWrap.style.display = 'flex';
            } else {
                loginBtn.textContent = 'Login';
                poemForm.style.display = 'none';
                userStatsWrap.style.display = 'none';
            }
        }

        let isSignUpMode = false;
        const authModal = document.getElementById('authModal');
        const authFormEl = document.getElementById('authForm');
        const authTitle = document.getElementById('authTitle');
        const authSubmit = document.getElementById('authSubmit');
        const authToggleText = document.getElementById('authToggleText');
        const authToggleBtn = document.getElementById('authToggleBtn');
        const authError = document.getElementById('authError');
        const authClose = document.getElementById('authClose');

        function openAuthModal() {
            authModal.style.display = 'flex';
            setTimeout(() => authModal.classList.add('active'), 10);
            authError.textContent = '';
            authFormEl.reset();
        }

        function closeAuthModal() {
            authModal.classList.remove('active');
            setTimeout(() => authModal.style.display = 'none', 300);
        }

        authClose.addEventListener('click', closeAuthModal);

        authToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            if (isSignUpMode) {
                authTitle.textContent = 'Create Your Space';
                authSubmit.textContent = 'Sign Up';
                authToggleText.textContent = 'Already have an account?';
                authToggleBtn.textContent = 'Login';
            } else {
                authTitle.textContent = 'Login to Your Space';
                authSubmit.textContent = 'Login';
                authToggleText.textContent = 'New here?';
                authToggleBtn.textContent = 'Sign Up';
            }
            authError.textContent = '';
        });
        
        authFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('authUsername').value.trim();
            const password = document.getElementById('authPassword').value;
            const endpoint = isSignUpMode ? '/signup' : '/login';
            try {
                authSubmit.disabled = true;
                const res = await fetch(`${API_BASE}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (!res.ok) {
                    authError.textContent = data.error || 'Failed.';
                } else {
                    loginUser(username);
                }
            } catch (e) { authError.textContent = 'Network error.'; }
            finally { authSubmit.disabled = false; }
        });

        function loginUser(username) {
            currentUser = username;
            localStorage.setItem('celestialVerses_user', currentUser);
            loadPoems();
            updateAuthUI();
            closeAuthModal();
        }

        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                currentUser = null;
                localStorage.removeItem('celestialVerses_user');
                customPoems = [];
                updateAuthUI();
                renderPoems();
            } else {
                openAuthModal();
            }
        });

        function renderPoems() {
            if(!poemGrid) return;
            poemGrid.innerHTML = '';
            if (!currentUser) {
                poemGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; opacity: 0.6;">Please login to view and add your poems.</p>';
                return;
            }
            if (customPoems.length === 0) {
                poemGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; opacity: 0.6;">No custom poems yet. Add your first masterpiece above.</p>';
                return;
            }
            customPoems.forEach(poem => {
                const div = document.createElement('div');
                div.className = 'poem-card fade-up';
                div.setAttribute('data-tilt', 'true');
                div.innerHTML = `
                    <span class="poem-tag" style="color:var(--rose)">${poem.is_public ? 'Public' : 'Private'}</span>
                    <div class="poem-title">${escapeHTML(poem.title)}</div>
                    <div class="poem-author">${escapeHTML(poem.author)}</div>
                    <div class="poem-text">${escapeHTML(poem.text)}</div>
                    <div class="poem-actions">
                        <button type="button" class="action-btn share-btn" data-id="${poem.id}">Share</button>
                        <button type="button" class="action-btn edit-btn" data-id="${poem.id}">Edit</button>
                        <button type="button" class="action-btn delete-btn" data-id="${poem.id}">Delete</button>
                    </div>
                `;
                if(poemGrid) poemGrid.appendChild(div);
                bindCardEffects(div);
            });
            bindActions();
        }

        function renderPublicPoems() {
            if(publicPoemGrid) publicPoemGrid.innerHTML = '';
            publicPoems.forEach(poem => {
                const div = document.createElement('div');
                div.className = 'poem-card fade-up';
                div.setAttribute('data-tilt', 'true');
                div.innerHTML = `
                    <span class="poem-tag" style="color:var(--teal)">Cosmic Library</span>
                    <div class="poem-title">${escapeHTML(poem.title)}</div>
                    <div class="poem-author">${escapeHTML(poem.author)} <button type="button" class="action-btn follow-btn" data-user="${poem.username}" style="padding: 0.2rem 0.5rem; font-size: 0.6rem; border-color: var(--silver); color: var(--silver); margin-left: 0.5rem;">Follow @${poem.username}</button></div>
                    <div class="poem-text">${escapeHTML(poem.text)}</div>
                    <div class="poem-actions" style="margin-top: 1rem;">
                        <button type="button" class="action-btn star-btn" data-id="${poem.id}">⭐ ${poem.star_count || 0}</button>
                        <button type="button" class="action-btn comment-btn" data-id="${poem.id}">💬 Comment</button>
                        <button type="button" class="action-btn share-btn" data-id="${poem.id}">Share</button>
                    </div>
                    <div class="comments-section" id="comments-${poem.id}" style="display: none; margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; font-size: 0.8rem; text-align: left;">
                        <div class="comments-list" style="max-height: 100px; overflow-y: auto; margin-bottom: 0.5rem;"></div>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" class="comment-input" placeholder="Write a comment..." style="flex:1; padding: 0.4rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px;">
                            <button type="button" class="action-btn post-comment-btn" data-id="${poem.id}" style="padding: 0.4rem 0.8rem;">Post</button>
                        </div>
                    </div>
                `;
                if(publicPoemGrid) publicPoemGrid.appendChild(div);
                bindCardEffects(div);
                if (typeof observer !== 'undefined') {
                    observer.observe(div);
                }
            });
            
            document.querySelectorAll('.star-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if(!currentUser) return openAuthModal();
                    const res = await fetch(`${API_BASE}/poems/${btn.dataset.id}/star`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: currentUser })
                    });
                    if(res.ok) loadPublicPoems();
                });
            });

            document.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', () => followUser(btn.dataset.user));
            });

            document.querySelectorAll('.comment-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const sec = document.getElementById(`comments-${btn.dataset.id}`);
                    if(sec.style.display === 'none') {
                        sec.style.display = 'block';
                        const comments = await fetchComments(btn.dataset.id);
                        const list = sec.querySelector('.comments-list');
                        list.innerHTML = comments.map(c => `<div style="margin-bottom:0.5rem"><strong>@${c.username}:</strong> <span style="opacity:0.8">${escapeHTML(c.text)}</span></div>`).join('');
                    } else {
                        sec.style.display = 'none';
                    }
                });
            });

            document.querySelectorAll('.post-comment-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const sec = document.getElementById(`comments-${btn.dataset.id}`);
                    const input = sec.querySelector('.comment-input');
                    if(input.value.trim()) {
                        const success = await postComment(btn.dataset.id, input.value.trim());
                        if(success) {
                            input.value = '';
                            const comments = await fetchComments(btn.dataset.id);
                            sec.querySelector('.comments-list').innerHTML = comments.map(c => `<div style="margin-bottom:0.5rem"><strong>@${c.username}:</strong> <span style="opacity:0.8">${escapeHTML(c.text)}</span></div>`).join('');
                        }
                    }
                });
            });

            // Also render top public poems to home page if the container exists
            const homeGrid = document.getElementById('homePublicPoemsGrid');
            if (homeGrid) {
                homeGrid.innerHTML = '';
                const displayPoems = publicPoems.slice(0, 6); // Show top 6
                displayPoems.forEach(poem => {
                    const div = document.createElement('div');
                    div.className = 'poem-card fade-up';
                    div.setAttribute('data-tilt', 'true');
                    div.innerHTML = `
                        <span class="poem-tag" style="color:var(--teal)">Community</span>
                        <div class="poem-title">${escapeHTML(poem.title)}</div>
                        <div class="poem-author">${escapeHTML(poem.author)}</div>
                        <div class="poem-text">${escapeHTML(poem.text)}</div>
                        <div class="poem-controls">
                            <button class="audio-narration-btn" data-audio="space">Play Audio</button>
                            <button class="zen-btn">Zen Mode</button>
                            <button class="bookmark-btn">⭐</button>
                        </div>
                    `;
                    homeGrid.appendChild(div);
                    bindCardEffects(div);
                    if (typeof observer !== 'undefined') observer.observe(div);
                });
            }
        }

        function bindCardEffects(div) {
            div.addEventListener('mousemove', e => {
                const r = div.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - .5;
                const y = (e.clientY - r.top) / r.height - .5;
                div.style.transform = `translateY(-8px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
                div.style.setProperty('--mx', e.clientX - r.left + 'px');
                div.style.setProperty('--my', e.clientY - r.top + 'px');
            });
            div.addEventListener('mouseleave', () => { div.style.transform = ''; });
        }

        function bindActions() {
            document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editPoem(btn.dataset.id)));
            document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deletePoem(btn.dataset.id)));
            document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', () => sharePoem(btn.dataset.id)));
        }

        // MOON PHASE LOGIC
        function getMoonPhase() {
            const date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            if (month < 3) { year--; month += 12; }
            let c = 365.25 * year;
            let e = 30.6 * month;
            let jd = c + e + day - 694039.09;
            jd /= 29.5305882;
            let b = parseInt(jd);
            jd -= b;
            return jd; // 0 to 1
        }

        function initMoonPhase() {
            const phase = getMoonPhase();
            const shadow = document.getElementById('moonShadow');
            const name = document.getElementById('moonPhaseName');
            let offset = 0;
            let phaseName = "";
            
            if (phase < 0.06 || phase > 0.94) { phaseName = "New Moon"; offset = 100; }
            else if (phase < 0.19) { phaseName = "Waxing Crescent"; offset = 70; }
            else if (phase < 0.31) { phaseName = "First Quarter"; offset = 50; }
            else if (phase < 0.44) { phaseName = "Waxing Gibbous"; offset = 20; }
            else if (phase < 0.56) { phaseName = "Full Moon"; offset = 0; }
            else if (phase < 0.69) { phaseName = "Waning Gibbous"; offset = -20; }
            else if (phase < 0.81) { phaseName = "Last Quarter"; offset = -50; }
            else { phaseName = "Waning Crescent"; offset = -70; }
            
            shadow.style.left = offset + "%";
            name.textContent = phaseName;
        }

        // AMBIENT PLAYER LOGIC
        let currentAudio = null;
        document.querySelectorAll('.audio-btn[data-src]').forEach(btn => {
            btn.addEventListener('click', () => {
                if(currentAudio) currentAudio.pause();
                document.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('active'));
                currentAudio = new Audio(btn.dataset.src);
                currentAudio.loop = true;
                currentAudio.play();
                btn.classList.add('active');
            });
        });
        document.getElementById('stopAudio').addEventListener('click', () => {
            if(currentAudio) currentAudio.pause();
            document.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('active'));
        });

        // AI ASSISTANT LOGIC
        const aiBtn = document.getElementById('aiSuggestBtn'); if(aiBtn) aiBtn.addEventListener('click', async () => {
            const title = document.getElementById('poemTitle').value || 'Stars';
            const suggestionEl = document.getElementById('aiSuggestion');
            suggestionEl.textContent = "Asking the stars...";
            try {
                const res = await fetch(`${API_BASE}/generate-poem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword: title })
                });
                if(res.ok) {
                    const data = await res.json();
                    suggestionEl.textContent = data.suggestion;
                }
            } catch(e) { suggestionEl.textContent = "The stars are silent."; }
        });

        // CONSTELLATION MAP LOGIC
        function initConstellationMap() {
            const map = document.getElementById('constellationMap');
            if(!map) return;
            map.innerHTML = '';
            const count = Math.min(publicPoems.length, 12);
            for(let i=0; i<count; i++) {
                const star = document.createElement('div');
                star.className = 'map-star';
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                star.style.left = x + '%';
                star.style.top = y + '%';
                
                const label = document.createElement('div');
                label.className = 'map-label';
                label.textContent = publicPoems[i].title;
                label.style.left = (x + 2) + '%';
                label.style.top = y + '%';
                
                star.addEventListener('click', () => {
                    const zTitle = document.getElementById('zenPoemTitle');
                    const zAuthor = document.getElementById('zenPoemAuthor');
                    const zText = document.getElementById('zenPoemText');
                    const zOverlay = document.getElementById('zenModeOverlay');
                    if (zOverlay && zTitle && zAuthor && zText) {
                        zTitle.textContent = publicPoems[i].title;
                        zAuthor.textContent = publicPoems[i].author;
                        zText.innerHTML = escapeHTML(publicPoems[i].text).replace(/\n/g, '<br>');
                        zOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    } else {
                        const el = document.querySelector(`.public-library-sec .poem-title`);
                        if(el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                
                map.appendChild(star);
                map.appendChild(label);
            }
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag] || tag)
            );
        }

        if(poemForm) poemForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (!currentUser) return;
            const idInput = document.getElementById('poemId').value;
            const title = document.getElementById('poemTitle').value;
            const author = document.getElementById('poemAuthor').value;
            const text = document.getElementById('poemText').value;
            const isPublic = document.getElementById('isPublicPoem').checked;

            submitBtn.disabled = true;
            try {
                if (idInput) {
                    const res = await fetch(`${API_BASE}/poems/${idInput}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: currentUser, title, author, text, is_public: isPublic })
                    });
                    if(res.ok) {
                        submitBtn.textContent = 'Add Poem';
                    }
                } else {
                    const res = await fetch(`${API_BASE}/poems`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: currentUser, title, author, text, is_public: isPublic })
                    });
                }
                loadPoems();
                loadPublicPoems();
                poemForm.reset();
                document.getElementById('poemId').value = '';
            } catch(err) { alert('Failed to save poem.'); }
            finally { submitBtn.disabled = false; }
        });

        function editPoem(id) {
            const poem = customPoems.find(p => p.id === id);
            if (poem) {
                document.getElementById('poemId').value = poem.id;
                document.getElementById('poemTitle').value = poem.title;
                document.getElementById('poemAuthor').value = poem.author;
                document.getElementById('poemText').value = poem.text;
                document.getElementById('isPublicPoem').checked = poem.is_public;
                submitBtn.textContent = 'Update Poem';
                document.getElementById('personal-space').scrollIntoView({ behavior: 'smooth' });
            }
        }

        async function deletePoem(id) {
            if (confirm('Are you sure you want to delete this poem?')) {
                try {
                    const res = await fetch(`${API_BASE}/poems/${id}?username=${encodeURIComponent(currentUser)}`, {
                        method: 'DELETE'
                    });
                    if(res.ok) { loadPoems(); loadPublicPoems(); }
                } catch(e) { alert('Network error.'); }
            }
        }

        function sharePoem(id) {
            const poem = customPoems.find(p => p.id === id);
            if (!poem) return;
            const textToShare = `"${poem.title}" by ${poem.author}\n\n${poem.text}\n\nShared from Celestial Verses`;
            if (navigator.share) {
                navigator.share({
                    title: poem.title,
                    text: textToShare
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(textToShare).then(() => {
                    alert('Poem copied to clipboard for sharing!');
                }).catch(() => {
                    alert('Failed to copy poem.');
                });
            }
        }

        // DAILY QUOTE LOGIC
        const dailyQuotes = [
            { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
            { text: "For my part I know nothing with any certainty, but the sight of the stars makes me dream.", author: "Vincent van Gogh" },
            { text: "Yours is the light by which my spirit's born: you are my sun, my moon, and all my stars.", author: "E.E. Cummings" },
            { text: "Doubt thou the stars are fire; Doubt that the sun doth move; Doubt truth to be a liar; But never doubt I love.", author: "William Shakespeare" },
            { text: "There is no easy way from the earth to the stars.", author: "Seneca" },
            { text: "Shoot for the moon. Even if you miss, you'll land among the stars.", author: "Norman Vincent Peale" },
            { text: "I have loved the stars too fondly to be fearful of the night.", author: "Sarah Williams" },
            { text: "The cosmos is within us. We are made of star-stuff.", author: "Carl Sagan" },
            { text: "Look at the stars, look how they shine for you.", author: "Coldplay" },
            { text: "A sky full of stars and he was staring at her.", author: "Atticus" }
        ];

        function displayDailyQuote() {
            const today = new Date();
            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            const quoteIndex = dayOfYear % dailyQuotes.length;
            const quote = dailyQuotes[quoteIndex];
            
            const quoteEl = document.getElementById('dailyQuote');
            if(quoteEl) {
                quoteEl.innerHTML = `"${quote.text}"<span class="daily-quote-author">— ${quote.author}</span>`;
            }
        }
        displayDailyQuote();

        // TAB SWITCHING
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.dashboard-view').forEach(v => v.classList.remove('active'));
                btn.classList.add('active');
                const view = document.getElementById(btn.dataset.tab);
                if(view) view.classList.add('active');
                
                if(btn.dataset.tab === 'tab-insights') loadInsights();
                if(btn.dataset.tab === 'tab-profile') loadProfile();
            });
        });

        // OLD AVATAR PICKER REMOVED (Replaced by Gamified Profile)

        async function loadProfile() {
            if(!currentUser) return;
            try {
                const res = await fetch(`${API_BASE}/profile?username=${encodeURIComponent(currentUser)}`);
                if(res.ok) {
                    const profile = await res.json();
                    document.getElementById('userBio').value = profile.bio;
                    document.getElementById('userAvatar').src = profile.avatar_url;
                    document.getElementById('userHandle').textContent = `@${currentUser}`;
                }
            } catch(e) {}
        }

        const pf = document.getElementById('profileForm'); if(pf) pf.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bio = document.getElementById('userBio').value;
            const avatar = document.getElementById('userAvatar').src;
            try {
                const res = await fetch(`${API_BASE}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser, bio, avatar_url: avatar })
                });
                if(res.ok) alert('Celestial profile updated!');
            } catch(e) {}
        });

        // INSIGHTS
        async function loadInsights() {
            if(!currentUser) return;
            try {
                const res = await fetch(`${API_BASE}/insights?username=${encodeURIComponent(currentUser)}`);
                if(res.ok) {
                    const data = await res.json();
                    document.getElementById('stat-views').textContent = data.total_views;
                    document.getElementById('stat-stars').textContent = data.total_stars;
                    document.getElementById('stat-poems').textContent = data.poem_count;
                    document.getElementById('top-poem-title').textContent = data.most_viewed ? data.most_viewed.title : "None yet";
                }
            } catch(e) {}
        }

        // FEEDBACK
        const fb = document.getElementById('feedbackForm'); if(fb) fb.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('feedbackMsg').value;
            try {
                const res = await fetch(`${API_BASE}/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser || 'Anonymous', message: msg })
                });
                if(res.ok) {
                    document.getElementById('feedbackConfirm').style.display = 'block';
                    document.getElementById('feedbackForm').reset();
                    setTimeout(() => { document.getElementById('feedbackConfirm').style.display = 'none'; }, 3000);
                }
            } catch(e) {}
        });

        // TRACK VIEWS
        const viewObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const poemId = entry.target.dataset.id;
                    if(poemId) fetch(`${API_BASE}/poems/${poemId}/view`, { method: 'POST' });
                    viewObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.8 });

        function logoutUser() {
            currentUser = null;
            localStorage.removeItem('celestialVerses_user');
            updateAuthUI();
            location.reload(); // Refresh to clear states
        }

        // UPDATE AUTH UI override
        function updateAuthUI() {
            const dashboard = document.getElementById('dashboardWrap');
            const unauth = document.getElementById('unauthMessage');
            if (currentUser) {
                if (loginBtn) loginBtn.textContent = `Logout (${currentUser})`;
                if (dashboard) dashboard.style.display = 'block';
                if (unauth) unauth.style.display = 'none';
                loadProfile();
            } else {
                if (loginBtn) loginBtn.textContent = 'Login';
                if (dashboard) dashboard.style.display = 'none';
                if (unauth) unauth.style.display = 'block';
            }
        }

        // Initial render
        loadPoems();
        loadPublicPoems();
        updateAuthUI();
        initMoonPhase();
        displayDailyQuote();
    
// SEARCH LOGIC
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        try {
            const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                publicPoems = await res.json();
                renderPublicPoems(); // Use the existing function to render
            }
        } catch(e) { console.error(e); }
    });
}

// COMMENTS AND FOLLOW (Placeholders for UI extensions)
async function fetchComments(poemId) {
    const res = await fetch(`${API_BASE}/comments?poem_id=${poemId}`);
    return await res.json();
}

async function postComment(poemId, text) {
    if(!currentUser) return openAuthModal();
    const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poem_id: poemId, username: currentUser, text })
    });
    return res.ok;
}

async function followUser(followingUser) {
    if(!currentUser) return openAuthModal();
    const res = await fetch(`${API_BASE}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: currentUser, following: followingUser })
    });
    const data = await res.json();
    alert(data.status === 'followed' ? `You are now following ${followingUser}` : `Unfollowed ${followingUser}`);
}

// --- SIDEBAR INJECTION & LOGIC ---
function initSidebar() {
    const nav = document.querySelector('nav');
    if(!nav) return;

    // Hamburger
    const hamburger = document.querySelector('.hamburger');
    if(!hamburger) return;

    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.id = 'sidebar';
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-profile-glow" id="sidebarAura"></div>
            <div class="sidebar-avatar-wrap">
                <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Star" id="sidebarAvatar" class="sidebar-avatar">
            </div>
            <div id="sidebarUsername" class="sidebar-username">${currentUser || 'Guest Stargazer'}</div>
            <div id="sidebarBadgeTop" class="sidebar-badge-label">${currentUser ? 'Stardust Wanderer' : 'Not Logged In'}</div>
            <div class="sidebar-stats" style="${currentUser ? '' : 'display:none;'}">
                <div class="sidebar-stat-item">
                    <span class="sidebar-stat-val" id="sidebarPoemsStat">0</span>
                    <span class="sidebar-stat-lbl">Verses</span>
                </div>
                <div class="sidebar-stat-item">
                    <span class="sidebar-stat-val" id="sidebarStarsStat">0</span>
                    <span class="sidebar-stat-lbl">Stars</span>
                </div>
                <div class="sidebar-stat-item">
                    <span class="sidebar-stat-val" id="sidebarLevelStat">1</span>
                    <span class="sidebar-stat-lbl">Level</span>
                </div>
            </div>
        </div>
        <div class="sidebar-nav">
            <div class="sidebar-nav-section-label">Navigate</div>
            <a href="index.html">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Home Base
            </a>
            <a href="library.html">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                Cosmic Library
            </a>
            <a href="dashboard.html">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                My Constellations
            </a>
            <a href="#" id="sidebarSavedBtn">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                Saved Verses
            </a>
            <div class="sidebar-divider"></div>
            <div class="sidebar-nav-section-label">Explore</div>
            <a href="library.html#constellations">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                Community Map
            </a>
            <a href="about.html">
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                About
            </a>
        </div>
        <div class="sidebar-footer">
            <div class="sidebar-divider"></div>
            <button id="sidebarEclipseToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                Eclipse Mode
            </button>
            ${currentUser ? `<button id="sidebarLogout" class="danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Leave Universe
            </button>` : `<button id="sidebarLogin">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Enter the Universe
            </button>`}
        </div>
    `;
    document.body.appendChild(sidebar);

    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        hamburger.classList.toggle('active');
        if (sidebar.classList.contains('active')) updateSidebarStats();
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
    });

    const logoutBtn = document.getElementById('sidebarLogout');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    
    const loginBtn = document.getElementById('sidebarLogin');
    if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
    
    document.getElementById('sidebarEclipseToggle').addEventListener('click', () => {
        document.body.style.background = document.body.style.background === 'var(--pale)' ? 'var(--deep)' : 'var(--pale)';
        document.body.style.color = document.body.style.background === 'var(--pale)' ? 'var(--deep)' : 'var(--pale)';
    });
}
initSidebar();

async function updateSidebarStats() {
    if(!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/user-stats?username=${encodeURIComponent(currentUser)}`);
        if (res.ok) {
            const stats = await res.json();
            const pStat = document.getElementById('sidebarPoemsStat');
            const sStat = document.getElementById('sidebarStarsStat');
            const lStat = document.getElementById('sidebarLevelStat');
            if(pStat) pStat.textContent = stats.count;
            if(sStat) sStat.textContent = stats.stars;

            const energy = (stats.count * 50) + (stats.stars * 10);
            const level = Math.floor(energy / 200) + 1;
            if(lStat) lStat.textContent = level;

            let title = 'Stardust Wanderer';
            if(level >= 2) title = 'Nova Architect';
            if(level >= 4) title = 'Galaxy Weaver';
            if(level >= 7) title = 'Universal Sage';
            const badge = document.getElementById('sidebarBadgeTop');
            if(badge) badge.textContent = title;

            // Sync aura glow color
            const storedAura = localStorage.getItem('celestial_aura') || 'var(--gold)';
            const auraEl = document.getElementById('sidebarAura');
            if(auraEl) auraEl.style.background = storedAura;

            const storedAvatar = localStorage.getItem('celestial_avatar') || 'Star';
            const avatarEl = document.getElementById('sidebarAvatar');
            if(avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${storedAvatar}`;
        }
    } catch(e) {}
}

// --- GAMIFIED PROFILE ---
function initGamifiedProfile() {
    if(!document.getElementById('userLevel')) return; // Only on dashboard
    updateGamifiedProfileStats();
}

async function updateGamifiedProfileStats() {
    if(!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/user-stats?username=${encodeURIComponent(currentUser)}`);
        if (res.ok) {
            const stats = await res.json();
            const energy = (stats.count * 50) + (stats.stars * 10);
            const level = Math.floor(energy / 200) + 1;
            const nextLevelEnergy = level * 200;
            const progressPct = ((energy % 200) / 200) * 100;
            
            document.getElementById('energyCount').textContent = energy;
            document.getElementById('nextLevelEnergy').textContent = nextLevelEnergy;
            document.getElementById('userLevel').textContent = level;
            document.getElementById('energyFill').style.width = `${progressPct}%`;
            
            let title = "Stardust Wanderer";
            if(level >= 2) title = "Nova Architect";
            if(level >= 4) title = "Galaxy Weaver";
            if(level >= 7) title = "Universal Sage";
            document.getElementById('userBadge').textContent = `Lv.${level} ${title}`;
            
            renderGamifiedAvatars(level);
            renderGamifiedAuras(level);
        }
    } catch(e) {}
}

const allAvatars = [
    { seed: 'Star', level: 1 }, { seed: 'Sun', level: 1 }, { seed: 'Moon', level: 2 }, 
    { seed: 'Eclipse', level: 2 }, { seed: 'Comet', level: 3 }, { seed: 'Nova', level: 4 }, 
    { seed: 'Nebula', level: 5 }, { seed: 'Galaxy', level: 7 }
];

function renderGamifiedAvatars(userLevel) {
    const picker = document.getElementById('avatarPicker');
    if(!picker) return;
    picker.innerHTML = '';
    const storedAvatar = localStorage.getItem('celestial_avatar') || 'Star';
    document.getElementById('userAvatar').src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${storedAvatar}`;
    
    allAvatars.forEach(av => {
        const wrap = document.createElement('div');
        wrap.className = 'avatar-opt-wrap';
        wrap.title = `Level ${av.level} Required`;
        const isLocked = userLevel < av.level;
        
        wrap.innerHTML = `
            <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${av.seed}" class="avatar-opt ${isLocked ? 'locked' : ''} ${storedAvatar === av.seed ? 'selected' : ''}">
            ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}
        `;
        
        if (!isLocked) {
            wrap.onclick = () => {
                document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
                wrap.querySelector('.avatar-opt').classList.add('selected');
                document.getElementById('userAvatar').src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${av.seed}`;
                localStorage.setItem('celestial_avatar', av.seed);
                updateSidebarStats();
            };
        } else {
            wrap.onclick = () => alert(`Reach Level ${av.level} to unlock the ${av.seed} avatar! Keep writing and collecting stars.`);
        }
        picker.appendChild(wrap);
    });
}

const allAuras = [
    { color: 'var(--gold)', level: 1, name: 'Golden Sun' },
    { color: 'var(--silver)', level: 1, name: 'Lunar Silver' },
    { color: 'var(--teal)', level: 2, name: 'Nebula Teal' },
    { color: 'var(--rose)', level: 3, name: 'Stardust Rose' },
    { color: '#ff9f43', level: 5, name: 'Solar Flare' },
    { color: '#d4c5f0', level: 7, name: 'Cosmic Void' }
];

function renderGamifiedAuras(userLevel) {
    const picker = document.getElementById('auraPicker');
    if(!picker) return;
    picker.innerHTML = '';
    const storedAura = localStorage.getItem('celestial_aura') || 'var(--gold)';
    document.getElementById('userAuraRing').style.background = `linear-gradient(135deg, ${storedAura}, transparent, ${storedAura})`;
    
    allAuras.forEach(aura => {
        const isLocked = userLevel < aura.level;
        const opt = document.createElement('div');
        opt.className = `aura-opt ${isLocked ? 'locked' : ''} ${storedAura === aura.color ? 'active' : ''}`;
        opt.style.background = aura.color;
        opt.title = `${aura.name} (Lv. ${aura.level})`;
        if(isLocked) opt.innerHTML = '<span style="position: absolute; top: -5px; right: -5px; font-size: 10px;">🔒</span>';
        
        if (!isLocked) {
            opt.onclick = () => {
                document.querySelectorAll('.aura-opt').forEach(a => a.classList.remove('active'));
                opt.classList.add('active');
                document.getElementById('userAuraRing').style.background = `linear-gradient(135deg, ${aura.color}, transparent, ${aura.color})`;
                localStorage.setItem('celestial_aura', aura.color);
                updateSidebarStats();
            };
        } else {
            opt.onclick = () => alert(`Reach Level ${aura.level} to unlock the ${aura.name} aura!`);
        }
        picker.appendChild(opt);
    });
}

// Call on load
initGamifiedProfile();


// 1. Inject Controls into existing poem cards
function injectPoemControls() {
    document.querySelectorAll('.poem-card').forEach(card => {
        if (!card.querySelector('.poem-controls') && !card.querySelector('.poem-actions')) {
            const controls = document.createElement('div');
            controls.className = 'poem-controls';
            controls.innerHTML = `
                <button class="audio-narration-btn" data-audio="space">Play Audio</button>
                <button class="zen-btn">Zen Mode</button>
                <button class="bookmark-btn">⭐</button>
            `;
            card.appendChild(controls);
        }
    });
}
injectPoemControls();

// 2. Verse of the Day Spotlight
const votdList = [
    { title: "The Cosmic Shore", author: "Carl Sagan", text: "The surface of the Earth is the shore of the cosmic ocean. From it we have learned most of what we know. Recently, we have waded a little out to sea, enough to dampen our toes or, at most, wet our ankles." },
    { title: "Starlight", author: "William Wordsworth", text: "There is a given volume of energy... it is the same starlight that has travelled for millennia, just to reach our eyes tonight." },
    { title: "Silent Void", author: "Anonymous", text: "In the quiet of the endless night,\nWe find our place, our gentle light." }
];
function initVOTD() {
    const votdCard = document.getElementById('votdCard');
    if (!votdCard) return;
    const today = new Date();
    const index = today.getDate() % votdList.length;
    const poem = votdList[index];
    votdCard.innerHTML = `
        <div class="poem-title" style="font-size: 2rem; margin-bottom: 0.5rem;">${poem.title}</div>
        <div class="poem-author" style="font-size: 1.1rem; margin-bottom: 1.5rem;">${poem.author}</div>
        <div class="poem-text" style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">${poem.text}</div>
    `;
}
initVOTD();

// 3. Audio Narrations (Simulated)
let narrationAudio = null;
document.addEventListener('click', e => {
    if (e.target.classList.contains('audio-narration-btn')) {
        const btn = e.target;
        if (btn.textContent === 'Stop Audio') {
            if (narrationAudio) { narrationAudio.pause(); narrationAudio = null; }
            btn.textContent = 'Play Audio';
            return;
        }
        document.querySelectorAll('.audio-narration-btn').forEach(b => b.textContent = 'Play Audio');
        btn.textContent = 'Stop Audio';
        
        if (narrationAudio) narrationAudio.pause();
        // Fallback to ambient soundhelix if no specific narration is found
        const src = btn.dataset.audio === 'lunar' 
            ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' 
            : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3';
        narrationAudio = new Audio(src);
        narrationAudio.play();
        
        narrationAudio.onended = () => {
            btn.textContent = 'Play Audio';
        };
    }
});

// 4. Zen Mode
const zenOverlay = document.getElementById('zenModeOverlay');
const zenClose = document.getElementById('zenCloseBtn');
const zenTitle = document.getElementById('zenPoemTitle');
const zenAuthor = document.getElementById('zenPoemAuthor');
const zenText = document.getElementById('zenPoemText');

document.addEventListener('click', e => {
    if (e.target.classList.contains('zen-btn')) {
        const card = e.target.closest('.poem-card');
        const title = card.querySelector('.poem-title').textContent;
        const author = card.querySelector('.poem-author').textContent;
        const text = card.querySelector('.poem-text').innerHTML;
        
        zenTitle.textContent = title;
        zenAuthor.textContent = author;
        zenText.innerHTML = text;
        
        zenOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

if (zenClose) {
    zenClose.addEventListener('click', () => {
        zenOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// 5. Bookmarks
let bookmarks = JSON.parse(localStorage.getItem('celestialBookmarks') || '[]');
document.addEventListener('click', e => {
    if (e.target.classList.contains('bookmark-btn')) {
        const btn = e.target;
        const card = btn.closest('.poem-card');
        const title = card.querySelector('.poem-title').textContent;
        
        if (bookmarks.includes(title)) {
            bookmarks = bookmarks.filter(t => t !== title);
            btn.classList.remove('active');
        } else {
            bookmarks.push(title);
            btn.classList.add('active');
        }
        localStorage.setItem('celestialBookmarks', JSON.stringify(bookmarks));
    }
});
// Restore bookmark state
document.querySelectorAll('.poem-card').forEach(card => {
    const titleEl = card.querySelector('.poem-title');
    if (titleEl) {
        const title = titleEl.textContent;
        if (bookmarks.includes(title)) {
            const btn = card.querySelector('.bookmark-btn');
            if (btn) btn.classList.add('active');
        }
    }
});

// 6. Lunar Whispers Newsletter
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        if (email) {
            document.getElementById('newsletterConfirm').style.display = 'block';
            newsletterForm.reset();
            setTimeout(() => {
                document.getElementById('newsletterConfirm').style.display = 'none';
            }, 4000);
        }
    });
}

// 7. Falling Star Interaction
const fallingStar = document.getElementById('fallingStar');
const fsModal = document.getElementById('fallingStarModal');
const fsClose = document.getElementById('fallingStarClose');
const fsPoemText = document.getElementById('secretPoemText');
const fsPoemAuthor = document.getElementById('secretPoemAuthor');

const secretPoems = [
    { text: "I have loved the stars too fondly to be fearful of the night.", author: "Sarah Williams" },
    { text: "Hope is being able to see that there is light despite all of the darkness.", author: "Desmond Tutu" },
    { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" }
];

function triggerFallingStar() {
    if (document.hidden) return;
    fallingStar.classList.remove('active');
    void fallingStar.offsetWidth; // trigger reflow
    fallingStar.style.top = Math.random() * 30 + 'vh';
    fallingStar.classList.add('active');
}

// Trigger a falling star every 15-30 seconds
setInterval(() => {
    if (Math.random() > 0.3) triggerFallingStar();
}, 20000);

if (fallingStar) {
    fallingStar.addEventListener('click', () => {
        fallingStar.classList.remove('active');
        const poem = secretPoems[Math.floor(Math.random() * secretPoems.length)];
        fsPoemText.textContent = `"${poem.text}"`;
        fsPoemAuthor.textContent = `— ${poem.author}`;
        fsModal.style.display = 'flex';
        setTimeout(() => fsModal.classList.add('active'), 10);
    });
}
if (fsClose) {
    fsClose.addEventListener('click', () => {
        fsModal.classList.remove('active');
        setTimeout(() => fsModal.style.display = 'none', 300);
    });
}

