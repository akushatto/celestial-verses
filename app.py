import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import hashlib
from supabase import create_client, Client

app = Flask(__name__, static_folder='.')
CORS(app)

# Supabase Credentials
# On Vercel, these should be set in the Dashboard -> Settings -> Environment Variables
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
        
    # Check if user exists
    existing = supabase.table('users').select('username').eq('username', username).execute()
    if existing.data:
        return jsonify({'error': 'Username already exists'}), 400
        
    # Insert user
    supabase.table('users').insert({
        'username': username,
        'password': hash_password(password)
    }).execute()
    
    return jsonify({'message': 'User created successfully', 'username': username})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    # Get user
    user = supabase.table('users').select('password').eq('username', username).execute()
    
    if not user.data or user.data[0]['password'] != hash_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
        
    return jsonify({'message': 'Login successful', 'username': username})

@app.route('/poems', methods=['GET'])
def get_poems():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
        
    # Get poems
    res = supabase.table('poems').select('*').eq('username', username).order('created_at', desc=True).execute()
    
    return jsonify(res.data)

@app.route('/poems', methods=['POST'])
def add_poem():
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    
    if not all([username, title, author, text]):
        return jsonify({'error': 'All fields are required'}), 400
        
    # Insert poem
    res = supabase.table('poems').insert({
        'username': username,
        'title': title,
        'author': author,
        'text': text
    }).execute()
    
    return jsonify(res.data[0])

@app.route('/poems/<poem_id>', methods=['PUT'])
def edit_poem(poem_id):
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    
    if not all([username, title, author, text]):
        return jsonify({'error': 'All fields are required'}), 400
        
    # Update poem
    res = supabase.table('poems').update({
        'title': title,
        'author': author,
        'text': text
    }).eq('id', poem_id).eq('username', username).execute()
    
    if res.data:
        return jsonify(res.data[0])
    else:
        return jsonify({'error': 'Poem not found or unauthorized'}), 404

@app.route('/poems/<poem_id>', methods=['DELETE'])
def delete_poem(poem_id):
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
        
    # Delete poem
    res = supabase.table('poems').delete().eq('id', poem_id).eq('username', username).execute()
    
    if res.data:
        return jsonify({'message': 'Poem deleted'})
    else:
        return jsonify({'error': 'Poem not found or unauthorized'}), 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)
