/* libraries used */
/* eslint no-underscore-dangle: 0 */

const { expect, assert } = require('chai');
const { ethers } = require('hardhat'); // eslint-disable-line

const setup = require('../lib/setupItems');
const vals = require('../lib/valuesCommon');
const testVals = require('../lib/testValuesCommon');

/* Useful aliases */
const toBN = ethers.BigNumber.from;
