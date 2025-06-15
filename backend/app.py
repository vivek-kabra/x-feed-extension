from flask import Flask, request, jsonify
from flask_cors import CORS
from twikit import Client
import asyncio

app= Flask(__name__)
CORS(app)

async def fetch_x_feed(auth_token, ct0_token):
    client= Client('en-US')
    cookies= {
        'auth_token': auth_token ,
        'ct0': ct0_token
    }
    client.set_cookies(cookies)
    
    timeline_tweets= await client.get_timeline()
    
    formatted_tweets= []
    for tweet in timeline_tweets:
        formatted_tweets.append({
            'id': tweet.id,
            'text': tweet.text,
            'author_name': tweet.user.name,
            'author_handle': tweet.user.screen_name,
            'author_avatar': tweet.user.profile_image_url,
        })
    return formatted_tweets



@app.route('/get_feed', methods=['POST'])
def get_feed_func():
    data= request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    auth_token= data.get('auth_token')
    ct0_token= data.get('ct0')
    
    if not auth_token or not ct0_token:
        return jsonify({'error': 'Missing required tokens'}), 400
    
    try:
        tweets= asyncio.run(fetch_x_feed(auth_token, ct0_token))
        return jsonify(tweets)
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to fetch feed. Tokens may be invalid or expired.'}), 500
    

if __name__== '__main__':
    app.run(debug=True, port=5000)