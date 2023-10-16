import logo from '../logo_3.png';
import fullLogo from '../full_logo.png';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

function Navbar() {
  const [connected, toggleConnect] = useState(false);
  const location = useLocation();
  const [currAddress, updateAddress] = useState('0x');

  async function getAddress() {
    const ethers = require("ethers");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    updateAddress(addr);
  }

  function updateButton() {
    const ethereumButton = document.querySelector('.enableEthereumButton');
    ethereumButton.textContent = "Connected";
    ethereumButton.classList.remove("hover:bg-blue-70");
    ethereumButton.classList.remove("bg-blue-500");
    ethereumButton.classList.add("hover:bg-green-70");
    ethereumButton.classList.add("bg-green-500");
  }

  async function connectWebsite() {
    if (window.ethereum === undefined) {
      alert("MetaMask is not installed. Please install MetaMask.");
      return;
    }
  
    // Comprueba si el usuario está conectado a MetaMask
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
  
    if (accounts.length === 0) {
      // El usuario no está conectado, solicita la conexión
      try {
        const addresses = await window.ethereum.request({ method: "eth_requestAccounts" });
        const userAddress = addresses[0]; // Obtiene la primera dirección
        alert("Connected to MetaMask with address: " + userAddress);
        // Puedes realizar otras acciones aquí después de la conexión exitosa
        updateAddress(userAddress); // Actualiza la dirección del usuario
        toggleConnect(true); // Marca como conectado
        updateButton(); // Actualiza el botón
      } catch (error) {
        console.error(error);
        alert("Failed to connect to MetaMask. Please try again.");
      }
    } else {
      // El usuario ya está conectado, muestra la dirección actual
      const userAddress = accounts[0]; // Obtiene la primera dirección
      updateAddress(userAddress); // Actualiza la dirección del usuario
      toggleConnect(true); // Marca como conectado
      updateButton(); // Actualiza el botón
    }
  }
  

  useEffect(() => {
    if(window.ethereum == undefined)
      return;
    let val = window.ethereum.isConnected();
    if(val)
    {
      console.log("here");
      getAddress();
      toggleConnect(val);
      updateButton();
    }

    window.ethereum.on('accountsChanged', function(accounts){
      window.location.replace(location.pathname)
    })
  });

  async function connectWebsite() {
    if (window.ethereum === undefined) {
      alert("MetaMask is not installed. Please install MetaMask.");
      return;
    }
  
    // Comprueba si el usuario está conectado a MetaMask
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
  
    if (accounts.length === 0) {
      // El usuario no está conectado, solicita la conexión
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        alert("Connected to MetaMask!");
        // Puedes realizar otras acciones aquí después de la conexión exitosa
      } catch (error) {
        console.error(error);
        alert("Failed to connect to MetaMask. Please try again.");
      }
    }
  }
  
  return (
    <div className="">
      <nav className="w-screen">
        <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
              {/* ... (contenido del logo) */}
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {/* ... (enlaces y botones del Navbar) */}
              <li>
                <button
                  className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={connectWebsite} // Asocia la función al evento onClick del botón
                >
                  {connected ? "Connected" : "Connect Wallet"}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div className='text-white text-bold text-right mr-10 text-sm'>
        {currAddress !== "0x" ? "Connected to" : "Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0, 15) + '...') : ""}
      </div>
    </div>
  );
}

export default Navbar;