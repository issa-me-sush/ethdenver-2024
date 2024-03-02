import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
const Navbar = () => {
    return (

        <div className='w-full px-[2rem] md:px-[8rem]'>
        <nav className="flex justify-between items-center bg-white/30 backdrop-blur-lg border border-gray-200/50 rounded-full p-4 w-full mx-auto my-8 shadow-lg">
            <span className="text-lg font-semibold">Social Attest</span>
            <span className="text-lg font-semibold"><ConnectButton/></span>
        </nav>
        </div>
    );
};

export default Navbar;
