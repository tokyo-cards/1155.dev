/* libraries used */

// const truffleAssert = require('truffle-assertions');
const { expect, assert } = require("chai");
const { Wallet, Contract } = require("ethers");
const { loadFixture, deployContract, MockProvider } = require("ethereum-waffle");

const setup = require('../lib/setupItems.js');
const testVals = require('../lib/testValuesCommon.js');
const vals = require('../lib/valuesCommon.js');

/* Useful aliases */
const toBN = ethers.BigNumber.from;


/* Utilities */
const toTokenId = optionId => optionId;

const TOTAL_OPTIONS = 9;
let creatureAccessory;
let myFactory;
let myLootBox;
let attacker;
let proxy;

describe('DivaItemFactory', () => {
  let owner, userA, userB, proxyForOwner;

  // To install the proxy mock and the attack contract we deploy our own
  // instances of all the classes here rather than using the ones that Truffle
  // deployed.
  before(async () => {

    /* Contracts in this test */
    const LootBoxRandomness = await ethers.getContractFactory("LootBoxRandomness");
    let lootBoxRandomness = await LootBoxRandomness.deploy();

    const MockProxyRegistry = await ethers.getContractFactory("MockProxyRegistry");
    const DivaItem = await ethers.getContractFactory("DivaItem");
    const DivaItemFactory = await ethers.getContractFactory("DivaItemFactory");
    const TestForReentrancyAttack = await ethers.getContractFactory("TestForReentrancyAttack");
    const DivaItemLootBox = await ethers.getContractFactory("DivaItemLootBox", { 
      libraries: { LootBoxRandomness: lootBoxRandomness.address },
    });

    /* Defining Accounts */
    let accounts = await ethers.getSigners();
    owner = accounts[0];
    userA = accounts[1];
    userB = accounts[2];
    proxyForOwner = accounts[8];
    
    proxy = await MockProxyRegistry.deploy();
    await proxy.setProxy(owner.address, proxyForOwner.address);
    creatureAccessory = await DivaItem.deploy(proxy.address);
    myLootBox = await DivaItemLootBox.deploy(proxy.address);
    myFactory = await DivaItemFactory.deploy(
      proxy.address,
      creatureAccessory.address,
      myLootBox.address
    );
    attacker = await TestForReentrancyAttack.deploy();
    await attacker.setFactoryAddress(myFactory.address);
    await setup.setupCreatureAccessories(
      creatureAccessory,
      myFactory,
      myLootBox,
      owner.address
    );
  });

  // This also tests the proxyRegistryAddress and lootBoxAddress accessors.
  describe('#constructor()', () => {
    it('should set proxyRegistryAddress to the supplied value', async () => {
      expect(await myFactory.proxyRegistryAddress()).to.equal(proxy.address);
      expect(await myFactory.lootBoxAddress()).to.equal(myLootBox.address);
    });
  });

  describe('#name()', () => {
    it('should return the correct name', async () => {
      expect(
        await myFactory.name()).to.equal(
          'OpenSea Creature Accessory Pre-Sale'
        );
    });
  });
 
  describe('#symbol()', () => {
    it('should return the correct symbol', async () => {
      expect(await myFactory.symbol()).to.equal(
        'OSCAP'
      );
    });
  });
 
  describe('#supportsFactoryInterface()', () => {
    it('should return true', async () => {
      assert.isOk(await myFactory.supportsFactoryInterface());
    });
  });
 
  describe('#factorySchemaName()', () => {
    it('should return the schema name', async () => {
      assert.equal(await myFactory.factorySchemaName(), 'ERC1155');
    });
  });
 
  describe('#numOptions()', () => {
    it('should return the correct number of options', async () => {
      assert.equal(await myFactory.numOptions(), TOTAL_OPTIONS);
    });
  });
 
  //NOTE: We test this early relative to its place in the source code as we
  //      mint tokens that we rely on the existence of in later tests here.
  
  describe('#mint()', () => {
    it('should not allow non-owner or non-operator to mint', async () => {
      await expect(
        myFactory
          .connect(userA)
          .mint(vals.CLASS_COMMON, userA.address, 1000, "0x00"))
        .to.be.revertedWith('DivaItemFactory#_mint: CANNOT_MINT_MORE')
    });

    it('should allow owner to mint', async () => {
      const quantity = toBN(10);
      await myFactory
        .connect(owner)
        .mint(
          vals.CLASS_COMMON,
          userA.address,
          quantity,
          "0x00"
        );
      // Check that the recipient got the correct quantity
      // Token numbers are one higher than option numbers
      const balanceUserA = await creatureAccessory.balanceOf(
        userA.address,
        toTokenId(vals.CLASS_COMMON)
      );
      assert.isOk(balanceUserA.eq(quantity));
      // Check that balance is correct
      const balanceOf = await myFactory.balanceOf(owner.address, vals.CLASS_COMMON);
      assert.isOk(balanceOf.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(quantity)));
      // Check that total supply is correct
      const premintedRemaining = await creatureAccessory.balanceOf(
        owner.address,
        toTokenId(vals.CLASS_COMMON)
      );
      assert.isOk(premintedRemaining.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(quantity)));
    });

    it('should allow proxy to mint', async () => {
      const quantity = toBN(100);
      //FIXME: move all quantities to top level constants
      const total = toBN(110);
      await myFactory
        .connect(proxyForOwner)
        .mint(
          vals.CLASS_COMMON,
          userA.address,
          quantity,
          "0x00"
        );
      // Check that the recipient got the correct quantity
      const balanceUserA = await creatureAccessory.balanceOf(
        userA.address,
        toTokenId(vals.CLASS_COMMON)
      );

      assert.isOk(balanceUserA.eq(total));

      // Check that balance is correct
      const balanceOf = await myFactory.balanceOf(owner.address, vals.CLASS_COMMON);
      assert.isOk(balanceOf.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(total)));
      // Check that total supply is correct
      const premintedRemaining = await creatureAccessory.balanceOf(
        owner.address,
        toTokenId(vals.CLASS_COMMON)
      );
      assert.isOk(premintedRemaining.eq(toBN(vals.MINT_INITIAL_SUPPLY).sub(total)));
    });

  });


  /**
   * NOTE: This check is difficult to test in a development
   * environment, due to the OwnableDelegateProxy. To get around
   * this, in order to test this function below, you'll need to:
   *
   * 1. go to DivaItemFactory.sol, and
   * 2. modify _isOwnerOrProxy
   *
   * --> Modification is:
   *      comment out
   *         return owner() == _address || address(proxyRegistry.proxies(owner())) == _address;
   *      replace with
   *         return true;
   * Then run, you'll get the reentrant error, which passes the test
   **/

  describe('Re-Entrancy Check', () => {
    it('Should have the correct factory address set',
       async () => {
         assert.equal(await attacker.factoryAddress(), myFactory.address);
       });

    // With unmodified code, this fails with:
    //   DivaItemFactory#_mint: CANNOT_MINT_MORE
    // which is the correct behavior (no reentrancy) for the wrong reason
    // (the attacker is not the owner or proxy).

    xit('Minting from factory should disallow re-entrancy attack',
       async () => {
         await truffleAssert.passes(
           myFactory.mint(1, userA, 1, "0x0", { from: owner })
         );
         await truffleAssert.passes(
           myFactory.mint(1, userA, 1, "0x0", { from: userA })
         );
         await truffleAssert.fails(
           myFactory.mint(
             1,
             attacker.address,
             1,
             "0x0",
             { from: attacker.address }
           ),
           truffleAssert.ErrorType.revert,
           'ReentrancyGuard: reentrant call'
         );
       });
  });

});



