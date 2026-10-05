import type { Profile, Project } from './types';

export const defaultProfile: Profile = {
  siteTitle: 'Your Name — Full-stack Developer',
  siteDescription: 'Portfolio of a full-stack developer: personal projects and professional work.',
  name: 'Your Name',
  role: 'Full-stack Developer',
  tagline: 'I design and build fast, accessible web products from database to pixel.',
  bio: 'Replace this text from the dashboard.\n\nI work across the stack with TypeScript, Astro, Web Components and serverless platforms.',
  avatarUrl: '',
  location: 'Remote',
  email: 'you@example.com',
  availability: 'Available for new projects',
  resumeUrl: '',
  socials: [
    { label: 'GitHub', url: 'https://github.com/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
  ],
  skills: [
    { group: 'Frontend', items: ['TypeScript', 'Astro', 'Web Components', 'CSS'] },
    { group: 'Backend', items: ['Node.js', 'Redis', 'PostgreSQL', 'REST'] },
    { group: 'Platform', items: ['Vercel', 'Docker', 'GitHub Actions'] },
  ],
  experience: [
    {
      company: 'Company Name',
      role: 'Senior Full-stack Developer',
      period: '2022 — Present',
      description: 'Describe what you built and the impact it had.',
    },
  ],
};

export const defaultProjects: Project[] = [
  {
    id: 'sample',
    slug: 'sample-project',
    title: 'Sample Project',
    summary: 'A placeholder project. Edit or delete it from the dashboard.',
    description: 'Describe the problem, your approach and the result.\n\nSeparate paragraphs with a blank line.',
    kind: 'personal',
    role: 'Solo developer',
    year: String(new Date().getFullYear()),
    tags: ['TypeScript', 'Astro'],
    images: [],
    youtubeUrl: '',
    repoUrl: '',
    liveUrl: '',
    featured: true,
    visible: true,
  },
];
