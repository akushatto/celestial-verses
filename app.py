import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import hashlib
from supabase import create_client, Client
import random

app = Flask(__name__, static_folder='.')
CORS(app)

# Supabase Credentials
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://rxqchbuejyjhkkprmbbd.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_z3jN_dRMvgIRDErx61qheA_fyP307qh')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/library')
def library():
    return send_from_directory('.', 'library.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory('.', 'dashboard.html')

@app.route('/about')
def about():
    return send_from_directory('.', 'about.html')

@app.route('/style.css')
def style():
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def script():
    return send_from_directory('.', 'app.js')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    existing = supabase.table('users').select('username').eq('username', username).execute()
    if existing.data:
        return jsonify({'error': 'Username already exists'}), 400
    try:
        supabase.table('users').insert({
            'username': username, 
            'password': hash_password(password),
            'avatar_url': 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + username,
            'bio': 'A wandering star'
        }).execute()
        return jsonify({'message': 'User created successfully', 'username': username})
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    user = supabase.table('users').select('password').eq('username', username).execute()
    if not user.data or user.data[0]['password'] != hash_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    return jsonify({'message': 'Login successful', 'username': username})

@app.route('/profile', methods=['GET'])
def get_profile():
    username = request.args.get('username')
    if not username: return jsonify({'error': 'Username required'}), 400
    res = supabase.table('users').select('avatar_url, bio').eq('username', username).execute()
    return jsonify(res.data[0]) if res.data else jsonify({'error': 'Not found'}), 404

@app.route('/profile', methods=['PUT'])
def update_profile():
    data = request.json
    username = data.get('username')
    avatar_url = data.get('avatar_url')
    bio = data.get('bio')
    res = supabase.table('users').update({'avatar_url': avatar_url, 'bio': bio}).eq('username', username).execute()
    return jsonify(res.data[0])

@app.route('/poems', methods=['GET'])
def get_poems():
    username = request.args.get('username')
    if not username: return jsonify({'error': 'Username is required'}), 400
    res = supabase.table('poems').select('*').eq('username', username).order('created_at', desc=True).execute()
    return jsonify(res.data)

@app.route('/public-poems', methods=['GET'])
def get_public_poems():
    res = supabase.table('poems').select('*, stars(count)').eq('is_public', True).order('created_at', desc=True).execute()
    data = []
    for p in res.data:
        p['star_count'] = p.get('stars', [{}])[0].get('count', 0) if isinstance(p.get('stars'), list) else 0
        data.append(p)
    return jsonify(data)

@app.route('/poems', methods=['POST'])
def add_poem():
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    is_public = data.get('is_public', False)
    res = supabase.table('poems').insert({
        'username': username, 'title': title, 'author': author, 'text': text, 'is_public': is_public
    }).execute()
    return jsonify(res.data[0])

@app.route('/poems/<poem_id>/view', methods=['POST'])
def view_poem(poem_id):
    # Increment view count
    curr = supabase.table('poems').select('view_count').eq('id', poem_id).execute()
    if curr.data:
        new_count = (curr.data[0].get('view_count') or 0) + 1
        supabase.table('poems').update({'view_count': new_count}).eq('id', poem_id).execute()
    return jsonify({'success': True})

@app.route('/insights', methods=['GET'])
def get_insights():
    username = request.args.get('username')
    poems = supabase.table('poems').select('id, title, view_count').eq('username', username).execute()
    total_views = sum(p.get('view_count') or 0 for p in poems.data)
    most_viewed = max(poems.data, key=lambda x: x.get('view_count') or 0) if poems.data else None
    
    # Stars
    ids = [p['id'] for p in poems.data]
    stars = 0
    if ids:
        star_res = supabase.table('stars').select('count', count='exact').filter('poem_id', 'in', f"({','.join(ids)})").execute()
        stars = star_res.count
        
    return jsonify({
        'total_views': total_views,
        'total_stars': stars,
        'poem_count': len(poems.data),
        'most_viewed': most_viewed
    })

@app.route('/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    username = data.get('username')
    message = data.get('message')
    supabase.table('feedback').insert({'username': username, 'message': message}).execute()
    return jsonify({'message': 'Thank you for your feedback!'})

@app.route('/search', methods=['GET'])
def search_poems():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    # Simple ilike search since gin index handles it well
    res = supabase.table('poems').select('*, stars(count)').eq('is_public', True).ilike('title', f'%{query}%').execute()
    data = []
    for p in res.data:
        p['star_count'] = p.get('stars', [{}])[0].get('count', 0) if isinstance(p.get('stars'), list) else 0
        data.append(p)
    return jsonify(data)

@app.route('/comments', methods=['GET', 'POST'])
def handle_comments():
    if request.method == 'GET':
        poem_id = request.args.get('poem_id')
        res = supabase.table('comments').select('*').eq('poem_id', poem_id).order('created_at', desc=False).execute()
        return jsonify(res.data)
    else:
        data = request.json
        supabase.table('comments').insert({
            'poem_id': data['poem_id'],
            'username': data['username'],
            'text': data['text']
        }).execute()
        return jsonify({'success': True})

@app.route('/follow', methods=['POST'])
def toggle_follow():
    data = request.json
    follower = data['follower']
    following = data['following']
    # Check if already following
    existing = supabase.table('follows').select('*').eq('follower', follower).eq('following', following).execute()
    if existing.data:
        supabase.table('follows').delete().eq('follower', follower).eq('following', following).execute()
        return jsonify({'status': 'unfollowed'})
    else:
        supabase.table('follows').insert({'follower': follower, 'following': following}).execute()
        return jsonify({'status': 'followed'})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
