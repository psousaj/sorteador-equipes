import React from 'react';

interface Props {
  icon: string;
  onClick?: () => void;
  dark?: boolean;
  disabled?: boolean;
  label?: string;
}

export function MenuButton({ icon, onClick, dark, disabled, label }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all
        ${dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={label}
    >
      {icon}
    </button>
  );
}
