import { Component } from '@angular/core';
import { Wallet, ethers, Contract, BigNumber, Transaction } from 'ethers';
import { env } from '../enviorment/env';
import { HttpClient } from '@angular/common/http'; 
import tokenJson from '../assets/MyToken.json';
import ballotJson from '../assets/Ballot.json';

const API_URL = `http://10.162.235.88:3000/contract-address`;
const API_URL_MINT = `http://10.162.235.88:3000/request-tokens`;
const DEPLOY_BALLOT_URL = `http://10.162.235.88:3000/deploy-ballot`;
const WINNING_PROPOSAL_URL = `http://10.162.235.88:3000/winning-proposal`;
const PROPOSALS = ["Bulbasaur", "Charmander", "Squirtle", "pikachu"];

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
  ballotContractAddress: string | undefined;
  ballotContract: Contract | undefined;
  winningProposal: string | undefined;
  latestTransaction: Transaction | undefined;
  votingPower: number | undefined;

  constructor(private http: HttpClient) {
    //this.provider = ethers.getDefaultProvider('goerli');
    this.provider = new ethers.providers.InfuraProvider(
    "maticmum",
    env.INFURA_API_KEY
     );

    // create logic to verify if is or not an imported 
    this.importedWallet = false;
  };

  getContractAddress() {
    return this.http.get<{ address: string }>(API_URL);
  };

  syncBlock() {
    this.blockNumber = "loading...";
    this.winningProposal = "unknown";
    this.provider.getBlock('latest').then((block) => {
      this.blockNumber = block.number;
    });
    this.getContractAddress().subscribe((response) => {
      this.tokenContractAddress = response.address;
      this.updateTokenInfo();
    });
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

  updateBallotInfo() {
    if (!this.ballotContractAddress) return;
    this.ballotContract = new Contract(
      this.ballotContractAddress,
      ballotJson.abi,
      this.provider
    );
  };

  clearBlock() {
    this.blockNumber = 0;
  };

  createWallet(){
    this.userWallet = Wallet.createRandom().connect(this.provider);
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

  importWallet(pkey: string){
    this.userWallet = new Wallet(pkey, this.provider);
    let balanceStr: string;
    this.userWallet.getBalance().then((balanceBN) => {
      balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
    this.importedWallet = true;
    }) 
    if(!this.tokenContract) return;
    this.tokenContract['balanceOf'](this.userWallet.address).then((mtkBalanceBN: BigNumber) => {
      balanceStr = ethers.utils.formatEther(mtkBalanceBN);
      this.tokenTotalSupply = parseFloat(balanceStr);
    });
    if (!this.tokenContract) return;
    this.tokenContract['balanceOf'](this.userWallet.address)
      .then((tokenBalanceBN: BigNumber) => {
        const tokenBalanceStr = ethers.utils.formatEther(tokenBalanceBN);
        this.userTokenBalance = parseFloat(tokenBalanceStr);
      });
  };

  delegate(delegateAddress: string) {
    if(!this.tokenContract) return;
    this.tokenContract['delegate'](delegateAddress).then((delegateTx: Transaction ) => {
      this.latestTransaction = delegateTx;
    });
  }

  getVotingPower(){
    if(!this.tokenContract) return; 
    if(!this.userWallet) return; 
    this.tokenContract['getVotes'](this.userWallet.address).then((getVotes: BigNumber ) => {
      const getVotesStr = ethers.utils.formatEther(getVotes);
      this.votingPower = parseFloat(getVotesStr);
    });  
  }

  requestTokens(amount: string) {
    const amountNum = parseInt(amount);
    this.http.post<{ balance: number }>(
      API_URL_MINT,
      {
        address: this.userWallet?.address,
        amount: amountNum
      },
      {
        responseType: "json"
      }
    ).subscribe((response) => {
      this.userTokenBalance = response.balance;
    });
  };

  deployBallot() {
    this.http.post<{ address: string, blockNumber: number }>(
      DEPLOY_BALLOT_URL,
      {
        proposals: PROPOSALS
      },
      {
        responseType: "json"
      }
    ).subscribe((response) => {
      this.ballotContractAddress = response.address;
      this.blockNumber = response.blockNumber;
    });
  }

  castVote(proposal: string, votes: string) {
    const proposalNum = parseInt(proposal);
    const votesNum = parseInt(votes);
    if (!this.userWallet || !this.ballotContract) return;
    this.ballotContract
      .connect(this.userWallet)["vote"](proposalNum, votesNum);
  };

  getWinningProposal() {
    this.http.get<{ winner: string }>(WINNING_PROPOSAL_URL)
      .subscribe((response) => {
        this.winningProposal = response.winner;
      });
  };
}
