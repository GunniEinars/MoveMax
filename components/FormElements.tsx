import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', type, ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-brand-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          className={`block w-full rounded-lg border-gray-300 shadow-sm 
            focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2.5 px-3 
            bg-white text-gray-900 placeholder:text-gray-400 [color-scheme:light]
            transition-colors
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 hover:border-brand-400'} 
            ${className}`}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-brand-700 mb-1">
        {label}
      </label>
      <select
        className={`block w-full rounded-lg border-gray-300 shadow-sm 
          focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2.5 px-3 
          bg-white text-gray-900 [color-scheme:light]
          transition-colors
          ${error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 hover:border-brand-400'}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>
      <button
        type="button"
        className={`${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};