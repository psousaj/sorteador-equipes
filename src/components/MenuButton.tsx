import React, { useState, useRef } from 'react';

interface Props {
  icon: string;
  onClick?: () => void;
  dark?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function MenuButton({ icon, onClick, dark, disabled, label, description }: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const showTooltip = () => {
    timerRef.current = setTimeout(() => {
      setTooltipVisible(true);
    }, 500);
  };

  const hideTooltip = () => {
    clearTimeout(timerRef.current ?? undefined);
    setTooltipVisible(false);
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onTouchStart={showTooltip}
      onTouchEnd={hideTooltip}
      onTouchMove={hideTooltip}
      onTouchCancel={hideTooltip}
      className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all
        ${dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={label}
    >
      {icon}
      {tooltipVisible && description && (
        <div className="absolute bottom-full mb-2 z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {description}
        </div>
      )}
    </button>
  );
}
