const FlightInsureData = artifacts.require("FlightInsureData");
const FlightInsureApp = artifacts.require("FlightInsureApp");

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;

  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  console.log("Accounts: ", accounts.length);

  console.log("Account 1", accounts[10]);

  it('can register oracles', async () => {

    // ARRANGE
    const appInstance = await FlightInsureApp.deployed();
    let fee = await appInstance.REGISTRATION_FEE();

    // ACT
    const account_offset = 10;
    for (let a = 0; a < TEST_ORACLES_COUNT; a++) {
      await appInstance.registerOracle({ from: accounts[a + account_offset], value: fee });
      let result = await appInstance.getMyIndexes.call({ from: accounts[a + account_offset] });
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {

    // ARRANGE
    const appInstance = await FlightInsureApp.deployed();
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    let firstAirline = '0x42b8af897600e4D674f9AcCd8d6b748326bfb2dc';
    // Submit a request for oracles to get status information for a flight
    await appInstance.fetchFlightStatus(firstAirline, flight, timestamp, { from: accounts[2] });
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    const account_offset = 10;
    for (let a = 0; a < TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await appInstance.getMyIndexes.call({ from: accounts[a + account_offset] });
      for (let idx = 0; idx < 3; idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await appInstance.submitOracleResponse(oracleIndexes[idx], firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a + account_offset] });

        }
        catch (e) {
          // Enable this when debugging
          console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
          console.log(e);
        }

      }
    }


  });



});
