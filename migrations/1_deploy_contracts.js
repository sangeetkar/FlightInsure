const FlightInsureData = artifacts.require("FlightInsureData");
const FlightInsureApp = artifacts.require("FlightInsureApp");
const fs = require('fs');

module.exports = async function (deployer) {

    let accounts = await web3.eth.personal.getAccounts();
    console.log(accounts[1]);
    //let firstAirline = '0x42b8af897600e4D674f9AcCd8d6b748326bfb2dc';
    let firstAirline = accounts[1];
    await deployer.deploy(FlightInsureData);
    const dataAddress = FlightInsureData.address;
    await deployer.deploy(FlightInsureApp, dataAddress);
    const dataContract = await FlightInsureData.deployed();
    await dataContract.setApp(FlightInsureApp.address);
    await dataContract.registerAirline(firstAirline);
    const appContract = await FlightInsureApp.deployed();
    await appContract.fund({ from: firstAirline, value: web3.utils.toWei("10", "ether") });

    let config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: FlightInsureData.address,
            appAddress: FlightInsureApp.address,
            firstAirline: firstAirline
        }
    }
    fs.writeFileSync('./src/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync('./client/src/lib/contract.json', JSON.stringify(config, null, '\t'), 'utf-8');
}