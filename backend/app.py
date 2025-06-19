from flask import Flask, request, jsonify
from flask_cors import CORS
from twikit import Client
import asyncio
from datetime import timezone

app= Flask(__name__)
CORS(app)

async def fetch_x_feed(auth_token, ct0_token, feed_type):
    client= Client('en-US')
    cookies= {
        'auth_token': auth_token ,
        'ct0': ct0_token
    }
    client.set_cookies(cookies)
    if (feed_type== 'for_you'):
        timeline_tweets= await client.get_timeline()
    else:
        timeline_tweets= await client.get_latest_timeline()
    
    formatted_tweets= []
    for tweet in timeline_tweets:
        tweet_media = []
        if tweet.media:
            for media_item in tweet.media:
                media_url = ''
                if media_item.type == 'photo':
                    media_url = media_item.media_url
                
                if media_item.type == 'video' and media_item.video_info:
                    variants = sorted(media_item.video_info['variants'], key=lambda v: v.get('bitrate', 0), reverse=True) #Finding best quality of video
                    if variants:
                        media_url = variants[0]['url']
                
                tweet_media.append({
                    'type': media_item.type, # 'photo', 'video', 'animated_gif'
                    'url': media_url, 
                    'tco_url': media_item.url #For cleanup
                })

        formatted_tweets.append({
            'id': tweet.id,
            'text': tweet.text,
            'author_name': tweet.user.name,
            'author_handle': tweet.user.screen_name,
            'author_avatar': tweet.user.profile_image_url,
            'media': tweet_media,
            'created_at': tweet.created_at if hasattr(tweet, 'created_at') else 0,
            'reply_count': tweet.reply_count if hasattr(tweet, 'reply_count') else 0,
            'repost_count': tweet.retweet_count if hasattr(tweet, 'retweet_count') else 0,
            'like_count': tweet.favorite_count if hasattr(tweet, 'favorite_count') else 0,
            'view_count': tweet.view_count if hasattr(tweet, 'view_count') and tweet.view_count is not None else 0
        })
    return formatted_tweets



@app.route('/get_for_you_feed', methods=['POST'])
def get_for_you_feed_func():
    data= request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    auth_token= data.get('auth_token')
    ct0_token= data.get('ct0')
    
    if not auth_token or not ct0_token:
        return jsonify({'error': 'Missing required tokens'}), 400
    
    try:
        tweets= asyncio.run(fetch_x_feed(auth_token, ct0_token, 'for_you'))
        return jsonify(tweets)
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to fetch feed. Tokens may be invalid or expired.'}), 500
    
@app.route('/get_following_feed', methods=['POST'])
def get_following_feed_func():
    data= request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    auth_token= data.get('auth_token')
    ct0_token= data.get('ct0')
    
    if not auth_token or not ct0_token:
        return jsonify({'error': 'Missing required tokens'}), 400
    
    try:
        tweets= asyncio.run(fetch_x_feed(auth_token, ct0_token, 'following'))
        return jsonify(tweets)
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to fetch feed. Tokens may be invalid or expired.'}), 500

if __name__== '__main__':
    app.run(debug=True, port=5000)