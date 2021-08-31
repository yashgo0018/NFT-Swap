import './App.css';
import React, { Component, Fragment } from 'react';
import Web3 from 'web3';
import NFTSwap from './artifacts/ERC1155Swap.json';
import GenerateSwap from './pages/GenerateSwap';
import ExecuteSwap from './pages/ExecuteSwap';
import UserSwaps from './pages/UserSwaps';
import { BrowserRouter as Router, Switch, Link, Route, NavLink } from 'react-router-dom';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      swapContract: null,
      networkId: '0',
      error: '',
      account: undefined,
      loading: false,
      mode: 1 // 1 means create, 2 means cancel
    };

    this.loadContracts = this.loadContracts.bind(this);
    this.loadUser = this.loadUser.bind(this);
    this.connectWithMetamask = this.connectWithMetamask.bind(this);
    this.getShortAddress = this.getShortAddress.bind(this);
  }

  async componentDidMount() {
    if (!window.ethereum) {
      this.setState({ error: 'Metamask Not Installed/Updated' });
      return;
    }

    this.web3 = new Web3(window.ethereum);
    window.ethereum.on('networkChanged', (networkId) => {
      if (!this.state.networkId) {
        this.loadContracts(networkId);
      } else if (this.state.networkId !== networkId) {
        window.location.reload();
      }
    });
    window.ethereum.autoRefreshOnNetworkChange = false;
    const networkId = window.ethereum.networkVersion;
    await this.loadContracts(networkId);
  }

  loadContracts(networkId) {
    this.setState({ networkId });
    console.log(networkId)
    const deployedSwapNetwork = NFTSwap.networks[networkId];
    if (deployedSwapNetwork) {
      const swapContract = new this.web3.eth.Contract(NFTSwap.abi, deployedSwapNetwork.address);
      this.setState({ swapContract });
      if (this.state.error === 'The current network is not supported.') {
        this.setState({ error: '' });
      }
    } else {
      this.setState({ error: 'The current network is not supported.' });
    }
  }

  async loadUser(account) {
    this.setState({ account });
    // if (!this.state.usdtContract) return;
    // console.log(this.state.swapContract._address)
    // this.loadAllowance(account);
  }

  async connectWithMetamask() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.loadUser(accounts[0]);
    // this.setState({account: accounts[0]});
  }

  shorten(text, char) {
    const len = text.length;
    return `${text.slice(0, char)}...${text.slice(len - char, len)}`;
  }

  getShortAddress() {
    const { account } = this.state;
    if (!account) {
      return '';
    }
    return this.shorten(account, 5);
  }

  // async cancelSwap() {
  //   const { token, contract: contractAddress, swapContract, account } = this.state;
  //   this.setState({ loading: true });

  //   // Check if Exist
  //   const contract = await this.validateAndReturnContract();
  //   if (!contract) {
  //     this.setState({ loading: false });
  //     return;
  //   };

  //   // Check The Ownership
  //   const owner = await contract.methods.ownerOf(token).call();
  //   if (owner.toLowerCase() !== account.toLowerCase()) {
  //     this.setState({ errors: { ...this.state.errors, token: 'You Are Not The Owner Of this Token' }, loading: false });
  //     return;
  //   }

  //   try {
  //     const result = await swapContract.methods.clearSwap(contractAddress, token).send({ from: account });
  //     console.log(result);
  //   } catch (e) {
  //     console.log(e.message);
  //   }

  //   this.setState({ loading: false });
  // }

  render() {
    const { error, account, loading, swapContract, mode } = this.state;
    const shortAddress = this.getShortAddress();

    return <Router><div id="app">
      <nav className="flex">
        <div><Link to="/" className="no-style-link">Swap ERC721 Tokens</Link></div>
        {account === undefined || <div>{shortAddress}</div>}
      </nav>
      <main>
        <div className="mode-selector">
          <NavLink exact activeClassName="active" to="/" className="no-style-link">Create Swap</NavLink>
          <NavLink activeClassName="active" to="/my-swaps" className="no-style-link">My Swap</NavLink>
        </div>
        <Switch>
          <div id="swap-container">
            {error === '' ? <>
              <Route path="/" exact>
                <GenerateSwap
                  web3={this.web3}
                  account={account}
                  swapContract={swapContract}
                  setLoading={isLoading => this.setState({ loading: isLoading })} />
              </Route>
              <Route path="/my-swaps" component={(props) => <UserSwaps
                web3={this.web3}
                account={account}
                swapContract={swapContract}
                setLoading={isLoading => this.setState({ loading: isLoading })} />} exact />
              <Route path="/swaps/:swapId" component={(props) => <ExecuteSwap
                {...props}
                account={account}
                setError={(error) => this.setState({ error })}
                setLoading={isLoading => this.setState({ loading: isLoading })}
                swapContract={swapContract}
                web3={this.web3} />} exact />
            </> :
              <div className="error">{error}</div>}
          </div>
        </Switch>
        {/* {lastTransaction === '' || <div className="lastTrasaction">
          <div className="title">Last Interaction</div>
          <div dangerouslySetInnerHTML={{ __html: lastTransaction }}></div>
        </div>} */}
        {(account !== undefined || error !== '') ||
          <div className="overflow">
            <button onClick={this.connectWithMetamask}>Connect With Metamask</button>
          </div>}
        {loading !== true ||
          <div className="overflow">
            <div className="spin"></div>
          </div>}
      </main>
    </div>
    </Router>;
  }
}