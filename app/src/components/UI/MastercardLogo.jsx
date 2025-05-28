import React from 'react';

const MastercardLogo = ({ size = "h-8 w-auto" }) => { // Increased default size
  return (
    <div className={`flex items-center ${size}`}>
      <div className="h-[20px] w-[20px] md:h-[24px] md:w-[24px] bg-red-500 rounded-full"></div>
      <div className="h-[20px] w-[20px] md:h-[24px] md:w-[24px] bg-yellow-500 rounded-full -ml-2 opacity-90"></div> {/* -ml-3 for more overlap */}
    </div>
  );
};

export default MastercardLogo;