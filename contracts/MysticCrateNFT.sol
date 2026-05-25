// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mystic Crate — ERC-721 on Base with XP, daily rewards, and leaderboard.
contract MysticCrateNFT is ERC721URIStorage, Ownable {
    uint256 public constant OPEN_PRICE = 0.000001 ether;
    uint256 public constant DAILY_ACTION_PRICE = 0.000001 ether;
    uint256 public constant MAX_MINTS_PER_DAY = 2;
    uint256 public constant DAY_SECONDS = 86400;
    uint256 public constant LEADERBOARD_SIZE = 10;

    address public immutable treasury;
    string private _contractURI;

    uint256 private _nextTokenId;
    string[20] private _variantURIs;

    mapping(address => uint256) public xp;
    mapping(address => uint256) public lastMintDay;
    mapping(address => uint256) public mintsToday;
    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public checkInStreak;
    mapping(address => uint256) public lastSpinDay;

    address[10] private _leaderboardUsers;
    uint256[10] private _leaderboardXp;

    event CrateOpened(
        address indexed player,
        uint256 indexed tokenId,
        uint256 variantId,
        uint256 xpAwarded
    );
    event DailyCheckIn(address indexed player, uint256 streakDay, uint256 xpAwarded);
    event DailySpin(address indexed player, uint256 xpAwarded);
    event XpAwarded(address indexed player, uint256 amount, string reason);

    constructor(address treasury_, string memory contractURI_) ERC721("Mystic Crate", "MYSTIC") Ownable(msg.sender) {
        require(treasury_ != address(0), "Invalid treasury");
        treasury = treasury_;
        _contractURI = contractURI_;
    }

    function setVariantURIs(string[20] calldata uris) external onlyOwner {
        for (uint256 i = 0; i < 20; i++) {
            _variantURIs[i] = uris[i];
        }
    }

    function setContractURI(string calldata uri) external onlyOwner {
        _contractURI = uri;
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function openCrate() external payable returns (uint256 tokenId) {
        require(msg.value >= OPEN_PRICE, "Min payment: 0.000001 ETH");
        _syncMintDay(msg.sender);
        require(mintsToday[msg.sender] < MAX_MINTS_PER_DAY, "Max 2 mints per day");

        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, _nextTokenId))
        );
        uint256 variantId = _rollVariant(seed);
        require(bytes(_variantURIs[variantId]).length > 0, "Variant URI not set");

        mintsToday[msg.sender]++;
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _variantURIs[variantId]);

        uint256 xpAwarded = _xpForVariant(variantId, seed);
        _awardXp(msg.sender, xpAwarded);

        emit CrateOpened(msg.sender, tokenId, variantId, xpAwarded);
        emit XpAwarded(msg.sender, xpAwarded, "crate");

        _forwardPayment();
    }

    function dailyCheckIn() external payable {
        require(msg.value >= DAILY_ACTION_PRICE, "Min payment: 0.000001 ETH");
        uint256 day = _today();
        require(lastCheckInDay[msg.sender] < day, "Already checked in today");

        if (lastCheckInDay[msg.sender] == day - 1) {
            uint256 next = checkInStreak[msg.sender] + 1;
            checkInStreak[msg.sender] = next > 7 ? 1 : next;
        } else {
            checkInStreak[msg.sender] = 1;
        }
        lastCheckInDay[msg.sender] = day;

        uint256 streakDay = checkInStreak[msg.sender];
        uint256 xpAwarded = _checkInXp(streakDay);
        _awardXp(msg.sender, xpAwarded);

        emit DailyCheckIn(msg.sender, checkInStreak[msg.sender], xpAwarded);
        emit XpAwarded(msg.sender, xpAwarded, "checkin");

        _forwardPayment();
    }

    function dailySpin() external {
        uint256 day = _today();
        require(lastSpinDay[msg.sender] < day, "Already spun today");
        lastSpinDay[msg.sender] = day;

        uint256 xpAwarded = _randomInRange(
            15,
            30,
            uint256(keccak256(abi.encodePacked(block.prevrandao, msg.sender, day, "spin")))
        );
        _awardXp(msg.sender, xpAwarded);

        emit DailySpin(msg.sender, xpAwarded);
        emit XpAwarded(msg.sender, xpAwarded, "spin");
    }

    function getPlayerStats(address user)
        external
        view
        returns (
            uint256 totalXp,
            uint256 mintsRemaining,
            uint256 streak,
            bool canCheckIn,
            bool canSpin
        )
    {
        totalXp = xp[user];
        streak = checkInStreak[user];
        uint256 day = _today();

        if (lastMintDay[user] != day) {
            mintsRemaining = MAX_MINTS_PER_DAY;
        } else {
            uint256 used = mintsToday[user];
            mintsRemaining = used >= MAX_MINTS_PER_DAY ? 0 : MAX_MINTS_PER_DAY - used;
        }

        canCheckIn = lastCheckInDay[user] < day;
        canSpin = lastSpinDay[user] < day;
    }

    function getLeaderboard()
        external
        view
        returns (address[10] memory users, uint256[10] memory scores)
    {
        return (_leaderboardUsers, _leaderboardXp);
    }

    function checkInXpForDay(uint256 day) external pure returns (uint256) {
        return _checkInXp(day);
    }

    function _checkInXp(uint256 day) private pure returns (uint256) {
        require(day >= 1 && day <= 7, "Invalid day");
        if (day == 1) return 5;
        if (day == 2) return 7;
        if (day == 3) return 10;
        if (day == 4) return 12;
        if (day == 5) return 15;
        if (day == 6) return 20;
        return 30;
    }

    function getNextCheckInDay(address user) external view returns (uint256) {
        uint256 day = _today();
        if (lastCheckInDay[user] >= day) return checkInStreak[user];
        if (lastCheckInDay[user] == day - 1) {
            uint256 next = checkInStreak[user] + 1;
            return next > 7 ? 1 : next;
        }
        return 1;
    }

    function _syncMintDay(address user) private {
        uint256 day = _today();
        if (lastMintDay[user] != day) {
            lastMintDay[user] = day;
            mintsToday[user] = 0;
        }
    }

    function _awardXp(address user, uint256 amount) private {
        if (amount == 0) return;
        uint256 newTotal = xp[user] + amount;
        xp[user] = newTotal;
        _updateLeaderboard(user, newTotal);
    }

    function _updateLeaderboard(address user, uint256 newTotal) private {
        if (newTotal == 0) return;

        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            if (_leaderboardUsers[i] == user) {
                _leaderboardXp[i] = newTotal;
                _sortLeaderboard();
                return;
            }
        }

        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            if (_leaderboardUsers[i] == address(0)) {
                _leaderboardUsers[i] = user;
                _leaderboardXp[i] = newTotal;
                _sortLeaderboard();
                return;
            }
        }

        if (newTotal > _leaderboardXp[LEADERBOARD_SIZE - 1]) {
            _leaderboardUsers[LEADERBOARD_SIZE - 1] = user;
            _leaderboardXp[LEADERBOARD_SIZE - 1] = newTotal;
            _sortLeaderboard();
        }
    }

    function _sortLeaderboard() private {
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            for (uint256 j = i + 1; j < LEADERBOARD_SIZE; j++) {
                if (_leaderboardXp[j] > _leaderboardXp[i]) {
                    uint256 tXp = _leaderboardXp[i];
                    _leaderboardXp[i] = _leaderboardXp[j];
                    _leaderboardXp[j] = tXp;
                    address tUser = _leaderboardUsers[i];
                    _leaderboardUsers[i] = _leaderboardUsers[j];
                    _leaderboardUsers[j] = tUser;
                }
            }
        }
    }

    function _forwardPayment() private {
        (bool sent,) = treasury.call{value: msg.value}("");
        require(sent, "Treasury transfer failed");
    }

    function _today() private view returns (uint256) {
        return block.timestamp / DAY_SECONDS;
    }

    function _randomInRange(uint256 min_, uint256 max_, uint256 seed) private pure returns (uint256) {
        if (max_ <= min_) return min_;
        return min_ + (seed % (max_ - min_ + 1));
    }

    function _xpForVariant(uint256 variantId, uint256 seed) private pure returns (uint256) {
        if (variantId <= 5) return _randomInRange(5, 10, seed);
        if (variantId <= 10) return _randomInRange(20, 25, seed >> 8);
        if (variantId <= 14) return 50;
        if (variantId <= 17) return 100;
        return _randomInRange(200, 250, seed >> 16);
    }

    function _rollVariant(uint256 seed) private pure returns (uint256) {
        uint256 r = seed % 100;
        uint256 sub = seed >> 8;

        if (r < 50) return sub % 6;
        if (r < 80) return 6 + (sub % 5);
        if (r < 95) return 11 + (sub % 4);
        if (r < 98) return 15 + (sub % 3);
        return 18 + (sub % 2);
    }
}
