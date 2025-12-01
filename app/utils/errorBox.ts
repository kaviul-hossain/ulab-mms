/**
 * Utility to scroll to an error box and apply glow animation
 * @param elementId - The ID of the error box element
 */
export function scrollToErrorBox(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Scroll to element with offset for better visibility
  const yOffset = -100; // 100px above the element
  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
  
  window.scrollTo({ top: y, behavior: 'smooth' });

  // Add glow animation
  element.classList.add('animate-error-glow');
  
  // Remove animation class after it completes (1.2s = 0.6s * 2 iterations)
  setTimeout(() => {
    element.classList.remove('animate-error-glow');
  }, 1200);
}

/**
 * Utility to create a ref callback that handles error box scrolling
 * Usage: <div ref={createErrorBoxRef(error, 'error-box-id')}>
 */
export function createErrorBoxRef(hasError: boolean, elementId: string) {
  return (node: HTMLElement | null) => {
    if (node && hasError) {
      // Set the ID if not already set
      if (!node.id) {
        node.id = elementId;
      }
      // Small delay to ensure DOM is ready
      setTimeout(() => scrollToErrorBox(elementId), 100);
    }
  };
}
