# -*- coding: utf-8 -*-
from bson.objectid import ObjectId
from cStringIO import StringIO
from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify, send_from_directory
from flask_oauthlib.client import OAuth
from gridfs.errors import NoFile
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pymongo import Connection
from pymongo import MongoClient
from urllib2 import Request, urlopen, URLError
from config import Config
from werkzeug import secure_filename

import gridfs, datetime, json, os, jinja2, flask
import PyPDF2
import hashlib

ALLOWED_EXTENSIONS = set(['pdf'])

#app = flask.Flask(__name__)
app = flask.Flask(__name__, static_url_path='', static_folder='')
my_loader = jinja2.ChoiceLoader([
    app.jinja_loader,
    jinja2.FileSystemLoader(Config.loader_path),
])
app.jinja_loader = my_loader

app.config['GOOGLE_ID'] = Config.google["id"]
app.config['GOOGLE_SECRET'] = Config.google["secret"]
app.config['UPLOAD_FOLDER'] = Config.upload_folder

app.debug = True
app.secret_key = 'development'
oauth = OAuth(app)
client = MongoClient('localhost', 27017)
db = client.OpenJournal
fs = gridfs.GridFS(db)

hash_password = Config.hash_password

google = oauth.remote_app(
    'google',
    consumer_key=app.config.get('GOOGLE_ID'),
    consumer_secret=app.config.get('GOOGLE_SECRET'),
    request_token_params={
        'scope': 'email'
    },
    base_url=Config.base_url,
    request_token_url=None,
    access_token_method='POST',
    access_token_url=Config.access_token_url,
    authorize_url=Config.authorize_url,
)

@app.route("/") #메인 홈페이지 이동
def home():
    userId = checkUserId()
    return render_template('main.html', userId = userId)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route("/main_token_buy_page")
def moveTokenBuy():
    userId = checkUserId()
    return render_template('main_token_buy_page.html', userId = userId)

def passwordTohash(password):
    hash_object = hashlib.sha256(password)
    hex_dig = hash_object.hexdigest()
    return hex_dig

@app.route("/blockEnrollUpdate")
def blockEnrollUpdate():
    id = session["obId"]
    paperCollection = db.PaperInformation
    pNum = session['journal_number']
    paperCollection.update({"_id":ObjectId(id)}, {"$set": {"complete": 1, "paperNum": pNum}})
    session.pop('journal_number', None)
    session.pop('obId', None)
    session['state'] = 0

@app.route("/enrollState", methods = ['POST'])
def enrollState():
    userId = checkUserId()
    state = request.form['state']
    obId = request.form['obId']
    session['state'] = state
    session['obId'] = obId
    session['journal_number'] = papernum()
    return render_template('main_enroll.html', userId = userId)

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
def papernum():                      #논문 번호 생성
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
    if 'google_token' in session:
        userCollection = db.Oauth_Users
        findedUserInfo = userCollection.find({"user_id": userId})
    else:
        userCollection = db.Users
        findedUserInfo = userCollection.find({"user_id": userId})
    paperCollection = db.PaperInformation
    findPaperInfo = paperCollection.find({"user_id": userId})
    return render_template('main_mypage.html', userId=userId, userInfo = findedUserInfo, writePaper = findPaperInfo)

@app.route("/main_login") #로그인 페이지 이동
def mainLogin():
    return render_template('main_login.html')

@app.route("/main_new_member") #회원 가입 페이지 이동
def mainNewMember():
    return render_template('main_new_member.html')

@app.route("/main_view_fix_journal")
def moveToSubPaper():
    userId = checkUserId()
    completePaperCollection = db.PaperInformation
    data = completePaperCollection.find({"complete":1}).sort("time", -1)
    return render_template('main_view_fix_journal.html', data = data, userId=userId)

@app.route('/main_logout')
def logout():
    userId = ""
    if 'google_token' in session:
        session.pop('google_token', None)
    if 'userId' in session:
        session.pop('userId', None)
    return render_template('main.html', userId = userId)

@app.route("/userLogin", methods=['POST'])
def userLogin():
    if 'google_token' in session:         #일반회원 로그인 시 구글 로그인 정보가 세션에 담겨져있다면 세션에서 제거
        session.pop('google_token', None)
    userId = request.form['email_id']
    password = passwordTohash(request.form['password'])
    collection = db.Users
    cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색
    loginFlag = 0
    for document in cursor:
        if document['user_id'] == userId and document['password'] == password:
            session['userId'] = userId
            loginFlag = 1
            break
    if loginFlag == 0:
        return render_template('main_login.html', userId = userId, loginFlag = loginFlag)
    elif loginFlag == 1:
        return render_template('main.html', loginFlag = loginFlag, userId = userId)

@app.route("/enrollNewMember", methods=['POST']) #일반회원 가입 기능 구현
def enrollNewMember():
    if request.method == 'POST':
        userFirstName = request.form['first_name']
        userLastName = request.form['last_name']
        userName = userLastName+userFirstName
        userId = request.form['email_id']
        newPassWord = passwordTohash(request.form['new_password'])
        newPassWordCheck = request.form['new_password_check']
        telephone = request.form['telephone']
        birthday = request.form['birthday']
        fame = 0
        subPaperNum = 0
        enrollPaperNum = 0
        tokenNum = 0
        accountInfo = request.form['ethereum_acc']
        doc = {'user_id'    : userId,      'user_name'     : userName,       'password':newPassWord,
               'telephone'  :telephone,    'birthday'      : birthday,       'fame'    : fame,
               'subPaperNum': subPaperNum, 'enrollPaperNum': enrollPaperNum, 'tokenNum': tokenNum,
               'accountInfo' : accountInfo}
        collection = db.Users
        oauthCollection = db.Oauth_Users
        cursor = collection.find({"user_id": userId})
        oauthCursor = oauthCollection.find({"user_id": userId})
        enrollFlag = 1
        for document in cursor:                   #구글 회원 등록 확인
            if document['user_id'] == userId:
                enrollFlag = 0
                return render_template('main_new_member.html', enrollFlag=enrollFlag)
        for oauthDocument in oauthCursor:        #일반 회원 등록 확인
            if oauthDocument['user_id'] == userId:
                enrollFlag = 0
                return render_template('main_new_member.html', enrollFlag=enrollFlag)
        collection.insert(doc)                   #아이디 검사 완료시 회원정보 데이터베이스 삽입
        return render_template("main.html", enrollFlag=enrollFlag)
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
    userId = checkUserId()
    return google.authorize(callback=url_for('authorized', _external=True))
    #return render_template('main.html', userId=userId)

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

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
    doc = {'user_id': userId, 'user_name': userName, 'fame': fame, 'tokenNum':0, 'subPaperNum':0, 'enrollPaperNum':0}
    client = MongoClient('localhost', 27017)
    db = client.OpenJournal
    collection = db.Oauth_Users
    cursor = collection.find({"user_id": userId}) #회원등록이 되 있는지 검색, 회원 정보가 있다면 session에 로그인 정보 추가 후 이동
    for document in cursor:
        if document['user_id'] == userId:
            return home()
    collection.insert(doc)
    return render_template('main.html', userId=userId)

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
    if userId == "":
        loginFlag = 2
        return render_template('main_login.html', loginFlag=loginFlag)
    else:
        return render_template('main_enroll_for_check_journal.html', userId = userId)

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
            userName = getUserName()
            now = datetime.datetime.now()
            currentTime = str(now.strftime("%Y.%m.%d %H:%M"))
            commentContent = request.form['comment']
            objectId = request.form['objectId']
            data = paperInfo.find({"_id": ObjectId(objectId)})
            commentNum = 0
            adaptFlag = 0
            for document in data:
                if document['_id'] == ObjectId(objectId):
                    commentNum = document['commentNumber']
            commentDict = {'commentNum':commentNum+1, 'userId':userId,'userName':userName, 'Time':currentTime,
                           'comment':commentContent, 'adaptFlag': adaptFlag}
            paperInfo.update({"_id": ObjectId(objectId)},{"$push": {"commentDicts":commentDict}})
            paperInfo.update({"_id": ObjectId(objectId)},{"$set": {"commentNumber":commentNum+1}})
            data = paperInfo.find({"_id": ObjectId(objectId)})
            data2 = paperInfo.find_one({"_id": ObjectId(objectId)})
            enrollUserId = data2['user_id']
            complete = data2['complete']
            paperNumDic = extractReference(objectId)
            return render_template('main_view_journal.html',data = data, userId = userId, enrollUserId = enrollUserId, complete = complete, paperNumDic = paperNumDic)
        else:
            return "잘못된 데이터 요청 입니다."
    else:
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

def extractReference(obId):
    paperInfo = db.PaperInformation
    paper = paperInfo.find_one({"_id":ObjectId(obId)})
    filepath = app.config['UPLOAD_FOLDER'] + paper['fileName']
    pdf_page = page_number_of_pdf(filepath)
    text = convert_pdf_to_txt(str(filepath), [pdf_page-3, pdf_page-2, pdf_page-1])
    reference_number_list, reference_title_list = extract_reference_from_text(text)
    reference_dic = {
    reference_number_list : reference_title_list for reference_number_list, reference_title_list in zip(reference_number_list, reference_title_list)
    }
    return reference_dic

@app.route("/main_view_journal", methods=['GET', 'POST'])
def viewPaper():
    id = request.args.get("id") #현재 보려고 하는 논문의 ObjectId 값 get
    paperInfo = db.PaperInformation
    userId = checkUserId()
    data = paperInfo.find({"_id": ObjectId(id)})
    data2 = paperInfo.find_one({"_id": ObjectId(id)})
    enrollUserId = data2['user_id']
    complete = data2['complete']
    paperNumDic = extractReference(id)
    return render_template('main_view_journal.html', id = id , data = data, userId = userId, enrollUserId = enrollUserId, complete = complete, paperNumDic = paperNumDic)

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
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

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
            paperNumDic = extractReference(list[1])
            return render_template('main_view_journal.html',data = data, userId = userId, paperNumDic = paperNumDic)

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
            paperNumDic = extractReference(list[1])
            return render_template('main_view_journal.html',data = data, userId = userId, paperNumDic = paperNumDic)

    loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
    return render_template('main_login.html', loginFlag=loginFlag)

@app.route('/enrollPaper', methods=['POST']) #논문 등록 버튼 클릭 시 처리 함수
def enrollPaper():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            userId = checkUserId()
            userName = ""
            if 'google_token' in session:
                me = google.get('userinfo')
                userName = me.data['name']
            elif 'userId' in session:
                user = db.Users
                data = user.find_one({"user_id": userId})
                userName = data['user_name']
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
                   'fileName'    : fileName,     'userName'   : userName
                   }
            collection = db.PaperInformation
            collection.insert(doc)
            userCollection = db.Users
            userInfo = userCollection.find_one({"user_id": userId})
            enrollPaperNum = userInfo['enrollPaperNum']
            userCollection.update({"user_id": userId}, {"$set":{"enrollPaperNum":enrollPaperNum+1}})
            return mainEnroll()
    else:
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

@app.route("/main_comunity") #커뮤니티 작성된 글 목록 구성
def mainComunity():
    collection = db.Bulletin
    rows = collection.find().sort("writingNum",-1)
    userId = checkUserId()
    return render_template('main_comunity.html', data=rows, userId=userId)

@app.route("/main_comunity_write") #글쓰기 버튼 클릭시 로그인 검사 및 글쓰기 페이지 이동
def mainComunityWrite():
    userId = checkUserId()
    if 'google_token' in session or 'userId' in session:
        return render_template('main_comunity_write.html', userId = userId)
    else:
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

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

def getUserName():
    userId   = checkUserId()
    userName = ""
    if 'google_token' in session:
        me = google.get('userinfo')
        userName = me.data['name']
    elif 'userId' in session:
        user = db.Users
        userData = user.find_one({"user_id": userId})
        userName = userData['user_name']
    return userName

@app.route('/enrollWriting', methods=['POST', 'GET']) #작성한 글 등록기능 구현
def enrollWriting():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            collection = db.BulletinNum
            bulletinCollection = db.Bulletin
            userId   = checkUserId()
            userName = getUserName()
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
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

@app.route('/commentEnroll', methods=['POST']) #댓글기능 구현
def commentEnroll():
    if 'google_token' in session or 'userId' in session:
        if request.method == 'POST':
            bulletin = db.Bulletin
            userId = checkUserId()
            userName = getUserName()
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
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

@app.route("/adaptComment") #댓글 채택시 명성 부여
def adaptComment():
    data = request.args.get("data")
    list = data.split(',') # 0번째 댓글번호, 1번째 문서객체아이디, 2번째 댓글 작성자 아이디, 3번째 채택flag, 4번째 글 작성자 아이디
    writingCollection = db.Bulletin
    userCollection = db.Users
    userId = checkUserId()
    if 'userId' in session:
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
    elif 'google_token' in session:
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
    else:
        loginFlag = 2   #로그인 정보 없을 때 로그인이 필요하다는 flag전달
        return render_template('main_login.html', loginFlag=loginFlag)

@app.route("/checkMyState", methods = ['POST'])
def checkMyState():
<<<<<<< HEAD
    if 'state' not in session:
        session['state'] = 0
        session['journal_number'] = 0
    return """{
        "result": 0,
        "check_state": %d,
        "journal_number": %d
    }""" %(session['state'], session['journal_number'])

@app.route("/completeState")
def completeState():
    session['state'] = 0
    session['journal_number'] = None
    return """{
        "result": 0
    }"""

def page_number_of_pdf(path):
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

def extract_reference_from_text(text):
    start = text.find('My references at below page.')
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

    if number_length != title_length:
        return -1, -1

    return reference_number_list, reference_title_list

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
