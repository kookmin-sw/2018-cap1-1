# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify, send_from_directory
from flask_oauthlib.client import OAuth
from pymongo import MongoClient
from pymongo import Connection
from urllib2 import Request, urlopen, URLError
import gridfs, datetime, json, os
from gridfs.errors import NoFile
from bson.objectid import ObjectId
from werkzeug import secure_filename
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
import PyPDF2
import hashlib
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfparser import PDFParser
from cStringIO import StringIO

ALLOWED_EXTENSIONS = set(['pdf'])
UPLOAD_FOLDER = '/home/hoon/captone3/2018-cap1-1/src/OpenJournal/web/static/journal'

app = Flask(__name__)
app.config['GOOGLE_ID'] = "1047595356269-lhvbbepm5r2dpt1bpk01f4m5e78vavk2.apps.googleusercontent.com"
app.config['GOOGLE_SECRET'] = "61w2EkT-lKN8eUkSRUBWIxMx"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

app.debug = True
app.secret_key = 'development'
oauth = OAuth(app)
client = MongoClient('localhost', 27017)
db = client.OpenJournal
fs = gridfs.GridFS(db)

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

hash_password = "0504110310110711"
pdf_path_without_filename = "/home/hoon/captone3/2018-cap1-1/src/OpenJournal/web/static/journal/"

@app.route("/") #메인 홈페이지 이동
def home():
    userId = checkUserId()
    return render_template('main.html', userId = userId)

def checkUserId():
    userId = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userId = me.data['email']
    elif 'userId' in session:
        userId = session['userId']
    return userId

def checkTime(month):   #월이 바뀌는 경우를 판단해주는 함수
    paperNumInfo = db.PaperNum
    data = paperNumInfo.find_one({"name": "latestNum"})
    storedMonth = data['month']
    if(storedMonth != month): #월이 다른 경우
        return 0
    else:
        return 1 #월이 같은 경우 1 리턴

@app.route("/papernum")
def papernum():
    paperNumInfo = db.PaperNum
    now   = datetime.datetime.now()
    year  = str(now.strftime("%Y"))
    month = str(now.strftime("%m"))
    flag  = checkTime(month)
    paper = paperNumInfo.find_one({"name":"latestNum"})
    createdPaperNum = 0

    if(flag == 1):
        if(paper['updatedPaperNum']>=0 and paper['updatedPaperNum']<=8):
            createdPaperNum = year+month+"000"+str(int(paper['updatedPaperNum']+1))
        elif(paper['updatedPaperNum']>=9 and paper['updatedPaperNum']<=98):
            createdPaperNum = year+month+"00"+str(int(paper['updatedPaperNum']+1))
        elif(paper['updatedPaperNum']>=99 and paper['updatedPaperNum']<=998):
            createdPaperNum = year+month+"0"+str(int(paper['updatedPaperNum']+1))
        elif(paper['updatedPaperNum']>=999 and paper['updatedPaperNum']<=9998):
            createdPaperNum = year+month+str(int(paper['updatedPaperNum']+1))
    elif(flag == 0):
        paperNumInfo.update({"name":"latestNum"}, {"$set": {"year":year,"month":month,"updatedPaperNum":0}})
        createdPaperNum = year+month+"000"+"1"

    return createdPaperNum

@app.route("/main_mypage") #메인 홈페이지 이동
def mainMypage():
    userId = checkUserId()
    userCollection = db.Users
    findedUserInfo = userCollection.find({"user_id": userId})
    paperCollection = db.PaperInformation
    findPaperInfo = paperCollection.find({"user_id": userId})
    return render_template('main_mypage.html', userInfo = findedUserInfo, writePaper = findPaperInfo)

@app.route("/main_login") #로그인 페이지 이동
def mainLogin():
    return render_template('main_login.html')

@app.route("/main_new_member") #회원 가입 페이지 이동
def mainNewMember():
    return render_template('main_new_member.html')
#################


@app.route("/main_view_fix_journal")
def moveToSubPaper():
    userId = checkUserId()
    completePaperCollection = db.PaperInformation
    data = completePaperCollection.find({"complete":1}).sort("time", -1)
    return render_template('main_view_fix_journal.html', data = data, userId=userId)

@app.route('/logout')
def logout():
    if 'google_token' in session:
        session.pop('google_token', None)
    if 'userId' in session:
        session.pop('userId', None)
    return render_template('main.html')

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
        subPaperNum = 0
        enrollPaperNum = 0
        tokenNum = 0
        doc = {'user_id'    : userId,      'user_name'     : userName,       'password':newPassWord,
               'telephone'  :telephone,    'birthday'      : birthday,       'fame'    : fame,
               'subPaperNum': subPaperNum, 'enrollPaperNum': enrollPaperNum, 'tokenNum': tokenNum}
        collection = db.Users
        oauthCollection = db.Oauth_Users
        cursor = collection.find({"user_id": userId})
        oauthCursor = oauthCollection.find({"user_id": userId})
        for document in cursor:                   #구글 회원 등록 확인
            if document['user_id'] == userId:
                #구현은 중복검사로 구현하기
                return "이미 회원 가입 되있습니다."
        for oauthDocument in oauthCursor:        #일반 회원 등록 확인
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

@app.route('/uploadPaper', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        # if user does not select file, browser also
        # submit a empty part without filename
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return str(filename)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],filename)

@app.route("/main_enroll_for_check_journal")
def mainEnrollForCheckJournal():
    userId = checkUserId()
    return render_template('main_enroll_for_check_journal.html', userId = userId)

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
    rows = collection.find({"complete": 0}).sort("writingPaperNum",-1)
    userId = checkUserId()
    return render_template('main_enroll.html', data =rows, userId=userId)

@app.route('/enrollPaperComment', methods=['POST'])
def enrollPaperComment():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            paperInfo = db.PaperInformation
            userId = checkUserId()
            userName = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": userId})
                userName = userData['user_name']
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            commentContent = request.form['comment']
            objectId = request.form['objectId']
            data = paperInfo.find({"_id": ObjectId(objectId)})
            commentNum = 0
            adaptFlag = 0
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
    userId = checkUserId()
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
    userId = checkUserId()
    data = paperInfo.find({"_id": ObjectId(id)})
    return render_template('main_journal_update.html', data = data, userId = userId)

@app.route("/version_update", methods=['GET', 'POST'])
def versionUpdate():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            userId = checkUserId()
            if 'google_token' in session:
                me = google.get('userinfo')
            elif 'userId' in session:
                user = db.Users
                data = user.find_one({"user_id": userId})
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
            fileName = upload_file()
            collection.update({"_id": ObjectId(id)}, {"$set": {"writer":writer, "mainCategory":mainCategory, "subCategory":subCategory,
                              "title":title, "abstract":abstract, "keyword": keyword, "version": version+1, "time": currentTime,
                              "fileName": fileName}})
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
    userId = checkUserId()

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
            userId = checkUserId()
            if 'google_token' in session:
                me = google.get('userinfo')
            elif 'userId' in session:
                user = db.Users
                data = user.find_one({"user_id": userId})
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
            paperNum = "" #최종 논문 등록시 논문 번호
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            latestPaperNum = db.latestPaperNum
            latestCursor = latestPaperNum.find_one({"latestfind": "latestfind"})
            writingPaperNum = int(latestCursor['latestPaperNum']+1)
            latestPaperNum.update({"latestfind": "latestfind"},
                                  {"latestfind": "latestfind",'latestPaperNum':writingPaperNum})
            fileName = upload_file()
            doc = {'user_id'     : userId,       'writer'     : writer,
                   'mainCategory': mainCategory, 'subCategory': subCategory,
                   'title'       : title,        'abstract'   : abstract,
                   'hits'        : hits,         'keyword'    : keyword,
                   'version'     : version,      'complete'   : complete,
                   'paperNum'    : paperNum,     'writingPaperNum' : writingPaperNum,
                   'time'        : currentTime,  'commentNumber' : commentNum,
                   'fileName'    : fileName
                   }
            collection = db.PaperInformation
            collection.insert(doc)
            userCollection = db.Users
            userInfo = userCollection.find_one({"user_id": userId})
            enrollPaperNum = userInfo['enrollPaperNum']
            userCollection.update({"user_id": userId}, {"$set":{"enrollPaperNum":enrollPaperNum+1}})
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
    userId = checkUserId()
    data = bulletin.find({"_id": ObjectId(id)})
    for document in data:
        if document['_id'] == ObjectId(id):
            hit = document['hits']
    bulletin.update({"_id": ObjectId(id)},{"$set": {"hits":hit+1}})
    data = bulletin.find({"_id": ObjectId(id)})
    return render_template('main_comunity_detail.html',data = data, userId = userId)

@app.route('/enrollWriting', methods=['POST', 'GET']) #작성한 글 등록기능 구현
def enrollWriting():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            collection = db.BulletinNum
            bulletinCollection = db.Bulletin
            userName = ""
            userId   = checkUserId()
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": userId})
                userName = userData['user_name']
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
            userId = checkUserId()
            userName = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
            elif 'userId' in session:
                user = db.Users
                userData = user.find_one({"user_id": session['userId']})
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
    userId = checkUserId()

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

@app.route("/final_enroll_blockChain", methods = ['GET', 'POST'])
def enrollBlockChain():
    id = request.args.get("id")
    userId = checkUserId()
    if userId != "":
        paperInfo = db.PaperInformation
        paper = paperInfo.find_one({"_id":ObjectId(id)})
        filepath = pdf_path_without_filename + paper['fileName']
        pdf_page = page_number_of_pdf(filepath)
        text = convert_pdf_to_txt(str(filepath))
        reference_number_list, reference_title_list = extract_reference_from_text(text)
        print(reference_number_list)
        print(reference_title_list)
        return render_template('main_enroll.html', userId=userId)
    else:
        return "로그인 이후 이용해 주시기 바랍니다."

def page_number_of_pdf(path):       # PDF의 page 수
    pdfFileObj = open(path, 'rb')
    pdfReader = PyPDF2.PdfFileReader(pdfFileObj)
    return pdfReader.numPages

def convert_pdf_to_txt(path, pages=None):
    if not pages:
        pagenums = set()
    else:
        pagenums = set(pages)

    output = StringIO()
    manager = PDFResourceManager()
    converter = TextConverter(manager, output, laparams=LAParams())
    interpreter = PDFPageInterpreter(manager, converter)

    infile = file(path, 'rb')
    for page in PDFPage.get_pages(infile, pagenums):
        interpreter.process_page(page)
    infile.close()
    converter.close()
    text = output.getvalue()
    output.close
    return text

def extract_reference_from_text(text):      # text로부터 reference를 추출
    start = text.find('REFERENCES:')
    reference_text = " ".join(text[start:].split("\n"))

    reference_list = reference_text.split("[")
    reference_number_list = []
    reference_title_list = []

    for reference in reference_list:
        is_valid = reference.find("]")
        try:
            int(reference[:is_valid])
        except:
            continue

        reference = reference[is_valid+1:]
        reference_detail_list = reference.split(",")
        is_openjournal_number = reference_detail_list[0].strip()

        try:
            reference_number_list.append(int(is_openjournal_number))
        except:
            continue

        start_title = reference.find("“")
        end_title = reference.find("”")

        reference_title = reference[start_title+3:end_title]
        reference_title_length = len(reference_title)

        if reference_title[reference_title_length-1] == ",":
            reference_title = reference_title[0:reference_title_length-1]
        reference_title_list.append(reference_title)

    number_length = len(reference_number_list)
    title_length = len(reference_title_list)

    # length가 다르면 오류 발생
    if number_length != title_length:
        return -1, -1

    return reference_number_list, reference_title_list

def make_reference_hash_string(number_list, title_list):    # reference를 hash string으로 변환
    hash_length = len(number_list)
    hash_list = []

    for i in range(0, hash_length):
        new_str = str(number_list[i])+hash_password+title_list[i]
        hash_list.append((hashlib.sha256(new_str.encode('utf-8')).hexdigest()))

    return hash_list

def make_hash_string(journal_number, journal_title):        # number와 title을 이용하여 hast string으로 변환
    new_str = str(journal_number)+hash_password+journal_title
    journal_hash = hashlib.sha256(new_str.encode('utf-8')).hexdigest()

    return journal_hash
def unicodetoascii(text):

    uni2ascii = {
            ord('\xe2\x80\x99'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\x9c'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9d'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9e'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x9f'.decode('utf-8')): ord('"'),
            ord('\xc3\xa9'.decode('utf-8')): ord('e'),
            ord('\xe2\x80\x9c'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\x93'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x92'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x94'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x94'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x98'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\x9b'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xec'.decode('utf-8')): ord('"'),
            ord('\xe2\x80\xed'.decode('utf-8')): ord('"'),

            ord('\xe2\x80\x90'.decode('utf-8')): ord('-'),
            ord('\xe2\x80\x91'.decode('utf-8')): ord('-'),

            ord('\xe2\x80\xb2'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb3'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb4'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb5'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb6'.decode('utf-8')): ord("'"),
            ord('\xe2\x80\xb7'.decode('utf-8')): ord("'"),

            ord('\xe2\x81\xba'.decode('utf-8')): ord("+"),
            ord('\xe2\x81\xbb'.decode('utf-8')): ord("-"),
            ord('\xe2\x81\xbc'.decode('utf-8')): ord("="),
            ord('\xe2\x81\xbd'.decode('utf-8')): ord("("),
            ord('\xe2\x81\xbe'.decode('utf-8')): ord(")"),

                            }
    return text.decode('utf-8').translate(uni2ascii).encode('ascii')

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
