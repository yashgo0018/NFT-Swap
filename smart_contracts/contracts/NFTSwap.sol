// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTSwap {
    struct Listing {
        address owner;
        address oppositeContract;
        uint256 oppositeTokenId;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    function swap(
        address contract1Address,
        uint256 token1,
        address contract2Address,
        uint256 token2
    ) public {
        IERC721 contract1 = IERC721(contract1Address);
        IERC721 contract2 = IERC721(contract2Address);
        require(
            contract1.ownerOf(token1) == msg.sender,
            "You Are Not The Owner of this token"
        );
        require(
            contract1.getApproved(token1) == address(this),
            "You Have To First Approve This ERC721 Token"
        );
        require(
            contract2.ownerOf(token2) != msg.sender,
            "You already have second nft"
        );

        Listing memory listing2 = listings[contract2Address][token2];
        if (listing2.owner != address(0)) {
            if (
                contract2.ownerOf(token2) != listing2.owner ||
                contract2.getApproved(token2) != address(this)
            ) {
                delete listings[contract2Address][token2];
            } else if (
                listing2.oppositeContract == contract1Address &&
                listing2.oppositeTokenId == token1
            ) {
                contract1.transferFrom(msg.sender, listing2.owner, token1);
                contract2.transferFrom(listing2.owner, msg.sender, token2);
                delete listings[contract1Address][token1];
                delete listings[contract2Address][token2];
                return;
            }
        }

        listings[contract1Address][token1] = Listing(
            msg.sender,
            contract2Address,
            token2
        );
    }

    function clearSwap(address contractAddress, uint256 tokenId) public {
        IERC721 tokenContract = IERC721(contractAddress);
        require(
            tokenContract.ownerOf(tokenId) == msg.sender,
            "Only Token Owner Allowed"
        );
        delete listings[contractAddress][tokenId];
    }
}
