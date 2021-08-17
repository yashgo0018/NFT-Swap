import './App.css';
import React, { Component, Fragment } from 'react';
import Web3 from 'web3';
import NFTSwap from './artifacts/NFTSwap.json';
import ERC721 from './artifacts/ERC721.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      swapContract: null,
      networkId: '0',
      error: '',
      account: undefined,
      loading: false,
      contract: '',
      contract1: '',
      contract2: '',
      token: '',
      token1: '',
      token2: '',
      step: 1,
      errors: {
        token: '',
        contract: ''
      },
      mode: 1 // 1 means create, 2 means cancel
    };

    this.loadContracts = this.loadContracts.bind(this);
    this.loadUser = this.loadUser.bind(this);
    this.connectWithMetamask = this.connectWithMetamask.bind(this);
    this.getShortAddress = this.getShortAddress.bind(this);
    this.approve = this.approve.bind(this);
    this.swap = this.swap.bind(this);
    this.cancelSwap = this.cancelSwap.bind(this);
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
    // if (!account) return;
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

  async validateAndReturnContract() {
    const { token, contract: contractAddress } = this.state;
    if (!contractAddress) {
      this.setState({ errors: { ...this.state.errors, contract: 'Please Enter Contract Address' } });
      return null;
    }

    if (!token) {
      this.setState({ errors: { ...this.state.errors, token: 'Please Enter Token ID' } });
      return null;
    }

    let contract;

    // Check If Contract Exist
    try {
      contract = new this.web3.eth.Contract(ERC721.abi, contractAddress);
    } catch (e) {
      console.log(e.message);
      this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
      return null;
    }

    // Check If Token Exist
    try {
      await contract.methods.tokenURI(token).call();
    } catch (e) {
      if (e.message === `Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.`) {
        this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
      } else {
        this.setState({ errors: { ...this.state.errors, token: 'Token Not Found' } });
      }
      return null;
    }

    return contract;
  }

  async approve() {
    const { token, contract: contractAddress, account, swapContract } = this.state;
    this.setState({ loading: true });

    // Check if Exist
    const contract = await this.validateAndReturnContract();
    if (!contract) {
      this.setState({ loading: false });
      return;
    }

    // Check The Ownership
    const owner = await contract.methods.ownerOf(token).call();
    if (owner.toLowerCase() !== account.toLowerCase()) {
      this.setState({ errors: { ...this.state.errors, token: 'You Are Not The Owner Of this Token' }, loading: false });
      return;
    }

    // Check If Approved
    const approvedFor = await contract.methods.getApproved(token).call();
    console.log(swapContract)
    if (approvedFor.toLowerCase() !== swapContract._address.toLowerCase()) {
      // If Not Approve Approve it
      try {
        const result = await contract.methods.approve(swapContract._address, token).send({ from: account });
        console.log(result);
      } catch (e) {
        console.log(e);
        return;
      }
    }

    this.setState({ step: 2, contract1: contractAddress, token1: token, contract: '', token: '', loading: false });
  }

  async swap() {
    const { token, contract: contractAddress, swapContract, contract1, token1, account } = this.state;
    this.setState({ loading: true });

    // Check if Exist
    const contract = await this.validateAndReturnContract();
    if (!contract) {
      this.setState({ loading: false });
      return;
    };

    // Check The Ownership
    const owner = await contract.methods.ownerOf(token).call();
    if (owner.toLowerCase() === account.toLowerCase()) {
      this.setState({ errors: { ...this.state.errors, token: 'You Are The Owner Of this Token' }, loading: false });
      return;
    }

    // Make Swap
    try {
      const result = await swapContract.methods.swap(contract1, token1, contractAddress, token).send({ from: account });
      console.log(result);
    } catch (e) {
      console.log(e.message);
    }

    this.setState({ step: 1, contract: '', token: '', loading: false });
  }

  async cancelSwap() {
    const { token, contract: contractAddress, swapContract, account } = this.state;
    this.setState({ loading: true });

    // Check if Exist
    const contract = await this.validateAndReturnContract();
    if (!contract) {
      this.setState({ loading: false });
      return;
    };

    // Check The Ownership
    const owner = await contract.methods.ownerOf(token).call();
    if (owner.toLowerCase() !== account.toLowerCase()) {
      this.setState({ errors: { ...this.state.errors, token: 'You Are Not The Owner Of this Token' }, loading: false });
      return;
    }

    try {
      const result = await swapContract.methods.clearSwap(contractAddress, token).send({ from: account });
      console.log(result);
    } catch (e) {
      console.log(e.message);
    }

    this.setState({ loading: false });
  }

  render() {
    const { error, account, loading, step, contract, token, errors, mode } = this.state;
    const shortAddress = this.getShortAddress();

    return <div id="app">
      <nav className="flex">
        <div>Swap ERC721 Tokens</div>
        {account === undefined || <div>{shortAddress}</div>}
      </nav>
      <main>
        <div className="mode-selector">
          <div onClick={() => this.setState({ mode: 1 })} className={mode === 1 ? 'active' : ''}>Create Swap</div>
          <div onClick={() => this.setState({ mode: 2 })} className={mode === 2 ? 'active' : ''}>Cancel Swap</div>
        </div>
        <div id="swap-container">
          {error === '' ? (
            <Fragment>
              <div className="flex swap-titlebar">
                <div className="operation-title">
                  {step === 1 || mode === 2 ? 'Your NFT Detail' : 'Your Friend\'s NFT Detail'}
                </div>
              </div>
              <div className="swap-form">
                <div className="form-group">
                  <label htmlFor="contractAddress">Contract Address</label>
                  <input
                    type="text"
                    value={contract}
                    id="contractAddress"
                    className={`form-control ${errors.contract ? 'error-input' : ''}`}
                    onChange={e => this.setState({
                      contract: e.target.value,
                      errors: { ...errors, contract: '' }
                    })} />
                  {errors.contract ?
                    <div className="error-message">
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      {errors.contract}
                    </div> : <></>}
                </div>
                <div className="form-group">
                  <label htmlFor="tokenID">Token ID</label>
                  <input
                    type="text"
                    id="tokenID"
                    value={token}
                    className={`form-control ${errors.token ? 'error-input' : ''}`}
                    onChange={e => this.setState({
                      token: e.target.value,
                      errors: { ...errors, token: '' }
                    })} />
                  {errors.token ?
                    <div className="error-message">
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      {errors.token}
                    </div> : <></>}
                </div>
                {mode === 1 ?
                  <button
                    className="operationButton"
                    onClick={step === 1 ? this.approve : this.swap}>
                    {step === 1 ? 'Approve' : 'Swap'}
                  </button> :
                  <button className="operationButton red" onClick={this.cancelSwap}>Cancel Swap</button>}
              </div>
              {mode === 1 ?
                <div className="text-center">
                  <span className={`step-tile ${step === 1 ? 'active' : ''}`}>Step 1</span>
                  &gt;
                  <span className={`step-tile ${step === 2 ? 'active' : ''}`}>Step 2</span>
                </div> : <></>}
            </Fragment>)
            : <div className="error">{error}</div>}
        </div>
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
    </div>;
  }
}