import { useEffect, useRef, useState } from 'react';

type TargetLanguageSelectProps = {
    value: string;
    onChange: (language: string) => void;
};

const targetLanguages = [
    { value: 'sr', label: 'Serbian', countryCode: 'rs' },
    { value: 'en', label: 'English', countryCode: 'gb' },
    { value: 'de', label: 'German', countryCode: 'de' },
    { value: 'fr', label: 'French', countryCode: 'fr' },
    { value: 'it', label: 'Italian', countryCode: 'it' },
    { value: 'es', label: 'Spanish', countryCode: 'es' },
];

function TargetLanguageSelect({ value, onChange }: TargetLanguageSelectProps) {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const selectedLanguage =
        targetLanguages.find((language) => language.value === value) ??
        targetLanguages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectLanguage = (language: string) => {
        onChange(language);
        setIsOpen(false);
    };

    return (
        <div className="target-language" ref={dropdownRef}>
            <span className="target-language-label">Translate to</span>

            <div className="language-dropdown">
                <button
                    type="button"
                    className="language-dropdown-trigger"
                    onClick={() => setIsOpen((current) => !current)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className="language-dropdown-value">
                        <span
                            className={`fi fi-${selectedLanguage.countryCode}`}
                            aria-hidden="true"
                        />
                        <span>{selectedLanguage.label}</span>
                    </span>

                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {isOpen && (
                    <div className="language-dropdown-menu" role="listbox">
                        {targetLanguages.map((language) => (
                            <button
                                key={language.value}
                                type="button"
                                className={
                                    language.value === value
                                        ? 'language-dropdown-option active'
                                        : 'language-dropdown-option'
                                }
                                onClick={() =>
                                    handleSelectLanguage(language.value)
                                }
                                role="option"
                                aria-selected={language.value === value}
                            >
                                <span
                                    className={`fi fi-${language.countryCode}`}
                                    aria-hidden="true"
                                />
                                <span>{language.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TargetLanguageSelect;