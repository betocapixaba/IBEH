export interface ChurchSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  heroUrl?: string;
}

export interface AdminAccount {
  id: string; // Document ID/Username
  username: string;
  password?: string; // Stored password
  role: 'super_admin' | 'editor';
  permissions: {
    settings: boolean;
    services: boolean;
    events: boolean;
    gallery: boolean;
    accounts: boolean;
  };
}

export interface Service {
  id: string;
  day: string;
  time: string;
  description: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  description: string;
  isFeatured: boolean;
  time?: string;
  location?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  url: string;
  type: 'photo' | 'video';
  eventName?: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

