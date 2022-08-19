# Welcome to the Gallion Contracts!

Gallion brings together a set of tools for the management and animation of Discord guilds in the world of web3 games.

This repository contains all contracts used by guilds. These contracts are powered by the ERC20, ERC721 and ERC1155 standards. The contracts also implement the [EIP-2535 Diamonds](https://github.com/ethereum/EIPs/issues/2535) standard, which allows for modular upgradeability.

* Gallion Discord: https://discord.gg/y6xPxvRmhD

## Deployed Contract Addresses

Gallion is not yet born, but it will appear on the Polygon sidechain.

* Polygon Diamond Address: `Coming soon!`

## Resources

* Official gitbook: `Coming soon!`

* Louper Dev Diamond Explorer: `Coming soon!`

* EIP2535 Primer: https://eips.ethereum.org/EIPS/eip-2535

## Devs section

**Note:** The loupe functions in DiamondLoupeFacet.sol MUST be added to a diamond and are required by the EIP-2535 Diamonds standard.

**Note:** In this implementation the loupe functions are NOT gas optimized. The `facets`, `facetFunctionSelectors`, `facetAddresses` loupe functions are not meant to be called on-chain and may use too much gas or run out of gas when called in on-chain transactions. In this implementation these functions should be called by off-chain software like websites and Javascript libraries etc., where gas costs do not matter.


### Installation

1. Clone this repo:
```console
git clone git@github.com:gallion-labs/gallion-contracts.git
```

2. Install NPM packages:
```console
cd gallion-contracts
yarn
```

### Deployment

```console
npx hardhat run scripts/deploy.js
```

### Run tests:
```console
npx hardhat test
```

### Calling Diamond Functions

In order to call a function that exists in a diamond you need to use the ABI information of the facet that has the function.

Here is an example that uses web3.js:

```javascript
let myUsefulFacet = new web3.eth.Contract(MyUsefulFacet.abi, diamondAddress);
```

In the code above we create a contract variable so we can call contract functions with it.

In this example we know we will use a diamond because we pass a diamond's address as the second argument. But we are using an ABI from the MyUsefulFacet facet so we can call functions that are defined in that facet. MyUsefulFacet's functions must have been added to the diamond (using diamondCut) in order for the diamond to use the function information provided by the ABI of course.

Similarly you need to use the ABI of a facet in Solidity code in order to call functions from a diamond. Here's an example of Solidity code that calls a function from a diamond:

```solidity
string result = MyUsefulFacet(address(diamondContract)).getResult()
```
