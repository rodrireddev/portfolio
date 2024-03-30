import {
  GradientText,
  Newsletter,
  Section,
} from 'astro-boilerplate-components';

const CTA = () => (
  <Section>
    <Newsletter
      title={
        <>
          Soon subscribe to my <GradientText>Newsletters</GradientText>
        </>
      }
      description="Exciting updates are in the works! Soon, you'll be able to subscribe to my newsletters and stay in the loop with the latest insights, trends, and projects. Join a community of like-minded individuals passionate about technology, innovation, and creativity. Be the first to know about upcoming events, exclusive content, and special offers directly to your inbox. Stay tuned for when subscription becomes available and be part of the journey!"
    />
  </Section>
);

export { CTA };
