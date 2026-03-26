function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6.94 8.5V19M6.94 5.75a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5ZM11.88 19V13.06c0-1.44 1.16-2.6 2.6-2.6s2.6 1.16 2.6 2.6V19M11.88 11.44v-2.94M17.08 11.44v-1.12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 7.5h16v9H4zM4.5 8l7.5 5.5L19.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9.2 18.4c-3.4 1.02-3.4-1.53-4.76-1.87m9.52 3.74v-2.63c.02-.67-.21-1.33-.65-1.84c2.92-.33 5.99-1.43 5.99-6.49c0-1.29-.46-2.34-1.22-3.17c.12-.32.53-1.62-.12-3.37c0 0-1-.32-3.28 1.21a11.32 11.32 0 0 0-5.96 0C6.44 2.45 5.44 2.77 5.44 2.77c-.65 1.75-.24 3.05-.12 3.37c-.76.83-1.22 1.88-1.22 3.17c0 5.05 3.06 6.16 5.98 6.49c-.44.51-.67 1.17-.64 1.84v2.63"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const footerLinks = [
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/vinicius-dias-linck-a52349160/",
    icon: LinkedinIcon,
  },
  {
    id: "email",
    label: "linckv@hotmail.com",
    href: "mailto:linckv@hotmail.com",
    icon: MailIcon,
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/ViniciusLinck/GameGrid",
    icon: GithubIcon,
  },
];

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="Informacoes do desenvolvedor">
      <div className="site-footer-copy">
        <span className="site-footer-kicker">Developer</span>
        <strong>Vinicius Dias Linck</strong>
      </div>

      <div className="site-footer-links" aria-label="Links externos">
        {footerLinks.map(({ id, label, href, icon: Icon }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-link"
            aria-label={label}
          >
            <span className="site-footer-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>{label}</span>
          </a>
        ))}
      </div>
    </footer>
  );
}
