pragma solidity ^0.4.0;

// 실제 파일을 공개하지 않고 파일의 소유권을 증명할 수 있는 스마트 컨트랙트 코드
// 파일의 해시와 소유자의 이름을 쌍으로 저장(map)하여 소유권을 증명
// 파일의 해시와 블록의 타임스탬프를 쌍으로 저장하는 방식으로 존재를 증명

contract Proof
{
    struct FileDetails
    {
        uint timestamp;
        string owner;
    }
    mapping (string => FileDetails) files;

    event logFileAddedStatus(bool status, uint timestamp, string owner, string fileHash);

    // 블록 타임스탬프에 파일의 소유자를 저장하기 위해 사용된다.
    function set(string owner, string fileHash)  public
    {
        // 키가 이미 존재하는지 확인하기 위한 적절한 방법이 없다 따라서 기본값을 확인한다.(예를 들어 모든 비트가 0인지)
        if(files[fileHash].timestamp == 0)
        {
            files[fileHash] = FileDetails(block.timestamp, owner);

            // 이벤트를 트리거해 프론트엔드 앱이 파일의 존재와 소유권에 대한 상세 정보가 저장됐다고 알림
            emit logFileAddedStatus(true, block.timestamp, owner, fileHash);
        }
        else
        {
            // 프론트엔드에게 파일의 상세정보가 이미 저장됐기 때문에 파일 존재 및 소유권에 대한 상세정보를 알 수 없다고 알림
            emit logFileAddedStatus(false, block.timestamp, owner, fileHash);
        }
    }
    
    // 파일 정보를 얻기 위해 사용된다
    function get(string fileHash) public view returns (uint timestamp, string owner)
    {
        return (files[fileHash].timestamp, files[fileHash].owner);
    }
}
