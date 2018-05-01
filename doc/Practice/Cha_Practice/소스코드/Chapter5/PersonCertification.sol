pragma solidity ^0.4.19;

// 본인 확인 계약
contract PersonCertification {
    // 계약 관리자 주소
    address admin;

    // 열람 허가 정보
    struct AppDetail {
        bool allowReference;        // 참조 허가 여부
        uint256 approveBlockNo;     // 승인했을 때의 블록 번호
        uint256 refLimitBlockNo;    // 열람 기간을 종료할 블록 번호
        address applicant;          // 열람을 허용할 주소
    }

    // 본인 확인 정보(A씨)
    struct PersonDetail {
        string name;
        string birth;
        address[] orglist;
    }

    // 인증 기관 정보(학교, 회사 등)
    struct OrganizationDetail {
        string name;
    }

    // 해당 키의 열람 허가 정보(주소 별로 열람을 허용할 정보 저장)
    mapping (address => AppDetail) appDetail;

    // 해당 키의 본인 확인 정보(본인 확인 정보)
    mapping (address => PersonDetail) personDetail;

    // 해당 키의 조직 정보
    mapping (address => OrganizationDetail) public orgDetail;

    // 생성자(추후 자유롭게 열람에 대한 조작을 할 수 있도록)
    function PersonCertification() {
        admin = msg.sender;
    }

    //-------------------------------------------------------------
    // 데이터 등록 기관(set)
    //-------------------------------------------------------------
    // 본인 정보를 등록
    function setPerson(string _name, string _birth) {
        personDetail[msg.sender].name = _name;
        personDetail[msg.sender].birth = _birth;
    }

    // 조직 정보를 등록
    function setOrganization(string _name) {
        orgDetail[msg.sender].name = _name;
    }

    // 조직이 개인의 소속을 증명
    function setBelong(address _person) {
        personDetail[_person].orglist.push(msg.sender);
    }

    // 본인 확인 정보 참조를 허가
    function setApprove(address _applicant, uint256 _span) {
        appDetail[msg.sender].allowReference = true;
        appDetail[msg.sender].approveBlockNo = block.number;
        appDetail[msg.sender].refLimitBlockNo = block.number + _span;   
        appDetail[msg.sender].applicant = _applicant;                   //참조를 허가할 대상 주소
    }

    //-------------------------------------------------------------
    // 데이터 취득 함수(get)
    //-------------------------------------------------------------
    // 본인 확인 정보를 참조
    function getPerson(address _person) public constant returns(
        bool _allowReference, uint256 _approveBlockNo, uint256 _refLimitBlockNo, address _applicant, string _name,
        string _birth, address[] _orglist){
        // 열람을 허가할 정보
        _allowReference = appDetail[_person].allowReference; 
        _approveBlockNo = appDetail[_person].approveBlockNo;
        _refLimitBlockNo = appDetail[_person].refLimitBlockNo;
        _applicant = appDetail[_person].applicant;

        // 열람을 제한할 정보
        if(((msg.sender == _applicant) && (_allowReference == true) && (block.number < _refLimitBlockNo))
        || (msg.sender == admin) || (msg.sender == _person)){
            _name = personDetail[_person].name;
            _birth = personDetail[_person].birth;
            _orglist = personDetail[_person].orglist;
        }
    }
}