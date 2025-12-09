import React from 'react';
import { Search, Filter } from 'lucide-react';

const SearchComponent = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative flex items-center justify-center group">
      {/* Animated Purple Gradient Border Effects */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-xl blur-[3px] 
                      before:absolute before:content-[''] before:z-[-2] before:w-[999px] before:h-[999px] 
                      before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[60deg]
                      before:bg-[conic-gradient(transparent,rgb(112,82,174)_5%,transparent_38%,transparent_50%,rgb(147,51,234)_60%,transparent_87%)] 
                      before:transition-all before:duration-[2000ms]
                      group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
      </div>

      {/* Inner glow layers */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-xl blur-[2px] 
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] 
                      before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                      before:bg-[conic-gradient(rgba(0,0,0,0),rgb(112,82,174),rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,rgb(147,51,234),rgba(0,0,0,0)_60%)] 
                      before:transition-all before:duration-[2000ms]
                      group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
      </div>

      {/* Main Search Container */}
      <div className="relative w-full">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="bg-gradient-to-r from-[#2D1B69] to-[#1A103C] border-none w-full h-[56px] rounded-xl text-white pl-14 pr-[70px] text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 transition-all"
        />
        
        {/* Very subtle purple overlay - UPDATED */}
        <div className="pointer-events-none w-[200px] h-[20px] absolute bg-gradient-to-r from-transparent to-purple-800/40 top-[18px] left-[70px] group-focus-within:hidden"></div>
        
        {/* Purple accent glow */}
        <div className="pointer-events-none w-[30px] h-[20px] absolute bg-purple-500 top-[10px] left-[5px] blur-2xl opacity-60 transition-all duration-[2000ms] group-hover:opacity-30"></div>
        
        {/* Filter Icon with animated border */}
        <div className="absolute h-[42px] w-[40px] overflow-hidden top-[7px] right-[7px] rounded-lg
                        before:absolute before:content-[''] before:w-[600px] before:h-[600px] 
                        before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[90deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),rgb(112,82,174),rgba(0,0,0,0)_50%,rgba(0,0,0,0)_50%,rgb(147,51,234),rgba(0,0,0,0)_100%)]
                        before:brightness-125 before:animate-spin-slow">
        </div>
        
        <div className="absolute top-2 right-2 flex items-center justify-center z-[2] h-10 w-[38px] overflow-hidden rounded-lg bg-gradient-to-b from-purple-900/40 via-[#1A103C] to-purple-900/40 border border-purple-500/20">
          <Filter className="w-5 h-5 text-purple-300" />
        </div>
        
        {/* Search Icon */}
        <div className="absolute left-5 top-[16px] z-10">
          <Search className="w-6 h-6 text-purple-300" />
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;