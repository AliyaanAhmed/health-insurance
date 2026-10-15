import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe,
  Heartbeat,
  Info,
  List,
  ShieldCheck,
  User,
  Users,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { art, coverageOptions } from './health'
import type { CoverageTarget } from './health'
import { useLanguage } from './language-context'
import { Modal, PrimaryButton } from './ui'

export function Header({ page }: { page: string }) {
  const { t, locale, toggle } = useLanguage()
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main-content')
          if (main) {
            main.tabIndex = -1
            main.focus()
          }
        }}
      >
        {t('Skip to content')}
      </a>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="InsureAI Health">
          <Heartbeat className="brand-symbol" weight="duotone" />
          <span>
            <b>InsureAI</b>
            <span className="brand-product">Health</span>
          </span>
        </a>
        <nav
          className={`main-nav ${menu ? 'nav-open' : ''}`}
          aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
        >
          <a
            href="#/"
            aria-current={page !== 'inquiries' ? 'page' : undefined}
            onClick={() => setMenu(false)}
          >
            {t('Home')}
          </a>
          <a
            href="#/inquiries"
            aria-current={page === 'inquiries' ? 'page' : undefined}
            onClick={() => setMenu(false)}
          >
            {t('My Inquiries')}
          </a>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="language-button"
            onClick={toggle}
            aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe size={19} />
            <span lang="en" className={locale === 'en' ? 'language-current' : ''}>
              EN
            </span>
            <span className="language-divider">/</span>
            <span lang="ar" className={locale === 'ar' ? 'language-current' : ''}>
              العربية
            </span>
          </button>
          <button className="button header-help" onClick={() => setHelp(true)}>
            {t('How it works')}
            <ArrowUpRight size={17} className="directional" />
          </button>
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label={locale === 'ar' ? 'القائمة' : 'Menu'}
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            {menu ? <X /> : <List />}
          </button>
        </div>
      </header>
      <Modal title="A little guidance." open={help} onClose={() => setHelp(false)}>
        <div className="help-steps">
          {[
            ['Tell us who needs cover', 'Start with yourself, your family, or your dependents.'],
            [
              'Add a few details',
              'We’ll guide you through your visa, your details and each family member.',
            ],
            [
              'Review at your own pace',
              'See every answer in your summary and edit it whenever you need.',
            ],
          ].map(([title, body], i) => (
            <div key={title}>
              <span className="help-number">{i + 1}</span>
              <div>
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </div>
            </div>
          ))}
        </div>
        <PrimaryButton onClick={() => setHelp(false)}>{t('Got it')}</PrimaryButton>
      </Modal>
    </>
  )
}
export function CoverageArtwork({ target }: { target: CoverageTarget }) {
  return (
    <span className={`coverage-art ${target}`} aria-hidden="true">
      {target === 'self' ? (
        <img src={art.man} alt="" />
      ) : target === 'self_and_dependents' ? (
        <img src={art.family} alt="" />
      ) : (
        <>
          <img src={art.father} alt="" />
          <img src={art.mother} alt="" />
        </>
      )}
    </span>
  )
}
export function Landing({
  onChoose,
  resume,
}: {
  onChoose: (target: CoverageTarget) => void
  resume?: () => void
}) {
  const { t } = useLanguage()
  return (
    <main className="landing" id="main-content">
      <div className="hero-copy">
        <p className="eyebrow">{t('Health insurance')}</p>
        <h1 tabIndex={-1}>
          {t('Your health.')}
          <br />
          <span>{t('One less worry.')}</span>
        </h1>
        <p className="hero-support">
          {t('Health cover for you and the people you love.')}
          <br className="desktop-break" />
          {t('Let’s find your fit, one simple step at a time.')}
        </p>
        <h2 className="coverage-question">{t('Who are we caring for?')}</h2>
        <div className="coverage-choices">
          {coverageOptions.map((option) => (
            <a
              href={`#/inquiry/cover/0?for=${option.value}`}
              key={option.value}
              className="coverage-choice"
              onClick={(event) => {
                event.preventDefault()
                onChoose(option.value)
              }}
            >
              <span className="coverage-choice-icon" aria-hidden="true">
                {option.value === 'self' ? <User size={23} /> : option.value === 'self_and_dependents' ? <UsersThree size={23} /> : <Users size={23} />}
              </span>
              <span className="coverage-choice-copy">
                <strong>{t(option.label)}</strong>
                <span>{t(option.helper)}</span>
              </span>
              <span className="choice-arrow">
                <ArrowUpRight size={17} className="directional" />
              </span>
            </a>
          ))}
        </div>
        <div className="landing-helper">
          {resume && (
            <button type="button" onClick={resume}>
              {t('Resume')}
              <ArrowRight size={14} className="directional" />
            </button>
          )}
        </div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-photo"
          src={art.hero}
          alt="A doctor speaking with a mother and child."
          width="1536"
          height="1024"
          fetchPriority="high"
        />
        <div className="care-pill">
          <Heartbeat weight="fill" size={25} />
          <span>{t('Care starts with the right cover')}</span>
        </div>
        <img className="hero-glass-tile" src={art.glass} alt="" width="1312" height="1199" />
      </div>
    </main>
  )
}

export function Success({ onInquiries }: { onInquiries: () => void }) {
  const { t } = useLanguage()
  return (
    <main className="centered-page success-page" id="main-content">
      <div className="success-visual">
        <img src={art.shield} alt="" width="1254" height="1254" />
        <span>
          <Check weight="bold" />
        </span>
      </div>
      <p className="eyebrow">{t('Prepared in this session')}</p>
      <h1>{t('Your inquiry preview is ready.')}</h1>
      <p>{t('You’ve brought everyone’s details together.')}</p>
      <div className="demo-notice">
        <Info size={19} />
        {t('Local preview only. No inquiry has been submitted.')}
      </div>
      <PrimaryButton onClick={onInquiries}>{t('View my inquiries')}</PrimaryButton>
      <a className="text-link" href="#/">
        {t('Back to home')}
      </a>
    </main>
  )
}
export function EmptyInquiries({ onStart }: { onStart: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="empty-inquiries">
      <ShieldCheck size={45} weight="duotone" />
      <h2>{t('Your next step starts here.')}</h2>
      <p>{t('Prepared inquiries appear here during this visit.')}</p>
      <PrimaryButton onClick={onStart}>{t('Start an inquiry')}</PrimaryButton>
    </div>
  )
}
