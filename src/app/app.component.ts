import { Component } from '@angular/core';
import { Wallet, ethers, Contract, BigNumber } from 'ethers';
import { env } from '../environment/env';
import { HttpClient } from '@angular/common/http'; 
import tokenJson from '../assets/MyToken.json';

const API_URL = 'http://10.162.235.88:3000/contract-address';

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
  userTokenBalance: number | undefined;
  tokenContractAddress: string | undefined;
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;


  constructor(private http: HttpClient) {
    //this.provider = ethers.getDefaultProvider('goerli');
    this.provider = new ethers.providers.InfuraProvider(
    "maticmum",
    env.INFURA_API_KEY
     );

    // create logic to verify if is or not an imported 
    this.importedWallet = false;
    //this.tokenContractAddress =
  }

  getTokenAddress(){
    return this.http.get<{ address: string }>(API_URL);
  }

  syncBlock(){
    this.blockNumber = "loading..."
    this.provider.getBlock('latest').then((block) => {
      this.blockNumber = block.number;
    })
    this.getTokenAddress().subscribe((response) => {
      this.tokenContractAddress = response.address;
      this.updateTokenInfo();
    })  
  }

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
