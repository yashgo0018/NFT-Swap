const ERC1155Swap = artifacts.require("ERC1155Swap");
const TestNFTToken = artifacts.require("TestNFTToken");
const TestERC1155Token = artifacts.require("TestERC1155Token");

contract('ERC1155Swap', accounts => {
  let testNFTToken, nftSwap, testERC1155Token;

  before(async () => {
    // Create Some NFTs
    testNFTToken = await TestNFTToken.deployed();
    testERC1155Token = await TestERC1155Token.deployed();
    nftSwap = await ERC1155Swap.deployed();
    await testNFTToken.safeMint(accounts[0], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[1], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[2], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[3], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[4], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[4], { from: accounts[0] });
    await testERC1155Token.mint(accounts[0], 0, 10, { from: accounts[0] });
    await testERC1155Token.mint(accounts[1], 1, 10, { from: accounts[0] });
    await testERC1155Token.mint(accounts[2], 2, 10, { from: accounts[0] });
    await testERC1155Token.mint(accounts[3], 3, 10, { from: accounts[0] });
  });

  it('Should check if the nfts are minted and to correct addresses', async () => {
    // Check erc721 balances
    assert(await testNFTToken.ownerOf(0) === accounts[0]);
    assert(await testNFTToken.ownerOf(1) === accounts[1]);
    assert(await testNFTToken.ownerOf(2) === accounts[2]);
    assert(await testNFTToken.ownerOf(3) === accounts[3]);
    assert(await testNFTToken.ownerOf(4) === accounts[4]);
    assert(await testNFTToken.ownerOf(5) === accounts[4]);

    // Check erc1155 balances
    assert((await testERC1155Token.balanceOf(accounts[0], 0)).toNumber() === 10);
    assert((await testERC1155Token.balanceOf(accounts[1], 1)).toNumber() === 10);
    assert((await testERC1155Token.balanceOf(accounts[2], 2)).toNumber() === 10);
    assert((await testERC1155Token.balanceOf(accounts[3], 3)).toNumber() === 10);
    assert((await testERC1155Token.balanceOf(accounts[0], 1)).toNumber() === 0);
  });

  describe('for erc721 to erc721', () => {
    it('Should fail if user is not the owner of the nft', async () => {
      try {
        await nftSwap.createSwap(testNFTToken.address, 1, testNFTToken.address, 2);
      } catch (e) {
        assert(e.message.includes("You Don't Own This Token"));
        return;
      }
      assert(false);
    })

    it('Should fail if contract is not approved for the token', async () => {
      try {
        await nftSwap.createSwap(testNFTToken.address, 0, testNFTToken.address, 2);
      } catch (e) {
        assert(e.message.includes('You Have Not Approved This Contract For This Token'));
        return;
      }
      assert(false);
    })

    it('Should Make A Swap', async () => {
      await testNFTToken.approve(nftSwap.address, 2, { from: accounts[2] });
      await nftSwap.createSwap(testNFTToken.address, 2, testNFTToken.address, 3, { from: accounts[2] });
      const listing = await nftSwap.swaps(0);
      assert(listing.owner === accounts[2]);
      assert(listing.contract2Address === testNFTToken.address);
      assert(listing.token2.toNumber() === 3);
      assert(listing.type1.toNumber() === 0);
      assert(listing.type2.toNumber() === 0);
    })

    it('Should create Another Swap', async () => {
      await testNFTToken.approve(nftSwap.address, 3, { from: accounts[3] });
      await nftSwap.createSwap(testNFTToken.address, 3, testNFTToken.address, 4, { from: accounts[3] });
      const listing = await nftSwap.swaps(1);
      assert(listing.owner === accounts[3]);
      assert(listing.contract2Address === testNFTToken.address);
      assert(listing.token2.toNumber() === 4);
      assert(listing.type1.toNumber() === 0);
      assert(listing.type2.toNumber() === 0);
    })

    it('Should create Third Swap', async () => {
      await testNFTToken.approve(nftSwap.address, 4, { from: accounts[4] });
      await nftSwap.createSwap(testNFTToken.address, 4, testNFTToken.address, 0, { from: accounts[4] });
      const listing = await nftSwap.swaps(2);
      assert(listing.owner === accounts[4]);
      assert(listing.contract2Address === testNFTToken.address);
      assert(listing.token2.toNumber() === 0);
      assert(listing.type1.toNumber() === 0);
      assert(listing.type2.toNumber() === 0);
    })

    it('Should execute A Swap', async () => {
      await testNFTToken.approve(nftSwap.address, 3, { from: accounts[3] });
      await nftSwap.executeSwap(0, testNFTToken.address, 3, testNFTToken.address, 2, { from: accounts[3] });
      const listing = await nftSwap.swaps(0);
      const ownerOf3 = await testNFTToken.ownerOf(3);
      const ownerOf2 = await testNFTToken.ownerOf(2);
      assert(listing.done, "Listing is not marked done");
      assert(ownerOf2 === accounts[3], "Owner of token 2 not switched");
      assert(ownerOf3 === accounts[2], "Owner of token 3 not switched");
    })

    it('Should not clear the listing if nft not of the user', async () => {
      try {
        await nftSwap.cancelSwap(1, { from: accounts[2] });
      } catch (e) {
        assert(e.message.includes('Only swap owner can cancel it'));
        return;
      }
      assert(false);
    })

    it('Should check if the owner is changed and delete the listing', async () => {
      await testNFTToken.transferFrom(accounts[4], accounts[2], 4, { from: accounts[4] });
      let listing = await nftSwap.swaps(2);
      assert(listing.owner === accounts[4]);
      await testNFTToken.approve(nftSwap.address, 0, { from: accounts[0] });
      assert(!listing.done);
      try {
        await nftSwap.executeSwap(2, testNFTToken.address, 0, testNFTToken.address, 4, { from: accounts[0] });
      } catch (e) {
        assert(e.message.includes('Swap not Valid'));
        return;
      }
      assert(false);
    })

    it('Should clear the listing', async () => {
      let listing = await nftSwap.swaps(2);
      assert(listing.owner === accounts[4]);
      assert(!listing.done);
      await nftSwap.cancelSwap(2, { from: accounts[4] });
      listing = await nftSwap.swaps(2);
      assert(listing.done);
    })
  });

  describe('for erc1155 to erc1155', () => {
    it('Should fail if user is not the owner of the nft', async () => {
      try {
        await nftSwap.createSwap(testERC1155Token.address, 1, testERC1155Token.address, 2);
      } catch (e) {
        assert(e.message.includes("You Don't Own This Token"));
        return;
      }
      assert(false);
    })

    it('Should fail if contract is not approved for the token', async () => {
      try {
        await nftSwap.createSwap(testERC1155Token.address, 0, testERC1155Token.address, 2);
      } catch (e) {
        assert(e.message.includes('You Have Not Approved This Contract For This Token'));
        return;
      }
      assert(false);
    })

    it('Should Make A Swap', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[2] });
      await nftSwap.createSwap(testERC1155Token.address, 2, testERC1155Token.address, 3, { from: accounts[2] });
      const listing = await nftSwap.swaps(3);
      assert(listing.owner === accounts[2]);
      assert(listing.contract2Address === testERC1155Token.address);
      assert(listing.token2.toNumber() === 3);
      assert(listing.type1.toNumber() === 1);
      assert(listing.type2.toNumber() === 1);
    })

    it('Should create Another Swap', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[0] });
      await nftSwap.createSwap(testERC1155Token.address, 0, testERC1155Token.address, 1, { from: accounts[0] });
      const listing = await nftSwap.swaps(4);
      assert(listing.owner === accounts[0]);
      assert(listing.contract2Address === testERC1155Token.address);
      assert(listing.token2.toNumber() === 1);
      assert(listing.type1.toNumber() === 1);
      assert(listing.type2.toNumber() === 1);
    })

    it('Should execute A Swap', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[1] });
      await nftSwap.executeSwap(4, testERC1155Token.address, 1, testERC1155Token.address, 0, { from: accounts[1] });
      const listing = await nftSwap.swaps(4);
      const balanceOf1OfAccount1 = (await testERC1155Token.balanceOf(accounts[0], 0)).toNumber();
      const balanceOf1OfAccount2 = (await testERC1155Token.balanceOf(accounts[1], 0)).toNumber();
      const balanceOf2OfAccount1 = (await testERC1155Token.balanceOf(accounts[0], 1)).toNumber();
      const balanceOf2OfAccount2 = (await testERC1155Token.balanceOf(accounts[1], 1)).toNumber();
      assert(listing.done, "Listing is not marked done");
      assert(balanceOf1OfAccount1 === 9, "Token 1 not transferred - part 1");
      assert(balanceOf1OfAccount2 === 1, "Token 1 not transferred - part 2");
      assert(balanceOf2OfAccount2 === 9, "Token 2 not transferred - part 1");
      assert(balanceOf2OfAccount1 === 1, "Token 2 not transferred - part 2");
    })


    it('Should not execute A Swap if already swapped for the id', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[1] });
      let listing = await nftSwap.swaps(4);
      assert(listing.done);
      try {
        await nftSwap.executeSwap(4, testERC1155Token.address, 1, testERC1155Token.address, 0, { from: accounts[1] });
      } catch (e) {
        assert(e.message.includes('Swap not Valid'));
        return;
      }
      assert(false);
    })

    it('Should not clear the listing if nft not of the user', async () => {
      try {
        await nftSwap.cancelSwap(3, { from: accounts[0] });
      } catch (e) {
        assert(e.message.includes('Only swap owner can cancel it'));
        return;
      }
      assert(false);
    })

    it('Should clear the listing', async () => {
      let listing = await nftSwap.swaps(3);
      assert(listing.owner === accounts[2]);
      assert(!listing.done);
      await nftSwap.cancelSwap(3, { from: accounts[2] });
      listing = await nftSwap.swaps(3);
      assert(listing.done);
    })
  })

  describe('for erc721 to erc1155', () => {
    it('Should Make A Swap from erc721 to erc1155', async () => {
      await testNFTToken.approve(nftSwap.address, 4, { from: accounts[2] });
      await nftSwap.createSwap(testNFTToken.address, 4, testERC1155Token.address, 3, { from: accounts[2] });
      const listing = await nftSwap.swaps(5);
      assert(listing.owner === accounts[2]);
      assert(listing.contract2Address === testERC1155Token.address);
      assert(listing.token2.toNumber() === 3);
      assert(listing.type1.toNumber() === 0);
      assert(listing.type2.toNumber() === 1);
    })

    it('Should Make A Swap from erc1155 to erc721', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[0] });
      await nftSwap.createSwap(testERC1155Token.address, 0, testNFTToken.address, 4, { from: accounts[0] });
      const listing = await nftSwap.swaps(6);
      assert(listing.owner === accounts[0]);
      assert(listing.contract2Address === testNFTToken.address);
      assert(listing.token2.toNumber() === 4);
      assert(listing.type1.toNumber() === 1);
      assert(listing.type2.toNumber() === 0);
    })

    it('Should execute A Swap from erc721 to erc1155', async () => {
      await testERC1155Token.setApprovalForAll(nftSwap.address, true, { from: accounts[3] });
      assert((await testERC1155Token.balanceOf(accounts[3], 3)).toNumber() === 10);
      assert(await testNFTToken.ownerOf(4) === accounts[2]);
      await nftSwap.executeSwap(5, testERC1155Token.address, 3, testNFTToken.address, 4, { from: accounts[3] });
      const listing = await nftSwap.swaps(5);
      const balanceOf1OfAccount2 = (await testERC1155Token.balanceOf(accounts[2], 3)).toNumber();
      const balanceOf1OfAccount3 = (await testERC1155Token.balanceOf(accounts[3], 3)).toNumber();
      const ownerOf4 = await testNFTToken.ownerOf(4);
      assert(listing.done, "Listing is not marked done");
      assert(balanceOf1OfAccount3 === 9, "Token 1 not transferred - part 1");
      assert(balanceOf1OfAccount2 === 1, "Token 1 not transferred - part 2");
      assert(ownerOf4 === accounts[3], "Token 2 not transferred");
    })
  });
})
