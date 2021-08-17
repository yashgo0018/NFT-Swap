const NFTSwap = artifacts.require("NFTSwap");
const TestNFTToken = artifacts.require("TestNFTToken");

contract('NFTSwap', accounts => {
  let testNFTToken, nftSwap;

  before(async () => {
    // Create Some NFTs
    testNFTToken = await TestNFTToken.deployed();
    nftSwap = await NFTSwap.deployed();
    await testNFTToken.safeMint(accounts[0], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[1], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[2], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[3], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[4], { from: accounts[0] });
    await testNFTToken.safeMint(accounts[4], { from: accounts[0] });
  });

  it('Should check if the nfts are minted and to correct addresses', async () => {
    assert(await testNFTToken.ownerOf(0) === accounts[0]);
    assert(await testNFTToken.ownerOf(1) === accounts[1]);
    assert(await testNFTToken.ownerOf(2) === accounts[2]);
    assert(await testNFTToken.ownerOf(3) === accounts[3]);
    assert(await testNFTToken.ownerOf(4) === accounts[4]);
    assert(await testNFTToken.ownerOf(5) === accounts[4]);
  });

  it('Should fail if user is not the owner of the nft', async () => {
    try {
      await nftSwap.swap(testNFTToken.address, 1, testNFTToken.address, 2);
    } catch (e) {
      assert(e.message.includes('You Are Not The Owner of this token'));
      return;
    }
    assert(false);
  })

  it('Should fail if contract is not approved for the token', async () => {
    try {
      await nftSwap.swap(testNFTToken.address, 0, testNFTToken.address, 2);
    } catch (e) {
      assert(e.message.includes('You Have To First Approve This ERC721 Token'));
      return;
    }
    assert(false);
  })

  it('Should Make A Swap', async () => {
    await testNFTToken.approve(nftSwap.address, 2, { from: accounts[2] });
    await nftSwap.swap(testNFTToken.address, 2, testNFTToken.address, 3, { from: accounts[2] });
    const listing = await nftSwap.listings(testNFTToken.address, 2);
    assert(listing.owner === accounts[2]);
    assert(listing.oppositeContract === testNFTToken.address);
    assert(listing.oppositeTokenId.toNumber() === 3);
  })

  it('Should create Another Swap', async () => {
    await testNFTToken.approve(nftSwap.address, 3, { from: accounts[3] });
    await nftSwap.swap(testNFTToken.address, 3, testNFTToken.address, 4, { from: accounts[3] });
    const listing = await nftSwap.listings(testNFTToken.address, 3);
    assert(listing.owner === accounts[3]);
    assert(listing.oppositeContract === testNFTToken.address);
    assert(listing.oppositeTokenId.toNumber() === 4);
  })

  it('Should create Third Swap', async () => {
    await testNFTToken.approve(nftSwap.address, 4, { from: accounts[4] });
    await nftSwap.swap(testNFTToken.address, 4, testNFTToken.address, 2, { from: accounts[4] });
    const listing = await nftSwap.listings(testNFTToken.address, 4);
    assert(listing.owner === accounts[4]);
    assert(listing.oppositeContract === testNFTToken.address);
    assert(listing.oppositeTokenId.toNumber() === 2);
  })

  it('Should execute A Swap', async () => {
    await testNFTToken.approve(nftSwap.address, 3, { from: accounts[3] });
    await nftSwap.swap(testNFTToken.address, 3, testNFTToken.address, 2, { from: accounts[3] });
    const listing = await nftSwap.listings(testNFTToken.address, 3);
    const listing2 = await nftSwap.listings(testNFTToken.address, 2);
    const ownerOf3 = await testNFTToken.ownerOf(3);
    const ownerOf2 = await testNFTToken.ownerOf(2);
    assert(ownerOf2 === accounts[3]);
    assert(ownerOf3 === accounts[2]);
    assert(listing.owner === '0x0000000000000000000000000000000000000000');
    assert(listing2.owner === '0x0000000000000000000000000000000000000000');
  })

  it('Should not clear the listing if nft not of the user', async () => {
    try {
      await nftSwap.clearSwap(testNFTToken.address, 4, { from: accounts[2] });
    } catch (e) {
      assert(e.message.includes('Only Token Owner Allowed'));
      return;
    }
    assert(false);
  })

  it('Should check if the owner is changed and delete the listing', async () => {
    await testNFTToken.transferFrom(accounts[4], accounts[2], 4, { from: accounts[4] });
    let listing = await nftSwap.listings(testNFTToken.address, 4);
    assert(listing.owner === accounts[4]);
    await testNFTToken.approve(nftSwap.address, 0, { from: accounts[0] });
    await nftSwap.swap(testNFTToken.address, 0, testNFTToken.address, 4, { from: accounts[0] });
    listing = await nftSwap.listings(testNFTToken.address, 4);
    assert(listing.owner === '0x0000000000000000000000000000000000000000');
    let newListing = await nftSwap.listings(testNFTToken.address, 0);
    assert(newListing.owner === accounts[0]);
  })

  it('Should clear the listing', async () => {
    let listing = await nftSwap.listings(testNFTToken.address, 0);
    assert(listing.owner === accounts[0]);
    await nftSwap.clearSwap(testNFTToken.address, 0, { from: accounts[0] });
    listing = await nftSwap.listings(testNFTToken.address, 0);
    assert(listing.owner === '0x0000000000000000000000000000000000000000');
  })
})
