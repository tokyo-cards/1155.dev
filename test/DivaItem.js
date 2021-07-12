// /* Contracts in this test */
const { expect } = require("chai");

const URI_BASE = 'https://creatures-api.opensea.io';
const CONTRACT_URI = `${URI_BASE}/contract/opensea-erc1155`;

let divaItem, DivaItem, MockProxyRegistry;
let owner, proxyForOwner;

describe("#constructor()", () => {
  before(async ()=> {
    MockProxyRegistry = await ethers.getContractFactory("MockProxyRegistry");
    DivaItem = await ethers.getContractFactory("DivaItem");

    let accounts = await ethers.getSigners();
    owner = accounts[0];
    proxyForOwner = accounts[8];

    proxy = await MockProxyRegistry.deploy();
    await proxy.setProxy(owner.address, proxyForOwner.address);
    divaItem = await DivaItem.deploy(proxy.address);

  });

  it('should set the contractURI to the supplied value', async () => {
    await divaItem.deployed();
    expect(await divaItem.contractURI()).to.equal(CONTRACT_URI);
  });
})
