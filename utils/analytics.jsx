// Your Measurement ID from Google Analytics
export const GA_MEASUREMENT_ID = 'G-JSSNN9R41G';

// Track page views manually (useful for SPA route changes)
export const trackPageView = (url, title) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: title,
      page_location: url,
    });
  }
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Game-specific tracking functions
export const trackGameEvent = (game, action, details = {}) => {
  trackEvent(action, 'Game', `${game} - ${action}`, details.value);
};

// User authentication tracking
export const trackAuth = (action) => {
  trackEvent(action, 'Authentication', action);
};

// Navigation tracking
export const trackNavigation = (destination) => {
  trackEvent('navigate', 'Navigation', destination);
};

// Button/interaction tracking
export const trackInteraction = (element, action) => {
  trackEvent(action, 'Interaction', element);
};