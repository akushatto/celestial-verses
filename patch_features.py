import glob

# 1. Fix SEO and Navigation Links
pages = {
    'index.html': ('Celestial Verses — Home', 'A cosmic anthology and sanctuary for stargazers and poets to share their verses.'),
    'library.html': ('Cosmic Library — Celestial Verses', 'Browse the public library of celestial poetry, search by keyword, and discover new poets.'),
    'dashboard.html': ('Your Space — Celestial Verses', 'Manage your cosmic verses, view your insights, and write new poetry.'),
    'about.html': ('About — Celestial Verses', 'The story behind Celestial Verses, an interactive anthology mapping the poetry of the stars.')
}

for file, (title, desc) in pages.items():
    with open(file, 'r') as f:
        content = f.read()
    
    # Fix SEO
    content = content.replace('<title>Celestial Verses — Poems of the Cosmos</title>', f'<title>{title}</title>\n    <meta name="description" content="{desc}">')
    
    # Fix Navigation
    content = content.replace('href="/"', 'href="index.html"')
    content = content.replace('href="/library.html"', 'href="library.html"')
    content = content.replace('href="/dashboard.html"', 'href="dashboard.html"')
    content = content.replace('href="/about.html"', 'href="about.html"')
    
    # Add Categories to Library
    if file == 'library.html':
        if 'id="categorySelect"' not in content:
            cat_html = '''
        <select id="categorySelect" style="padding: 0.8rem; margin-left: 10px; border-radius: 4px; border: 1px solid var(--gold); background: rgba(0,0,0,0.5); color: white; font-family: 'Cinzel';">
            <option value="">All Categories</option>
            <option value="Star-themed">Star-themed</option>
            <option value="Nature-themed">Nature-themed</option>
            <option value="Emotional">Emotional</option>
        </select>
'''
            content = content.replace('<button id="searchBtn" class="action-btn">Search</button>', '<button id="searchBtn" class="action-btn">Search</button>' + cat_html)
    
    with open(file, 'w') as f:
        f.write(content)

# 2. Add Follow and Comments UI to app.js
with open('app.js', 'r') as f:
    app_js = f.read()

# Add follow and comment buttons to public poem cards
if "class='social-actions'" not in app_js:
    social_html = r"""
        <div class='social-actions' style='margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; display: flex; justify-content: space-between;'>
            <div>
                <button onclick='followUser(\"${poem.username}\")' style='background: none; border: 1px solid var(--gold); color: var(--gold); padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8rem;'>✦ Follow ${poem.username}</button>
            </div>
            <div>
                <button onclick='toggleComments(\"${poem.id}\")' style='background: none; border: none; color: #ccc; cursor: pointer; font-size: 0.9rem;'>💬 Comments</button>
            </div>
        </div>
        <div id='comments-${poem.id}' style='display: none; margin-top: 10px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;'>
            <div id='comment-list-${poem.id}' style='max-height: 150px; overflow-y: auto; margin-bottom: 10px; font-size: 0.9rem; color: #ddd;'></div>
            <div style='display: flex;'>
                <input type='text' id='comment-input-${poem.id}' placeholder='Leave a poetic thought...' style='flex: 1; padding: 5px; background: transparent; border: 1px solid var(--teal); color: white;'>
                <button onclick='postComment(\"${poem.id}\")' style='background: var(--teal); border: none; padding: 5px 10px; color: white; cursor: pointer;'>Post</button>
            </div>
        </div>
    """
    
    app_js = app_js.replace("</div>\n                    </div>\n                `;\n                container.appendChild(card);", social_html + "\n                    </div>\n                `;\n                container.appendChild(card);")

# Add the JS functions for Follow and Comments if not exist
if "function followUser" not in app_js:
    js_funcs = r"""
window.followUser = async function(targetUser) {
    if(!currentUser) { showAuthModal(); return; }
    if(currentUser === targetUser) { alert("You cannot follow yourself in the cosmos."); return; }
    try {
        let res = await fetch(`${API_BASE}/follow`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({follower: currentUser, following: targetUser})
        });
        let data = await res.json();
        alert(data.status === 'followed' ? `You are now following ${targetUser}'s verses.` : `You unfollowed ${targetUser}.`);
    } catch(err) { console.error(err); }
};

window.toggleComments = async function(poemId) {
    let div = document.getElementById(`comments-${poemId}`);
    if(div.style.display === 'none') {
        div.style.display = 'block';
        await loadComments(poemId);
    } else {
        div.style.display = 'none';
    }
};

window.loadComments = async function(poemId) {
    try {
        let res = await fetch(`${API_BASE}/comments?poem_id=${poemId}`);
        let comments = await res.json();
        let list = document.getElementById(`comment-list-${poemId}`);
        list.innerHTML = comments.map(c => `<div style="margin-bottom: 5px;"><strong>${c.username}:</strong> ${c.text}</div>`).join('') || "<em>No thoughts yet. Be the first.</em>";
    } catch(err) { console.error(err); }
};

window.postComment = async function(poemId) {
    if(!currentUser) { showAuthModal(); return; }
    let input = document.getElementById(`comment-input-${poemId}`);
    let text = input.value.trim();
    if(!text) return;
    try {
        await fetch(`${API_BASE}/comments`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({poem_id: poemId, username: currentUser, text: text})
        });
        input.value = '';
        await loadComments(poemId);
    } catch(err) { console.error(err); }
};
"""
    app_js += "\n" + js_funcs

with open('app.js', 'w') as f:
    f.write(app_js)
