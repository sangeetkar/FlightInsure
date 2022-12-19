const FlightInsureData = artifacts.require("FlightInsureData");
const FlightInsureApp = artifacts.require("FlightInsureApp");
const fs = require('fs');

module.exports = async function (deployer) {
    let firstAirline = '0x42b8af897600e4D674f9AcCd8d6b748326bfb2dc';
    await deployer.deploy(FlightInsureData);
    const dataAddress = FlightInsureData.address;
    await deployer.deploy(FlightInsureApp, dataAddress, firstAirline);
    const dataContract = await FlightInsureData.deployed();
    await dataContract.setApp(FlightInsureApp.address);
    let config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: FlightInsureData.address,
            appAddress: FlightInsureApp.address
        }
    }
    fs.writeFileSync('./src/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
}