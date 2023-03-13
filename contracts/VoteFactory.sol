// SPDX-License-Identifier: MIT
/* It is voting on proposal topic and ask the voter agree with this topic or not 
agree->voted:true, not agree->voted:false and everyone need to have rights to vote on this proposal
from the owner (ballotOfficialAddress), the owner will need to add voter address one by one.
and everyone and rights to vote just once.
*/
pragma solidity 0.8.17;

contract VoteFactory {
    struct Poll {
        uint countResult;
        uint finalResult;
        uint totalVoter;
        uint totalVote;
        string PollName;
        string proposal;
        State state;
    }
    uint public pollCount;
    address public contractOwner;

    struct Vote {
        address voterAddress;
        bool choice;
    }
    struct Voter {
        address voterAddress;
        bool voted;
    }
    mapping(uint => Vote[]) public pollIDToListVote;
    mapping(uint => Voter[]) public pollIDToListVoter;
    mapping(uint => Poll) public pollIDToPoll;
    Poll[] public polls; //array of poll

    enum State {
        Created, //0
        Voting, //1
        Ended //2
    }
    modifier condition(bool _condition) {
        require(_condition);
        _;
    }

    modifier onlyOfficial() {
        require(msg.sender == contractOwner, "You must be contract owner!");
        _;
    }

    modifier inState(State _state, uint pollID) {
        require(pollIDToPoll[pollID].state == _state, "Wrong state!");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
    }

    event CreatPoll(
        uint pollID,
        address indexed creator,
        string proposal,
        string pollName
    );
    event AddVoter(address indexed voterAddress, uint pollID);
    event StartVote(uint pollID);
    event DoVote(address indexed voter, uint pollID);
    event EndVote(uint pollID, uint finalResult);

    function createPoll(
        string memory pollName,
        string memory proposal
    ) public onlyOfficial {
        Poll memory poll;
        poll.countResult = 0;
        poll.finalResult = 0;
        poll.totalVoter = 0;
        poll.totalVote = 0;
        poll.PollName = pollName;
        poll.proposal = proposal;
        poll.state = State.Created;
        pollCount++;
        pollIDToPoll[pollCount] = poll; //save poll
        polls.push(poll);
        emit CreatPoll(pollCount, contractOwner, proposal, pollName);
    }

    function addVoter(
        address _voterAddress,
        uint pollID
    ) public inState(State.Created, pollID) onlyOfficial {
        //cannot add one voter 2 times
        for (uint i = 0; i < pollIDToListVoter[pollID].length; i++) {
            require(
                pollIDToListVoter[pollID][i].voterAddress != _voterAddress,
                "Already added"
            );
        }
        Voter memory voter;
        voter.voterAddress = _voterAddress;
        voter.voted = false;
        pollIDToListVoter[pollID].push(voter);
        pollIDToPoll[pollID].totalVoter++; //increment of account voter that we have
        emit AddVoter(_voterAddress, pollID);
    }

    function startVote(
        uint pollID
    ) public inState(State.Created, pollID) onlyOfficial {
        pollIDToPoll[pollID].state = State.Voting;
        emit StartVote(pollID);
    }

    function doVote(
        bool _choice,
        uint pollID
    ) public inState(State.Voting, pollID) {
        bool found = false;
        uint index;
        for (uint i = 0; i < pollIDToListVoter[pollID].length; i++) {
            if (pollIDToListVoter[pollID][i].voterAddress == msg.sender) {
                found = true;
                index = i;
            }
        }
        require(found == true, "Voter address is not added yet!");
        //voter vote only 1 times
        require(!pollIDToListVoter[pollID][index].voted, "already voted!");
        pollIDToListVoter[pollID][index].voted = true;
        if (_choice) {
            pollIDToPoll[pollID].countResult++;
        }
        Vote memory vote;
        vote.voterAddress = msg.sender;
        vote.choice = _choice;
        pollIDToListVote[pollID].push(vote);
        pollIDToPoll[pollID].totalVote++;
        emit DoVote(msg.sender, pollID);
    }

    function endVote(
        uint pollID
    ) public inState(State.Voting, pollID) onlyOfficial {
        pollIDToPoll[pollID].state = State.Ended;
        pollIDToPoll[pollID].finalResult = pollIDToPoll[pollID].countResult;
        emit EndVote(pollID, pollIDToPoll[pollID].finalResult);
    }

    function getListPollWithID () public view returns (Poll[] memory){
        Poll[]  memory myListPolls = new Poll[](pollCount);
        for(uint i=1;i<= pollCount ; i++){
            myListPolls[i-1]=pollIDToPoll[i];
        }
        return myListPolls;
    }
}
