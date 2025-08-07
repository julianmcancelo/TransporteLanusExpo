/**
 * Componentes de formulario mejorados con validación en tiempo real
 * y mejor experiencia de usuario
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TextInput as RNTextInput,
} from 'react-native';
import {
  TextInput,
  HelperText,
  Button,
  Chip,
  Menu,
  Divider,
} from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

import { ShakeView } from './AnimatedComponents';

interface EnhancedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  maxLength?: number;
  validator?: (value: string) => string | null;
  onValidation?: (isValid: boolean) => void;
  style?: any;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

/**
 * Campo de texto mejorado con validación en tiempo real
 */
export const EnhancedTextInput: React.FC<EnhancedTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  disabled = false,
  maxLength,
  validator,
  onValidation,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
}) => {
  const theme = useTheme();
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);
  const shakeRef = useRef<boolean>(false);
  const focusAnimation = useRef(new Animated.Value(0)).current;

  const currentError = error || internalError;
  const showError = hasBeenTouched && currentError;

  useEffect(() => {
    if (validator && hasBeenTouched) {
      const validationError = validator(value);
      setInternalError(validationError);
      onValidation?.(validationError === null);
    }
  }, [value, validator, hasBeenTouched, onValidation]);

  useEffect(() => {
    if (showError) {
      shakeRef.current = true;
    }
  }, [showError]);

  useEffect(() => {
    Animated.timing(focusAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnimation]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (hasBeenTouched && currentError) {
      // Re-validate on change if there was an error
      if (validator) {
        const validationError = validator(text);
        setInternalError(validationError);
        onValidation?.(validationError === null);
      }
    }
  };

  // Remove unused borderColor animation for now
  // const borderColor = focusAnimation.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: [
  //     showError ? theme.colors.error : theme.colors.border,
  //     showError ? theme.colors.error : theme.colors.primary,
  //   ],
  // });

  return (
    <ShakeView trigger={shakeRef.current} style={[styles.inputContainer, style]}>
      <View style={styles.inputWrapper}>
        <View style={styles.inputBorder}>
          <TextInput
            label={required ? `${label} *` : label}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            disabled={disabled}
            maxLength={maxLength}
            error={!!showError}
            mode="outlined"
            style={styles.textInput}
            left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
            right={
              rightIcon ? (
                <TextInput.Icon
                  icon={rightIcon}
                  onPress={onRightIconPress}
                />
              ) : undefined
            }
          />
        </View>
        {showError && (
          <HelperText type="error" visible={true}>
            {currentError}
          </HelperText>
        )}
        {maxLength && (
          <HelperText type="info" visible={true}>
            {value.length}/{maxLength}
          </HelperText>
        )}
      </View>
    </ShakeView>
  );
};

interface SearchableDropdownProps {
  label: string;
  value: string;
  onSelect: (value: string, item: any) => void;
  options: { label: string; value: string; [key: string]: any }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  style?: any;
}

/**
 * Dropdown con búsqueda
 */
export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  onSelect,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
  searchable = true,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (searchable && searchQuery) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options, searchable]);

  const selectedOption = options.find(option => option.value === value);

  const openMenu = () => setVisible(true);
  const closeMenu = () => {
    setVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.dropdownContainer, style]}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <TextInput
            label={required ? `${label} *` : label}
            value={selectedOption?.label || ''}
            placeholder={placeholder}
            error={!!error}
            disabled={disabled}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="chevron-down" onPress={openMenu} />}
            onPress={openMenu}
          />
        }
        contentStyle={styles.menuContent}
      >
        {searchable && (
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Buscar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
            />
            <Divider style={styles.searchDivider} />
          </View>
        )}
        {filteredOptions.map((option, index) => (
          <Menu.Item
            key={option.value}
            onPress={() => {
              onSelect(option.value, option);
              closeMenu();
            }}
            title={option.label}
            style={[
              styles.menuItem,
              option.value === value && styles.selectedMenuItem,
            ]}
          />
        ))}
        {filteredOptions.length === 0 && (
          <Menu.Item
            title="No se encontraron resultados"
            disabled
            style={styles.noResultsItem}
          />
        )}
      </Menu>
      {error && (
        <HelperText type="error" visible={true}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

interface TagInputProps {
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  maxTags?: number;
  suggestions?: string[];
  style?: any;
}

/**
 * Input para tags/etiquetas
 */
export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onTagsChange,
  placeholder = 'Escribir y presionar Enter',
  error,
  required = false,
  maxTags,
  suggestions = [],
  style,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  const filteredSuggestions = suggestions.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      (!maxTags || tags.length < maxTags)
    ) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      event.preventDefault();
      addTag(inputValue);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    setShowSuggestions(text.length > 0 && filteredSuggestions.length > 0);
  };

  return (
    <View style={[styles.inputContainer, ...(Array.isArray(style) ? style : [style])]}>
      <TextInput
        ref={inputRef}
        label={required ? `${label} *` : label}
        value={inputValue}
        onChangeText={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        error={!!error}
        mode="outlined"
        onFocus={() => setShowSuggestions(inputValue.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        right={
          inputValue ? (
            <TextInput.Icon
              icon="plus"
              onPress={() => addTag(inputValue)}
            />
          ) : undefined
        }
      />

      {/* Tags existentes */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              mode="outlined"
              onClose={() => removeTag(tag)}
              style={styles.tag}
            >
              {tag}
            </Chip>
          ))}
        </View>
      )}

      {/* Sugerencias */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.cardBackground }]}>
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <Button
              key={index}
              mode="text"
              onPress={() => addTag(suggestion)}
              style={styles.suggestionButton}
              contentStyle={styles.suggestionContent}
            >
              {suggestion}
            </Button>
          ))}
        </View>
      )}

      {error && (
        <HelperText type="error" visible={true}>
          {error}
        </HelperText>
      )}

      {maxTags && (
        <HelperText type="info" visible={true}>
          {tags.length}/{maxTags} etiquetas
        </HelperText>
      )}
    </View>
  );
};

interface FormValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  validateAll: () => boolean;
  validateSingle: (fieldName: string) => boolean;
  clearErrors: () => void;
  getError: (fieldName: string) => string | undefined;
}

interface FormField {
  name: string;
  value: any;
  validator?: (value: any) => string | null;
  required?: boolean;
}

/**
 * Hook para validación de formularios
 */
export const useFormValidation = (fields: FormField[]): FormValidationResult => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (field: FormField): string | null => {
    if (field.required && (!field.value || field.value.toString().trim() === '')) {
      return 'Este campo es requerido';
    }
    
    if (field.validator && field.value) {
      return field.validator(field.value);
    }
    
    return null;
  };

  const validateAll = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const validateSingle = (fieldName: string): boolean => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return true;

    const error = validateField(field);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || '',
    }));

    return !error;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const getError = (fieldName: string): string | undefined => {
    return errors[fieldName];
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validateAll,
    validateSingle,
    clearErrors,
    getError,
  };
};

/**
 * Validadores comunes
 */
export const validators = {
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },

  phone: (value: string): string | null => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Teléfono inválido';
  },

  minLength: (min: number) => (value: string): string | null => {
    return value.length >= min ? null : `Mínimo ${min} caracteres`;
  },

  maxLength: (max: number) => (value: string): string | null => {
    return value.length <= max ? null : `Máximo ${max} caracteres`;
  },

  numeric: (value: string): string | null => {
    return /^\d+$/.test(value) ? null : 'Solo números';
  },

  alphanumeric: (value: string): string | null => {
    return /^[a-zA-Z0-9]+$/.test(value) ? null : 'Solo letras y números';
  },

  required: (value: any): string | null => {
    return value && value.toString().trim() ? null : 'Campo requerido';
  },
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputBorder: {
    borderRadius: 4,
    borderWidth: 1,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  menuContent: {
    maxHeight: 300,
  },
  searchContainer: {
    padding: 8,
  },
  searchDivider: {
    marginTop: 8,
  },
  menuItem: {
    maxWidth: 300,
  },
  selectedMenuItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  noResultsItem: {
    opacity: 0.6,
  },
  tagInputContainer: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    marginBottom: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4,
    borderRadius: 4,
    maxHeight: 200,
  },
  suggestionButton: {
    justifyContent: 'flex-start',
    borderRadius: 0,
  },
  suggestionContent: {
    justifyContent: 'flex-start',
  },
});
