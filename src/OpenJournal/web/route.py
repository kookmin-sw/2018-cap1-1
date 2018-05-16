# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify
from flask_oauthlib.client import OAuth
from pymongo import MongoClient
from pymongo import Connection
from urllib2 import Request, urlopen, URLError
import gridfs, datetime, json
from gridfs.errors import NoFile
from bson.objectid import ObjectId
from werkzeug import secure_filename

ALLOWED_EXTENSIONS = set(['pdf'])

app = Flask(__name__)
app.config['GOOGLE_ID'] = "1047595356269-lhvbbepm5r2dpt1bpk01f4m5e78vavk2.apps.googleusercontent.com"
app.config['GOOGLE_SECRET'] = "61w2EkT-lKN8eUkSRUBWIxMx"
app.debug = True
app.secret_key = 'development'
oauth = OAuth(app)
client = MongoClient('localhost', 27017)
db = client.OpenJournal

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

@app.route("/") #메인 홈페이지 이동
def home():
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']
    return render_template('main.html', userId = userId)

@app.route("/main_login") #로그인 페이지 이동
def mainLogin():
    return render_template('main_login.html')

@app.route("/main_new_member") #회원 가입 페이지 이동
def mainNewMember():
    return render_template('main_new_member.html')

@app.route('/logout')
def logout():
    if 'google_token' in session:
        session.pop('google_token', None)
    if 'userId' in session:
        session.pop('userId', None)
    return render_template('main.html')

@app.route("/loginInformation", methods=['POST']) #로그인시 로그인 정보 상단 출력(구현중)
def loginInformation():
    if 'google_token' in session:
        me = google.get('userinfo')
        return str(me.data['email'])

@app.route("/userLogin", methods=['POST'])
def userLogin():
    if 'google_token' in session:         #일반회원 로그인 시 구글 로그인 정보가 세션에 담겨져있다면 세션에서 제거
        session.pop('google_token', None)
    userId = request.form['email_id']
    password = request.form['password']
    collection = db.Users
    cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색
    for document in cursor:
        if document['user_id'] == userId and document['password'] == password:
            session['userId'] = userId
            break
    return render_template('main.html', userId = userId)

@app.route("/enrollNewMember", methods=['POST']) #회원 가입 기능 구현
def enrollNewMember():
    if request.method == 'POST':
        userFirstName = request.form['first_name']
        userLastName = request.form['last_name']
        userName = userLastName+userFirstName
        userId = request.form['email_id']
        newPassWord = request.form['new_password']
        newPassWordCheck = request.form['new_password_check']
        telephone = request.form['telephone']
        birthday = request.form['birthday']
        fame = 0
        doc = {'user_id'  : userId,     'user_name': userName, 'password':newPassWord,
               'telephone':telephone,   'birthday' :birthday, 'fame': fame}
        collection = db.Users
        oauthCollection = db.Oauth_Users
        cursor = collection.find({"user_id": userId})
        oauthCursor = oauthCollection.find({"user_id": userId})
        for document in cursor:                   #구글 회원 등록 확인
            if document['user_id'] == userId:
                #구현은 중복검사로 구현하기
                return "이미 회원 가입 되있습니다."
        for oauthDocument in oauthCursor:        #일반 회원 등록 확
            if oauthDocument['user_id'] == userId:
                #구현은 중복검사로 구현하기
                return "이미 회원 가입 되있습니다."
        collection.insert(doc)                   #아이디 검사 완료시 회원정보 데이터베이스 삽입
        return render_template("main.html")
    else:
        return "잘못된 데이터 요청 입니다."

@app.route('/oauth', methods=['GET', 'POST'])
def index():
    if 'userId' in session:         #구글회원 로그인 시 일반회원 로그인 정보가 세션에 담겨져있다면 세션에서 제거
        session.pop('userId', None)
    if 'google_token' in session:
        me = google.get('userinfo')
        return render_template('main.html')
    else:
        return redirect(url_for('login'))

@app.route('/login')
def login():
    return google.authorize(callback=url_for('authorized', _external=True))

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/files/<oid>')
def serve_gridfs_file(oid):
    try:
        file = fs.get(ObjectId(oid))
        response = make_response(file.read())
        response.mimetype = file.content_type
        return response
    except NoFile:
        abort(404)

@app.route("/main_enroll_for_check_journal")
def mainEnrollForCheckJournal():
    if 'google_token' in session or 'userId' in session:
        return render_template('main_enroll_for_check_journal.html')
    else:
        #로그인이 필요한 기능입니다. 라는 팝업 메시지 띄워주고 login 창으로 이동.
        return render_template('main_login.html')

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
    fame = 0
    doc = {'user_id': userId, 'user_name': userName, 'fame': fame}
    client = MongoClient('localhost', 27017)
    db = client.OpenJournal
    collection = db.Oauth_Users
    cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색, 회원 정보가 있다면 session에 로그인 정보 추가 후 이동
    for document in cursor:
        if document['user_id'] == userId:
            return render_template('main.html')
    collection.insert(doc)
    return render_template('main.html')

@app.route("/main_enroll") #검수중인 논문 리스트 페이지 뷰 구현
def mainEnroll():
    collection = db.PaperInformation
    rows = collection.find().sort("writingPaperNum",-1)
    return render_template('main_enroll.html', data =rows)

@app.route('/enrollPaperComment', methods=['POST'])
def enrollPaperComment():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            paperInfo = db.PaperInformation
            userId = ""
            userName = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
                userId = me.data['email']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": session['userId']})
                userId = session['userId']
                userName = userData['user_name']
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            commentContent = request.form['comment']
            objectId = request.form['objectId']
            data = paperInfo.find({"_id": ObjectId(objectId)})
            commentNum = 0
            adaptFlag = 0
            validity = 0
            for document in data:
                if document['_id'] == ObjectId(objectId):
                    commentNum = document['commentNumber']
                    if document['commentNumber']>=5:
                        validity = 1
                        paperInfo.update({"_id": ObjectId(objectId)},{"$set": {"complete":validity}})
            commentDict = {'commentNum':commentNum+1, 'userId':userId,'userName':userName, 'Time':currentTime,
            'comment':commentContent, 'adaptFlag': adaptFlag}
            paperInfo.update({"_id": ObjectId(objectId)},{"$push": {"commentDicts":commentDict}})
            paperInfo.update({"_id": ObjectId(objectId)},{"$set": {"commentNumber":commentNum+1}})
            data = paperInfo.find({"_id": ObjectId(objectId)})
            return render_template('main_view_journal.html',data = data, userId = userId)
        else:
            return "잘못된 데이터 요청 입니다."
    else:
        return "로그인이 필요한 기능입니다."

@app.route("/main_view_journal", methods=['GET', 'POST'])
def viewPaper():
    id = request.args.get("id") #현재 보려고 하는 논문의 ObjectId 값 get
    paperInfo = db.PaperInformation
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']
    data = paperInfo.find({"_id": ObjectId(id)})
    """
    for doc in data:
        if doc['user_id'] == userId:
            fs = gridfs.GridFS(db)
            oid = doc['file_id']
            file = fs.get(ObjectId(oid))
    """
    data = paperInfo.find({"_id": ObjectId(id)})
    return render_template('main_view_journal.html', data = data, userId = userId)

@app.route("/move_paper_update", methods=['GET', 'POST'])
def moveUpdatePaper():
    id = request.args.get("id")
    paperInfo = db.PaperInformation
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']
    data = paperInfo.find({"_id": ObjectId(id)})
    return render_template('main_journal_update.html', data = data, userId = userId)

@app.route("/version_update", methods=['GET', 'POST'])
def versionUpdate():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            userId = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userId = me.data['email']
            elif 'userId' in session:
                user = db.Users
                data = user.find_one({"user_id": session['userId']})
                userId = data['user_id']
            collection = db.PaperInformation
            writer = request.form['writerName']
            mainCategory = request.form['mainCat']
            subCategory = request.form['subCat']
            title = request.form['title']
            abstract = request.form['abstract']
            keyword = request.form['keyword']
            version = 1
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            id = request.form['objectId']
            data = collection.find_one({"_id": ObjectId(id)})
            version = data['version']
            fs = gridfs.GridFS(db)
            file = request.files['file']
            fileId = ""
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                fileId = fs.put(file, content_type=file.content_type, filename=filename)
            collection.update({"_id": ObjectId(id)}, {"$set": {"writer":writer, "mainCategory":mainCategory, "subCategory":subCategory,
                              "title":title, "abstract":abstract, "keyword": keyword, "version": version, "time": currentTime,
                              "file_id":fileId}})
            return mainEnroll()
    else:
        #로그인이 필요한 기능입니다. 라는 팝업 메시지 띄워data = data, userId = userId주고 login 창으로 이동.
        return render_template('main_login.html')

@app.route("/adaptPaperComment") #댓글 채택시 명성 부여
def adaptPaperComment():
    data = request.args.get("data")
    list = data.split(',') # 0번째 댓글번호, 1번째 문서객체아이디, 2번째 댓글 작성자 아이디, 3번째 채택flag, 4번째 글 작성자 아이디
    paperCollection = db.PaperInformation
    userCollection = db.Users
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']

    cursor = userCollection.find({"user_id": list[2]}) #일반 유저인 경우
    for document in cursor:
        if document['user_id'] == list[2]:
            userCollection.update({"user_id":document['user_id']}, {"$set": {"fame": document['fame']+5}})
            paper = paperCollection.find_one({'_id': ObjectId(list[1])})
            commentN = list[0]
            paperCollection.update({"_id": ObjectId(list[1]), "commentDicts.commentNum": int(commentN)},
            {"$set": {"commentDicts.$.adaptFlag": 1}}, True)
            data = paperCollection.find({"_id": ObjectId(list[1])})
            return render_template('main_view_journal.html',data = data, userId = userId)

    oauthUserCollection = db.Oauth_Users
    oauthCursor = oauthUserCollection.find({"user_id": list[2]}) #구글 유저인 경우
    for doc in oauthCursor:
        if doc['user_id'] == list[2]:
            oauthUserCollection.update({"user_id":doc['user_id']}, {"$set": {"fame": doc['fame']+5}})
            writingPaper = writingCollection.find_one({'_id': ObjectId(list[1])})
            commentN = list[0]
            writingCollection.update({"_id": ObjectId(list[1]), "commentDicts.commentNum": int(commentN)},
            {"$set": {"commentDicts.$.adaptFlag": 1}}, True)
            data = writingCollection.find({"_id": ObjectId(list[1])})
            return render_template('main_comunity_detail.html',data = data, userId = userId)
    return "fail"

@app.route('/enrollPaper', methods=['POST']) #논문 등록 버튼 클릭 시 처리 함수
def enrollPaper():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            userId = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userId = me.data['email']
            elif 'userId' in session:
                user = db.Users
                data = user.find_one({"user_id": session['userId']})
                userId = data['user_id']
            writer = request.form['writerName']
            mainCategory = request.form['mainCat']
            subCategory = request.form['subCat']
            title = request.form['title']
            abstract = request.form['abstract']
            keyword = request.form['keyword']
            hits = 0
            version = 1
            complete = 0
            commentNum = 0
            paperNum = ""
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            latestPaperNum = db.latestPaperNum
            latestCursor = latestPaperNum.find_one({"latestfind": "latestfind"})
            writingPaperNum = int(latestCursor['latestPaperNum']+1)
            latestPaperNum.update({"latestfind": "latestfind"},
                                  {"latestfind": "latestfind",'latestPaperNum':writingPaperNum})
            fs = gridfs.GridFS(db)
            file = request.files['file']
            fileId = ""
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                fileId = fs.put(file, content_type=file.content_type, filename=filename)
                #return redirect(url_for('serve_gridfs_file', oid=str(oid)))
            doc = {'user_id'     : userId,       'writer'     : writer,
                   'mainCategory': mainCategory, 'subCategory': subCategory,
                   'title'       : title,        'abstract'   : abstract,
                   'hits'        : hits,         'keyword'    : keyword,
                   'version'     : version,      'complete'   : complete,
                   'file_id'     : fileId,       'writingPaperNum' : writingPaperNum,
                   'time'        : currentTime,  'commentNumber' : commentNum,
                   'paperNum'    : paperNum
                   }
            collection = db.PaperInformation
            collection.insert(doc)
            return mainEnroll()
    else:
        #로그인이 필요한 기능입니다. 라는 팝업 메시지 띄워data = data, userId = userId주고 login 창으로 이동.
        return render_template('main_login.html')

@app.route("/main_comunity") #커뮤니티 작성된 글 목록 구성
def mainComunity():
    collection = db.Bulletin
    rows = collection.find().sort("writingNum",-1)
    return render_template('main_comunity.html', data=rows)

@app.route("/main_comunity_write") #글쓰기 버튼 클릭시 로그인 검사 및 글쓰기 페이지 이동
def mainComunityWrite():
    if 'google_token' in session or 'userId' in session:
        return render_template('main_comunity_write.html')
    else:
        #로그인이 필요한 기능입니다. 라는 팝업 메시지 띄워주고 login 창으로 이동.
        return render_template('main_login.html', data = data, userId = userId)

@app.route("/main_comunity_detail", methods=['GET', 'POST']) #커뮤니티 글 내용 불러오기 기능 구현
def getWriting():
    id = request.args.get("id")
    bulletin = db.Bulletin
    hit = 0
    userId = ""
    data = bulletin.find({"_id": ObjectId(id)})
    for document in data:
        if document['_id'] == ObjectId(id):
            hit = document['hits']
    bulletin.update({"_id": ObjectId(id)},{"$set": {"hits":hit+1}})
    data = bulletin.find({"_id": ObjectId(id)})
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']
    return render_template('main_comunity_detail.html',data = data, userId = userId)

@app.route('/enrollWriting', methods=['POST', 'GET']) #작성한 글 등록기능 구현
def enrollWriting():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            collection = db.BulletinNum
            bulletinCollection = db.Bulletin
            userName = ""
            userId   = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
                userId = me.data['email']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": session['userId']})
                userName = userData['user_name']
                userId   = session['userId']
            mainCategory = request.form['mainCat']
            subCategory = request.form['subCat']
            title = request.form['title']
            contents = request.form['contents']
            hits = 0
            like = 0
            writingNum = 0
            cursor = collection.find_one({"latestName": "latestName"})
            writingNum = int(cursor['writingNum']+1)
            commentNum = 0
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            doc = {'userName': userName, 'userId': userId, 'mainCategory':mainCategory,
                   'subCategory':subCategory, 'title':title, 'contents':contents, 'hits':hits,
                   'writingNum':writingNum,'time':currentTime, 'commentNumber':commentNum}
            bulletinCollection.insert(doc)
            collection.update({"latestName": "latestName"},
                              {"latestName": "latestName",'writingNum':writingNum})
            return mainComunity()
    else:
        #로그인이 필요한 기능입니다. 라는 팝업 메시지 띄워주고 login 창으로 이동.
        return render_template('main_login.html')

@app.route('/commentEnroll', methods=['POST']) #댓글기능 구현
def commentEnroll():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            bulletin = db.Bulletin
            userId = ""
            userName = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
                userId = me.data['email']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": session['userId']})
                userId = session['userId']
                userName = userData['user_name']
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            commentContent = request.form['comment']
            objectId = request.form['objectId']
            data = bulletin.find({"_id": ObjectId(objectId)})
            commentNum = 0
            adaptFlag = 0
            for document in data:
                if document['_id'] == ObjectId(objectId):
                    commentNum = document['commentNumber']
            commentDict = {'commentNum':commentNum+1, 'userId':userId,'userName':userName, 'Time':currentTime,
            'comment':commentContent, 'adaptFlag': adaptFlag}
            bulletin.update({"_id": ObjectId(objectId)},{"$push": {"commentDicts":commentDict}})
            bulletin.update({"_id": ObjectId(objectId)},{"$set": {"commentNumber":commentNum+1}})
            data = bulletin.find({"_id": ObjectId(objectId)})
            return render_template('main_comunity_detail.html',data = data, userId = userId)
        else:
            return "잘못된 데이터 요청 입니다."
    else:
        return "로그인이 필요한 기능입니다."

@app.route("/adaptComment") #댓글 채택시 명성 부여
def adaptComment():
    data = request.args.get("data")
    list = data.split(',') # 0번째 댓글번호, 1번째 문서객체아이디, 2번째 댓글 작성자 아이디, 3번째 채택flag, 4번째 글 작성자 아이디
    writingCollection = db.Bulletin
    userCollection = db.Users
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']

    cursor = userCollection.find({"user_id": list[2]}) #일반 유저인 경우
    for document in cursor:
        if document['user_id'] == list[2]:
            userCollection.update({"user_id":document['user_id']}, {"$set": {"fame": document['fame']+5}})
            writingPaper = writingCollection.find_one({'_id': ObjectId(list[1])})
            commentN = list[0]
            writingCollection.update({"_id": ObjectId(list[1]), "commentDicts.commentNum": int(commentN)},
            {"$set": {"commentDicts.$.adaptFlag": 1}}, True)
            data = writingCollection.find({"_id": ObjectId(list[1])})
            return render_template('main_comunity_detail.html',data = data, userId = userId)

    oauthUserCollection = db.Oauth_Users
    oauthCursor = oauthUserCollection.find({"user_id": list[2]}) #구글 유저인 경우
    for doc in oauthCursor:
        if doc['user_id'] == list[2]:
            oauthUserCollection.update({"user_id":doc['user_id']}, {"$set": {"fame": doc['fame']+5}})
            writingPaper = writingCollection.find_one({'_id': ObjectId(list[1])})
            commentN = list[0]
            writingCollection.update({"_id": ObjectId(list[1]), "commentDicts.commentNum": int(commentN)},
            {"$set": {"commentDicts.$.adaptFlag": 1}}, True)
            data = writingCollection.find({"_id": ObjectId(list[1])})
            return render_template('main_comunity_detail.html',data = data, userId = userId)

    return "fail"

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
