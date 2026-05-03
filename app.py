import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import uuid

app = Flask(__name__)
CORS(app)

DB_FILE = 'database.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS poems (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT username FROM users WHERE username = ?', (username,))
    if c.fetchone():
        conn.close()
        return jsonify({'error': 'Username already exists'}), 400
        
    c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hash_password(password)))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'User created successfully', 'username': username})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    
    if not row or row[0] != hash_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
        
    return jsonify({'message': 'Login successful', 'username': username})

@app.route('/poems', methods=['GET'])
def get_poems():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, title, author, text FROM poems WHERE username = ? ORDER BY timestamp DESC', (username,))
    poems = [{'id': row[0], 'title': row[1], 'author': row[2], 'text': row[3]} for row in c.fetchall()]
    conn.close()
    
    return jsonify(poems)

@app.route('/poems', methods=['POST'])
def add_poem():
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    
    if not all([username, title, author, text]):
        return jsonify({'error': 'All fields are required'}), 400
        
    poem_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO poems (id, username, title, author, text) VALUES (?, ?, ?, ?, ?)',
              (poem_id, username, title, author, text))
    conn.commit()
    conn.close()
    
    return jsonify({'id': poem_id, 'title': title, 'author': author, 'text': text})

@app.route('/poems/<poem_id>', methods=['DELETE'])
def delete_poem(poem_id):
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('DELETE FROM poems WHERE id = ? AND username = ?', (poem_id, username))
    conn.commit()
    deleted = c.rowcount > 0
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Poem deleted'})
    else:
        return jsonify({'error': 'Poem not found or unauthorized'}), 404

if __name__ == '__main__':
    init_db()
    app.run(port=5000, debug=True)

@app.route('/poems/<poem_id>', methods=['PUT'])
def edit_poem(poem_id):
    data = request.json
    username = data.get('username')
    title = data.get('title')
    author = data.get('author')
    text = data.get('text')
    
    if not all([username, title, author, text]):
        return jsonify({'error': 'All fields are required'}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('UPDATE poems SET title = ?, author = ?, text = ? WHERE id = ? AND username = ?',
              (title, author, text, poem_id, username))
    conn.commit()
    updated = c.rowcount > 0
    conn.close()
    
    if updated:
        return jsonify({'id': poem_id, 'title': title, 'author': author, 'text': text})
    else:
        return jsonify({'error': 'Poem not found or unauthorized'}), 404
