/**
 * Combobox - Selector con búsqueda integrada
 *
 * Componente empresarial que permite buscar y seleccionar opciones
 * escribiendo parte del nombre. Sin dependencias externas.
 *
 * Features:
 * - Búsqueda por texto mientras escribes
 * - Navegación con teclado (Arrow Up/Down, Enter, Escape)
 * - Opciones deshabilitadas
 * - Accesibilidad (ARIA)
 * - Cierre al hacer clic fuera
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
  ReactElement,
} from 'react';
import styles from './Combobox.module.css';

// ============================================
// TYPES
// ============================================

export interface ComboboxOption {
  /** Valor único de la opción */
  value: string;
  /** Texto a mostrar */
  label: string;
  /** Texto secundario (opcional) */
  sublabel?: string;
  /** Si la opción está deshabilitada */
  disabled?: boolean;
}

export interface ComboboxProps {
  /** Lista de opciones disponibles */
  options: ComboboxOption[];
  /** Valor seleccionado actualmente */
  value: string;
  /** Callback cuando cambia la selección */
  onChange: (value: string, option: ComboboxOption | null) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Si el combobox está deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** ID para accesibilidad */
  id?: string;
}

// ============================================
// COMPONENT
// ============================================

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  className = '',
  id,
}: ComboboxProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Encontrar la opción seleccionada
  const selectedOption = options.find(opt => opt.value === value) || null;

  // Filtrar opciones basado en búsqueda
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll al elemento resaltado
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Reset highlight cuando cambian las opciones filtradas
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchText]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleSelectOption = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return;

      onChange(option.value, option);
      setIsOpen(false);
      setSearchText('');
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= filteredOptions.length ? 0 : nextIndex;
          });
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => {
            const nextIndex = prev - 1;
            return nextIndex < 0 ? filteredOptions.length - 1 : nextIndex;
          });
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchText('');
        break;

      case 'Tab':
        setIsOpen(false);
        setSearchText('');
        break;
    }
  };

  const handleClear = () => {
    onChange('', null);
    setSearchText('');
    inputRef.current?.focus();
  };

  // Determinar qué mostrar en el input
  const displayValue = isOpen ? searchText : selectedOption?.label || '';

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className} ${disabled ? styles.disabled : ''}`}
    >
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          className={styles.input}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Icono de búsqueda o flecha */}
        <span className={styles.icon}>
          {isOpen ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </span>

        {/* Botón limpiar */}
        {value && !disabled && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Limpiar selección"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul ref={listRef} className={styles.dropdown} role="listbox" aria-label="Opciones">
          {filteredOptions.length === 0 ? (
            <li className={styles.noResults}>No se encontraron resultados</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                className={`
                  ${styles.option}
                  ${option.value === value ? styles.selected : ''}
                  ${option.disabled ? styles.optionDisabled : ''}
                  ${index === highlightedIndex ? styles.highlighted : ''}
                `}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.sublabel && (
                  <span className={styles.optionSublabel}>{option.sublabel}</span>
                )}
                {option.disabled && <span className={styles.optionBadge}>AGOTADO</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default Combobox;
