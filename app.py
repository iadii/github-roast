import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from services import get_github_data, roast_profile, cache

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Initialize Cache
cache.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/roast', methods=['POST'])
def roast():
    data = request.get_json()
    username = data.get('username')
    style = data.get('style')  # Get styling preference
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
        
    github_data, error = get_github_data(username)
    
    if error:
        return jsonify({'error': error}), 404
        
    roast_text = roast_profile(github_data, style)
    
    return jsonify({
        'profile': github_data['profile'],
        'roast': roast_text
    })

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
