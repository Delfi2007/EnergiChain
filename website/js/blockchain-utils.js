/**
 * Blockchain Utilities for EnergiChain
 * Web3 integration and smart contract interactions
 */

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.networkId = null;
  }

  /**
   * Initialize Web3 connection
   */
  async init() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.connect();
    } else {
      console.warn('MetaMask not installed');
      return false;
    }
  }

  /**
   * Connect wallet
   */
  async connect() {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      this.signer = this.provider.getSigner();
      const network = await this.provider.getNetwork();
      this.networkId = network.chainId;
      return accounts[0];
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Get current account
   */
  async getAccount() {
    if (!this.signer) await this.init();
    return await this.signer.getAddress();
  }

  /**
   * Get balance
   */
  async getBalance(address) {
    if (!this.provider) await this.init();
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, value) {
    if (!this.signer) await this.init();
    
    const tx = {
      to: to,
      value: ethers.utils.parseEther(value.toString())
    };

    const transaction = await this.signer.sendTransaction(tx);
    return await transaction.wait();
  }

  /**
   * Call smart contract method
   */
  async callContract(contractAddress, abi, method, params = []) {
    if (!this.provider) await this.init();
    
    const contract = new ethers.Contract(
      contractAddress,
      abi,
      this.signer || this.provider
    );

    return await contract[method](...params);
  }

  /**
   * Deploy smart contract
   */
  async deployContract(abi, bytecode, args = []) {
    if (!this.signer) await this.init();
    
    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    
    return contract.address;
  }

  /**
   * Listen to contract events
   */
  subscribeToEvents(contractAddress, abi, eventName, callback) {
    if (!this.provider) {
      console.error('Provider not initialized');
      return;
    }

    const contract = new ethers.Contract(
      contractAddress,
      abi,
      this.provider
    );

    contract.on(eventName, callback);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    if (!this.provider) await this.init();
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Estimate gas
   */
  async estimateGas(transaction) {
    if (!this.provider) await this.init();
    return await this.provider.estimateGas(transaction);
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    if (!this.signer) await this.init();
    return await this.signer.signMessage(message);
  }

  /**
   * Verify signature
   */
  verifySignature(message, signature) {
    return ethers.utils.verifyMessage(message, signature);
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    if (!this.provider) await this.init();
    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  /**
   * Get block number
   */
  async getBlockNumber() {
    if (!this.provider) await this.init();
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block
   */
  async getBlock(blockNumber) {
    if (!this.provider) await this.init();
    return await this.provider.getBlock(blockNumber);
  }

  /**
   * Switch network
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      this.networkId = chainId;
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }

  /**
   * Add custom token
   */
  async addToken(tokenAddress, tokenSymbol, tokenDecimals, tokenImage) {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Token addition failed:', error);
      return false;
    }
  }
}

/**
 * NFT Contract Interface
 */
class NFTContract {
  constructor(contractAddress, abi, blockchain) {
    this.address = contractAddress;
    this.abi = abi;
    this.blockchain = blockchain;
    this.contract = null;
  }

  async init() {
    if (!this.blockchain.signer) {
      await this.blockchain.init();
    }
    this.contract = new ethers.Contract(
      this.address,
      this.abi,
      this.blockchain.signer
    );
  }

  /**
   * Mint NFT
   */
  async mint(to, tokenURI) {
    if (!this.contract) await this.init();
    const tx = await this.contract.mint(to, tokenURI);
    return await tx.wait();
  }

  /**
   * Transfer NFT
   */
  async transfer(from, to, tokenId) {
    if (!this.contract) await this.init();
    const tx = await this.contract.transferFrom(from, to, tokenId);
    return await tx.wait();
  }

  /**
   * Get NFT owner
   */
  async ownerOf(tokenId) {
    if (!this.contract) await this.init();
    return await this.contract.ownerOf(tokenId);
  }

  /**
   * Get NFT metadata
   */
  async tokenURI(tokenId) {
    if (!this.contract) await this.init();
    return await this.contract.tokenURI(tokenId);
  }

  /**
   * Get balance of address
   */
  async balanceOf(address) {
    if (!this.contract) await this.init();
    const balance = await this.contract.balanceOf(address);
    return balance.toNumber();
  }

  /**
   * Approve NFT transfer
   */
  async approve(to, tokenId) {
    if (!this.contract) await this.init();
    const tx = await this.contract.approve(to, tokenId);
    return await tx.wait();
  }

  /**
   * Set approval for all
   */
  async setApprovalForAll(operator, approved) {
    if (!this.contract) await this.init();
    const tx = await this.contract.setApprovalForAll(operator, approved);
    return await tx.wait();
  }
}

/**
 * Token Contract Interface (ERC20)
 */
class TokenContract {
  constructor(contractAddress, abi, blockchain) {
    this.address = contractAddress;
    this.abi = abi;
    this.blockchain = blockchain;
    this.contract = null;
  }

  async init() {
    if (!this.blockchain.signer) {
      await this.blockchain.init();
    }
    this.contract = new ethers.Contract(
      this.address,
      this.abi,
      this.blockchain.signer
    );
  }

  /**
   * Get token balance
   */
  async balanceOf(address) {
    if (!this.contract) await this.init();
    const balance = await this.contract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 18);
  }

  /**
   * Transfer tokens
   */
  async transfer(to, amount) {
    if (!this.contract) await this.init();
    const value = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await this.contract.transfer(to, value);
    return await tx.wait();
  }

  /**
   * Approve token spending
   */
  async approve(spender, amount) {
    if (!this.contract) await this.init();
    const value = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await this.contract.approve(spender, value);
    return await tx.wait();
  }

  /**
   * Get allowance
   */
  async allowance(owner, spender) {
    if (!this.contract) await this.init();
    const allowance = await this.contract.allowance(owner, spender);
    return ethers.utils.formatUnits(allowance, 18);
  }

  /**
   * Transfer from
   */
  async transferFrom(from, to, amount) {
    if (!this.contract) await this.init();
    const value = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await this.contract.transferFrom(from, to, value);
    return await tx.wait();
  }

  /**
   * Get token info
   */
  async getTokenInfo() {
    if (!this.contract) await this.init();
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.contract.name(),
      this.contract.symbol(),
      this.contract.decimals(),
      this.contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.utils.formatUnits(totalSupply, decimals)
    };
  }
}

/**
 * IPFS Integration
 */
class IPFSService {
  constructor(gateway = 'https://ipfs.io/ipfs/') {
    this.gateway = gateway;
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': 'YOUR_API_KEY',
          'pinata_secret_api_key': 'YOUR_SECRET_KEY'
        },
        body: formData
      });

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload JSON to IPFS
   */
  async uploadJSON(jsonData) {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': 'YOUR_API_KEY',
          'pinata_secret_api_key': 'YOUR_SECRET_KEY'
        },
        body: JSON.stringify({
          pinataContent: jsonData
        })
      });

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error('IPFS JSON upload failed:', error);
      throw error;
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(hash) {
    const url = `${this.gateway}${hash}`;
    const response = await fetch(url);
    return await response.json();
  }

  /**
   * Get file URL
   */
  getURL(hash) {
    return `${this.gateway}${hash}`;
  }
}

// Initialize global blockchain service
const blockchain = new BlockchainService();
const ipfs = new IPFSService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlockchainService,
    NFTContract,
    TokenContract,
    IPFSService,
    blockchain,
    ipfs
  };
}
