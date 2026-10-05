export interface Social {
  label: string;
  url: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Profile {
  siteTitle: string;
  siteDescription: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  email: string;
  availability: string;
  resumeUrl: string;
  socials: Social[];
  skills: SkillGroup[];
  experience: Experience[];
}

export interface ProjectImage {
  url: string;
  alt: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  kind: 'personal' | 'team';
  role: string;
  year: string;
  tags: string[];
  images: ProjectImage[];
  youtubeUrl: string;
  repoUrl: string;
  liveUrl: string;
  featured: boolean;
  visible: boolean;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
}
