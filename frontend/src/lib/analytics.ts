declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

export const isProduction = import.meta.env.PROD;

export const initGA = () => {
  if (!GA_TRACKING_ID || !isProduction) {
    console.log('Google Analytics not initialized:', {
      hasTrackingId: !!GA_TRACKING_ID,
      isProduction
    });
    return;
  }

  if (typeof window !== 'undefined') {
    // Load the Google Analytics script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Configure Google Analytics
    script.onload = () => {
      if (window.gtag) {
        window.gtag('config', GA_TRACKING_ID, {
          page_title: document.title,
          page_location: window.location.href,
        });

        console.log('Google Analytics initialized with ID:', GA_TRACKING_ID);
      }
    };
  }
};

export const trackPageView = (url: string, title?: string) => {
  if (!GA_TRACKING_ID || !isProduction) {
    console.log('Page view tracked (dev mode):', url);
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: title || document.title,
      page_location: url,
    });

    console.log('Page view tracked:', url);
  }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!GA_TRACKING_ID || !isProduction) {
    console.log('Event tracked (dev mode):', { action, category, label, value });
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });

    console.log('Event tracked:', { action, category, label, value });
  }
};

export const trackLogin = (method: string) => {
  trackEvent('login', 'authentication', method);
};

export const trackSignup = (method: string) => {
  trackEvent('sign_up', 'authentication', method);
};

export const trackCandidateAuth = (method: string) => {
  trackEvent('candidate_login', 'authentication', method);
};
