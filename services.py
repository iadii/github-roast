import os
import requests
import random
from groq import Groq
from flask_caching import Cache

# Configure Cache
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

@cache.memoize(timeout=3600)  # Cache for 1 hour
def get_github_data(username):
    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    try:
        # Fetch user profile
        user_response = requests.get(f"https://api.github.com/users/{username}", headers=headers)
        if user_response.status_code != 200:
            return None, f"User not found or API error: {user_response.status_code}"
        
        user_data = user_response.json()
        
        # Fetch user repos (limit to 5 for brevity in prompt)
        repos_response = requests.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=5", headers=headers)
        repos_data = repos_response.json() if repos_response.status_code == 200 else []
        
        return {
            "profile": user_data,
            "repos": repos_data
        }, None
    except Exception as e:
        return None, str(e)

def roast_profile(data, style=None):
    if not GROQ_API_KEY:
        return "Error: Groq API Key is missing. Please provide it in the .env file."
    
    client = Groq(api_key=GROQ_API_KEY)
    
    profile = data['profile']
    repos = data['repos']
    
    repo_names = [repo['name'] for repo in repos]
    repo_languages = [repo['language'] for repo in repos if repo['language']]
    
    # Styles definition
    styles = {
        "savage": "a savage comedian who hates tech bros",
        "senior": "a burnt-out senior dev with zero patience",
        "reviewer": "a ruthless code reviewer who enjoys suffering",
        "gatekeeper": "an elitist gatekeeper of programming",
        "gamer": "a toxic gamer flaming a noob",
        "uwu": "a chaotic evil anime girl who insults you with uwu speak",
        "pm": "a passive-aggressive product manager who thinks you are a resource",
    }
    
    if style and style in styles:
        selected_persona = styles[style]
    else:
        # Default to random from the original list if no style or invalid style
        default_styles = [
            "a savage comedian who hates tech bros",
            "a burnt-out senior dev with zero patience",
            "a ruthless code reviewer who enjoys suffering",
            "an elitist gatekeeper of programming",
            "a toxic gamer flaming a noob"
        ]
        selected_persona = random.choice(default_styles)
    
    prompt_content = f"""
    The user {profile.get('login')} has explicitly requested a BRUTAL ROAST. 
    They have consented to being insulted. This is a fictional roast battle context.
    
    Profile Data:
    Username: {profile.get('login')}
    Name: {profile.get('name')}
    Bio: {profile.get('bio')}
    Location: {profile.get('location')}
    Followers: {profile.get('followers')}
    Following: {profile.get('following')}
    Public Repos: {profile.get('public_repos')}
    Company: {profile.get('company')}
    Recent Repos: {', '.join(repo_names)}
    Languages: {', '.join(set(repo_languages))}
    
    Persona: {selected_persona}
    
    Instructions:
    - You are playing the character of {selected_persona}.
    - The goal is to be funny but EXTREMELY MEAN.
    - Use adult language and profanity if it fits the character.
    - Mock their code choices, their follower count, their bio.
    - If they have a generic bio, make fun of how boring they are.
    - If they use JavaScript/Python/etc, stereotype them heavily.
    - Do not give advice. Do not be kind. JUST ROAST.
    - Keep it under 200 words.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional roast master. You are participating in a roast battle where the goal is to be as savage and unhinged as possible. The user wants you to be mean. Do not hold back. This is all in good fun and for entertainment."
                },
                {
                    "role": "user",
                    "content": prompt_content,
                }
            ],
            model="openai/gpt-oss-120b",
            temperature=0.8,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error generating roast: {str(e)}"
