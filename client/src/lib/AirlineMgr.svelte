<script>
    export let showError;
    export let config;
    let amountineth = "10";
    let airline = "";

    let fund = async () => {
        if (!config.appContract) {
            showError(
                "Connect your wallet first! (Click the Button on the Menu!)"
            );
            return;
        }
        try {
            await config.appContract.methods.fund().send({
                from: config.account,
                value: config.web3.utils.toWei(amountineth, "ether"),
            });
            showError("Funds sent!");
        } catch (err) {
            console.log(err.message);
            showError("Error: Have you registered yourself?");
        }
    };

    let registerAirline = async () => {
        if (!config.appContract) {
            showError(
                "Connect your wallet first! (Click the Button on the Menu!)"
            );
            return;
        }
        try {
            await config.appContract.methods
                .registerAirline("0x" + airline)
                .send({ from: config.account });
        } catch (err) {
            console.log(err.message);
            showError("Error: Is the airline already registered?");
        }
    };
</script>

<div class="mb-3">
    <h3>Send funds to Participate</h3>
    <hr />
    <label for="amountid">Amount in Eth: </label>
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
    <button type="button" class="btn btn-primary" on:click={fund}>Fund</button>
</div>

<div class="mb-3">
    <h3>Airline registration</h3>
    <hr />
    <div class="input-group flex-nowrap mb-3">
        <span class="input-group-text" id="addon-wrapping">0x</span>
        <input
            bind:value={airline}
            type="text"
            class="form-control"
            placeholder="Airline Address"
            aria-label="Username"
            aria-describedby="addon-wrapping"
        />
    </div>

    <button type="button" class="btn btn-primary" on:click={registerAirline}>
        Propose New Airline Member
    </button>
</div>
