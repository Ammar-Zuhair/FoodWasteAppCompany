import { useState, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Reusable Searchable Select Component
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to select from. Each item should be an object.
 * @param {any} props.value - Selected value (usually ID)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.displayKey - Key to display in the dropdown (default: 'name')
 * @param {string} props.valueKey - Key to use as the value (default: 'id')
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label text
 * @param {boolean} props.required - Is field required
 * @param {boolean} props.disabled - Is field disabled
 * @param {boolean} props.loading - Is data loading
 * @param {string} props.className - Additional classes
 */
export default function SearchableSelect({
    items = [],
    value,
    onChange,
    displayKey = 'name',
    valueKey = 'id',
    placeholder = '',
    label,
    required = false,
    disabled = false,
    loading = false,
    className = '',
}) {
    const { language } = useLanguage();
    const [query, setQuery] = useState('');

    const selectedItem = useMemo(() => {
        return items.find((item) => item[valueKey] == value) || null;
    }, [items, value, valueKey]);

    const filteredItems = useMemo(() => {
        if (query === '') return items;
        return items.filter((item) => {
            const itemValue = item[displayKey];
            return itemValue ? itemValue.toLowerCase().includes(query.toLowerCase()) : false;
        });
    }, [items, query, displayKey]);

    // Handle selection
    const handleChange = (item) => {
        onChange(item ? item[valueKey] : null);
    };

    const isDark = false; // Could pass theme prop or context if needed, defaulting to light/neutral for now or use system classes

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className={`block mb-2 font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <Combobox value={selectedItem} onChange={handleChange} disabled={disabled || loading} nullable>
                <div className="relative mt-1">
                    <div className={`relative w-full cursor-default overflow-hidden rounded-lg border ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                        } text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm`}>

                        <ComboboxInput
                            className={`w-full border-none py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 ${isDark ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-900'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            displayValue={(item) => item ? item[displayKey] : ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={loading ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...') : placeholder}
                        />

                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </ComboboxButton>
                    </div>

                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg">
                        <ComboboxOptions className="max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50 bg-white dark:bg-slate-800">
                            {filteredItems.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                    {language === 'ar' ? 'لا توجد نتائج.' : 'Nothing found.'}
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <ComboboxOption
                                        key={item[valueKey]}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-teal-600 text-white' : 'text-gray-900 dark:text-gray-100'
                                            }`
                                        }
                                        value={item}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                    {item[displayKey]}
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-teal-600'
                                                        }`}>
                                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ComboboxOption>
                                ))
                            )}
                        </ComboboxOptions>
                    </div>
                </div>
            </Combobox>
        </div>
    );
}
