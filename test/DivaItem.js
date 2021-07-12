// /* Contracts in this test */
const { expect } = require('chai');
const { ethers } = require('hardhat'); // eslint-disable-line

const URI_BASE = 'https://creatures-api.opensea.io';
const CONTRACT_URI = `${URI_BASE}/contract/opensea-erc1155`;

let divaItem;
let DivaItem;
let MockProxyRegistry;
let owner;
let proxyForOwner;
let proxy;
let _others; // eslint-disable-line

describe('#constructor()', () => {
  before(async () => {
    MockProxyRegistry = await ethers.getContractFactory('MockProxyRegistry');
    DivaItem = await ethers.getContractFactory('DivaItem');

    const accounts = await ethers.getSigners();
    [owner, proxyForOwner, ..._others] = accounts;

    proxy = await MockProxyRegistry.deploy();
    await proxy.setProxy(owner.address, proxyForOwner.address);
    divaItem = await DivaItem.deploy(proxy.address);
  });

  it('should set the contractURI to the supplied value', async () => {
    await divaItem.deployed();
    expect(await divaItem.contractURI()).to.equal(CONTRACT_URI);
  });
});
