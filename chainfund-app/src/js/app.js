var App = {
  web3: null,
  contracts: {},
  chainFundERC1155Address: "0x21a5A4819e2D6C3052b5606C12A03794C880a2Dc",
  batchaddress:"0x3Ffae30038a2c8161803AaB7397D6fe8C92614Ca",
  currentAccount: null,

  init: async function() {
      return await App.initWeb3();
  },

  initWeb3: async function() {
      if (window.ethereum) {
          App.web3 = new Web3(window.ethereum);
          try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              App.currentAccount = (await App.web3.eth.getAccounts())[0];
              App.updateUIForAccountChange();
              window.ethereum.on('accountsChanged', function(accounts) {
                  App.currentAccount = accounts[0];
                  App.updateUIForAccountChange();
              });
          } catch (error) {
              console.error("User denied account access");
              toastr.error("User denied account access");
          }
      } else if (window.web3) {
          App.web3 = new Web3(window.web3.currentProvider);
      } else {
          console.log("No Web3 detected. Falling back to HTTP Provider.");
          toastr.warning("No Web3 detected. Falling back to HTTP Provider.");
          App.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
      }
     
        try {
            if (App.contracts.ChainFundMultiToken && App.currentAccount) {
                App.handleAccountChange();
            }
        } catch (error) {
            console.error("Error initializing contract: ", error);
        }
    
      return App.initContracts();
  },

  initContracts: async function() {
      App.contracts.ChainFundMultiToken = new App.web3.eth.Contract(App.abiChainFundERC1155, App.chainFundERC1155Address, {});
      App.contracts.batch = new App.web3.eth.Contract(App.abibatch, App.batchaddress, {});
      testContractConnection =  async function() {
        try {
            const supply = await App.contracts.ChainFundMultiToken.methods.totalCFTSupply().call();
            console.log(`Total CFT Supply: ${supply}`);
            toastr.info(`Contract connected. Total CFT Supply: ${supply}`);
            const contractOwner = await App.contracts.ChainFundMultiToken.methods.owner().call();
            console.log(`Contract Owner: ${contractOwner}`);
        } catch (error) {
            console.error("Contract connection failed:", error);
            toastr.error("Error in contract connection.");
        }
    }
    testContractConnection()
    
      return App.bindEvents();
  },

  updateUIForAccountChange: async function() {
      $('#connect-metamask').text(`Connected: ${App.currentAccount}`);
      try {
          const isRegistered = await App.contracts.ChainFundMultiToken.methods.registeredInvestors(App.currentAccount).call();
          if (isRegistered) {
              $('#register-user').text('Registered').prop('disabled', true);
              toastr.success("Account is already registered.");
          } else {
              $('#register-user').text('Register').prop('disabled', false);
              toastr.info("Account is not registered. Please register.");
          }
      } catch (error) {
          console.error("Error checking registration status:", error);
          toastr.error("Error checking registration status.");
      }
  },

  bindEvents: function() {
      $('#connect-metamask').on(App.connectMetaMask);
      $('#register-user').click(App.registerInvestor);
      $('#buy-cft').click(App.buyCFTTokens);
      $('#sell-cft').click(App.sellCFTTokens);
      $('#transfer-cft').click(App.transferCFT);
      $('#getGOV-nft').click(App.issueNFT);
      $('#check-cft-balance').click(App.checkCFTBalance);
      $('#check-total-supply').click(App.checkTotalCFTSupply);
      $('#initialize-proposals').click(App.initializeProposals);
      $('#vote-on-proposal').click(App.voteOnProposal);
      $('#batch-purchase').click(App.executeBatchPurchase);
      $('#get-batch-balance').click(App.getBatchBalance);
      $('#get-winning-proposal').click(App.getWinningProposal);
      $('#execute-batch-transfer').click(App.executeBatchTransfer);
      $('#distribute-dividends').click(App.distributeDividends);
      $('#get-cft-composition').click(App.getCFTComposition);
      $('#execute-proposal').click(App.executeProposal);
  },

  connectMetaMask: async function() {
      if (window.ethereum) {
          try {
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              App.currentAccount = accounts[0];
              $('#connect-metamask').text(`Connected: ${App.currentAccount}`);
              toastr.success("Connected to MetaMask.");
          } catch (error) {
              console.error("Error connecting to MetaMask:", error);
              toastr.error("Error connecting to MetaMask.");
          }
      } else {
          console.log("MetaMask not available!");
          toastr.warning("MetaMask not available!");
      }
  },

  executeBatchPurchase: async function() {
    const ethAmount = $('#batch-purchase-amount').val();
    try {
        await App.contracts.batch.methods.batchpurchase().send({
            from: App.currentAccount,
            value: App.web3.utils.toWei(ethAmount, 'ether')
        });
        toastr.success(`Successfully executed batch purchase with ${ethAmount} ETH.`);
    } catch (err) {
        toastr.error("Error executing batch purchase.");
        console.error(err);
    }
},
executeProposal: async function() {
  try {
      await App.contracts.ChainFundMultiToken.methods.executeProposal().send({ from: App.currentAccount });
      toastr.success("Proposal executed successfully.");
  } catch (err) {
      toastr.error("Error executing proposal.");
      console.error(err);
    }
},

distributeDividends: async function() {
  try {
      await App.contracts.ChainFundMultiToken.methods.distributeDividends().send({ from: App.currentAccount });
      toastr.success("Dividends distributed successfully.");
  } catch (err) {
      toastr.error("Error distributing dividends.");
      console.error(err);
    }
},
getCFTComposition: async function() {
  try {
      const composition = await App.contracts.ChainFundMultiToken.methods.getCFTComposition().call();
      $('#cft-composition-display').text(`BTC Ratio: ${composition[0]}, USDT Ratio: ${composition[1]}`);
      toastr.info(`BTC Ratio: ${composition[0]}, USDT Ratio: ${composition[1]}`);
  } catch (err) {
      toastr.error("Error fetching CFT composition.");
      console.error(err);
    }
},
getBatchBalance: async function() {
  const userAddress = $('#batch-balance-address').val().trim();
  const tokenId = $('#batch-balance-tokenid').val().trim();

  if (!App.web3.utils.isAddress(userAddress)) {
      toastr.error("Invalid address");
      return;
  }

  if (!tokenId) {
      toastr.error("Token ID is required");
      return;
  }

  try {
      const balance = await App.contracts.batch.methods.getbalance(userAddress, tokenId).call();
      $('#batch-balance-display').text(`Batch Balance for Token ID ${tokenId}: ${balance}`);
      toastr.info(`Batch Balance for Token ID ${tokenId}: ${balance}`);
  } catch (err) {
      toastr.error("Error fetching batch balance.");
      console.error(err);
  }
},
executeBatchTransfer: async function() {
  const fromAddress = $('#batch-transfer-from-address').val().trim();
  const toAddress = $('#batch-transfer-to-address').val().trim();
  const cftAmount = $('#batch-transfer-cft-amount').val().trim();

  if (!App.web3.utils.isAddress(fromAddress) || !App.web3.utils.isAddress(toAddress)) {
      toastr.error("Invalid 'from' or 'to' address");
      return;
  }

  if (!cftAmount) {
      toastr.error("CFT amount is required");
      return;
  }

  try {
      await App.contracts.batch.methods.transferCFTandNFT(fromAddress, toAddress, cftAmount).send({ from: App.currentAccount });
      toastr.success("Batch transfer executed successfully.");
  } catch (err) {
      toastr.error("Error executing batch transfer.");
      console.error(err);
  }
},
  initializeProposals: async function() {
    try {
        await App.contracts.ChainFundMultiToken.methods.initializeProposals().send({ from: App.currentAccount });
        toastr.success("Proposals initialized successfully.");
    } catch (err) {
        toastr.error("Error initializing proposals.");
        console.error(err);
    }
},
voteOnProposal: async function() {
  const proposalId = $('#proposal-vote-id').val().trim();
  try {
      await App.contracts.ChainFundMultiToken.methods.vote(proposalId).send({ from: App.currentAccount });
      toastr.success("Vote cast successfully.");
  } catch (err) {
      toastr.error("Error casting vote.");
      console.error(err);
    }
},
getWinningProposal: async function() {
  try {
      const winningProposalId = await App.contracts.ChainFundMultiToken.methods.getwinningproposal().call();
      $('#winning-proposal-display').text(`Winning Proposal ID: ${winningProposalId}`);
      toastr.info(`Winning Proposal ID: ${winningProposalId}`);
  } catch (err) {
      toastr.error("Error fetching winning proposal.");
      console.error(err);
    }
},

  registerInvestor: async function() {
      await App.contracts.ChainFundMultiToken.methods.registerInvestor(App.currentAccount).send({ from: App.currentAccount })
          .then(function(result) {
              console.log("Investor Registered:", result);
              $('#register-user').text('Registered').prop('disabled', true);
              toastr.success("Investor registered successfully.");
          })
          .catch(function(err) {
              console.error("Registration failed:", err);
              toastr.error("Registration failed.");
          });
  },

  buyCFTTokens: async function() {
      const ethAmount = $('#cft-amount').val();
      await App.contracts.ChainFundMultiToken.methods.buyCFT().send({ from: App.currentAccount, value: App.web3.utils.toWei(ethAmount, 'ether') })
          .then(function(result) {
              console.log("Bought CFT:", result);
              toastr.success(`Successfully bought ${ethAmount} CFT.`);
          })
          .catch(function(err) {
              console.error("Buy failed:", err);
              toastr.error("Buying CFT failed.");
          });
  },

  sellCFTTokens: function() {
      const cftAmount = $('#sell-cft-amount').val();
      App.contracts.ChainFundMultiToken.methods.withdraw(cftAmount).send({ from: App.currentAccount })
          .then(function(result) {
              console.log("CFT Sold:", result);
              toastr.success(`Successfully sold ${cftAmount} CFT.`);
          })
          .catch(function(err) {
              console.error("Sell failed:", err);
              toastr.error("Selling CFT failed.");
          });
  },

  transferCFT: function() {
      const recipient = $('#transfer-cft-address').val();
      const amount = $('#transfer-cft-amount').val();
      App.contracts.ChainFundMultiToken.methods.transferCFT(recipient, amount).send({ from: App.currentAccount })
          .then(function(result) {
              console.log("CFT Transferred:", result);
              toastr.success(`Successfully transferred ${amount} CFT to ${recipient}.`);
          })
          .catch(function(err) {
              console.error("Transfer failed:", err);
              toastr.error("Transferring CFT failed.");
          });
  },

  issueNFT: function() {
      App.contracts.ChainFundMultiToken.methods.getGovernanceNFT(App.currentAccount).send({ from: App.currentAccount })
          .then(function(result) {
              console.log("NFT Issued:", result);
              toastr.success("NFT issued successfully.");
          })
          .catch(function(err) {
              console.error("Issue NFT failed:", err);
              toastr.error("Issue NFT failed.");
          });
  },

  checkCFTBalance: async function() {
    const recipient = $('#balance-check-address').val().trim();

    if (!App.web3.utils.isAddress(recipient)) {
        toastr.error("Invalid address");
        console.error("Invalid address");
        return;
    }

    await App.contracts.ChainFundMultiToken.methods.CFTbalance(recipient).call()
        .then(function(balance) {
            $('#current-user-cft-balance').text(`CFT Balance: ${balance}`).show();
            toastr.info(`CFT Balance: ${balance}`);
        })
        .catch(function(err) {
            console.error("Check balance failed:", err);
            toastr.error("Checking CFT balance failed.");
        });
},


  checkTotalCFTSupply: async function() {
      await App.contracts.ChainFundMultiToken.methods.totalCFTSupply().call()
          .then(function(supply) {
              toastr.info(`Total CFT Supply: ${supply}`);
          })
          .catch(function(err) {
              console.error("Check total supply failed:", err);
              toastr.error("Checking total CFT supply failed.");
          });
  },

  abiChainFundERC1155: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_erc20Address",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_erc721Address",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idsLength",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valuesLength",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InvalidArrayLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC1155MissingApprovalForAll",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "TransferBatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "TransferSingle",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "value",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "URI",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "CFTbalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ETHPerCFT",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "accounts",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "balanceOfBatch",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "btcratio",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "buyCFT",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "distributeDividends",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "executeProposal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCFTComposition",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getGovernanceNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getwinningproposal",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "winningProposal",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "hasGovernanceNFT",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "initializeProposals",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "investor",
          "type": "address"
        }
      ],
      "name": "isInvestorRegistered",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registerInvestor",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "registeredInvestors",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeBatchTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalCFTSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "cftAmount",
          "type": "uint256"
        }
      ],
      "name": "transferCFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "usdtratio",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "toProposal",
          "type": "uint256"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "cftAmount",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  abibatch:[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_erc1155Address",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idsLength",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valuesLength",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InvalidArrayLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC1155MissingApprovalForAll",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "TransferBatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "TransferSingle",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "value",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "URI",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "CFTID",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ETHPerCFT",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "NFTID",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "accounts",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "balanceOfBatch",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "batchpurchase",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "getbalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "registeredInvestors",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeBatchTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "CFTamount",
          "type": "uint256"
        }
      ],
      "name": "transferCFTandNFT",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
};

$(document).ready(function() {
  App.init();
});
