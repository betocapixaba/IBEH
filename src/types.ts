export interface HistoryStep {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface ChurchSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  heroUrl?: string;
  historySteps?: HistoryStep[];
  mission?: string;
  vision?: string;
  values?: { label: string; color: string }[];
  pastorName?: string;
  pastorImageUrl?: string;
  pastorQuote?: string;
  pastorBio?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  welcomeTitle?: string;
  welcomeMessage?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroSubtitle?: string;
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
  longDescription?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  url: string; // The selected thumbnail/cover URL
  urls?: string[]; // Array of all photos in this post/album
  type: 'photo' | 'video';
  eventName?: string;
  description?: string; // Facebook-style post description
  hidden?: boolean; // Optional flag to hide album from visitors
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

export interface QuickNotice {
  id: string;
  title: string;
  content: string;
  bgColor: string;
  titleColor: string;
  contentColor: string;
  widthClass: string;
  heightClass: string;
  createdAt: string;
}


