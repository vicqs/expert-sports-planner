import React from 'react';
import './Skeleton.css';

/**
 * Skeleton Loader for loading states
 * @param {string} variant - text | title | circle | rectangle
 * @param {number} width - Custom width
 * @param {number} height - Custom height
 * @param {number} count - Number of repeated skeletons
 */
const Skeleton = ({
    variant = 'text',
    width,
    height,
    count = 1,
    className = ''
}) => {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    const variantClass = `skeleton-${variant}`;
    const style = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <>
            {skeletons.map((_, i) => (
                <div
                    key={i}
                    className={`skeleton ${variantClass} ${className}`}
                    style={style}
                />
            ))}
        </>
    );
};

export default Skeleton;
