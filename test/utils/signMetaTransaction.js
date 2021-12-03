const ethUtils = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

const domainType = [
  {
    name: "name",
    type: "string",
  },
  {
    name: "version",
    type: "string",
  },
  {
    name: "verifyingContract",
    type: "address",
  },
  {
    name: "salt",
    type: "bytes32",
  },
];

const metaTransactionType = [
  {
    name: "nonce",
    type: "uint256",
  },
  {
    name: "from",
    type: "address",
  },
  {
    name: "functionSignature",
    type: "bytes",
  },
];

const signMetaTransaction = async (wallet, nonce, domainData, functionSignature) => {
  const message = {};
  message.nonce = parseInt(nonce, 16);
  message.from = await wallet.getAddress();
  message.functionSignature = functionSignature;

  const dataToSign = {
    types: {
      EIP712Domain: domainType,
      MetaTransaction: metaTransactionType,
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message,
  };

  const signature = sigUtil.signTypedData(
    ethUtils.toBuffer(wallet.privateKey),
    { data: dataToSign },
  );

  const r = signature.slice(0, 66);
  const s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = parseInt(v, 16);
  if (![27, 28].includes(v)) v += 27;

  return {
    r,
    s,
    v,
  };
};

module.exports = {
  signMetaTransaction,
};
