// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract ERC1155Swap {
    using Counters for Counters.Counter;

    enum NFTType {
        ERC721,
        ERC1155,
        OTHER
    }

    Counters.Counter private _swapIdCounter;

    bytes4 private constant _InterfaceId_ERC721 = 0x80ac58cd;
    bytes4 private constant _InterfaceId_ERC1155 = 0xd9b67a26;

    struct Swap {
        address owner;
        address contract1Address;
        uint256 token1;
        NFTType type1;
        address contract2Address;
        uint256 token2;
        NFTType type2;
        bool done;
    }

    mapping(uint256 => Swap) public swaps;

    event SwapCreated(
        uint256 id,
        address owner,
        address contract1Address,
        uint256 token1,
        NFTType type1,
        address contract2Address,
        uint256 token2,
        NFTType type2
    );

    event SwapExecuted(uint256 id, address counterParty);

    event SwapCancelled(uint256 id);

    function createSwap(
        address contract1Address,
        uint256 token1,
        address contract2Address,
        uint256 token2
    ) public returns (uint256) {
        NFTType type1 = _getType(contract1Address);
        NFTType type2 = _getType(contract2Address);
        require(
            type1 != NFTType.OTHER && type2 != NFTType.OTHER,
            "These contracts are not supported"
        );
        string memory validationError = _validateTokenOwner(
            msg.sender,
            contract1Address,
            token1,
            type1
        );
        require(
            keccak256(abi.encodePacked(validationError)) ==
                keccak256(abi.encodePacked("")),
            validationError
        );
        uint256 swapId = _swapIdCounter.current();
        swaps[swapId] = Swap(
            msg.sender,
            contract1Address,
            token1,
            type1,
            contract2Address,
            token2,
            type2,
            false
        );
        emit SwapCreated(
            swapId,
            msg.sender,
            contract1Address,
            token1,
            type1,
            contract2Address,
            token2,
            type2
        );
        _swapIdCounter.increment();
        return swapId;
    }

    function executeSwap(
        uint256 swapId,
        address contract1Address,
        uint256 token1,
        address contract2Address,
        uint256 token2
    ) public {
        require(
            swapId < _swapIdCounter.current(),
            "This Swap is never created"
        );
        Swap memory swap = swaps[swapId];
        require(!swap.done, "Swap not Valid");
        bool isValid = swap.contract1Address == contract2Address &&
            swap.token1 == token2 &&
            swap.contract2Address == contract1Address &&
            swap.token2 == token1;
        require(isValid, "Details Mismatch");
        string memory validationError = _validateTokenOwner(
            msg.sender,
            contract1Address,
            token1,
            swap.type2
        );
        require(
            keccak256(abi.encodePacked(validationError)) ==
                keccak256(abi.encodePacked("")),
            validationError
        );
        string memory validationError2 = _validateTokenOwner(
            swap.owner,
            swap.contract1Address,
            swap.token1,
            swap.type1
        );
        if (
            keccak256(abi.encodePacked(validationError2)) !=
            keccak256(abi.encodePacked(""))
        ) {
            swaps[swapId].done = true;
            emit SwapCancelled(swapId);
            require(false, "Swap not Valid");
        }
        _transferToken(
            swap.contract1Address,
            swap.token1,
            swap.owner,
            msg.sender,
            swap.type1
        );
        _transferToken(
            swap.contract2Address,
            swap.token2,
            msg.sender,
            swap.owner,
            swap.type2
        );
        swaps[swapId].done = true;
        emit SwapExecuted(swapId, msg.sender);
    }

    function cancelSwap(uint256 swapId) public {
        require(
            msg.sender == swaps[swapId].owner,
            "Only swap owner can cancel it"
        );
        swaps[swapId].done = true;
        emit SwapCancelled(swapId);
    }

    function _getType(address contractAddress) internal view returns (NFTType) {
        IERC165 nftContract = IERC165(contractAddress);
        if (nftContract.supportsInterface(_InterfaceId_ERC721)) {
            return NFTType.ERC721;
        } else if (nftContract.supportsInterface(_InterfaceId_ERC1155)) {
            return NFTType.ERC1155;
        } else {
            return NFTType.OTHER;
        }
    }

    function _validateTokenOwner(
        address owner,
        address contractAddress,
        uint256 tokenId,
        NFTType tokenType
    ) internal view returns (string memory) {
        if (tokenType == NFTType.ERC721) {
            IERC721 tokenContract = IERC721(contractAddress);
            if (tokenContract.ownerOf(tokenId) != owner) {
                return "You Don't Own This Token";
            }
            if (tokenContract.getApproved(tokenId) != address(this)) {
                return "You Have Not Approved This Contract For This Token";
            }
        } else if (tokenType == NFTType.ERC1155) {
            IERC1155 tokenContract = IERC1155(contractAddress);
            if (tokenContract.balanceOf(owner, tokenId) == 0) {
                return "You Don't Own This Token";
            }
            if (!tokenContract.isApprovedForAll(owner, address(this))) {
                return "You Have Not Approved This Contract For This Token";
            }
        }
        return "";
    }

    function _transferToken(
        address contractAddress,
        uint256 tokenId,
        address from,
        address to,
        NFTType tokenType
    ) internal {
        if (tokenType == NFTType.ERC721) {
            IERC721 tokenContract = IERC721(contractAddress);
            tokenContract.transferFrom(from, to, tokenId);
        } else if (tokenType == NFTType.ERC1155) {
            IERC1155 tokenContract = IERC1155(contractAddress);
            tokenContract.safeTransferFrom(from, to, tokenId, 1, "");
        }
    }
}
