# Running and Deploying Ballot Dapp


This project is a Ballot decentralized application


## Prerequisites:


Have the following installed :


* NPM: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
* Truffle: https://trufflesuite.com/docs/truffle/how-to/install/
* Ganache: https://trufflesuite.com/ganache/




## Start the application
In the project directory, follow the steps below to start the application locally


1. Enter ballot-app directory by entering the following command in the terminal, `cd ballot-app`


2. Install dependencies by executing the following command, `npm install`


3. Run the application by entering `npm start` in the terminal.


4. Open http://localhost:3000 to view the application in your browser.


## Deploy Ballot contract to Ganche
In the project directory, follow the steps below to deploy the smart contract on the development network (Ganache). Make sure Ganache is running locally on your device before executing the steps below


1. Enter ballot-contract directory by entering the following command in the terminal, `cd ballot-contract`


2. Install dependencies by executing the following command, `npm install`


3. Deploy smart contract to Ganache network by entering `truffle migrate` in the terminal.


4. The command above should have printed contract deployment details on your terminal. Find the address associated with the field **'contract address:'**. Copy that address and paste it in between the quotes of line 4 in file app.js. Ex:   `address: "paste_the_copied_address_here"`
5. Follow the steps detailed in **'Start the application'** section to run the application


## Deploy Ballot contract to Sepolia
In the project directory, follow the steps below to deploy the smart contract on the Sepolia network.


1. Enter ballot-contract directory by entering the following command in the terminal, `cd ballot-contract`


2. Install dependencies by executing the following command, `npm install`


3. Locate the .env file and populate the values for PROJECT_ID and MNEMONIC. For **PROJECT_ID** variable enter the Infura project API Key inbetween the quotes. For **MNEMONIC** variable enter the account seed phrase. Note: The contract will be deployed on the address that is assocaited with that seed phrase


4. Deploy smart contract to Sepolia network by entering `truffle migrate --network sepolia` in the terminal.


5. The command above should have printed contract deployment details on your terminal. Find the address associated with the field **'contract address:'**. Copy that address and paste it inbetween the quotes of line 4 in file app.js. Ex:   `address: "paste_the_copied_address_here"`
6. Follow the steps detailed in **'Start the application'** section to run the application

