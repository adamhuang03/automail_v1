// components/ColdOutreach/types.ts
export type Prospect = {
    name: string;
    email: string;
    scheduledTime: string;
  }
  
  export type FirmGroup = {
    firm: string;
    prospects: Prospect[];
  }
  