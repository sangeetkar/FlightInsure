// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

interface IFlightInsureData {
    function buyInsurance(
        address,
        string calldata,
        uint256,
        address,
        uint256
    ) external;

    function getInsurees(
        address,
        string calldata,
        uint256
    ) external view returns (address[] memory);

    function getInsuranceAmount(
        address,
        string calldata,
        uint256,
        address
    ) external view returns (uint256);

    function creditInsuree(
        address,
        string calldata,
        uint256,
        address,
        uint256
    ) external;

    function registerAirline(address) external;

    function getAirlineCount() external view returns (uint256);

    function isRegistered(address) external view returns (bool);

    function fund(address airline) external payable;

    function withdrawPayments(address payable payee) external;

    function hasFunded(address) external returns (bool);
}
