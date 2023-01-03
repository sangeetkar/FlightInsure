// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/PullPayment.sol";

contract FlightInsureData is Ownable, Pausable, PullPayment {
    address[] private airlines;
    address private appContract;
    mapping(address => bool) private funded;
    mapping(address => bool) private registered;

    struct Insurance {
        uint256 amount;
        bool credited;
    }

    mapping(bytes32 => address[]) private insurees;
    mapping(bytes32 => mapping(address => Insurance)) private insurances;

    function hasFunded(address airline) external view returns (bool) {
        return funded[airline];
    }

    function getInsurees(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) external view returns (address[] memory) {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return insurees[flightKey];
    }

    function getInsuranceAmount(
        address airline,
        string calldata flight,
        uint256 timestamp,
        address insuree
    ) external view returns (uint256) {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        return insurances[flightKey][insuree].amount;
    }

    function setApp(address _appContract) external onlyOwner {
        appContract = _appContract;
    }

    function isRegistered(address airline) public view returns (bool) {
        return registered[airline];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    modifier onlyApp() {
        require(msg.sender == appContract, "Not authorised");
        _;
    }

    modifier onlyAppOrOwner() {
        require(
            msg.sender == appContract || msg.sender == owner(),
            "Not authorised"
        );
        _;
    }

    function registerAirline(address airline)
        external
        whenNotPaused
        onlyAppOrOwner
    {
        require(!isRegistered(airline), "Airline already registered");
        airlines.push(airline);
        registered[airline] = true;
    }

    function getAirlineCount() external view returns (uint256) {
        return airlines.length;
    }

    function buyInsurance(
        address airline,
        string calldata flight,
        uint256 timestamp,
        address insuree,
        uint256 amount
    ) external whenNotPaused onlyApp {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        insurees[flightKey].push(insuree);
        Insurance storage insurance = insurances[flightKey][insuree];
        insurance.amount = amount;
        insurance.credited = false;
    }

    function creditInsuree(
        address airline,
        string calldata flight,
        uint256 timestamp,
        address insuree,
        uint256 amount
    ) external onlyApp whenNotPaused {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(!insurances[flightKey][insuree].credited, "Already Credited");
        insurances[flightKey][insuree].credited = true;
        _asyncTransfer(insuree, amount);
    }

    function withdraw(address insuree) external onlyApp whenNotPaused {
        withdrawPayments(payable(insuree));
    }

    function getFlightKey(
        address airline,
        string calldata flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function fund(address airline) external payable {
        require(isRegistered(airline), "Need to register first");
        funded[airline] = true;
    }

    function testingPause() external view whenNotPaused {}

    receive() external payable {}
}
