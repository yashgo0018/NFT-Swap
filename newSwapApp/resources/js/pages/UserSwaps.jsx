import React, { Component } from 'react';
import Axios from 'axios';
import './UserSwaps.css';

export default class UserSwaps extends Component {
  constructor(props) {
    super(props);
    this.state = {
      swaps: []
    }
    this.cancelSwap = this.cancelSwap.bind(this);
  }

  async componentDidMount() {
    if (this.props.account) {
      const { data } = await Axios.get(`/api/swaps/${this.props.account}`);
      this.setState({ swaps: data });
    }
  }

  async cancelSwap(swapId) {
    const { account, swapContract, setLoading } = this.props;
    setLoading(true);
    try {
      const result = await swapContract.methods.cancelSwap(swapId).send({ from: account });
      console.log(result);
      const { data } = await Axios.get(`/api/swaps/${account}`);
      this.setState({ swaps: data });
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  }

  render() {
    const { swaps } = this.state;
    if (swaps.length === 0) {
      return <div>
        You have not generated any swaps yet.
      </div>;
    }
    console.log(swaps)
    return <div>
      {swaps.map(swap => <div key={swap.id} className="user-swap-container">
        <div className="user-swap-id">Swap ID: {swap.swap_id} <span>({swap.done ? (swap.cancelled ? 'Cancelled' : 'Closed') : 'Open'})</span></div>
        <div className="user-swap-token-1-container">
          <div>My Token Details:</div>
          <div>Contract Address: {swap.contract_1_address}</div>
          <div>Token ID: {swap.token_1}</div>
        </div>
        <div className="user-swap-token-2-container">
          <div className="title-">The Other Token Details:</div>
          <div>Contract Address: {swap.contract_2_address}</div>
          <div>Token ID: {swap.token_2}</div>
        </div>
        <div className="user-swap-link">Swap link: {location.protocol}//{location.host}/swaps/{swap.swap_id}</div>
        {!swap.done ?
          <div><button className="cancel-btn" onClick={() => this.cancelSwap(swap.swap_id)}>Cancel</button></div>
          : <></>}
      </div>)}
    </div>
  }
}