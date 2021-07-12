// /* Contracts in this test */
// const { expect } = require("chai");
// 
// describe("#constructor()", () => {
//   it('should set the contractURI to the supplied value', async () => {
//     const URI_BASE = 'https://creatures-api.opensea.io';
//     const CONTRACT_URI = `${URI_BASE}/contract/opensea-erc1155`;
//     const DivaItem = await ethers.getContractFactory("DivaItem");
//     const divaItem = await DivaItem.deploy();
//     await divaItem.deployed();
//     expect(await divaItem.contractURI()).to.equal(CONTRACT_URI);
//   });
// })

// const DivaItem = artifacts.require(
//   "../contracts/DivaItem.sol"
// );
// 
// 
// contract("DivaItem", (accounts) => {
//   const URI_BASE = 'https://creatures-api.opensea.io';
//   const CONTRACT_URI = `${URI_BASE}/contract/opensea-erc1155`;
//   let divaItem;
// 
//   before(async () => {
//     divaItem = await DivaItem.deployed();
//   });
// 
//   // This is all we test for now
// 
//   // This also tests contractURI()
// 
//   describe('#constructor()', () => {
//     it('should set the contractURI to the supplied value', async () => {
//       assert.equal(await divaItem.contractURI(), CONTRACT_URI);
//     });
//   });
// });
