import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import ERC721 from '../artifacts/ERC721.json';
import ERC1155 from '../artifacts/ERC1155.json';
import ERC165 from '../artifacts/ERC165.json';

export default class GenerateSwap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      step: 1,
      contract: '',
      token: '',
      errors: {
        contract: '',
        token: ''
      },
      token1: '',
      contract1: '',
      type1: ''
    };
    this.validateAndReturnContract = this.validateAndReturnContract.bind(this);
    this.approve = this.approve.bind(this);
    this.generateSwap = this.generateSwap.bind(this);
  }

  async validateAndReturnContract() {
    const { token, contract: contractAddress } = this.state;
    const { web3 } = this.props;
    console.log(this.props);
    if (!contractAddress) {
      this.setState({ errors: { ...this.state.errors, contract: 'Please Enter Contract Address' } });
      return [null, ''];
    }

    if (!token) {
      this.setState({ errors: { ...this.state.errors, token: 'Please Enter Token ID' } });
      return [null, ''];
    }

    let tokenType;

    try {
      const erc165Contract = new web3.eth.Contract(ERC165.abi, contractAddress);
      const isERC721Contract = await erc165Contract.methods.supportsInterface('0x80ac58cd').call();
      const isERC1155Contract = await erc165Contract.methods.supportsInterface('0xd9b67a26').call();
      if (isERC721Contract) {
        tokenType = 'erc721';
      } else if (isERC1155Contract) {
        tokenType = 'erc1155';
      } else {
        this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
        return [null, ''];
      }
    } catch (e) {
      console.log(e.message);
      this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
      return [null, ''];
    }

    let contract;

    // Check If Contract Exist
    try {
      contract = new web3.eth.Contract(tokenType === 'erc721' ? ERC721.abi : ERC1155.abi, contractAddress);
    } catch (e) {
      console.log(e.message);
      this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
      return [null, ''];
    }

    // Check If Token Exist
    if (tokenType === 'erc721') {
      try {
        await contract.methods.tokenURI(token).call();
      } catch (e) {
        if (e.message === `Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.`) {
          this.setState({ errors: { ...this.state.errors, contract: 'Contract Not Found' } });
        } else {
          this.setState({ errors: { ...this.state.errors, token: 'Token Not Found' } });
        }
        return [null, ''];
      }
    }

    return [contract, tokenType];
  }

  async approve() {
    const { token, contract: contractAddress } = this.state;
    const { account, setLoading, swapContract } = this.props;
    setLoading(true);

    // Check if Exist
    const [contract, tokenType] = await this.validateAndReturnContract();
    console.log(contract)
    console.log(tokenType)
    if (!contract) {
      setLoading(false);
      return;
    }

    // Check The Ownership
    if (tokenType === 'erc721') {
      const owner = await contract.methods.ownerOf(token).call();
      if (owner.toLowerCase() !== account.toLowerCase()) {
        setLoading(false);
        this.setState({ errors: { ...this.state.errors, token: 'You Are Not The Owner Of this Token' } });
        return;
      }
    } else {
      const balanceOfOwner = await contract.methods.balanceOf(account, token).call();
      if (balanceOfOwner === '0') {
        setLoading(false);
        this.setState({ errors: { ...this.state.errors, token: 'You Are Not The Owner Of this Token' } });
        return;
      }
    }

    // Check If Approved
    console.log(tokenType)
    if (tokenType === 'erc721') {
      const approvedFor = await contract.methods.getApproved(token).call();
      console.log(swapContract)
      if (approvedFor.toLowerCase() !== swapContract._address.toLowerCase()) {
        // If Not Approve Approve it
        try {
          const result = await contract.methods.approve(swapContract._address, token).send({ from: account });
          console.log(result);
        } catch (e) {
          console.log(e);
          setLoading(false);
          return;
        }
      }
    } else {
      const isApproved = await contract.methods.isApprovedForAll(account, swapContract._address).call();
      console.log(isApproved)
      if (!isApproved) {
        try {
          const result = await contract.methods.setApprovalForAll(swapContract._address, true).send({ from: account });
          console.log(result);
        } catch (e) {
          console.log(e);
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    this.setState({
      step: 2,
      contract1: contractAddress,
      token1: token,
      contract: '',
      token: '',
      type1: tokenType
    });
  }

  async generateSwap() {
    const { token, contract: contractAddress, contract1, token1, type1 } = this.state;
    const { account, setLoading, swapContract } = this.props;
    setLoading(true);

    // Check if Exist
    const [contract, tokenType] = await this.validateAndReturnContract();
    if (!contract) {
      setLoading(false);
      return;
    };

    // Check The Ownership
    if (tokenType === 'erc721') {
      const owner = await contract.methods.ownerOf(token).call();
      if (owner.toLowerCase() === account.toLowerCase()) {
        setLoading(false);
        this.setState({ errors: { ...this.state.errors, token: 'You Are The Owner Of this Token' } });
        return;
      }
    }

    // Generate Swap
    try {
      const result = await swapContract.methods.createSwap(contract1, token1, contractAddress, token).send({ from: account });
      const swapId = result.events.SwapCreated.returnValues.id;
      alert(`Swap generated with id ${swapId}\nYou can view the sharable link on my swaps page`);
    } catch (e) {
      console.log(e.message);
    }

    setLoading(false);
    this.setState({ step: 1, contract: '', token: '' });
  }

  render() {
    const { error, step, contract, token, errors } = this.state;

    return (
      <>
        <div className="flex swap-titlebar">
          <div className="operation-title">
            {step === 1 ? 'Your NFT Detail' : 'Your Friend\'s NFT Detail'}
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
          <button
            className="operationButton"
            onClick={step === 1 ? this.approve : this.generateSwap}>
            {step === 1 ? 'Approve' : 'Swap'}
          </button>
        </div>
        <div className="text-center">
          <span className={`step-tile ${step === 1 ? 'active' : ''}`}>Step 1</span>
          &gt;
          <span className={`step-tile ${step === 2 ? 'active' : ''}`}>Step 2</span>
        </div>
      </>)
  }
}