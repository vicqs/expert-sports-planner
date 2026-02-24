import React from 'react';
import './Button.css';

/**
 * Modern Button Component with multiple variants
 * @param {string} variant - primary | secondary | accent | ghost | icon
 * @param {string} size - sm | md | lg
 * @param {boolean} loading - Show loading state
 * @param {ReactNode} children - Button content
 * @param {ReactNode} leftIcon - Icon before text
 * @param {ReactNode} rightIcon - Icon after text
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    const sizeClass = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg'
    }[size];

    const variantClass = `btn-${variant}`;

    return (
        <button
            className={`btn ${variantClass} ${sizeClass} ${loading ? 'btn-loading' : ''} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading ? (
                <span className="btn-spinner" />
            ) : (
                <>
                    {leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;
