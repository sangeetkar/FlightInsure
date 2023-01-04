const FlightInsureApp = require("../build/contracts/FlightInsureApp.json");
const Config = require("./config.json");
const Web3 = require("web3");
const express = require("express");
const fs = require("fs");

const STATUS_CODES = [10, 20, 30, 40, 50];

async function setupOracles() {
	let config = Config['localhost'];

	let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
	const accounts = await web3.eth.personal.getAccounts();
	web3.eth.defaultAccount = accounts[0];
	let flightInsureApp = new web3.eth.Contract(FlightInsureApp.abi, config.appAddress);

	const total_oracles = 20;
	const oracle_starting_address_idx = 10;
	const oracles = accounts.slice(oracle_starting_address_idx, oracle_starting_address_idx + total_oracles);
	let oracleIndices = {};

	const fee = await flightInsureApp.methods.REGISTRATION_FEE().call({ from: accounts[0] });

	for (let oracle of oracles) {
		try {
			await flightInsureApp.methods.registerOracle().send({ from: oracle, value: fee, gas: '1000000' });
			let indices = await flightInsureApp.methods.getMyIndexes().call({ from: oracle });
			oracleIndices[oracle] = indices;
			console.log(`Oracle ${oracle} registered with indices: ${indices}`);
		} catch (e) {
			console.log(e.message);
		}
	}

	await flightInsureApp.events.OracleRequest(async (error, evt) => {
		if (error) {
			console.log(error);
		} else {
			let { index, airline, flight, timestamp } = evt.returnValues;
			let randint = Math.floor(Math.random() * 5);
			let responseCode = STATUS_CODES[randint];
			for (let oracle of oracles) {
				let indices = oracleIndices[oracle];
				if (indices.includes(index)) {
					try {
						await flightInsureApp.methods.submitOracleResponse(index, airline, flight, timestamp, responseCode).send({ from: oracle, gas: '1000000' });
						console.log("response submittted ", index, oracle);
					} catch (err) {
						console.log(err.message);
					}
				}
			}
		}
	});

	// Test code
	//
	/*
	await flightInsureApp.events.FlightStatusInfo((error, evt) => {
		console.log(evt);
	})

	let flight = 'ND1309'; // Course number
	let timestamp = Math.floor(Date.now() / 1000);

	response = 20;
	let firstAirline = '0x42b8af897600e4D674f9AcCd8d6b748326bfb2dc';
	// Submit a request for oracles to get status information for a flight
	await flightInsureApp.methods.fetchFlightStatus(firstAirline, flight, timestamp).send({ from: accounts[2] });
	*/
}


function generateFlights() {
	let flightsdb = [];
	const config = Config['localhost'];
	const airline = config.firstAirline;
	const flights = ["L01", "L02", "L03"];
	const timestamp = Date.now();

	for (let i = 0; i < flights.length; i++) {
		flightsdb.push({
			airline: airline,
			flight: flights[i],
			timestamp: timestamp + i * 100000 + 100000
		});
	}

	fs.writeFileSync('./client/src/lib/flights.json', JSON.stringify(flightsdb, null, '\t'), 'utf-8');
	console.log("New flights db generated");

}

(async () => {
	generateFlights();
	await setupOracles();
})();


const app = express();
app.get('/api', (req, res) => {
	res.send({
		message: 'An API for use with your Dapp!'
	})
})

module.exports = app;

