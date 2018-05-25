var category = ["engineering", "education", "AFO", "interdisciplinary", "social", "article_physication", "medicine", "humanities", "natural"]
var categorySize = category.length;

var subCategory = [["전체","건축공학", "고분자공학", "공학일반", "금속공학", "기계공학", "기타공학", "도로/철도공학", "도시공학", "산업공학", "섬유공학", "안전공학", "원자력공학", "음향공학", "자동차공학", "자원공학", "재료공학", "전기전자공학", "전자/정보통신공학", "제어계측공학", "조선공학", "컴퓨터공학", "토목공학", "항공우주공학", "해양공학", "화학공학", "환경공학"],
                   ["전체", "과학교육", "교육학", "국어교육", "미술교육", "사회교육", "수학교육", "영어교육", "유아교육", "윤리교육", "음악교육", "체육교육", "초등교육", "특수교육", "학생지도"],
                   ["전체", "농경제", "농학", "농화학", "수산학", "식품과학", "임학", "조경학", "축산학", "해상운송학", "해양학"],
                   ["전체", "과학기술학", "기술정책", "학제간연구"],
                   ["전체", "가정학", "경영학", "경제학", "관광학", "군사학", "금융/재정", "기타사회학", "노사관계", "무역학", "문헌정보학", "법학", "사회과학일반", "사회복지학", "사회학", "신문방송학", "심리학", "여성학", "인류학", "정책학", "정치외교학", "지역/지리", "커뮤니케이션", "행정학", "회계학"],
                   ["전체", "건축학", "공연예술", "기타예술교육", "디자인", "무용", "미술", "미용", "사진", "연극", "영화", "예술일반", "음악", "의상", "체육"],
                   ["전체", "가정의학", "간호학", "기타의약학", "내과학", "대체의학", "마취통증의학", "면역학", "물리치료학", "방사선종양학", "법의학", "병리학", "보건학", "비뇨기과학", "산부인과학", "생리학", "생명공학", "성형외과학", "소아청소년과학", "수의학", "신경화학", "신경외과학", "안과학", "약리학", "약학", "영상의학", "예방의학", "응급의학", "의공학", "의약학일반", "이비인후과학", "일반외과학", "작업치료학", "재활의학", "정신건강의학", "정형외과학", "직업환경의학", "진단검사의학", "치의학", "피부과학", "한의학", "해부학", "핵의학", "흉부외과학"],
                   ["전체", "가톨릭신학", "고고학", "고전연구", "국어국문학", "기독교신학", "기타어문학", "기타인문학", "노어노문학", "독어독문학", "문학", "문학이론.비평", "문화연구", "민속학", "불교학", "불어불문학", "사전학", "스페인어와 문학", "아시아연구", "언어학", "역사학", "영어영문학", "유교학", "윤리학", "인문학일반", "일어일문학", "종교학", "중어중문학", "철학", "통역번역학"],
                   ["전체", "기타자연과학", "물리학", "생물학", "생태학", "수학", "식물학", "유전학", "자연과학일반", "지구과학", "천문학", "통계학", "화학"]]

function ShowHideSubCat(){
  var x = document.getElementById("mainCat").value;
  var subCategoryIdx = null;

  for(var i=0; i<categorySize; i++){
    if(x == category[i]){
      subCategoryIdx = i;
      break;
    }
  }


  //subCat에 붙임
  var subElement = document.getElementById("subCat");
  var subSize = subCategory[subCategoryIdx].length;
  df = document.createDocumentFragment(); // create a document fragment to hold the options while we create them

  subElement.options.length = 0;

  for(var i=0; i<subSize; i++){
    var option = document.createElement('option');
    option.value = subCategory[subCategoryIdx][i];
    option.appendChild(document.createTextNode(subCategory[subCategoryIdx][i]));
    df.appendChild(option);
  }

  subElement.appendChild(df);
}

$(document).ready(function(){
  $('.dropdown-trigger').dropdown();
});

function openTotalJournal(){
  $('#journalPDF').attr('src', "../static/journal_example.pdf");
}

function checkcheck(test){
  var img_id = test.id;

  if(document.getElementById(img_id).classList.contains('unchecked')){
    var split_arr = img_id.split("_");
    console.log(split_arr[0], split_arr[1]);
    //아이디 증가할 땐 split_arr[0]
    //댓글번호는 split_arr[1]

    var special_id = document.getElementById(img_id).firstElementChild;
    special_id.src = "../static/check.png"
    document.getElementById(img_id).classList.add('checked');
    document.getElementById(img_id).classList.remove('unchecked');
  }
}

function on(){
  document.getElementById("overlay").style.display = "block";
}

function off(){
  document.getElementById("overlay").style.display = "none";
  var value = document.getElementById("MetaAcc").innerText;
  document.getElementById("ethereum_acc").value= value;
  document.getElementById("overlay").style.display = "none";
}


function viewAccount(){
  document.getElementById("AccountList").style.display = "block";
}


function selectAccount(x){
  var value = x.getElementsByTagName("td")[1].innerText;
  document.getElementById("etherium_acc").value= value;
  document.getElementById("overlay").style.display = "none";
}


function changeEthtoOJ(){
  var a = document.getElementById("input_eth").value;
  a = Number(a*10000).toLocaleString('en');
  document.getElementById("changeEthtoOJ").innerText = a;

  return false;
}

function changeOJtoEth(){
  var a = document.getElementById("input_OJ").value;
  a = Number(a/10000).toLocaleString('en');
  document.getElementById("chageOJtoEth").innerText = a;
}

function filterNumber(event) {
  var code = event.keyCode;
  if (code > 47 && code < 58) {  //숫자입력
    return;
  }
  if (event.ctrlKey || event.altKey) {
    return;
  }

  if (code === 110 || code === 190) { //점입력
    return;
  }

  if (code === 9 || code === 36 || code === 35 || code === 37 ||
    code === 39 || code === 8 || code === 46) {
  return;
}
  event.preventDefault();
}
