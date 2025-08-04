// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract VotingSystem {
    bool private isEnded;
    bool public started;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        bool authorized;
        uint votesCast;
    }

    address public admin;
    string public electionName;

    uint public startTime;
    uint public endTime;
    uint public maxVotesPerVoter;
    address[] public voterAddresses;

    mapping(address => Voter) public voters;
    mapping(address => mapping(uint => bool)) public voterVotes;
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    uint public totalVotes;

    event CandidateAdded(uint indexed candidateId, string name);
    event VoteCast(address indexed voter, uint indexed candidateId);
    event VoteRevoked(address indexed voter, uint indexed candidateId);
    event ElectionStarted();
    event ElectionEnded();

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier duringElection() {
        require(started, "Election has not started");
        require(block.timestamp >= startTime, "Election has not started (time)");
        require(
            !isEnded && (endTime == 0 || block.timestamp <= endTime),
            "Election has ended"
        );
        _;
    }

    modifier beforeElection() {
        require(!started, "Election already started");
        _;
    }

    constructor(
        string memory _name,
        uint _durationSeconds,
        uint _maxVotesPerVoter
    ) {
        require(_maxVotesPerVoter > 0, "Max votes per voter must be greater than 0");

        admin = msg.sender;
        electionName = _name;
        maxVotesPerVoter = _maxVotesPerVoter;
        // Không gán startTime/endTime ở đây
        started = false;
        isEnded = false;
        // endTime sẽ set khi start
        if (_durationSeconds > 0) {
            endTime = _durationSeconds; // sẽ xử lý khi start()
        }
    }

    function start() public onlyAdmin beforeElection {
        started = true;
        isEnded = false;
        startTime = block.timestamp;
        if (endTime > 0 && endTime < block.timestamp) {
            endTime = block.timestamp + endTime;
        } else if (endTime == 0) {
            endTime = 0;
        }
        emit ElectionStarted();
    }

    function addCandidate(string memory _name) public onlyAdmin beforeElection {
        unchecked { candidatesCount++; }
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function addMultipleCandidates(string[] memory _names) public onlyAdmin beforeElection {
        require(_names.length > 0, "No candidate names provided");
        for (uint i = 0; i < _names.length; i++) {
            unchecked { candidatesCount++; }
            candidates[candidatesCount] = Candidate(candidatesCount, _names[i], 0);
            emit CandidateAdded(candidatesCount, _names[i]);
        }
    }

    function removeCandidate(uint _candidateId) public onlyAdmin beforeElection {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        require(candidates[_candidateId].id != 0, "Candidate does not exist");
         for (uint i = _candidateId; i < candidatesCount; i++) {
            candidates[i] = candidates[i + 1];
            candidates[i].id = i;
        }
        delete candidates[candidatesCount];
        candidatesCount--;
    }

    function authorize(address _person) public onlyAdmin {
        Voter storage v = voters[_person];
        require(!v.authorized, "Voter is already authorized");
        v.authorized = true;
        v.votesCast = 0;
        voterAddresses.push(_person);
    }

    function vote(uint _candidateId) public duringElection {
        Voter storage sender = voters[msg.sender];
        require(sender.authorized, "You are not authorized to vote");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        require(!voterVotes[msg.sender][_candidateId], "Already voted for this candidate");
        require(sender.votesCast < maxVotesPerVoter, "You have exceeded your vote limit");

        voterVotes[msg.sender][_candidateId] = true;
        sender.votesCast++;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function voteMultiple(uint[] memory _candidateIds) public duringElection {
        Voter storage sender = voters[msg.sender];
        require(sender.authorized, "You are not authorized to vote");
        require(sender.votesCast + _candidateIds.length <= maxVotesPerVoter, "Vote limit exceeded");

        for (uint i = 0; i < _candidateIds.length; i++) {
            uint candidateId = _candidateIds[i];
            require(candidateId > 0 && candidateId <= candidatesCount, "Invalid candidate");
            require(!voterVotes[msg.sender][candidateId], "Already voted for this candidate");

            voterVotes[msg.sender][candidateId] = true;
            sender.votesCast++;
            candidates[candidateId].voteCount++;
            totalVotes++;
            emit VoteCast(msg.sender, candidateId);
        }
    }

    function revokeVote(uint _candidateId) public duringElection {
        Voter storage sender = voters[msg.sender];
        require(sender.authorized, "You are not authorized to vote");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");
        require(voterVotes[msg.sender][_candidateId], "You haven't voted for this candidate");

        voterVotes[msg.sender][_candidateId] = false;
        sender.votesCast--;
        candidates[_candidateId].voteCount--;
        totalVotes--;

        emit VoteRevoked(msg.sender, _candidateId);
    }

    function changeVote(uint _oldId, uint _newId) public duringElection {
        require(_oldId != _newId, "Candidate IDs must differ");
        revokeVote(_oldId);
        vote(_newId);
    }

    function getCandidate(uint _candidateId)
        public view
        returns (uint id, string memory name, uint votes)
    {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        Candidate storage c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getAllCandidates()
        external view
        returns (
            uint[] memory ids,
            string[] memory names,
            uint[] memory votes
        )
    {
        ids = new uint[](candidatesCount);
        names = new string[](candidatesCount);
        votes = new uint[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; ++i) {
            Candidate storage c = candidates[i];
            uint idx = i - 1;
            ids[idx] = c.id;
            names[idx] = c.name;
            votes[idx] = c.voteCount;
        }
    }

    function end() public onlyAdmin duringElection {
        require(!isEnded, "Election has ended");
        isEnded = true;
        emit ElectionEnded();
    }

    function restart() public onlyAdmin {
        require(isEnded, "Election is not ended yet");
        isEnded = false;
        started = false;
        // startTime và endTime sẽ được set lại khi gọi start
    }

    function getWinner()
        public view
        returns (uint winnerId, string memory winnerName, uint winnerVotes)
    {
        require(
            isEnded || (endTime != 0 && block.timestamp > endTime),
            "Election is still in progress"
        );

        uint highest;
        uint winId;
        for (uint i = 1; i <= candidatesCount; ++i) {
            uint vCount = candidates[i].voteCount;
            if (vCount > highest) {
                highest = vCount;
                winId = i;
            }
        }
        if (winId == 0) return (0, "", 0);
        Candidate storage w = candidates[winId];
        return (w.id, w.name, w.voteCount);
    }
}
