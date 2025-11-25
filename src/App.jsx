import React, { useState, useEffect } from 'react';
import { Wallet, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BrowserProvider, Contract } from "ethers";

const Web3WalletApp = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transfer form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');


  // Token approval state
  //const [tokenAddress, setTokenAddress] = useState('');
  const [spenderAddress, setSpenderAddress] = useState("");
  const [approvalAmount, setApprovalAmount] = useState('');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  const tokenAddress = "0x7E29CF1D8b1F4c847D0f821b79dDF6E67A5c11F8";

  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  const BUY_ABI = [
    "function buy(uint256 tokenAmount)",
  ];


  const createWriteContract = async () => {
    const provider = new BrowserProvider(window.ethereum);  // replaces Web3Provider
    const signer = await provider.getSigner();              // same method in v6
    const newContract = new Contract("0x7E29CF1D8b1F4c847D0f821b79dDF6E67A5c11F8", ERC20_ABI, signer); // same constructor

    return newContract;
  };


  const createBuyContract = async () => {
    const provider = new BrowserProvider(window.ethereum);  // replaces Web3Provider
    const signer = await provider.getSigner();              // same method in v6
    const newContract = new Contract("0x7f0113D6fb9faDD19D965bF025B314C8E1C5786d", BUY_ABI, signer); // same constructor

    return newContract;
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('Please install MetaMask to use this app');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      setAccount(accounts[0]);
      await updateBalance(accounts[0]);
      setSuccess('Wallet connected successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Update balance
  const updateBalance = async (addr) => {
    try {
      const bal = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [addr, 'latest']
      });

      const ethBalance = parseInt(bal, 16) / 1e18;
      setBalance(ethBalance.toFixed(4));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  // Approve ERC20 token spending
  const approveToken = async (evt) => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!approvalAmount) {
      setError('Please fill in all approval fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // ERC20 approve function signature
      evt.preventDefault();
      const contract = await createWriteContract();
      const tx = await contract.approve("0x7f0113D6fb9faDD19D965bF025B314C8E1C5786d", approvalAmount);
      await tx.wait();

      setSuccess(`Approval sent!`);

      setSpenderAddress('');
      setApprovalAmount('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  // Transfer ERC20 tokens
  const buy = async (evt) => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!tokenAddress || !recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      evt.preventDefault();
      const contract = await createBuyContract();

      const tx = await contract.buy(amount);
      await tx.wait();

      setSuccess(`Transaction successful!`);
      setRecipient('');
      setAmount('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance('0');
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Token Sale</h1>
          <p className="text-indigo-200">Approve and Buy ARM Token</p>
        </div>

        {/* Wallet Connection Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="text-white" size={24} />
              <div>
                <p className="text-sm text-indigo-200">Wallet Address</p>
                <p className="text-white font-mono text-sm">
                  {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not connected'}
                </p>
              </div>
            </div>
            {account ? (
              <div className="text-right">
                <p className="text-sm text-indigo-200">Balance</p>
                <p className="text-white font-bold text-lg">{balance} ETH</p>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-300" size={20} />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-300" size={20} />
            <p className="text-green-100">{success}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Transfer Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Send className="text-white" size={24} />
              <h2 className="text-2xl font-bold text-white">Buy ARM Token</h2>
            </div>

            <div className="space-y-4">


              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.001"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={buy}
                disabled={loading || !account}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Buy ARM
              </button>
            </div>
          </div>

          {/* Approval Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-white" size={24} />
              <h2 className="text-2xl font-bold text-white">Token Approval</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Approval Amount
                </label>
                <input
                  type="number"
                  value={approvalAmount}
                  onChange={(e) => setApprovalAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.001"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={approveToken}
                disabled={loading || !account}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Approve Token
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
          <ul className="space-y-2 text-indigo-200 text-sm">
            <li>• Connect your MetaMask wallet to get started</li>
            <li>• Use the Transfer section to send native ETH or ERC20 tokens</li>
            <li>• Use the Approval section to allow smart contracts to spend your tokens</li>
            <li>• All transactions require confirmation in MetaMask</li>
            <li>• Make sure you have enough ETH for gas fees</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Web3WalletApp;