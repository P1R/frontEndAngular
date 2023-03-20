import { Component } from '@angular/core';
import { ethers, Contract, BigNumber } from 'ethers';
import { env } from '../enviorment/env';
import lotteryJson from '../assets/Lottery.json';
import tokenJson from '../assets/LotteryToken.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.InfuraProvider;
  userWallet: ethers.Wallet | undefined;
  userEthBalance: number | undefined;
  importedWallet: boolean;
  userTokenBalance: number | undefined; 
  tokenContractAddress: string | undefined; 
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;
  lotteryContractAddress: string | undefined;
  lotteryContract: Contract | undefined;

  constructor() {
    //this.provider = ethers.getDefaultProvider('goerli');
    this.provider = new ethers.providers.InfuraProvider(
    "goerli",
    env.INFURA_API_KEY
     );

    // create logic to verify if is or not an imported 
    this.importedWallet = false;
  };

  async syncBlock() {
    // clean variables
    this.clearWallet();
    this.blockNumber = "loading...";
    // test connection
    this.provider.getBlock('latest').then((block) => {
      this.blockNumber = block.number;
    });
    this.lotteryContractAddress = "0x2F0cF8a8ffAa5e406aD4f158891931292740aFEC"
    this.updateLotteryInfo();
    //TODO
    if (!this.lotteryContract) return;
    this.tokenContractAddress = await this.lotteryContract['paymentToken']()
    this.updateTokenInfo();
  };

  updateTokenInfo() {
    if (!this.tokenContractAddress) return;
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.userWallet ?? this.provider
    );
    this.tokenTotalSupply = 'loading...';
    this.tokenContract['totalSupply']().then((totalSupplyBN: BigNumber) => {
      const totalSupplyStr = ethers.utils.formatEther(totalSupplyBN);
      this.tokenTotalSupply = parseFloat(totalSupplyStr);
    });
  };

  updateLotteryInfo() {
    if (!this.lotteryContractAddress) return;
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.provider
    );
  };

  clearWallet() {
    // Cleans Variables
    this.blockNumber = 0;
    this.userWallet = undefined;
    this.userEthBalance = undefined;
    this.importedWallet = false;
    this.userTokenBalance = undefined; 
    this.tokenContractAddress = undefined; 
    this.tokenContract = undefined;
    this.tokenTotalSupply = undefined;
    this.lotteryContractAddress = undefined;
    this.lotteryContract = undefined;
  };

  createWallet(){
    // clean variables
    this.clearWallet();
    this.userWallet = ethers.Wallet.createRandom().connect(this.provider);
    let balanceStr: string;
    this.userWallet.getBalance().then((balanceBN) => {
      balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    })
    if(!this.tokenContract) return;
    this.tokenContract['balanceOf'](this.userWallet.address).then((mtkBalanceBN: BigNumber) => {
      balanceStr = ethers.utils.formatEther(mtkBalanceBN);
      this.tokenTotalSupply = parseFloat(balanceStr);
    });
  };

  isEthereumKey(text: string): boolean | null {
    // Regular expression for detecting Ethereum private keys
    const keyRegex: RegExp = /^(0x)?[0-9a-fA-F]{64}$/;
    // Regular expression for detecting Ethereum mnemonics
    const mnemonicRegex: RegExp = /^(?:\w+\s){11}\w+$/;

    // Check if the text string matches the Ethereum private key regular expression
    if (keyRegex.test(text)) {
      return true;
    }
    // Check if the text string matches the Ethereum mnemonic regular expression
    else if (mnemonicRegex.test(text)) {
      return false;
    }
    // If the text string doesn't match either regular expression, return null
    else {
      return null;
    }
  };

  importWallet(pkey: string){
    const isPrivateKey: boolean | null = this.isEthereumKey(pkey);
    
    if (isPrivateKey === true) { 
      // for a private key
      this.userWallet = new ethers.Wallet(`${pkey}`, this.provider);
    } else if (isPrivateKey === false) {
      // for mnemonic key
      this.userWallet = ethers.Wallet.fromMnemonic(pkey);
    
    } else {
      throw new Error('The input string is not an Ethereum private key or mnemonic phrase.'); 
      return;
    }

    // Clean previous Balances display 
    this.userEthBalance  = 0;
    this.userTokenBalance = 0;
    // Get the ETH balance from the imported Wallet
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    this.importedWallet = true;
    }) 
    // Gets the userTokenBalance from the imported Wallet
    if (!this.tokenContract) return;
    this.tokenContract['balanceOf'](this.userWallet.address)
      .then((tokenBalanceBN: BigNumber) => {
        const tokenBalanceStr = ethers.utils.formatEther(tokenBalanceBN);
        this.userTokenBalance = parseFloat(tokenBalanceStr);
      });
  };


  //delegate(delegateAddress: string) {
  //  if(!this.tokenContract) return;
  //  this.tokenContract['delegate'](delegateAddress).then((delegateTx: Transaction ) => {
  //    this.latestTransaction = delegateTx;
  //  });
  //}

  //getVotingPower(){
  //  if(!this.tokenContract) return; 
  //  if(!this.userWallet) return; 
  //  this.tokenContract['getVotes'](this.userWallet.address).then((getVotes: BigNumber ) => {
  //    const getVotesStr = ethers.utils.formatEther(getVotes);
  //    this.votingPower = parseFloat(getVotesStr);
  //  });  
  //}

  //requestTokens(amount: string) {
  //  const amountNum = parseInt(amount);
  //  this.http.post<{ balance: number }>(
  //    API_URL_MINT,
  //    {
  //      address: this.userWallet?.address,
  //      amount: amountNum
  //    },
  //    {
  //      responseType: "json"
  //    }
  //  ).subscribe((response) => {
  //    this.userTokenBalance = response.balance;
  //  });
  //};

  //deployBallot() {
  //  this.http.post<{ address: string, blockNumber: number }>(
  //    DEPLOY_BALLOT_URL,
  //    {
  //      proposals: PROPOSALS
  //    },
  //    {
  //      responseType: "json"
  //    }
  //  ).subscribe((response) => {
  //    this.ballotContractAddress = response.address;
  //    this.blockNumber = response.blockNumber;
  //  });
  //}

  //castVote(proposal: string, votes: string) {
  //  const proposalNum = parseInt(proposal);
  //  const votesNum = parseInt(votes);
  //  if (!this.userWallet || !this.ballotContract) return;
  //  this.ballotContract
  //    .connect(this.userWallet)["vote"](proposalNum, votesNum);
  //};

  //getWinningProposal() {
  //  this.http.get<{ winner: string }>(WINNING_PROPOSAL_URL)
  //    .subscribe((response) => {
  //      this.winningProposal = response.winner;
  //    });
  //};
}
