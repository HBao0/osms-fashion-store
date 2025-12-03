import React, { useEffect, useRef, useState } from 'react';

interface PhoneInputProps {
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

type Country = { name: string; code: string; dial_code: string; flag: string };

const COUNTRIES: Country[] = [
    { name: 'Việt Nam', code: 'VN', dial_code: '+84', flag: '🇻🇳' },
    { name: 'Vương quốc Anh', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
    { name: 'Mỹ', code: 'US', dial_code: '+1', flag: '🇺🇸' },
    { name: 'Pháp', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
    { name: 'Úc', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
    { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
    { name: 'Indonesia', code: 'ID', dial_code: '+62', flag: '🇮🇩' },
    { name: 'Uzbekistan', code: 'UZ', dial_code: '+998', flag: '🇺🇿' },
    { name: 'Uruguay', code: 'UY', dial_code: '+598', flag: '🇺🇾' },
    // ... add more as needed
];

const detectPrefix = (value?: string) => {
    if (!value) return '+84';
    const m = value.match(/^(\+\d{1,4})/);
    return m ? m[1] : '+84';
};

const stripPrefix = (value?: string) => {
    if (!value) return '';
    return value.replace(/^(\+\d{1,4})/, '').trim();
};

const PhoneInput: React.FC<PhoneInputProps> = ({ name, value, onChange, placeholder, required, className }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement | null>(null);

    const prefix = detectPrefix(value);
    const local = stripPrefix(value);

    const selected = COUNTRIES.find(c => c.dial_code === prefix) || COUNTRIES[0];

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLocal = e.target.value;
        onChange && onChange(`${selected.dial_code}${newLocal}`);
    };

    const handleSelect = (c: Country) => {
        setMenuOpen(false);
        // If there is an existing local part, keep it and swap prefix
        const newVal = `${c.dial_code}${local}`;
        onChange && onChange(newVal);
    };

    const list = COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.dial_code.includes(query));

    return (
        <div className={`relative ${className || ''}`} ref={ref}>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMenuOpen(v => !v)} className="flex items-center justify-center w-10 h-10 rounded-md border border-border bg-background text-sm">
                    <span className="text-lg mr-1" aria-hidden>{selected.flag}</span>
                    <svg className="w-3 h-3 text-text-light" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
                </button>
                <span className="text-sm text-text-light select-none">{selected.dial_code}</span>

                <input
                    type="tel"
                    name={name}
                    value={local}
                    onChange={handleLocalChange}
                    placeholder={placeholder}
                    required={required}
                    className="flex-1 p-2 bg-background border border-border rounded"
                    aria-label="Số điện thoại"
                />
            </div>

            {menuOpen && (
                <div className="absolute left-0 mt-2 w-80 max-h-72 overflow-auto bg-background border border-border rounded shadow z-50">
                    <div className="p-2">
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm quốc gia hoặc mã" className="w-full p-2 border border-border rounded" />
                    </div>
                    <ul>
                        {list.map(c => (
                            <li key={c.code}>
                                <button onClick={() => handleSelect(c)} className="w-full text-left px-4 py-3 hover:bg-primary/10 flex items-center gap-3">
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="flex-1">{c.name}</span>
                                    <span className="text-text-light">{c.dial_code}</span>
                                </button>
                            </li>
                        ))}
                        {list.length === 0 && (
                            <li className="px-4 py-2 text-text-light">Không tìm thấy quốc gia</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
