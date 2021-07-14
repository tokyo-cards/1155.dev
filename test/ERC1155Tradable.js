/* libraries used */
/* eslint no-underscore-dangle: 0 */

const { expect, assert } = require('chai');
const { ethers } = require('hardhat'); // eslint-disable-line

const vals = require('../lib/testValuesCommon');

/* Useful aliases */
const toBN = ethers.BigNumber.from;

/* Consts */
const NAME = 'ERC-1155 Test Contract';
const SYMBOL = 'ERC1155Test';

const INITIAL_TOKEN_ID = 1;
const NON_EXISTENT_TOKEN_ID = 99999999;
const MINT_AMOUNT = toBN(100);
const OVERFLOW_NUMBER = toBN(2, 10).pow(toBN(256, 10)).sub(toBN(1, 10));

let instance;
let proxy;
let approvedContract;

/* Accounts */
let owner;
let creator;
let userA;
let userB;
let proxyForOwner;
let _others; // eslint-disable-line

// Keep track of token ids as we progress through the tests, rather than
// hardcoding numbers that we will have to change if we add/move tests.
// For example if test A assumes that it will create token ID 1 and test B
// assumes that it will create token 2, changing test A later so that it
// creates another token will break this as test B will now create token ID 3.
// Doing this avoids this scenario.
let tokenId = 0;

// Because we need to deploy and use a mock ProxyRegistry, we deploy our own
// instance of ERC1155Tradable instead of using the one that Truffle deployed.
describe('ERC1155Tradable - ERC 1155', () => {
  before(async () => {
    /* Contracts in this test */
    const ERC1155Tradable = await ethers.getContractFactory('ERC1155Tradable');
    const MockProxyRegistry = await ethers.getContractFactory('MockProxyRegistry');
    const ApprovedSpenderContract = await ethers.getContractFactory('ApprovedSpenderContract');

    /* Defining Accounts */
    [owner, creator, userA, userB, proxyForOwner, ..._others] = await ethers.getSigners();

    proxy = await MockProxyRegistry.deploy();
    await proxy.setProxy(owner.address, proxyForOwner.address);
    instance = await ERC1155Tradable.deploy(NAME, SYMBOL, vals.URI_BASE, proxy.address);
    approvedContract = await ApprovedSpenderContract.deploy();
  });

  describe('#constructor()', () => {
    it('should set the token name, symbol, and URI', async () => {
      const name = await instance.name();
      assert.equal(name, NAME);
      const symbol = await instance.symbol();
      assert.equal(symbol, SYMBOL);
      // We cannot check the proxyRegistryAddress as there is no accessor for it
    });
  });

  describe('#create()', () => {
    it('should allow the contract owner to create tokens with zero supply',
      async () => {
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, 0, '', '0x00'),
        ).to.emit(instance, 'TransferSingle').withArgs(
          owner.address,
          vals.ADDRESS_ZERO,
          owner.address,
          toBN(tokenId),
          toBN(0),
        );
        const supply = await instance.tokenSupply(tokenId);
        assert.ok(supply.eq(toBN(0)));
      });

    it('should allow the contract owner to create tokens with initial supply',
      async () => {
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, MINT_AMOUNT, '', '0x00'),
        ).to.emit(instance, 'TransferSingle').withArgs(
          owner.address,
          vals.ADDRESS_ZERO,
          owner.address,
          toBN(tokenId),
          MINT_AMOUNT,
        );
        const supply = await instance.tokenSupply(tokenId);
        assert.ok(supply.eq(MINT_AMOUNT));
      });

    // We check some of this in the other create() tests but this makes it
    // explicit and is more thorough.
    it('should set tokenSupply on creation',
      async () => {
        tokenId += 1;
        const tokenSupply = 33;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, tokenSupply, '', '0x00'),
        ).to.emit(instance, 'TransferSingle').withArgs(
          owner.address,
          vals.ADDRESS_ZERO,
          owner.address,
          toBN(tokenId),
          tokenSupply,
        );
        const balance = await instance.balanceOf(owner.address, tokenId);
        assert.ok(balance.eq(toBN(tokenSupply)));
        const supply = await instance.tokenSupply(tokenId);
        assert.ok(supply.eq(toBN(tokenSupply)));
        assert.ok(supply.eq(balance));
      });

    it('should increment the token type id',
      async () => {
        // We can't check this with an accessor, so we make an explicit check
        // that it increases in consecutive creates() using the value emitted
        // in their events.
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, 0, '', '0x00'),
        ).to.emit(instance, 'TransferSingle').withArgs(
          owner.address,
          vals.ADDRESS_ZERO,
          owner.address,
          toBN(tokenId),
          toBN(0),
        );
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, 0, '', '0x00'),
        ).to.emit(instance, 'TransferSingle').withArgs(
          owner.address,
          vals.ADDRESS_ZERO,
          owner.address,
          toBN(tokenId),
          toBN(0),
        );
      });

    it('should not allow a non-owner to create tokens',
      async () => {
        tokenId += 1;
        await expect(
          instance
            .connect(userA)
            .create(userA.address, tokenId, 0, '', '0x00'),
        ).to.be.revertedWith('caller is not the owner');
      });

    it('should allow the contract owner to create tokens and emit a URI',
      async () => {
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, 0, vals.URI_BASE, '0x00'),
        ).to.emit(instance, 'URI').withArgs(vals.URI_BASE, toBN(tokenId));
      });

    it('should not emit a URI if none is passed',
      async () => {
        tokenId += 1;
        await expect(
          instance
            .connect(owner)
            .create(owner.address, tokenId, 0, '', '0x00'),
        ).to.not.emit(instance, 'URI');
      });
  });

  describe('#totalSupply()', () => {
    it('should return correct value for token supply',
      async () => {
        tokenId += 1;
        await instance.connect(owner).create(owner.address, tokenId, MINT_AMOUNT, '', '0x00');
        const balance = await instance.balanceOf(owner.address, tokenId);
        assert.ok(balance.eq(MINT_AMOUNT));
        // Use the created getter for the map
        const supplyGetterValue = await instance.tokenSupply(tokenId);
        assert.ok(supplyGetterValue.eq(MINT_AMOUNT));
        // Use the hand-crafted accessor
        const supplyAccessorValue = await instance.totalSupply(tokenId);
        assert.ok(supplyAccessorValue.eq(MINT_AMOUNT));

        // Make explicitly sure everything mateches
        assert.ok(supplyGetterValue.eq(balance));
        assert.ok(supplyAccessorValue.eq(balance));
      });

    it('should return zero for non-existent token',
      async () => {
        const balanceValue = await instance.balanceOf(
          owner.address,
          NON_EXISTENT_TOKEN_ID,
        );
        assert.ok(balanceValue.eq(toBN(0)));
        const supplyAccessorValue = await instance.totalSupply(
          NON_EXISTENT_TOKEN_ID,
        );
        assert.ok(supplyAccessorValue.eq(toBN(0)));
      });
  });

  describe('#setCreator()', () => {
    it('should allow the token creator to set creator to another address',
      async () => {
        await instance.connect(owner).setCreator(userA.address, [INITIAL_TOKEN_ID]);
        const tokenCreator = await instance.creators(INITIAL_TOKEN_ID);
        assert.equal(tokenCreator, userA.address);
      });

    it('should allow the new creator to set creator to another address',
      async () => {
        await instance.connect(userA).setCreator(creator.address, [INITIAL_TOKEN_ID]);
        const tokenCreator = await instance.creators(INITIAL_TOKEN_ID);
        assert.equal(tokenCreator, creator.address);
      });

    // it('should not allow the token creator to set creator to 0x0',
    //   () => truffleAssert.fails(
    //     instance.setCreator(
    //       vals.ADDRESS_ZERO,
    //       [INITIAL_TOKEN_ID],
    //       { from: creator },
    //     ),
    //     truffleAssert.ErrorType.revert,
    //     'ERC1155Tradable#setCreator: INVALID_ADDRESS.',
    //   ));

    // it('should not allow a non-token-creator to set creator',
    //   // Check both a user and the owner of the contract
    //   async () => {
    //     await truffleAssert.fails(
    //       instance.setCreator(userA, [INITIAL_TOKEN_ID], { from: userA }),
    //       truffleAssert.ErrorType.revert,
    //       'ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED',
    //     );
    //     await truffleAssert.fails(
    //       instance.setCreator(owner, [INITIAL_TOKEN_ID], { from: owner }),
    //       truffleAssert.ErrorType.revert,
    //       'ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED',
    //     );
    //   });
  });

  describe('#mint()', () => {
    it('should allow creator to mint tokens',
      async () => {
        await instance
          .connect(creator)
          .mint(userA.address, INITIAL_TOKEN_ID, MINT_AMOUNT, '0x00');
        const supply = await instance.totalSupply(INITIAL_TOKEN_ID);
        assert.isOk(supply.eq(MINT_AMOUNT));
      });

    it('should update token totalSupply when minting', async () => {
      let supply = await instance.totalSupply(INITIAL_TOKEN_ID);
      assert.isOk(supply.eq(MINT_AMOUNT));
      await instance
        .connect(creator)
        .mint(userA.address, INITIAL_TOKEN_ID, MINT_AMOUNT, '0x00');
      supply = await instance.totalSupply(INITIAL_TOKEN_ID);
      assert.isOk(supply.eq(MINT_AMOUNT.mul(toBN(2))));
    });

    it('should not overflow token balances',
      async () => {
        const supply = await instance.totalSupply(INITIAL_TOKEN_ID);
        assert.isOk(supply.eq(MINT_AMOUNT.add(MINT_AMOUNT)));
        await expect(
          instance
            .connect(creator)
            .mint(userB.address, INITIAL_TOKEN_ID, OVERFLOW_NUMBER, '0x00'),
        ).to.be.revertedWith('revert');
      });
  });

  describe('#batchMint()', () => {
    it('should correctly set totalSupply',
      async () => {
        await instance.connect(creator).batchMint(
          userA.address,
          [INITIAL_TOKEN_ID],
          [MINT_AMOUNT],
          '0x00',
        );
        const supply = await instance.totalSupply(INITIAL_TOKEN_ID);
        assert.isOk(
          supply.eq(MINT_AMOUNT.mul(toBN(3))),
        );
      });
  });
});
