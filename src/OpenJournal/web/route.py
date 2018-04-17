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
        return render_template('authorization.html', name=me.data['name'])
    else:
        return redirect(url_for('login'))
      
@app.route('/login')
def login():
    return google.authorize(callback=url_for('authorized', _external=True))

@app.route('/logout', methods = ['POST', 'GET'])
def logout():
    session.pop('google_token', None)
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

    userId = me.data['email']
    userName = me.data['name']
    doc = {'user_id': userId, 'user_name': userName}
   
    client = MongoClient('localhost', 27017)
    db = client.OpenJournal
    collection = db.Oauth_Users
    cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색, 회원 정보가 있다면 session에 로그인 정보 추가 후 이동
    for document in cursor:  
	if document['user_id'] == userId:
	    return render_template('authorization.html', name=me.data['name'])
    	    
    collection.insert(doc)
    client.close()
    return "구글계정으로 처음 로그인. db에 oauth정보 추가"    

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

#mongo URI가 들어왔을 때 'GET'메소드를 통해 mongo.html에 data 전송
@app.route('/board', methods=['GET'])
def board():
    client = MongoClient('localhost', 27017)
    db = client.OpenJournal
    collection = db.Article
    rows = collection.find()
    client.close()
    return render_template('white_board.html', data=rows)

@app.route('/enroll')
def enroll():
   return render_template('enroll.html')

#일반회원 가입. 데이터베이스에 User등록
@app.route('/enrollUser', methods=['POST'])
def enrollUser():
    if request.method == 'POST':
        userId = request.form['user_id']
	userName = request.form['user_name']
	userPw = request.form['user_pw']
  	doc = {'user_id': userId, 'user_name': userName, 'user_pw': userPw}  
        client = MongoClient('localhost', 27017)
        db = client.OpenJournal
        collection = db.Users
        cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색
        for document in cursor:  
	    if document['user_id'] == userId:
		return "이미 회원 가입 되었습니다."
	collection.insert(doc)
	client.close()
	return render_template("index.html")
    else:
	return "잘못된 데이터 수신 에러 입니다."   
    
"""쿠키 설정"""
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

@app.route('/enrollArticle')
def enrollArticle():
   return render_template('write.html')

@app.route('/setArticle', methods=['POST'])
def setArticle():
    if 'google_token' in session:
        if request.method == 'POST':
            me = google.get('userinfo')
            category = "article test"
            userId = me.data['email']
            subject = request.form['subject']
            content = request.form['content']
            doc = {'user_id': userId, 'category':category,'subject':subject, 'content':content}
            client = MongoClient('localhost', 27017)
            db = client.OpenJournal
            collection = db.Article
            collection.insert(doc)
            client.close()
            return "글쓰기 성공"
        else:
            return "세션에 토큰정보없음"
    else:
        return "로그인 안돼있음"
      
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
