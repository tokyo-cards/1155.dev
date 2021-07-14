/* libraries used */
/* eslint no-underscore-dangle: 0 */

const { expect, assert } = require('chai');
const { ethers } = require('hardhat'); // eslint-disable-line
const { MockProvider } = require('ethereum-waffle'); // eslint-disable-line
const { signMetaTransaction } = require('./utils/signMetaTransaction');

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

    it('should not allow the token creator to set creator to 0x0',
      () => {
        expect(
          instance.connect(creator).setCreator(
            vals.ADDRESS_ZERO,
            [INITIAL_TOKEN_ID],
          ),
        ).to.be.revertedWith('ERC1155Tradable#setCreator: INVALID_ADDRESS.');
      });

    it('should not allow a non-token-creator to set creator',
      // Check both a user and the owner of the contract
      async () => {
        await expect(
          instance.connect(userA).setCreator(
            userA.address, [INITIAL_TOKEN_ID],
          ),
        ).to.be.revertedWith('ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED');
        await expect(
          instance.connect(owner).setCreator(
            owner.address, [INITIAL_TOKEN_ID],
          ),
        ).to.be.revertedWith('ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED');
      });
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

    it('should not overflow token balances',
      () => {
        return expect(
          instance.connect(creator).batchMint(
            userA.address,
            [INITIAL_TOKEN_ID],
            [OVERFLOW_NUMBER],
            '0x00',
          ),
        ).to.be.reverted;
      });

    it('should require that caller has permission to mint each token',
      async () => {
        await expect(
          instance
            .connect(userB)
            .batchMint(userA.address, [INITIAL_TOKEN_ID], [MINT_AMOUNT], '0x00'),
        ).to.be.revertedWith('ERC1155Tradable#batchMint: ONLY_CREATOR_ALLOWED');
      });
  });

  describe('#uri()', () => {
    it('should return the uri that supports the substitution method', async () => {
      const uriTokenId = 1;
      const uri = await instance.uri(uriTokenId);
      assert.equal(uri, `${vals.URI_BASE}`);
    });

    it('should not return the uri for a non-existent token',
      async () => {
        expect(instance.uri(NON_EXISTENT_TOKEN_ID)).to.be.revertedWith('NONEXISTENT_TOKEN');
      });
  });

  describe('#setURI()', () => {
    const newUri = 'https://newuri.com/{id}';
    it('should allow the owner to set the url', async () => {
      assert.isOk(await instance.connect(owner).setURI(newUri));
      const uriTokenId = 1;
      const uri = await instance.uri(uriTokenId);
      assert.equal(uri, newUri);
    });

    it('should not allow non-owner to set the url', async () => {
      expect(instance.connect(userA).setURI(newUri)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('#setCustomURI()', () => {
    const customUri = 'https://customuri.com/metadata';
    it('should allow the creator to set the custom uri of a token', async () => {
      tokenId += 1;
      await instance.connect(owner).create(owner.address, tokenId, 0, '', '0x00');
      assert.isOk(await instance.connect(owner).setCustomURI(tokenId, customUri));
      const uri = await instance.uri(tokenId);
      assert.equal(uri, customUri);
    });

    it('should not allow non-creator to set the custom url of a token', async () => {
      tokenId += 1;
      await instance.connect(owner).create(owner.address, tokenId, 0, '', '0x00');
      expect(instance.connect(userB).setCustomURI(tokenId, customUri)).to.be.reverted; // eslint-disable-line
    });
  });

  describe('#isApprovedForAll()', () => {
    it('should approve proxy address as _operator', async () => {
      assert.isOk(
        await instance.isApprovedForAll(owner.address, proxyForOwner.address),
      );
    });

    it('should not approve non-proxy address as _operator', async () => {
      assert.isNotOk(
        await instance.isApprovedForAll(owner.address, userB.address),
      );
    });

    it('should reject proxy as _operator for non-owner _owner', async () => {
      assert.isNotOk(
        await instance.isApprovedForAll(userA.address, proxyForOwner.address),
      );
    });

    it('should accept approved _operator for _owner', async () => {
      await instance.connect(userA).setApprovalForAll(userB.address, true);
      assert.isOk(await instance.isApprovedForAll(userA.address, userB.address));
      // Reset it here
      await instance.connect(userA).setApprovalForAll(userB.address, false);
    });

    it('should not accept non-approved _operator for _owner', async () => {
      await instance.connect(userA).setApprovalForAll(userB.address, false);
      assert.isNotOk(await instance.isApprovedForAll(userA.address, userB.address));
    });
  });

  describe('#executeMetaTransaction()', () => {
    it('should allow calling setApprovalForAll with a meta transaction', async () => {
      const wallet = new MockProvider().createEmptyWallet();
      const user = await wallet.getAddress();

      const name = await instance.name();
      const nonce = await instance.getNonce(user);
      const version = await instance.ERC712_VERSION();
      const chainId = await instance.getChainId();
      const domainData = {
        name,
        version,
        verifyingContract: instance.address,
        salt: `0x${ethers.utils.hexValue(chainId).substring(2).padStart(64, '0')}`,
      };
      /*
      const functionSignature = await web3ERC1155
        .methods.setApprovalForAll(approvedContract.address, true).encodeABI();

      const { r, s, v } = await signMetaTransaction(
        wallet,
        nonce,
        domainData,
        functionSignature,
      );

      assert.equal(await instance.isApprovedForAll(user, approvedContract.address), false);
      truffleAssert.eventEmitted(
        await instance.executeMetaTransaction(
          user,
          functionSignature,
          r,
          s,
          v,
        ),
        'ApprovalForAll',
        {
          account: user,
          operator: approvedContract.address,
          approved: true,
        },
      );
      assert.equal(await instance.isApprovedForAll(user, approvedContract.address), true);
      */
    });
  });
});
