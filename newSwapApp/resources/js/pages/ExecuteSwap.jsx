import React, { Component } from 'react';
import Axios from 'axios';
import ERC721 from '../artifacts/ERC721.json';
import ERC1155 from '../artifacts/ERC1155.json';

export default class ExecuteSwap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      swap: null,
      step: 1,
      loading: false
    }
    this.validateSwap = this.validateSwap.bind(this);
    this.approve = this.approve.bind(this);
    this.confirmSwap = this.confirmSwap.bind(this);
  }

  async componentDidMount() {
    try {
      const { data: swap } = await Axios.get(`/api/swap/${this.props.match.params.swapId}`);
      this.setState({ swap });
    } catch (e) {
      location.replace('/404');
    }
    this.validationInterval = setInterval(async () => {
      if (this.props.swapContract) {
        clearInterval(this.validationInterval);
        try {
          const data = await this.props.swapContract.methods.swaps(this.props.match.params.swapId).call();
          if (data.done) {
            location.replace('/404');
          }
          if (this.props.account && !await this.validateSwap(this.props.account, data)) {
            this.props.setError("You are not the owner of this token");
          }
        } catch (e) {
          console.log(e);
          location.replace('/404');
        }
      }
    }, 500);
  }

  componentWillUnmount() {
    clearInterval(this.validationInterval);
  }

  async validateSwap(account, swap) {
    const { web3 } = this.props;
    if (swap.type2 === '0') {
      const contract = new web3.eth.Contract(ERC721.abi, swap.contract2Address);
      const owner = await contract.methods.ownerOf(swap.token2).call();
      return owner.toString().toLowerCase() === account.toLowerCase();
    } else {
      const contract = new web3.eth.Contract(ERC1155.abi, swap.contract2Address);
      const balance = await contract.methods.balanceOf(account, swap.token2).call();
      return parseInt(balance) > 0;
    }
  }

  async approve() {
    const { swapContract, web3, account, setLoading } = this.props;
    const { swap } = this.state;

    this.setState({ loading: true });
    if (swap.type_2 === 0) {
      const contract = new web3.eth.Contract(ERC721.abi, swap.contract_2_address);
      const approvedFor = await contract.methods.getApproved(swap.token_2).call();
      if (approvedFor.toLowerCase() !== swapContract._address.toLowerCase()) {
        // If Not Approve Approve it
        try {
          const result = await contract.methods.approve(swapContract._address, swap.token_2).send({ from: account });
          console.log(result);
        } catch (e) {
          console.log(e);
          this.setState({ loading: false });
          return;
        }
      }
    } else {
      const contract = new web3.eth.Contract(ERC1155.abi, swap.contract_2_address);
      const isApproved = await contract.methods.isApprovedForAll(account, swapContract._address).call();
      if (!isApproved) {
        try {
          const result = await contract.methods.setApprovalForAll(swapContract._address, true).send({ from: account });
          console.log(result);
        } catch (e) {
          console.log(e);
          this.setState({ loading: false });
          return;
        }
      }
    }
    this.setState({ loading: false });
    this.setState({ step: 2 });
  }

  async confirmSwap() {
    const { swapContract, account, setLoading } = this.props;
    const { swap } = this.state;
    this.setState({ loading: true });
    try {
      const result = await swapContract.methods.executeSwap(
        swap.swap_id,
        swap.contract_2_address,
        swap.token_2,
        swap.contract_1_address,
        swap.token_1
      ).send({ from: account });
      alert('Swap Done!!!');
      location.replace('/');
    } catch (e) {
      console.log(e.message);
    }
    this.setState({ loading: false });
  }

  render() {
    console.log(this.props.match.params.swapId);
    const { swap, step, loading } = this.state;
    console.log(swap)
    return <div>{!this.props.account ? 'Please Login First' : (swap ? <div>
      <div className="user-swap-id">Swap ID: {swap.swap_id} <span>({swap.done ? (swap.cancelled ? 'Cancelled' : 'Closed') : 'Open'})</span></div>
      <div className="user-swap-token-1-container">
        <div>My Token Details:</div>
        <div>Contract Address: {swap.contract_2_address}</div>
        <div>Token ID: {swap.token_2}</div>
      </div>
      <div className="user-swap-token-2-container">
        <div className="title-">The Other Token Details:</div>
        <div>Contract Address: {swap.contract_1_address}</div>
        <div>Token ID: {swap.token_1}</div>
      </div>
      <div>
        {step === 1 ? <button className="approve-btn" onClick={this.approve}>Approve</button> : <button className="swap-btn" onClick={this.confirmSwap}>Confirm</button>}
      </div>
    </div> : <></>)}
      {
        loading !== true ||
        <div className="overflow">
          <div className="spin"></div>
        </div>
      }
    </div>;
  }
}