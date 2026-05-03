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
    supabase.table('users').insert({'username': username, 'password': hash_password(password)}).execute()
    return jsonify({'message': 'User created successfully', 'username': username})

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

@app.route('/poems', methods=['GET'])
def get_poems():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    res = supabase.table('poems').select('*').eq('username', username).order('created_at', desc=True).execute()
    return jsonify(res.data)

@app.route('/public-poems', methods=['GET'])
def get_public_poems():
    # Fetch public poems and join with star count
    res = supabase.table('poems').select('*, stars(count)').eq('is_public', True).order('created_at', desc=True).execute()
    # Flatten the count
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
    if not all([username, title, author, text]):
        return jsonify({'error': 'All fields are required'}), 400
    res = supabase.table('poems').insert({
        'username': username, 'title': title, 'author': author, 'text': text, 'is_public': is_public
    }).execute()
    return jsonify(res.data[0])

@app.route('/poems/<poem_id>', methods=['PUT'])
def edit_poem(poem_id):
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    is_public = data.get('is_public', False)
    res = supabase.table('poems').update({
        'title': title, 'author': author, 'text': text, 'is_public': is_public
    }).eq('id', poem_id).eq('username', username).execute()
    if res.data:
        return jsonify(res.data[0])
    return jsonify({'error': 'Unauthorized'}), 404

@app.route('/poems/<poem_id>', methods=['DELETE'])
def delete_poem(poem_id):
    username = request.args.get('username')
    res = supabase.table('poems').delete().eq('id', poem_id).eq('username', username).execute()
    return jsonify({'message': 'Deleted'}) if res.data else jsonify({'error': 'Unauthorized'}), 404

@app.route('/poems/<poem_id>/star', methods=['POST'])
def star_poem(poem_id):
    username = request.json.get('username')
    if not username: return jsonify({'error': 'Login required'}), 401
    try:
        supabase.table('stars').insert({'username': username, 'poem_id': poem_id}).execute()
        return jsonify({'message': 'Starred'})
    except:
        # If already starred, unstar
        supabase.table('stars').delete().eq('username', username).eq('poem_id', poem_id).execute()
        return jsonify({'message': 'Unstarred'})

@app.route('/generate-poem', methods=['POST'])
def generate_poem():
    keyword = request.json.get('keyword', 'Stars')
    prompts = [
        f"In the silence of the {keyword}, stardust whispers secrets of old.",
        f"Beneath the {keyword} sky, we are but echoes of an ancient light.",
        f"The {keyword} dance in a rhythm only the soul can hear.",
        f"Like {keyword} across the void, our dreams travel further than light.",
        f"A fragment of {keyword} rests in every breath we take."
    ]
    return jsonify({'suggestion': random.choice(prompts)})

@app.route('/user-stats', methods=['GET'])
def user_stats():
    username = request.args.get('username')
    poems = supabase.table('poems').select('count', count='exact').eq('username', username).execute()
    # Count stars received across all poems
    user_poems = supabase.table('poems').select('id').eq('username', username).execute()
    ids = [p['id'] for p in user_poems.data]
    stars = 0
    if ids:
        star_res = supabase.table('stars').select('count', count='exact').filter('poem_id', 'in', f"({','.join(ids)})").execute()
        stars = star_res.count
    return jsonify({'count': poems.count, 'stars': stars})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
