
// Global type declarations for NPCL Dashboard
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
  
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      parameters?: {
        event_category?: string;
        value?: number;
        metric_rating?: string;
        custom_parameter_1?: string;
      }
    ) => void;
  }
}

// Module declarations
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

export {};
