import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * Qantonic marketing landing page — the public "/" (qantonic.arkaiver.com).
 *
 * A signed-in user never sees this; they're bounced straight to their real
 * page (owner -> config, platform_operator -> audit log). There is no admin
 * home behind "/" — this page is it for signed-out visitors.
 *
 * Light theme only, mobile-first (designed at 390px). Palette is applied with
 * explicit hex values so the admin app's dark-mode class can never reach it.
 *
 *   page          #FAFAF9
 *   cards / alt   #FFFFFF
 *   text          #18181B
 *   muted text    #71717A
 *   accent        #4F46E5   (primary CTAs and links only)
 *
 * Above-the-fold budget at 390x844 (the page's top constraint) — the hero copy
 * block is sized so HeroMedia always starts well above 844px:
 *
 *   nav                     64
 *   hero padding-top        24
 *   h1 (2 lines @32/1.15)   74
 *   gap                     12
 *   subhead (3 lines)       68
 *   gap                     16
 *   buttons (side by side)  44
 *   gap                     20
 *   -------------------------- =  322px  ->  media top
 *   media (292px @ 9:16)   519
 *   -------------------------- =  841px  <  844px viewport
 *
 * Measured in-browser at 390x844: media top 322px, bottom 841px — the whole
 * frame clears the fold. Keep the mobile subhead at or under three lines.
 *
 * Two things on this page move on their own — the hero chat plays message by
 * message, and the use-case section auto-advances. Both stop dead under
 * prefers-reduced-motion and render their finished state instead; see
 * usePrefersReducedMotion.
 */

const ACCENT = '#4F46E5'

/**
 * "Docs" points at the engine repo's public docs (config schema + ADRs) —
 * there is no docs site yet and "/docs" was a dead route. These are
 * engineering docs, not a setup guide for a business owner, so swap this for
 * a real docs URL once one exists.
 */
const DOCS_URL = 'https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent/tree/main/docs'

/**
 * Every "Book a setup call" on the page goes straight to Calendly. There is no
 * contact form and no in-app booking flow to build or maintain — the calendar
 * is the booking flow. The mailto is the stated backup for anyone who will not
 * or cannot use Calendly, so it sits next to every instance of the button
 * rather than only in the footer.
 */
const CALENDLY_URL = 'https://calendly.com/ramsey-arkaiver/30min'
const CONTACT_EMAIL = 'ramsey@arkaiver.com'

/* ------------------------------------------------------------ Motion prefs */

/**
 * Both self-playing sections consult this. Read once at mount *and* watched,
 * because the OS-level setting can flip while the page is open.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

/* ------------------------------------------------------------ Chat mockup */

/**
 * Stand-in for the real hero footage: a WhatsApp thread where the agent takes
 * an order end to end.
 *
 * This is the one place the page palette does not apply — it is standing in
 * for a screenshot, so it wears WhatsApp's colors, not Qantonic's.
 */
const CHAT = [
  { from: 'customer', text: 'Hey, are you open right now?' },
  {
    from: 'bot',
    text: "We're open 24/7! Our Jollof Rice Combo is ₵45 — want me to add it to your order?",
  },
  { from: 'customer', text: 'Yes, add it. Any drinks?' },
  { from: 'bot', text: "We've got Chapman, Zobo, or Coke — ₵10 each." },
  { from: 'customer', text: "Zobo please, and I'll pay on delivery" },
  {
    from: 'bot',
    text: 'Order confirmed — Jollof Combo + Zobo, ₵55 total, cash on delivery. On its way in 20 mins!',
  },
] as const

/**
 * The thread opens on the customer's first message already sent, so it reads
 * as a conversation in progress rather than one starting from an empty screen.
 */
const CHAT_START = 1

/** How long the finished thread sits before it replays from the top. */
const CHAT_LOOP_PAUSE_MS = 5000

/** Beat between a message landing and the agent starting to type back. */
const CHAT_THINK_MS = 550

/** How long a customer message waits before it sends. */
const CHAT_SEND_MS = 1100

/**
 * Typing time scales with the reply's length so the long confirmation takes
 * visibly longer than the short one — a fixed delay makes the dots read as a
 * spinner rather than as someone typing.
 */
function typingDuration(text: string) {
  return Math.min(2000, Math.max(750, text.length * 22))
}

function ChatMockup() {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(CHAT_START)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    // Reduced motion gets the whole transcript at once and no timers at all.
    if (reduced) {
      setShown(CHAT.length)
      setTyping(false)
      return
    }

    let timer: number

    if (shown >= CHAT.length) {
      timer = window.setTimeout(() => setShown(CHAT_START), CHAT_LOOP_PAUSE_MS)
    } else if (CHAT[shown].from === 'bot' && !typing) {
      timer = window.setTimeout(() => setTyping(true), CHAT_THINK_MS)
    } else {
      const wait = typing ? typingDuration(CHAT[shown].text) : CHAT_SEND_MS
      timer = window.setTimeout(() => {
        setShown((count) => count + 1)
        setTyping(false)
      }, wait)
    }

    return () => window.clearTimeout(timer)
  }, [shown, typing, reduced])

  return (
    /* The thread churns every second or so. Announcing each bubble would make
       a screen reader unusable, so the whole frame is one labelled image. */
    <div
      className="flex h-full w-full flex-col bg-[#E5DDD5]"
      role="img"
      aria-label="A WhatsApp thread where a Qantonic agent takes a customer's food order, quotes prices and confirms delivery."
    >
      {/* Thread header */}
      <div
        aria-hidden="true"
        className="flex shrink-0 items-center gap-2.5 bg-[#075E54] px-3 py-2.5 text-white"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
          KC
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold">KampusCrave</span>
          <span className="text-[10px] text-white/70">online — your agent, replying live</span>
        </div>
      </div>

      {/* justify-end pins the thread to the bottom, so each new bubble pushes
          the older ones off the top exactly the way a real chat scrolls. The
          overflow is deliberately unreachable — this is a mockup, not a
          scroller. */}
      <div
        aria-hidden="true"
        className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-2.5 py-3"
      >
        <div className="flex justify-center pb-1">
          <span className="rounded-md bg-white/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
            Today
          </span>
        </div>

        {CHAT.slice(0, shown).map((message, i) => {
          const isCustomer = message.from === 'customer'
          return (
            <div
              /* Keyed by position so a loop restart unmounts every bubble and
                 the mount animation runs again on the next pass. */
              key={i}
              className={`qtc-bubble-in flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-lg px-2.5 py-1.5 text-[12px] leading-[1.4] text-neutral-900 shadow-sm ${
                  isCustomer ? 'bg-[#DCF8C6]' : 'bg-white'
                }`}
              >
                {message.text}
                {isCustomer && (
                  <span className="ml-1 align-middle text-[9px] text-[#53BDEB]">✓✓</span>
                )}
              </div>
            </div>
          )
        })}

        {typing && (
          <div className="qtc-bubble-in flex justify-start">
            <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 shadow-sm">
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-neutral-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- HeroMedia */

type HeroMediaProps = {
  /** Looping product clip. Omit to render the poster / placeholder. */
  src?: string
  /** Frame shown before the video paints, and used if the video fails. */
  poster?: string
  /** Static image used when the video errors and there is no poster. */
  fallbackImage?: string
  alt?: string
}

function HeroMedia({
  src,
  poster,
  fallbackImage,
  alt = 'Qantonic agent answering a customer in a chat thread',
}: HeroMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false)

  const showVideo = Boolean(src) && !videoFailed
  const stillImage = fallbackImage ?? poster

  return (
    <div className="relative flex justify-center">
      {/* Soft neutral radial glow — hero only, nothing else on the page glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[130%] w-[190%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(closest-side, rgba(24,24,27,0.10), rgba(24,24,27,0.04) 55%, rgba(24,24,27,0) 100%)',
        }}
      />

      {/* Phone-style frame. Width drives the 9:16 box: 292px wide == 519px tall,
          so the 520px max-height is respected without the frame collapsing. */}
      <div className="relative aspect-[9/16] max-h-[520px] w-[292px] max-w-full rounded-[28px] border border-[#E4E4E7] bg-[#FFFFFF] p-2 shadow-[0_1px_2px_rgba(24,24,27,0.06),0_12px_32px_rgba(24,24,27,0.10)]">
        <div className="h-full w-full overflow-hidden rounded-[20px] bg-[#E4E4E7]">
          {showVideo ? (
            <video
              className="h-full w-full object-cover"
              src={src}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={alt}
              onError={() => setVideoFailed(true)}
            />
          ) : stillImage ? (
            <img className="h-full w-full object-cover" src={stillImage} alt={alt} />
          ) : (
            /* Last resort: the chat mockup, so the frame always shows the
               product doing its job rather than an empty grey box. */
            <ChatMockup />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- Icons */

type IconProps = { className?: string }

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

function SlackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522zm-1.269 0a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522zm-2.522 10.122a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522zm0-1.269a2.527 2.527 0 0 1-2.52-2.522 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.522z" />
    </svg>
  )
}

function WidgetIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="3" width="20" height="16" rx="2.5" />
      <path d="M2 7.5h20" />
      <path d="M8.5 11.5h7a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-3.5L10 18v-2h-1.5A1.5 1.5 0 0 1 7 14.5V13a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  )
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0" />
    </svg>
  )
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 1.153h3.68l-8.04 9.19L24 22.846h-7.41l-5.8-7.584-6.64 7.584H.47l8.6-9.83L0 1.154h7.59l5.24 6.932zm-1.29 19.49h2.04L6.49 3.24H4.3z" />
    </svg>
  )
}

function GitHubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58l-.01-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.75.09-.73.09-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
    </svg>
  )
}

/* -------------------------------------------------------------------- Data */

const CHANNELS = [
  { name: 'WhatsApp', Icon: WhatsAppIcon },
  { name: 'Slack', Icon: SlackIcon },
  { name: 'Website widget', Icon: WidgetIcon },
  { name: 'Instagram', Icon: InstagramIcon },
] as const

/**
 * Use cases are a slideshow rather than a row of cards because the picture is
 * the argument here — a shopkeeper with a phone in hand says "this is for you"
 * to a reader who will not stop to read three bullets. Each slide is one image
 * and as little copy as the point survives on.
 *
 * Images are committed under public/images rather than hotlinked, so the page
 * has no third-party runtime dependency. All are Unsplash-licensed (free
 * commercial use, no attribution required).
 */
const USE_CASES = [
  {
    title: 'Sales',
    body: 'Your agent quotes from your live price list, answers the objection, and closes — at 2am, on the channel the customer already has open.',
    image: '/images/use-sales.webp',
    alt: 'A market trader holding his phone and giving a thumbs up at his stall',
    /** Focal point — keeps the subject in frame as the crop changes. */
    position: '50% 35%',
  },
  {
    title: 'Enquiries',
    body: 'The same twelve questions, answered from your own docs and policies, every time, without anyone retyping them.',
    image: '/images/use-enquiries.webp',
    alt: 'A woman smiling while taking a customer call at her desk',
    position: '50% 40%',
  },
  {
    title: 'And many more',
    body: 'Bookings, order status, delivery updates, opening hours, handover to a human when it matters. If it happens in a chat, it can happen here.',
    image: '/images/use-more.webp',
    alt: 'A shop owner behind her counter with her phone beside her',
    position: '50% 45%',
  },
] as const

/** How long each use-case slide holds before the next one fades in. */
const SLIDE_MS = 5500

/**
 * Footer socials.
 *
 * An entry with an empty href is not rendered at all — a dead or wrong profile
 * link on a marketing page is worse than a missing icon, so unknown handles
 * stay empty until someone confirms them rather than being guessed. Only the
 * GitHub org URL is verified; fill the other three in and they appear.
 */
const SOCIALS = [
  { name: 'GitHub', href: 'https://github.com/Arkaiver-Tech-Ghana', Icon: GitHubIcon },
  { name: 'LinkedIn', href: '', Icon: LinkedInIcon },
  { name: 'X', href: '', Icon: XIcon },
  { name: 'Instagram', href: '', Icon: InstagramIcon },
] as const

/**
 * Pricing has two independent axes and conflating them is what made the old
 * three-tier grid wrong:
 *
 *   setup   — free if you do it yourself, paid if we do it for you
 *   running — usage, always, for everyone
 *
 * So the first two cards are the setup choice and the third is the running
 * cost that applies either way. There is no freemium tier and no subscription;
 * do not reintroduce one here without changing the billing model first.
 */
const SETUP_OPTIONS = [
  {
    name: 'Set it up yourself',
    price: 'Free',
    cadence: 'setup',
    blurb: "You're a developer, or you have one. Everything you need is in the dashboard and the docs.",
    features: [
      'Full access to the agent config',
      'Every channel — WhatsApp, Slack, Instagram, your own site',
      'Docs and config schema',
      'No setup fee, no seat fee, no subscription',
    ],
    emphasis: false,
  },
  {
    name: 'We set it up for you',
    price: 'From $50',
    cadence: 'per integration',
    blurb: 'Our people do the integration. What it costs depends on the platform and what you need the agent to do.',
    features: [
      'We wire the agent into your platform',
      'Trained on your prices, policies and content',
      'Priced per integration to your spec — $50 is the floor, not the average',
      'Handover call so your team can run it after',
    ],
    emphasis: true,
  },
] as const

/* ------------------------------------------------------------- Small parts */

function Check({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  )
}

/** Every "Book a setup call" on the page routes through here. */
function CalendlyButton({
  className,
  style,
  children,
}: {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {children}
    </a>
  )
}

/* ---------------------------------------------------------- Use-case slides */

function UseCaseSlides() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduced || paused) return
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % USE_CASES.length),
      SLIDE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [index, paused, reduced])

  // A visitor reading a slide should not have it yanked away, and a background
  // tab should not burn a timer at all.
  useEffect(() => {
    const sync = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What people put their agents on"
      className="relative isolate overflow-hidden border-y border-[#E4E4E7] bg-[#FAFAF9]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* All slides occupy the same grid cell, so the section is as tall as the
          tallest slide and a crossfade never shifts the page. */}
      <div className="grid">
        {USE_CASES.map((slide, i) => {
          const active = i === index
          return (
            <article
              key={slide.title}
              style={{ gridArea: '1 / 1' }}
              className={`relative transition-opacity duration-700 ease-out ${
                active ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={!active}
            >
              {/* Mobile: a band of image at the top that fades out before the
                  copy starts (.qtc-slide-fade). Desktop: the image fills the
                  section and the copy sits on top of it. */}
              <div className="absolute inset-x-0 top-0 h-[300px] sm:h-[380px] lg:inset-0 lg:h-full">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="qtc-slide-fade h-full w-full object-cover"
                  style={{ objectPosition: slide.position }}
                />
                {/* Desktop only — the scrim that makes white copy legible over
                    a photo. On mobile the copy is on the page background and
                    dark, so there is nothing to scrim. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden lg:block"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(9,9,11,0.82) 0%, rgba(9,9,11,0.62) 42%, rgba(9,9,11,0.15) 78%, rgba(9,9,11,0) 100%)',
                  }}
                />
              </div>

              <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-end px-5 pt-[268px] pb-20 sm:pt-[348px] lg:min-h-[560px] lg:justify-center lg:px-8 lg:pt-20 lg:pb-24">
                <div className="lg:max-w-lg">
                  <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[#18181B] lg:text-[46px] lg:text-white">
                    {slide.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-[1.6] text-[#71717A] lg:mt-4 lg:text-[18px] lg:text-white/80">
                    {slide.body}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Controls sit outside the fading stack so they never fade with a slide. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 pb-8 lg:px-8 lg:pb-12">
          {USE_CASES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${slide.title}`}
              aria-current={i === index}
              className="pointer-events-auto h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === index ? 32 : 12,
                backgroundColor: i === index ? ACCENT : 'rgba(113,113,122,0.35)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- Page */

export function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'owner' ? '/config' : '/audit-log'} replace />

  return (
    /* overflow-x-clip (not -hidden) contains the hero glow without turning this
       div into a scroll container, which would break the sticky nav. */
    <div className="min-h-dvh overflow-x-clip bg-[#FAFAF9] font-sans text-[#18181B] antialiased">
      {/* 1 — Nav ------------------------------------------------------- */}
      <header className="sticky top-0 z-50 h-16 border-b border-[#E4E4E7] bg-[#FAFAF9]">
        {/* Deliberately full-bleed rather than centred in a max-w container:
            the wordmark sits against the left edge and the actions against the
            right, so the bar frames the page instead of floating in it. */}
        <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link to="/" className="text-[18px] font-semibold tracking-[-0.02em] text-[#18181B]">
            Qantonic
          </Link>

          <div className="flex items-center gap-0.5 sm:gap-2">
            <a
              href="#pricing"
              className="rounded-md px-2.5 py-2 text-[13px] text-[#71717A] transition-colors hover:text-[#18181B] sm:px-3 sm:text-[14px]"
            >
              Pricing
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2.5 py-2 text-[13px] text-[#71717A] transition-colors hover:text-[#18181B] sm:px-3 sm:text-[14px]"
            >
              Docs
            </a>
            <Link
              to="/signup"
              className="ml-1 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 sm:px-3.5 sm:text-[14px]"
              style={{ backgroundColor: ACCENT }}
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 2 — Hero --------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 pt-6 pb-14 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pt-16 lg:pb-24">
          {/* Copy block. Sizes are deliberately tight on mobile so the media
              clears the 844px fold — see the budget at the top of this file. */}
          <div className="lg:max-w-xl">
            <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.025em] lg:text-[52px] lg:leading-[1.08]">
              Chat agents that sell and answer
            </h1>
            <p className="mt-3 text-[15px] leading-[1.5] text-[#71717A] lg:mt-5 lg:text-[18px] lg:leading-[1.6]">
              Put a configurable AI agent on WhatsApp, Slack, Instagram and your own site
              — trained on your prices and policies.
            </p>

            <div className="mt-4 flex items-center gap-3 lg:mt-8">
              <Link
                to="/signup"
                className="flex h-11 flex-1 items-center justify-center rounded-lg px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 lg:h-12 lg:flex-none lg:px-6 lg:text-[15px]"
                style={{ backgroundColor: ACCENT }}
              >
                Get started
              </Link>
              <CalendlyButton className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FFFFFF] px-4 text-[14px] font-semibold text-[#18181B] transition-colors hover:border-[#D4D4D8] lg:h-12 lg:flex-none lg:px-6 lg:text-[15px]">
                Book a setup call
              </CalendlyButton>
            </div>
          </div>

          {/* Media. Starts 322px down the page at 390x844. */}
          <div className="mt-5 lg:mt-0">
            <HeroMedia />
          </div>
        </section>

        {/* 3 — Channel strip ------------------------------------------ */}
        <section className="border-y border-[#E4E4E7] bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-9">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:items-center sm:justify-between sm:gap-8">
              {CHANNELS.map(({ name, Icon }) => (
                <div key={name} className="flex items-center gap-2.5 text-[#71717A]">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-[14px] leading-none lg:text-[15px]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Use cases ---------------------------------------------- */}
        <UseCaseSlides />

        {/* 5 — Pricing ------------------------------------------------ */}
        <section id="pricing" className="border-b border-[#E4E4E7] bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] lg:text-[36px]">Pricing</h2>
            <p className="mt-2.5 max-w-2xl text-[15px] leading-[1.6] text-[#71717A] lg:text-[17px]">
              Two separate things: getting set up, and running the agents. Setup is free if
              you do it yourself. The agents are billed on what they actually use — there is
              no subscription and no seat count.
            </p>

            <div className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-2 lg:gap-6">
              {SETUP_OPTIONS.map((option) => (
                <div
                  key={option.name}
                  className={`flex flex-col rounded-2xl bg-[#FFFFFF] p-6 lg:p-8 ${
                    option.emphasis ? 'border-2 border-[#18181B]' : 'border border-[#E4E4E7]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-semibold">{option.name}</h3>
                    {option.emphasis && (
                      <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-[#71717A] uppercase">
                        Done for you
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[34px] leading-none font-semibold tracking-[-0.02em]">
                      {option.price}
                    </span>
                    <span className="text-[14px] text-[#71717A]">{option.cadence}</span>
                  </div>

                  <p className="mt-3 text-[14px] leading-[1.55] text-[#71717A]">{option.blurb}</p>

                  <ul className="mt-6 space-y-2.5">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-[14px] leading-[1.5]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#71717A]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 pt-1 lg:mt-auto">
                    {option.emphasis ? (
                      <>
                        <CalendlyButton
                          className="flex h-11 w-full items-center justify-center rounded-lg px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: ACCENT }}
                        >
                          Book a setup call
                        </CalendlyButton>
                        <p className="mt-3 text-center text-[13px] text-[#71717A]">
                          or email{' '}
                          <a
                            href={`mailto:${CONTACT_EMAIL}`}
                            className="font-medium underline underline-offset-2"
                            style={{ color: ACCENT }}
                          >
                            {CONTACT_EMAIL}
                          </a>
                        </p>
                      </>
                    ) : (
                      <Link
                        to="/signup"
                        className="flex h-11 w-full items-center justify-center rounded-lg border border-[#E4E4E7] px-4 text-[14px] font-semibold text-[#18181B] transition-colors hover:border-[#D4D4D8]"
                      >
                        Get started
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* The running cost applies to both columns above, so it gets its
                own full-width band rather than becoming a third tier. */}
            <div className="mt-4 rounded-2xl border border-[#E4E4E7] bg-[#FAFAF9] p-6 lg:mt-6 lg:p-8">
              <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
                <div className="lg:max-w-xl">
                  <h3 className="text-[16px] font-semibold">Then the agents themselves</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.6] text-[#71717A]">
                    Priced on use. You pay for the conversations your agents actually handle
                    — nothing for the quiet months, nothing per seat, nothing up front.
                  </p>
                </div>
                <div className="mt-5 shrink-0 lg:mt-0 lg:text-right">
                  <div className="text-[28px] leading-none font-semibold tracking-[-0.02em]">
                    Pay for what you use
                  </div>
                  <div className="mt-2 text-[14px] text-[#71717A]">No subscription, no minimum</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 — Closing CTA -------------------------------------------- */}
        <section id="setup-call" className="bg-[#FAFAF9]">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] lg:text-[36px]">
                Put an agent on your busiest channel this week
              </h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#71717A] lg:text-[17px]">
                Build it yourself in an afternoon, or book a call and we will have your first
                agent live on WhatsApp and your site within five working days.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CalendlyButton
                  className="flex h-12 items-center justify-center rounded-lg px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                  style={{ backgroundColor: ACCENT }}
                >
                  Book a setup call
                </CalendlyButton>
                <Link
                  to="/signup"
                  className="flex h-12 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FFFFFF] px-6 text-[15px] font-semibold text-[#18181B] transition-colors hover:border-[#D4D4D8] sm:w-auto"
                >
                  Get started
                </Link>
              </div>

              <p className="mt-4 text-[14px] text-[#71717A]">
                Calendly not your thing? Email{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium underline underline-offset-2"
                  style={{ color: ACCENT }}
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>

            {/* The point of the picture: this is the job the agent is doing. */}
            <div className="mt-10 lg:mt-0">
              <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(24,24,27,0.06),0_12px_32px_rgba(24,24,27,0.08)]">
                <img
                  src="/images/receptionist.webp"
                  alt="A receptionist wearing a headset, smiling as she takes a call at her desk"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                  style={{ objectPosition: '55% 35%' }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7 — Footer -------------------------------------------------- */}
      <footer className="border-t border-[#E4E4E7] bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[18px] font-semibold tracking-[-0.02em]">Qantonic</div>
              <div className="mt-1.5 text-[14px] text-[#71717A]">
                Built by{' '}
                <a
                  href="https://github.com/Arkaiver-Tech-Ghana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#18181B] underline underline-offset-2"
                >
                  Arkaiver Tech
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {SOCIALS.filter((social) => social.href).map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex size-10 items-center justify-center rounded-lg text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#18181B]"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="ml-1 text-[14px] text-[#71717A] transition-colors hover:text-[#18181B]"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-[#E4E4E7] pt-6 text-[13px] text-[#71717A] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Arkaiver. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <a href="#pricing" className="transition-colors hover:text-[#18181B]">
                Pricing
              </a>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#18181B]"
              >
                Docs
              </a>
              <CalendlyButton className="transition-colors hover:text-[#18181B]">
                Book a call
              </CalendlyButton>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
