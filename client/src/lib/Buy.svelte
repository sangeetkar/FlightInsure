<script>
    import flightsdb from "./flights.json";
    export let showError;
    export let config;
    let buyButtonText = "Buy Insurance";
    let airlines = [...new Set(flightsdb.map((x) => x.airline))];

    let airline;
    let flights;
    let flight;
    let timestamps;
    let timestamp;
    let amountineth = "0";

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

    let buyInsurance = async () => {
        buyButtonText = "Buying...";
        try {
            let block_timestamp = Math.floor(+timestamp / 1000);
            await config.appContract.methods
                .buyInsurance(airline, flight, block_timestamp)
                .send({
                    from: config.account,
                    value: config.web3.utils.toWei(amountineth, "ether"),
                });
            buyButtonText = "Buy Insurance";
        } catch (err) {
            showError(err.message);
            buyButtonText = "Buy Insurance";
        }
    };
</script>

<h3>Buy Insurance</h3>
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
<div class="mb-3">
    <label for="amountid">Amount to Insure: </label>
    <div class="input-group mb-3">
        <input
            bind:value={amountineth}
            id="amountid"
            type="text"
            class="form-control"
            placeholder="< 1 Eth"
            aria-label="Amount to Insure"
            aria-describedby="basic-addon2"
        />
        <span class="input-group-text" id="basic-addon2">ETH</span>
    </div>
</div>
<button type="button" class="btn btn-primary" on:click={buyInsurance}>
    {buyButtonText}
</button>
