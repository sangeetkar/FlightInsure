<script>
    import flightsdb from "./flights.json";
    export let showError;
    export let config;
    const STATUS_CODE_LATE_AIRLINE = 20;
    let claimDisabled = "disabled";
    let checkButtonText = "Check Status";
    let errorReported = false;

    let airlines = [...new Set(flightsdb.map((x) => x.airline))];

    let airline;
    let flights;
    let flight;
    let timestamps;
    let timestamp;

    $: flights = [
        ...new Set(
            flightsdb.filter((x) => x.airline === airline).map((x) => x.flight)
        ),
    ];

    $: timestamps = [
        ...new Set(
            flightsdb.filter((x) => x.flight === flight).map((x) => x.timestamp)
        ),
    ];

    let checkStatus = async () => {
        errorReported = false;
        try {
            let block_timestamp = Math.floor(timestamp / 1000);
            checkButtonText = "Checking...";
            config.appContract.events.FlightStatusInfo((err, event) => {
                if (err) {
                    console.log(err.message);
                } else {
                    if (
                        event.returnValues.airline == airline &&
                        event.returnValues.flight == flight &&
                        +event.returnValues.timestamp ==
                            Math.floor(timestamp / 1000)
                    ) {
                        if (
                            event.returnValues.status ==
                            STATUS_CODE_LATE_AIRLINE
                        ) {
                            claimDisabled = "";
                            if (!errorReported) {
                                showError(
                                    "Click the claim button to receive in your wallet"
                                );
                                errorReported = true;
                            }
                        } else {
                            if (!errorReported) {
                                showError(
                                    "Delay not due to Airline. Nothing to claim"
                                );
                                errorReported = true;
                            }
                            console.log(
                                "Delay code ",
                                event.returnValues.status
                            );
                        }
                        checkButtonText = "Check Status";
                    }
                }
            });

            await config.appContract.methods
                .fetchFlightStatus(airline, flight, block_timestamp)
                .send({ from: config.account });
        } catch (err) {
            showError(err.message);
            checkButtonText = "Check Status";
        }
    };

    let claim = async () => {
        claimDisabled = "disabled";
        try {
            await config.appContract.methods
                .withdraw()
                .send({ from: config.account });
        } catch (err) {
            showError(err.message);
        }
    };
</script>

<h3>Claim Insurance</h3>
<hr />
<div class="mb-3">
    <label for="airlineid">Airline: </label>
    <select id="airlineid" class="form-select" bind:value={airline}>
        {#each airlines as a}
            <option value={a}>{a}</option>
        {/each}
    </select>
</div>
<div class="mb-3">
    <label for="flightid">Flight: </label>
    <select id="flightid" class="form-select" bind:value={flight}>
        {#each flights as f}
            <option value={f}>{f}</option>
        {/each}
    </select>
</div>
<div class="mb-3">
    <label for="timestampid">Time: </label>
    <select id="timestampid" class="form-select" bind:value={timestamp}>
        {#each timestamps as ts}
            <option value={ts}>{new Date(ts).toLocaleString()}</option>
        {/each}
    </select>
</div>

<button type="button" class="btn btn-primary" on:click={checkStatus}>
    {checkButtonText}
</button>
<button type="button" class="btn btn-primary {claimDisabled}" on:click={claim}
    >Claim</button
>
