// Global type declarations for marketing pixels

declare global {
  interface Window {
    // Meta (Facebook) Pixel
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq?: unknown;

    // TikTok Pixel
    ttq?: {
      load: (id: string) => void;
      page: () => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      instance: (id: string) => unknown;
    };

    // Google Tag Manager dataLayer
    dataLayer: Record<string, unknown>[];
  }
}

export {};
