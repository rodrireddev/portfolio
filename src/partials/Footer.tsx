import { Section } from 'astro-boilerplate-components';

import { AppConfig } from '@/utils/AppConfig';

const Footer = () => (
  <Section>
    <footer>© Copyright 2024 by {AppConfig.site_name}</footer>
  </Section>
);

export { Footer };
