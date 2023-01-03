// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./IFlightInsureData.sol";

contract FlightInsureApp is Ownable, Pausable {
    IFlightInsureData private dataContract;
    uint256 private maximumInsuredAmount = 1 ether;
    uint256 private fundRequiredPerAirline = 10 ether;
    mapping(address => address[]) private voters;

    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    constructor(address _dataContract) {
        dataContract = IFlightInsureData(_dataContract);
    }

    modifier hasFunded(address airline) {
        require(
            dataContract.hasFunded(airline),
            "Airline needs to send funds to participate"
        );
        _;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateMaxInsuredamount(uint256 _max)
        external
        onlyOwner
        whenNotPaused
    {
        maximumInsuredAmount = _max;
    }

    function updateFundRequired(uint256 _fund)
        external
        onlyOwner
        whenNotPaused
    {
        fundRequiredPerAirline = _fund;
    }

    function registerAirline(address airline)
        external
        whenNotPaused
        hasFunded(msg.sender)
    {
        address sponsoringAirline = msg.sender;
        require(!dataContract.isRegistered(airline), "Already Registered");
        require(dataContract.isRegistered(sponsoringAirline), "Not authorised");
        uint256 count = dataContract.getAirlineCount();
        if (count < 4) {
            dataContract.registerAirline(airline);
        } else {
            address[] storage supporters = voters[airline];
            for (uint256 i = 0; i < supporters.length; i++) {
                if (supporters[i] == sponsoringAirline) {
                    revert("You've already voted");
                }
            }
            uint256 numSupporters = supporters.length + 1;
            uint256 totalAirlineCount = dataContract.getAirlineCount();
            if (numSupporters > (totalAirlineCount / 2)) {
                dataContract.registerAirline(airline);
            } else {
                supporters.push(sponsoringAirline);
            }
        }
    }

    function fund() external payable {
        require(
            dataContract.isRegistered(msg.sender),
            "You need to register yourself first"
        );
        require(msg.value >= fundRequiredPerAirline, "Insufficient funding");
        dataContract.fund{value: msg.value}(msg.sender);
    }

    function buyInsurance(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) external payable whenNotPaused hasFunded(airline) {
        require(msg.value > 0, "Missing insurance amount");
        require(
            msg.value <= maximumInsuredAmount,
            "Above Maximum Insurance Limit"
        );
        require(
            timestamp > block.timestamp,
            "You can insure only future flights"
        );

        dataContract.buyInsurance(
            airline,
            flight,
            timestamp,
            msg.sender,
            msg.value
        );
    }

    function creditInsurees(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) internal whenNotPaused {
        address[] memory insurees = dataContract.getInsurees(
            airline,
            flight,
            timestamp
        );

        for (uint256 i = 0; i < insurees.length; i++) {
            uint256 amount = dataContract.getInsuranceAmount(
                airline,
                flight,
                timestamp,
                insurees[i]
            );
            dataContract.creditInsuree(
                airline,
                flight,
                timestamp,
                insurees[i],
                (amount * 3) / 2
            );
        }
    }

    function withdraw() external {
        dataContract.withdrawPayments(payable(msg.sender));
    }

    mapping(bytes32 => uint8) finalFlightStatus;

    function processFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal {
        bytes32 key = keccak256(abi.encodePacked(airline, flight, timestamp));
        finalFlightStatus[key] = statusCode;
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            creditInsurees(airline, flight, timestamp);
        }
    }

    function fetchFlightStatus(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) external {
        require(
            timestamp < block.timestamp,
            "Available after scheduled departure"
        );
        bytes32 flightkey = keccak256(
            abi.encodePacked(airline, flight, timestamp)
        );
        if (finalFlightStatus[flightkey] != STATUS_CODE_UNKNOWN) {
            emit FlightStatusInfo(
                airline,
                flight,
                timestamp,
                finalFlightStatus[flightkey]
            );
        } else {
            uint8 idx = getRandomIndex(msg.sender);
            bytes32 key = keccak256(
                abi.encodePacked(idx, airline, flight, timestamp)
            );
            oracleResponses[key].requester = msg.sender;
            oracleResponses[key].isOpen = true;
            emit OracleRequest(idx, airline, flight, timestamp);
        }
    }

    /// Oracle Code

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            oracleResponses[key].isOpen = false;
            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}
