import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from twikit import Client
import asyncio
from datetime import timezone
from dotenv import load_dotenv
from supabase import create_client
from cryptography.fernet import Fernet


#Loading environment variables from .env file
load_dotenv()

#Initializing Supabase client using secrets from .env
#We will use SERVICE_ROLE_KEY for all backend operations
supabase_url= os.environ.get("SUPABASE_URL")
supabase_key= os.environ.get("SUPABASE_SERVICE_KEY")
supabase= create_client(supabase_url, supabase_key)
print("Supabase client initialized.")

#Initializing Cryptography Suite using the secret from .env
encryption_key= os.environ.get("ENCRYPTION_KEY").encode()
fernet= Fernet(encryption_key)
print("Encryption suite initialized.")

def encrypt_token(token: str) -> str:
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    return fernet.decrypt(encrypted_token.encode()).decode()


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


@app.route('/share_feed', methods=['POST'])
def share_feed_route():
    try:
        #Verify the user's Supabase JWT from the Authorization header
        auth_header= request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        jwt= auth_header.split(' ')[1]
        user_response= supabase.auth.get_user(jwt)
        user= user_response.user
        if not user:
            return jsonify({'error': 'Invalid JWT or user not found'}), 401

        #Get the required data from the JSON body
        data= request.get_json()
        owner_x_handle= data.get('owner_x_handle')
        auth_token= data.get('auth_token')
        ct0_token= data.get('ct0_token')
        display_name= data.get('display_name')

        if not all([owner_x_handle, auth_token, ct0_token]):
            return jsonify({'error': 'Missing one or more required fields: owner_x_handle, auth_token, ct0_token'}), 400

        #Encrypt the sensitive tokens
        encrypted_auth= encrypt_token(auth_token)
        encrypted_ct0= encrypt_token(ct0_token)

        #Prepare data and upsert into Supabase
        #Upsert will INSERT a new row, or UPDATE an existing one if a row with the
        #same primary key (or unique constraint) already exists.
        #We use 'owner_x_handle' as the conflict resolution key.
        record_to_upsert = {
            'user_id': user.id,
            'owner_x_handle': owner_x_handle,
            'display_name': display_name,
            'auth_token_encrypted': encrypted_auth,
            'ct0_token_encrypted': encrypted_ct0,
            'is_public': True  #Sharing implies making it public
        }
        
        response= supabase.table('shared_accounts').upsert(
            record_to_upsert, on_conflict='owner_x_handle'
        ).execute()

        return jsonify({'message': 'Feed shared successfully!'}), 200

    except Exception as e:
        print(f"An error occurred in /share_feed: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500
    
@app.route('/unshare_feed', methods=['POST'])
def unshare_feed_route():
    try:
        #Verify the user's Supabase JWT
        auth_header= request.headers.get('Authorization')
        jwt= auth_header.split(' ')[1]
        user= supabase.auth.get_user(jwt).user
        if not user:
            return jsonify({'error': 'Invalid JWT'}), 401

        #Update the is_public flag to false for the user's record
        #RLS ensures they can only update their own record.
        supabase.table('shared_accounts').update(
            {'is_public': False}
        ).eq('user_id', user.id).execute()

        return jsonify({'message': 'Feed is no longer shared.'}), 200
        
    except Exception as e:
        print(f"An error occurred in /unshare_feed: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500


@app.route('/check_share_status', methods=['GET'])
def check_share_status_route():
    try:
        #Verify the user's Supabase JWT
        auth_header= request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        jwt= auth_header.split(' ')[1]
        user= supabase.auth.get_user(jwt).user
        if not user:
            return jsonify({'error': 'Invalid JWT'}), 401

        #Fetch the sharing status for the logged-in user
        response= supabase.table('shared_accounts').select(
            'owner_x_handle, is_public'
        ).eq('user_id', user.id).execute()
        
        data= response.data
        if not data:
            # User has never shared before
            return jsonify({'is_public': False, 'owner_x_handle': ''}), 200
        
        return jsonify(data), 200

    except Exception as e:
        print(f"An error occurred in /check_share_status: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500


@app.route('/get_for_you_feed', methods=['POST'])
def get_for_you_feed_route():
    try:
        viewer_request_data = request.get_json()
        target_x_handle = viewer_request_data.get('target_x_handle')
        if not target_x_handle:
            return jsonify({'error': 'target_x_handle is required'}), 400

        response = supabase.table('shared_accounts').select(
            'auth_token_encrypted, ct0_token_encrypted'
        ).eq('owner_x_handle', target_x_handle).eq('is_public', True).single().execute()
        
        sharer_data = response.data

        decrypted_auth_token = decrypt_token(sharer_data['auth_token_encrypted'])
        decrypted_ct0_token = decrypt_token(sharer_data['ct0_token_encrypted'])

        tweets = asyncio.run(fetch_x_feed(decrypted_auth_token, decrypted_ct0_token, 'for_you'))
        return jsonify(tweets)

    except Exception as e:
        print(f"An error occurred in /get_for_you_feed: {e}")
        return jsonify({'error': 'Feed not found or is not shared publicly.'}), 404
    
@app.route('/get_following_feed', methods=['POST'])
def get_following_feed_route():
    try:
        viewer_request_data = request.get_json()
        target_x_handle = viewer_request_data.get('target_x_handle')

        if not target_x_handle:
            return jsonify({'error': 'target_x_handle is required'}), 400

        response = supabase.table('shared_accounts').select(
            'auth_token_encrypted, ct0_token_encrypted'
        ).eq('owner_x_handle', target_x_handle).eq('is_public', True).single().execute()

        sharer_data = response.data

        decrypted_auth_token = decrypt_token(sharer_data['auth_token_encrypted'])
        decrypted_ct0_token = decrypt_token(sharer_data['ct0_token_encrypted'])

        tweets = asyncio.run(fetch_x_feed(decrypted_auth_token, decrypted_ct0_token, 'following'))
        return jsonify(tweets)

    except Exception as e:
        #This block handles multiple errors: record not found, decryption errors, Twikit errors
        print(f"An error occurred in /get_following_feed: {e}")
        return jsonify({'error': 'Feed not found or is not shared publicly.'}), 404

if __name__== '__main__':
    app.run(debug=True, port=5000)