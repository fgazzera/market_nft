// metamask.js

// Función para verificar si MetaMask está instalado y habilitado
async function checkMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.enable();
        return true;
    }
    return false;
}

// Función para conectar MetaMask
async function connectToMetaMask() {
    const isMetaMaskInstalled = await checkMetaMask();

    if (isMetaMaskInstalled) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accountAddress = accounts[0];
        return accountAddress;
    } else {
        return null;
    }
}

// Función para desconectar de MetaMask
async function disconnectFromMetaMask() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
}

export { checkMetaMask, connectToMetaMask, disconnectFromMetaMask };

