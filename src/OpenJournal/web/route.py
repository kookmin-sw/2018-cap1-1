# -*- coding: utf-8 -*- 

from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from flask_oauthlib.client import OAuth
from pymongo import MongoClient 
from urllib2 import Request, urlopen, URLError


app = Flask(__name__)
app.config['GOOGLE_ID'] = "1047595356269-lhvbbepm5r2dpt1bpk01f4m5e78vavk2.apps.googleusercontent.com"
app.config['GOOGLE_SECRET'] = "61w2EkT-lKN8eUkSRUBWIxMx"
app.debug = True
app.secret_key = 'development'
oauth = OAuth(app)

google = oauth.remote_app(
    'google',
    consumer_key=app.config.get('GOOGLE_ID'),
    consumer_secret=app.config.get('GOOGLE_SECRET'),
    request_token_params={
        'scope': 'email'
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

@app.route("/")
def home():
    return render_template('index.html')

@app.route('/oauth', methods=['GET', 'POST'])
def index():
    if 'google_token' in session:
        me = google.get('userinfo')
        #return me.data['gender']
	return render_template('authorization.html', name=me.data['name'])
    return redirect(url_for('login'))


@app.route('/login')
def login():
    return google.authorize(callback=url_for('authorized', _external=True))


@app.route('/logout', methods = ['POST', 'GET'])
def logout():
    session.pop('google_token', None)
    #return redirect(url_for('index'))
    return render_template('index.html')


@app.route('/login/authorized')
def authorized():
    resp = google.authorized_response()
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    session['google_token'] = (resp['access_token'], '')
    me = google.get('userinfo')
    return jsonify({"data": me.data})
    #return render_template('authorization.html', name=me.data['name'])

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

#mongo URI가 들어왔을 때 'GET'메소드를 통해 mongo.html에 data 전송
@app.route('/mongo', methods=['GET'])
def mongo():
    client = MongoClient('localhost', 27017)
    db = client.mongoTest
    collection = db.mongoTest
    results = collection.find()
    client.close()
    return render_template('mongo.html', data=results)

@app.route('/login2')
def login2():
   return render_template('login2.html')

@app.route('/setcookie', methods = ['POST', 'GET'])
def setcookie():
   if request.method == 'POST':
	user = request.form['nm']
   
 	resp = make_response(render_template('readcookie.html'))
	resp.set_cookie('userID', user)   
   	return resp


@app.route('/getcookie')
def getcookie():
   name = request.cookies.get('userID')
   return '<h1>welcome '+name+'</h1>'


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
