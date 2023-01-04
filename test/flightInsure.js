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


    it('Airline can register an airline using registerAirline() if < 4 airlines are registered', async () => {

        const dataInstance = await FlightInsureData.deployed();
        const appInstance = await FlightInsureApp.deployed();
        let firstAirline = accounts[1]; //already registered while deploying 
        let newAirline = accounts[2];

        try {
            await appInstance.registerAirline(newAirline, { from: firstAirline });
        }
        catch (e) {
            console.log(e.message);
        }
        let result = await dataInstance.isRegistered(newAirline);

        assert.equal(result, true, "Airline should be able to register another airline if <4 airlines are registered");
    });

    it('Airline cannot register an Airline using registerAirline() if it is not funded', async () => {

        const dataInstance = await FlightInsureData.deployed();
        const appInstance = await FlightInsureApp.deployed();

        let unfundedAirline = accounts[2];
        let newAirline = accounts[3];

        try {
            await appInstance.registerAirline(newAirline, { from: unfundedAirline });
        }
        catch (e) {
            console.log(e.message);
        }
        let result = await dataInstance.isRegistered(newAirline);

        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('The fifth airline can not be registered by only 1 airline (min 2 required = 50%)', async () => {

        const dataInstance = await FlightInsureData.deployed();
        const appInstance = await FlightInsureApp.deployed();

        //accounts[1] & accounts[2] are already registered -- above test
        let airline1 = accounts[1]; //already registered while deploying 
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];
        let newAirline = accounts[5];

        try {
            //register airline3, airline4 (airline1 & airline2 already resgistered)
            await appInstance.registerAirline(airline3, { from: airline1 });
            await appInstance.registerAirline(airline4, { from: airline2 });

            //try registering airline5 with only airline1
            await appInstance.registerAirline(newAirline, { from: airline1 });
        }
        catch (e) {
            console.log(e.message);
        }
        let result = await dataInstance.isRegistered(newAirline);

        assert.equal(result, false, "5th airline cannot be resgitered unless at least 2 airlines (= 50% of registered) submit their request");
    });

    it('The fifth airline can be registered by 2 airlines (min 2 required = 50%)', async () => {

        const dataInstance = await FlightInsureData.deployed();
        const appInstance = await FlightInsureApp.deployed();

        let airline1 = accounts[1]; //already registered while deploying 
        let airline2 = accounts[2];
        let airline3 = accounts[3];
        let airline4 = accounts[4];
        let newAirline = accounts[5];

        try {
            //send funds from airline2 to activate it
            await appInstance.fund({ from: airline2, value: web3.utils.toWei('10', 'ether') });

            //try registering airline5 with airline2 -- airline1 already requested in the above test case
            await appInstance.registerAirline(newAirline, { from: airline2 });
        }
        catch (e) {
            console.log(e.message);
        }
        let result = await dataInstance.isRegistered(newAirline);

        assert.equal(result, true, "5th airline can be resgitered when 2 airlines (= 50% of registered) submit their requests");
    });
});