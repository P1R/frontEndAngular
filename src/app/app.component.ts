import { Component } from '@angular/core';
import { ethers, Wallet, utils, Contract, BigNumber } from 'ethers';
import { env } from '../environment/env';
import { HttpClient } from '@angular/common/http'; 
import tokenJson from '../assets/MyToken.json';
import ballotJson from '../assets/Ballot.json';

const CONTRACT_ADDRESS_URL = `http://${env.api}/contract-address`;
const MINT_TOKENS_URL = `http://${env.api}/request-tokens`;
const DEPLOY_BALLOT_URL = `http://${env.api}/deploy-ballot`;
const WINNING_PROPOSAL_URL = `http://${env.api}/winning-proposal`;
const PROPOSALS = ["Bulbasaur", "Charmander", "Squirtle", "pikachu"];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  blockNumber: number | string | undefined;
  provider: ethers.providers.AlchemyProvider;
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

  constructor(private http: HttpClient) {
    this.provider = new ethers.providers.AlchemyProvider(
      env.network,
      env.key
    );

    // create logic to verify if is or not an imported 
    this.importedWallet = false;
  };

  getContractAddress() {
    return this.http.get<{ address: string }>(CONTRACT_ADDRESS_URL);
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
      const totalSupplyStr = utils.formatEther(totalSupplyBN);
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

  createWallet() {
    this.userWallet = Wallet.createRandom().connect(this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
      this.userTokenBalance = 0;
    });
  };

  importWallet(privateKey: string) {
    this.userWallet = new Wallet(privateKey, this.provider);
    this.userWallet.getBalance().then((balanceBN) => {
      const balanceStr = ethers.utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr);
      this.importedWallet = true;
    });
    if (!this.tokenContract) return;
    this.tokenContract['balanceOf'](this.userWallet.address)
      .then((tokenBalanceBN: BigNumber) => {
        const tokenBalanceStr = utils.formatEther(tokenBalanceBN);
        this.userTokenBalance = parseFloat(tokenBalanceStr);
      });
  };
  
  requestTokens(amount: string) {
    const amountNum = parseInt(amount);
    this.http.post<{ balance: number }>(
      MINT_TOKENS_URL,
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

  delegate(address: string) {
    if (!this.tokenContract || !this.userWallet) return;
    this.tokenContract['delegate'](address);
  }

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
