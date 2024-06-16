import { Section } from 'astro-boilerplate-components';

import bayerLogo from '../../public/assets/images/bayerLogo.svg';
import heycreditoLogo from '../../public/assets/images/heycreditoLogo.webp';
import percapitaLogo from '../../public/assets/images/percapitaLogo.png';
import raussaLogo from '../../public/assets/images/raussaLogo.png';
import reflektmeLogo from '../../public/assets/images/reflektmeLogo.svg';
import socialeLogo from '../../public/assets/images/sociale_White_logo_v2.png';

const Sponsors = () => (
  <Section title="Experience">
    <table className="mx-auto border-collapse">
      <tbody>
        <tr className="h-56">
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://sociale.com/"
              target="_blank"
              aria-label="Sociale web"
            >
              <span className="sr-only">Link to Sociale web</span>
              <img
                src={socialeLogo.src}
                alt="Sociale"
                width={260}
                height={224}
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://www.reflektme.com/"
              target="_blank"
              aria-label="Reflektme web"
            >
              <span className="sr-only">Link to Reflektme web</span>
              <img
                src={reflektmeLogo.src}
                alt="Reflektme"
                width={260}
                height={224}
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://play.google.com/store/apps/details?id=com.dialogotecnologico.raussa&hl=es_BO"
              aria-label="Download RAUSSA Diálogo Tecnológico, S.L. from Google Play"
            >
              <span className="sr-only">Link to Playstore web of RAUSSA</span>
              <img
                src={raussaLogo.src}
                alt="RAUSSA Diálogo Tecnológico, S.L."
                width={260}
                height={224}
              />
            </a>
          </td>
        </tr>
        <tr className="h-56">
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://percapita.mx/"
              target="_blank"
              aria-label="Visitar Percapita MX sitio web"
            >
              <span className="sr-only">Link to Percapita</span>
              <img
                src={percapitaLogo.src}
                alt="Percapita MX"
                width={260}
                height={224}
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://heycreditos.com.ar/"
              target="_blank"
              aria-label="Visitar Hey Créditos sitio web"
            >
              <span className="sr-only">Link to Hey Créditos web</span>
              <img
                src={heycreditoLogo.src}
                alt="Hey Créditos"
                width={260}
                height={224}
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-3">
            <a
              href="https://www.agro.bayer.com.ar/"
              target="_blank"
              aria-label="Visitar Bayer sitio web"
            >
              <span className="sr-only">Link to Bayer web</span>

              <img src={bayerLogo.src} alt="Bayer" width={260} height={224} />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
);

export { Sponsors };
