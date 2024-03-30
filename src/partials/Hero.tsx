import {
  GradientText,
  HeroAvatar,
  HeroSocial,
  Section,
} from 'astro-boilerplate-components';

const Hero = () => (
  <Section>
    <HeroAvatar
      title={
        <>
          Hi there, I'm <GradientText>Rodrigo</GradientText> 👋
        </>
      }
      description={
        <>
          As a fullstack developer, I thrive on creating seamless digital
          experiences from end to end. With a deep understanding of both
          frontend and backend development, I excel at crafting intuitive user
          interfaces that seamlessly integrate with robust server-side
          architectures. From conceptualizing user interactions to implementing
          scalable{' '}
          <a className="text-cyan-400 hover:underline" href="/">
            solutions.{' '}
          </a>
          I am passionate about bridging the gap between design and
          functionality. My versatile
          <a className="text-cyan-400 hover:underline" href="/">
            {' '}
            skill{' '}
          </a>
          set allows me to tackle a wide range of challenges, ensuring that
          every project I undertake meets the highest standards of performance,
          usability, and innovation. malesuada nisi tellus, non imperdiet nisi
          tempor at. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore.
        </>
      }
      avatar={
        <img
          className="h-80 w-64"
          src="/assets/images/avatar.svg"
          alt="Avatar"
          loading="lazy"
        />
      }
      socialButtons={
        <>
          {/* <a href="/">
            <HeroSocial
              src="/assets/images/twitter-icon.png"
              alt="Twitter icon"
            />
          </a>
          <a href="/">
            <HeroSocial
              src="/assets/images/facebook-icon.png"
              alt="Facebook icon"
            />
          </a> */}
          <a href="/">
            <HeroSocial
              src="/assets/images/linkedin-icon.png"
              alt="Linkedin icon"
            />
          </a>
          {/* <a href="/">
            <HeroSocial
              src="/assets/images/youtube-icon.png"
              alt="Youtube icon"
            />
          </a> */}
        </>
      }
    />
  </Section>
);

export { Hero };
