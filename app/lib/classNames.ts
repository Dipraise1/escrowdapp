/**
 * Utility function to conditionally join CSS class names together
 * 
 * @param {...(string|boolean|null|undefined|{[key: string]: boolean})[]} classes - CSS class names or objects with class names as keys and boolean conditions as values
 * @returns {string} - Combined class names string
 * 
 * Usage examples:
 * - classNames('btn', 'btn-primary') => 'btn btn-primary'
 * - classNames('btn', isActive && 'active') => 'btn active' or 'btn' if isActive is false
 * - classNames('btn', { active: isActive, disabled: isDisabled }) => conditionally adds classes based on values
 */
export function classNames(...classes: (string | boolean | null | undefined | {[key: string]: boolean})[]): string {
  return classes
    .filter(Boolean) // Filter out falsy values
    .map(className => {
      if (typeof className === 'string') {
        return className;
      } else if (typeof className === 'object' && className !== null) {
        return Object.entries(className)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .join(' ')
    .trim();
} 