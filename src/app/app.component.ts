import { Component } from '@angular/core';
import { ethers, Contract, BigNumber } from 'ethers';
import { env } from '../enviorment/env';
import lotteryJson from '../assets/Lottery.json';
import tokenJson from '../assets/LotteryToken.json';

const TOKEN_RATIO = 1000;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.InfuraProvider;
  userWallet: ethers.Wallet | undefined;
  importedWallet: boolean;
  userEthBalance: number | undefined;
  userTokenBalance: number | undefined; 
  tokenContractAddress: string | undefined; 
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;
  lotteryContractAddress: string | undefined;
  lotteryContract: Contract | undefined;
  lotteryEthBalance: number | undefined;
  prizePool: number | undefined; 
  ownerPool: number | undefined; 
  betsState: String | undefined;
  txHash: string | undefined; 

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
    // Clean previous Balances display 
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
    let tokenBalanceStr;
    if (!this.lotteryContractAddress) return;
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.provider
    );
    // ToDo Fix Issue....
    // Get the ETH balance from the Lottery Contract
    //this.lotteryContract['getBalance']().then((balanceBN: BigNumber) => {
    //  const balanceStr = ethers.utils.formatEther(balanceBN);
    //  this.lotteryEthBalance = parseFloat(balanceStr);
    //this.importedWallet = true;
    //}) 
    // Gets the userTokenBalance from the imported Wallet
    this.lotteryContract['prizePool']()
      .then((tokenBalanceBN: BigNumber) => {
        tokenBalanceStr = ethers.utils.formatEther(tokenBalanceBN);
        this.prizePool = parseFloat(tokenBalanceStr);
      });
    this.lotteryContract['ownerPool']()
      .then((tokenBalanceBN: BigNumber) => {
        tokenBalanceStr = ethers.utils.formatEther(tokenBalanceBN);
        this.ownerPool = parseFloat(tokenBalanceStr);
      });
    this.lotteryContract['betsOpen']()
      .then((betsOpen: boolean) => {
        if (betsOpen){
        this.betsState = "open";
        }
        else{
        this.betsState = "closed";
        }
      });
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

  async topUpTokens(amount: string)  {
    if (!this.lotteryContract) return;
    const tx = await this.lotteryContract["purchaseTokens"]({
      value: ethers.utils.parseEther(amount).div(TOKEN_RATIO)
    });    
    const receipt = await tx.wait();
    this.txHash = receipt.transactionHash;
  }
}
