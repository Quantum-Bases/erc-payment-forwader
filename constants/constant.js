const config = require("../config");

const constant = {
  name: {
    minLength: 3,
    maxLength: 20,
  },

  otpType: {
    signupOtp: "signupOtp",
    updateOtp: "updateOtp",
    withdrawOtp: "withdrawOtp",
    transferOtp: "transferOtp",
  },
  transactionType: {
    transfer: "transfer",
    withdraw: "withdraw",
    deposit: "deposit",
  },
  CHAIN_NAME: {
    ETH: "ETH",
    MATIC: "MATIC",
    XLM: "XLM",
    TOKEN: "SST",
  },
  tableName: {
    wallets: "user_wallets",
    nftMinting: "nft_minting",
    transactions: "transactions",
    otp: "otp",
    users: "users",
    admins: "admins",
    projects: "projects",
  },
  otpTokenLength: {
    minLength: 6,
    maxLength: 6,
  },
  website_info: {
    custodialWallet: "Custodial wallet",
  },
  otpType: {
    signupOtp: "signupOtp",
    updateOtp: "updateOtp",
    withdrawOtp: "withdrawOtp",
    transferOtp: "transferOtp",
  },
  transactionType: {
    transfer: "transfer",
    withdraw: "withdraw",
    deposit: "deposit",
  },
  CHAIN_NAME: {
    ETH: "ETH",
    MATIC: "MATIC",
    XLM: "XLM",
    TOKEN:"SST"
  },
  pagination: {
    defaultPageNumber: 1,
    defaultPageSize: 15,
    transactionLimit: 5,
  },
  tokenName: "SST",
};

module.exports = constant;
