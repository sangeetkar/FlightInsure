const FlightInsureData = artifacts.require("FlightInsureData");
const FlightInsureApp = artifacts.require("FlightInsureApp");

contract('Flight Insure Tests', async (accounts) => {


    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/


    it(`(multiparty) has correct initial paused() value`, async function () {

        // Get operating status
        const dataInstance = await FlightInsureData.deployed();
        let status = await dataInstance.paused();
        assert.equal(status, false, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to pause() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        const dataInstance = await FlightInsureData.deployed();
        let accessDenied = false;
        try {
            await dataInstance.pause({ from: accounts[1] });
        } catch (err) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to pause() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        const dataInstance = await FlightInsureData.deployed();
        let accessDenied = false;
        try {
            await dataInstance.pause({ from: accounts[0] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
        await dataInstance.unpause();
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {


        const dataInstance = await FlightInsureData.deployed();
        await dataInstance.pause();

        let reverted = false;
        try {
            await dataInstance.testingPause();
        }
        catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await dataInstance.unpause();

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        const dataInstance = await FlightInsureData.deployed();
        const appInstance = await FlightInsureApp.deployed();
        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await appInstance.registerAirline(newAirline, { from: accounts[1] });
        }
        catch (e) {

        }
        let result = await dataInstance.isRegistered(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });


});