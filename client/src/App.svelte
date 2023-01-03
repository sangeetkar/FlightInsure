<script>
  import { Router, Route, Link } from "svelte-navigator";
  import { onMount } from "svelte";

  import AirlineMgr from "./lib/AirlineMgr.svelte";
  import BuyInsurance from "./lib/Buy.svelte";
  import Claim from "./lib/Claim.svelte";
  import About from "./lib/About.svelte";
  import ConnectWallet from "./lib/ConnectWallet.svelte";

  let config = {
    connected: false,
    account: "0x",
    web3: undefined,
    appContract: undefined,
  };

  function showError(message) {
    const alertplaceholder = document.getElementById("alertplaceholder");
    const wrapper = document.createElement("div");
    //const message = "Please install metamask to interact with this app!";
    wrapper.innerHTML = [
      `<div class="alert alert-danger alert-dismissible" role="alert">`,
      `   <div>${message}</div>`,
      '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
      "</div>",
    ].join("");
    alertplaceholder.append(wrapper);
  }
</script>

<main>
  <div>
    <h1>FlightInsure - Get your Flight Insurance Today!</h1>
    <Router>
      <nav class="navbar navbar-expand-lg  navbar-dark bg-dark">
        <div class="container-fluid">
          <Link class="navbar-brand" to="/">FlightInsure</Link>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon" />
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <Link class="nav-link" aria-current="page" to="/buy"
                  >Buy Insurance</Link
                >
              </li>
              <li class="nav-item">
                <Link class="nav-link" to="claim">Claim Insurance</Link>
              </li>
              <li class="nav-item">
                <Link class="nav-link" to="airlines">Airlines Area</Link>
              </li>
            </ul>
            <ConnectWallet bind:config {showError} />
          </div>
        </div>
      </nav>
      <div id="alertplaceholder" />
      <Route path="/">
        <About />
      </Route>
      <Route path="/buy">
        <BuyInsurance {config} {showError} />
      </Route>
      <Route path="/claim">
        <Claim {config} {showError} />
      </Route>
      <Route path="/airlines">
        <AirlineMgr {config} {showError} />
      </Route>
    </Router>
  </div>
</main>

<style>
  main {
    margin: 2em auto;
    max-width: 1024px;
  }
  nav {
    margin-bottom: 2em;
  }
</style>
