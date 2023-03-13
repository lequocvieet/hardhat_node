const { env } = require("process");

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.5.16",
        settings: {},
      },
      {
        version: "0.8.9",
        settings: {},
      },

      {
        version: "0.6.6",
        settings: {},
      },
      {
        version: "0.5.10",
        settings: {},
      },
      {
        version: "0.4.0",
        settings: {},
      },
      {
        version: "0.4.23",
        settings: {},
      },
      {
        version: "0.6.12",
        settings: {},
      },
      {
        version: "0.5.12",
        settings: {},
      },
      {
        version: "0.8.0",
        settings: {},
      },
      {
        version: "0.6.4",
        settings: {},
      },
    ],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/2e5775eb41aa490991bff9eb183e1122',
      accounts: ["0a6bbab2d0fb0d7b049ae0d8de395f4cfe9c3783ad302c56f21676fcc34f4fbe"]
    },
    ganache: {
      url: "HTTP://127.0.0.1:8545",
      accounts: [
        `0x675d8f21fdbb66b5684b3aee6ee3fc2630bf34530a0ebe3a3f0e4eead7822edb`,
        '0xfb0afaa2825b8e3a1df7150c00e2dc0dc3bb2b0d1fc2fe9c9ba609822dfad0b3',
        '0xcde1a6eab979c4ef0628e552f2d3db044a85017d3361f599e9b8b0d2acb8e1d3',
        '0xd9241f4a5fe9dcfe6bc7f9052fc7b31d71d8538db404544a98da693769448a67',

      ],
      allowUnlimitedContractSize: true
    }
  },
};
