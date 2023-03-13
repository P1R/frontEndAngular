import { Component } from '@angular/core';
import { Wallet, ethers } from 'ethers';
import { env } from '../environment/env';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.InfuraProvider;
  userWallet: Wallet | undefined;
  userEthBalance: number | undefined;
  importedWallet: boolean;


  constructor() {
    //this.provider = ethers.getDefaultProvider('goerli');
    this.provider = new ethers.providers.InfuraProvider(
    "maticmum",
    env.INFURA_API_KEY
     );

    // create logic to verify if is or not an imported 
    this.importedWallet = false;
  }

  syncBlock(){
    this.blockNumber = "loading..."
    this.provider.getBlock('latest').then((block) => {
      this.blockNumber = block.number;
    })
  }

  clearBlock() {
    this.blockNumber = 0;
  }

  createWallet(){
    this.userWallet = Wallet.createRandom().connect(this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    })
  }

  importWallet(pkey: string){
    this.userWallet = new Wallet(pkey, this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    this.importedWallet = true;
    })
  }
}
