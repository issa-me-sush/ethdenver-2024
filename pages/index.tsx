import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useTransactionReceipt } from 'wagmi';
import type { NextPage } from 'next';
import { LSP25_VERSION } from '@lukso/lsp-smart-contracts';
import { ethers } from 'ethers'
import Head from 'next/head';
import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import UniversalProfileContract from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import KeyManagerContract from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import { EIP191Signer } from '@lukso/eip191-signer.js';
import { EAS_ABI } from '../constants/abi'
import styles from '../styles/Home.module.css';
import Navbar from '../components/navbar';
import { useState, useEffect } from 'react';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { parse } from 'path';
const Home: NextPage = () => {
  const [socialUrl, setSocialUrl] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [attUid, setAttUid] = useState('');
  const [uid, setUid] = useState('')
  const [luksoName, setLuksoName] = useState('')
  const [attData, setAttData] = useState('')
  const [luksoExplorer, setLuksoExplorer] = useState('');
  const [veraxSdk, setVeraxSdk] = useState(null);
  const transactionReceipt = useTransactionReceipt();
  const { address, isConnected } = useAccount()
  useEffect(() => {
    const initVeraxSdk = async () => {
      const sdkConf = VeraxSdk.DEFAULT_LINEA_TESTNET_FRONTEND;
      const veraxSdkInstance = new VeraxSdk(sdkConf, address);
      // @ts-ignore 
      setVeraxSdk(veraxSdkInstance);
    };

    initVeraxSdk();
  }, []);
  // @ts-ignore 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!veraxSdk) {
      console.error('Verax SDK not initialized');
      return;
    }
    console.log(veraxSdk)
    const SCHEMA = '(bool hasCompletedTutorial)';
    // @ts-ignore 
    const schemahash = await veraxSdk.schema.create(
      "SocialAttest",
      "Attestations for social media posts to verify authenticity",
      "https://socialattest.vercel.app",
      SCHEMA
    );
    //   const receipt = await useTransactionReceipt({
    //     hash: schemahash,
    // });
    const receipt = await provider.waitForTransaction(schemahash)
    // @ts-ignore 
    const schemaId = receipt.logs[0].topics[1];
    console.log(schemaId)
    // @ts-ignore 
    const portalhash = await veraxSdk.portal.deployDefaultPortal(
      [],
      "SocialAttest Portal",
      "SocialAttest Portal",
      false,
      "SocialAttest"

    );
    //   const receiptp = await useTransactionReceipt({
    //     hash: portalhash,
    // });
    const receiptp = await provider.waitForTransaction(portalhash)
    // @ts-ignore 
    const portalId = receiptp.logs[0].topics[1];
    console.log(portalId)
    // @ts-ignore 
    const txHash = await veraxSdk.portal.attest(
      portalId,
      {
        schemaId,
        expirationDate: Math.floor(Date.now() / 1000) + 2592000000, // 300000 days
        subject: address,
        attestationData: [{
          socialUrl: socialUrl,
          additionalNotes: additionalNotes
        }],
      },
      []
    );


    console.log('Attestation submitted, transaction hash:', txHash);


    console.log({ socialUrl, additionalNotes });

    setSocialUrl('');
    setAdditionalNotes('');
  };
  // @ts-ignore 
  const handleLuksoSubmit = async (e) => {
    e.preventDefault();
    const schemaId = "0x556998c7ff05b496d8b0eaf248fb2c492e49b699e104f587ec65def9b55fd1cd"


    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = provider.getSigner();
    const contractAddress = '0xD6302d3bDDb59Da0217B4A04778d3642A379dA0E';
    const contractABI = EAS_ABI


    const contract = new ethers.Contract(contractAddress, contractABI, signer);


    const recipient = address;
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const revocable = false;
    const refUID = ethers.constants.HashZero;
    console.log(socialUrl)
    const data = ethers.utils.defaultAbiCoder.encode(['string', 'string'], [socialUrl, additionalNotes]);
    const value = 0;
    console.log(refUID)

    // Construct the AttestationRequest parameter
    // const attestationRequest = {
    //   schema: schemaId,
    //   data: {
    //     recipient,
    //     expirationTime,
    //     revocable,
    //     refUID,
    //     data,
    //     value,
    //   },
    // };

    const concatenatedData = socialUrl + "|" + additionalNotes;


    const encodedData = ethers.utils.toUtf8Bytes(concatenatedData);



    const attestationRequest = {
      schema: schemaId,
      data: {
        recipient,
        expirationTime,
        revocable,
        refUID,
        data: encodedData,
        value,
      },
    };

    try {
      // Call the attest function
      const tx = await contract.attest(attestationRequest);
      const receipt = await tx.wait();
      console.log('Attestation successful, transaction receipt:', receipt);

      // @ts-ignore 
      const attestedEvent = receipt.events?.find((e) => e.event === "Attested");
      const uid = attestedEvent?.args?.uid;
      console.log(attestedEvent)
      console.log('New Attestation UID:', uid);
      setAttUid(`${uid}`)

      setSocialUrl('');
      setAdditionalNotes('');
    } catch (error) {
      console.error('Attestation failed:', error);
    }

  };

  // const handleRelayLukso = async (e) => {
  //   e.preventDefault();


  //   const provider = new ethers.providers.Web3Provider(window.ethereum);
  //   await window.ethereum.request({ method: 'eth_requestAccounts' });
  //   const signer = provider.getSigner();


  //   const universalProfileAddress = '0xC88445E297B138ebF4AaAeD136c4D4Eb70df733f';
  //   const universalProfile = new ethers.Contract(universalProfileAddress, UniversalProfileContract.abi, signer);

  //   const keyManagerAddress = await universalProfile.owner();
  //   const keyManager = new ethers.Contract(keyManagerAddress, KeyManagerContract.abi, signer);

  // //relay call params for attesting
  //   const schemaId = "0x556998c7ff05b496d8b0eaf248fb2c492e49b699e104f587ec65def9b55fd1cd";
  //   const recipient = address;
  //   const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  //   const revocable = false;
  //   const refUID = ethers.constants.HashZero;
  //   const data = ethers.utils.defaultAbiCoder.encode(['string', 'string'], [socialUrl, additionalNotes]);
  //   const value = 0;

  //   const abiPayload = universalProfile.interface.encodeFunctionData('execute', [
  //     0, // Operation type: CALL
  //     recipient,
  //     ethers.utils.parseEther('0'), // No LYX transfer
  //     data,
  //   ]);

  //   const channelId = 0;
  //   const nonce = await keyManager.getNonce(address, channelId);
  //   const validityTimestamps = 0;

  //   // Sign the transaction
  //   const { chainId } = await provider.getNetwork();
  //   const encodedMessage = ethers.utils.solidityPack(
  //     ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes'],
  //     [25, chainId, nonce, validityTimestamps, value, abiPayload]
  //   );

  //   const eip191Signer = new EIP191Signer();
  //   const controllerPrivateKey = process.env.NEXT_PUBLIC_PRIVKEY || ''; // Be cautious with the private key
  //   const { signature } = await eip191Signer.signDataWithIntendedValidator(
  //     keyManagerAddress,
  //     encodedMessage,
  //     controllerPrivateKey,
  //   );

  //   try {
  //     // Execute via executeRelayCall
  //     const tx = await keyManager.executeRelayCall(signature, nonce, validityTimestamps, abiPayload, { from: signer.address });
  //     const receipt = await tx.wait();
  //     console.log('Relayed Attestation successful, transaction receipt:', receipt);
  //   } catch (error) {
  //     console.error('Relayed Attestation failed:', error);
  //   }
  // };
  // @ts-ignore  
  async function handleLuksoRelayer(e) {
    e.preventDefault();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = provider.getSigner();
    const universalProfileAddress = '0xC88445E297B138ebF4AaAeD136c4D4Eb70df733f';
    const universalProfile = new ethers.Contract(universalProfileAddress, UniversalProfileContract.abi, signer);
    const controllerPrivateKey = process.env.NEXT_PUBLIC_PRIVKEY || '';
    const keyManagerAddress = await universalProfile.owner();
    const keyManager = new ethers.Contract(keyManagerAddress, KeyManagerContract.abi, signer);

    const controllerAccount = new ethers.Wallet(controllerPrivateKey, provider);





    // EAS contract setup
    const easContractAddress = '0xD6302d3bDDb59Da0217B4A04778d3642A379dA0E';
    const easContractABI = EAS_ABI
    const easContract = new ethers.Contract(easContractAddress, easContractABI, controllerAccount);

    // Prepare the EAS contract function call
    const schemaId = "0x556998c7ff05b496d8b0eaf248fb2c492e49b699e104f587ec65def9b55fd1cd";
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const revocable = false;
    const refUID = ethers.constants.HashZero;
    const data = ethers.utils.defaultAbiCoder.encode(['string', 'string'], [socialUrl, additionalNotes]);
    const value = 0;

    const easFunctionCallData = easContract.interface.encodeFunctionData('attest', [{
      schema: schemaId,
      data: {
        recipient: address,
        expirationTime,
        revocable,
        refUID,
        data,
        value,
      },
    }]);

    // Sign the transaction
    const channelId = 0;
    const nonce = await keyManager.getNonce(controllerAccount.address, channelId);
    const validityTimestamps = 0;
    const { chainId } = await provider.getNetwork();

    const encodedMessage = ethers.utils.solidityPack(
      ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes'],
      [LSP25_VERSION, chainId, nonce, validityTimestamps, value, easFunctionCallData]
    );

    const signature = await controllerAccount.signMessage(ethers.utils.arrayify(ethers.utils.keccak256(encodedMessage)));

    // Send the signed transaction data to the relayer service
    try {
      const relayResponse = await keyManager.executeRelayCall(signature, nonce, validityTimestamps, easFunctionCallData);
      console.log('Transaction relayed successfully:', relayResponse);
    } catch (error) {
      console.error('Error relaying transaction:', error);
    }
  }
  const getAttestation = async () => {
    try {


      const provider = new ethers.providers.Web3Provider(window.ethereum);



      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = provider.getSigner();





      const contractAddress = '0xD6302d3bDDb59Da0217B4A04778d3642A379dA0E';
      const contractABI = EAS_ABI


      const contract = new ethers.Contract(contractAddress, contractABI, signer);



      const attestationData = await contract.getAttestation(uid);

      console.log(attestationData)



      const decodedString = parseAttestation(attestationData.data)
      console.log(decodedString)

      const erc725js = new ERC725(lsp3ProfileSchema, `0xC88445E297B138ebF4AaAeD136c4D4Eb70df733f`, 'https://rpc.testnet.lukso.gateway.fm',
        {
          ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
        },
      );
      const profileData = await erc725js.getData();
      console.log(profileData);

      setAttData(JSON.stringify(decodedString));

      try {
        // Find the LSP3Profile entry and extract the IPFS URL
        const lsp3ProfileEntry = profileData.find(entry => entry.name === "LSP3Profile");
           // @ts-ignore 
        if (!lsp3ProfileEntry || !lsp3ProfileEntry.value || !lsp3ProfileEntry.value.url) {
          throw new Error("LSP3Profile entry or IPFS URL not found");
        }
        // @ts-ignore 
        const ipfsUrl = lsp3ProfileEntry.value.url.replace("ipfs://", "https://ipfs.io/ipfs/"); // Convert IPFS URL to a gateway URL

        // Fetch the profile data from IPFS
        const response = await fetch(ipfsUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch profile data from IPFS");
        }
        const profileJson = await response.json();

        // Extract the name
        const name = profileJson.LSP3Profile.name;
        if (!name) {
          throw new Error("Name field not found in LSP3Profile data");
        }

        setLuksoName(name)

        console.log("Extracted name:", name);
        return name; // Return the name if needed
      } catch (error) {
        console.error("Error extracting name from LSP3Profile:", error);
        return null; // Return null or handle the error as needed
      }

    } catch (error) {
      console.error('Error fetching attestation:', error);
      setAttData('Error fetching attestation');
    }
  };
  // @ts-ignore 
  function parseAttestation(hexString) {

    const cleanHexString = hexString.startsWith('0x') ? hexString.slice(2) : hexString;


    const decodedString = Buffer.from(cleanHexString, 'hex').toString('utf8');


    const [url, note] = decodedString.split('|');


    return {
      url,
      note
    };
  }

  return (
    <div className="flex flex-col gap-12 w-full items-center px-4 md:px-8 lg:px-12">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
        <input
          type="text"
          placeholder="Social URL"
          value={socialUrl}
          onChange={(e) => setSocialUrl(e.target.value)}
          className="form-input mt-4 w-full rounded-full py-2 px-4 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
        <textarea
          placeholder="Additional notes"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className="form-textarea mt-4 w-full rounded-2xl py-2 px-4 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          rows={4}
        />
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full transition ease-in duration-200"
          >
            Attest on Linea
          </button>
          <button
            onClick={handleLuksoSubmit}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded-full transition ease-in duration-200"
          >
            Attest on Lukso
          </button>
          <button
            onClick={handleLuksoRelayer}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-8 rounded-full transition ease-in duration-200"
          >
            Attest on Lukso - Gasless
          </button>
        </div>
        {attUid && <p className="mt-6 text-gray-700">Attestation UID: {attUid}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mt-12 flex flex-col md:flex-row items-center gap-4">
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Enter UID"
          className="form-input w-full rounded-full py-2 px-4 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
        <button
          onClick={getAttestation}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-8 rounded-full transition ease-in duration-200"
        >
          Get Attestation
        </button>
      </div>

      {attData && <div className="mt-6 text-gray-700">attestation : {attData} by  lukso user - {luksoName}</div>}
    </div>

  );
};

export default Home;
