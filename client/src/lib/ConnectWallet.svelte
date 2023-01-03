<script>
    import FlightInsureApp from "../../../build/contracts/FlightInsureApp.json";
    import appConfig from "./contract.json";
    export let config;
    export let showError;

    async function connectWallet() {
        if (typeof window.ethereum === "undefined") {
            showError("Please install metamask to continue...");
        } else {
            try {
                const accounts = await ethereum.request({
                    method: "eth_requestAccounts",
                });
                config.account = accounts[0];
                config.connected = true;
                config.web3 = new Web3(
                    Web3.givenProvider || "ws://localhost:8545"
                );
                config.appContract = new config.web3.eth.Contract(
                    FlightInsureApp["abi"],
                    appConfig["localhost"]["appAddress"]
                );
            } catch (err) {
                console.log(err);
            }
        }
    }
</script>

{#if config.connected}
    <div class="d-flex">
        Connected: {`0x...${config.account.slice(-4)}`}
    </div>
{:else}
    <form class="d-flex">
        <button
            class="btn btn-sm btn-outline-success"
            type="button"
            on:click={connectWallet}>Connect your Wallet</button
        >
    </form>
{/if}

<style>
    div {
        color: green;
        font-size: small;
    }
</style>
