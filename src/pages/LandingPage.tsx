import { useState } from 'react'
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
 */

const ACCENT = '#4F46E5'

/**
 * "Docs" points at the engine repo's public docs (config schema + ADRs) —
 * there is no docs site yet and "/docs" was a dead route. These are
 * engineering docs, not a setup guide for a business owner, so swap this for
 * a real docs URL once one exists.
 */
const DOCS_URL = 'https://github.com/Arkaiver-Tech-Ghana/adaptive-llm-agent/tree/main/docs'

/* ------------------------------------------------------------ Chat mockup */

/**
 * Stand-in for the real hero footage: a WhatsApp thread where the agent takes
 * an order end to end. Ported from the component-based landing spike on
 * feature/landing-page and resized for the 292x519 frame.
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

function ChatMockup() {
  return (
    <div className="flex h-full w-full flex-col bg-[#E5DDD5]">
      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-2.5 bg-[#075E54] px-3 py-2.5 text-white">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
          KC
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold">KampusCrave</span>
          <span className="text-[10px] text-white/70">online — your agent, replying live</span>
        </div>
      </div>

      {/* Messages sit at the bottom so the payoff line is always in frame and
          the thread reads as one already in progress. */}
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-2.5 py-3">
        <div className="flex justify-center pb-1">
          <span className="rounded-md bg-white/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
            Today
          </span>
        </div>

        {CHAT.map((message, i) => {
          const isCustomer = message.from === 'customer'
          return (
            <div key={i} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
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

        {/* Typing indicator — the agent is mid-reply, so the thread reads live
            rather than as a finished transcript. */}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-neutral-400" />
            <span className="size-1.5 rounded-full bg-neutral-300" />
            <span className="size-1.5 rounded-full bg-neutral-200" />
          </div>
        </div>
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
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[190%] -translate-x-1/2 -translate-y-1/2"
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

/* -------------------------------------------------------------------- Data */

const CHANNELS = [
  { name: 'WhatsApp', Icon: WhatsAppIcon },
  { name: 'Slack', Icon: SlackIcon },
  { name: 'Website widget', Icon: WidgetIcon },
  { name: 'Instagram', Icon: InstagramIcon },
] as const

const USE_CASES = [
  {
    title: 'Sales',
    body: 'Qualify every inbound lead the minute it lands. Your agent asks the questions your best rep would ask, quotes from your live price list, and books the meeting straight into your calendar.',
    points: [
      'Qualifies and scores leads from the first message',
      'Quotes prices and availability from your own data',
      'Hands warm buyers to a human with the full transcript',
    ],
  },
  {
    title: 'Enquiries',
    body: 'Stop retyping the same twelve answers. Point the agent at your docs, policies and FAQs once, and it handles order status, opening hours, refunds and everything else at 2am.',
    points: [
      'Answers from your docs, policies and past tickets',
      'Says "let me get a person" instead of guessing',
      'Flags every unanswered question so you can fill the gap',
    ],
  },
] as const

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    cadence: 'forever',
    blurb: 'Enough to prove an agent can carry real conversations.',
    features: [
      '1 agent, 1 channel',
      '200 conversations per month',
      'Website widget or WhatsApp',
      'Community support',
    ],
    cta: 'Start free',
    emphasis: false,
  },
  {
    name: 'Growth',
    price: '$49',
    cadence: 'per month',
    blurb: 'For teams running sales and support through chat every day.',
    features: [
      '5 agents, every channel',
      '5,000 conversations per month',
      'Custom branding and tone',
      'Handover to your team, analytics, exports',
      'Email support within one business day',
    ],
    cta: 'Start free',
    emphasis: false,
  },
  {
    name: 'Launch',
    price: '$899',
    cadence: 'one-time',
    blurb: 'We build it, train it and ship it. You approve and go live.',
    features: [
      'Everything in Growth for 12 months',
      'Done-for-you setup — we write the agent, load your content and connect your channels',
      'Your site, WhatsApp and socials wired up for you',
      '60-minute handover call and a written runbook',
      '30 days of tuning after launch',
    ],
    cta: 'Book a setup call',
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
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="text-[18px] font-semibold tracking-[-0.02em] text-[#18181B]"
          >
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
            <h1 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em] lg:text-[52px] lg:leading-[1.08]">
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
                Start free
              </Link>
              <a
                href="#setup-call"
                className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E4E4E7] bg-[#FFFFFF] px-4 text-[14px] font-semibold text-[#18181B] transition-colors hover:border-[#D4D4D8] lg:h-12 lg:flex-none lg:px-6 lg:text-[15px]"
              >
                Book a setup call
              </a>
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
        <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            {USE_CASES.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#E4E4E7] bg-[#FFFFFF] p-6 lg:p-8"
              >
                <h2 className="text-[20px] font-semibold tracking-[-0.015em] lg:text-[24px]">
                  {card.title}
                </h2>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-[#71717A]">{card.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[14px] leading-[1.5]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#71717A]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* 5 — Pricing ------------------------------------------------ */}
        <section id="pricing" className="border-y border-[#E4E4E7] bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] lg:text-[36px]">
              Pricing
            </h2>
            <p className="mt-2.5 max-w-xl text-[15px] leading-[1.6] text-[#71717A] lg:text-[17px]">
              Start free on your own. If you would rather not touch the config at all, we
              set the whole thing up for you once and you never pay a subscription.
            </p>

            <div className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-3 lg:gap-6">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col rounded-2xl bg-[#FFFFFF] p-6 lg:p-7 ${
                    tier.emphasis
                      ? 'border-2 border-[#18181B]'
                      : 'border border-[#E4E4E7]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-semibold">{tier.name}</h3>
                    {tier.emphasis && (
                      <span className="rounded-full bg-[#F4F4F5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A]">
                        Done for you
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[34px] font-semibold leading-none tracking-[-0.02em]">
                      {tier.price}
                    </span>
                    <span className="text-[14px] text-[#71717A]">{tier.cadence}</span>
                  </div>

                  <p className="mt-3 text-[14px] leading-[1.55] text-[#71717A]">
                    {tier.blurb}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-[14px] leading-[1.5]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#71717A]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 pt-1 lg:mt-auto">
                    {tier.emphasis ? (
                      <a
                        href="#setup-call"
                        className="flex h-11 w-full items-center justify-center rounded-lg px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {tier.cta}
                      </a>
                    ) : (
                      <Link
                        to="/signup"
                        className="flex h-11 w-full items-center justify-center rounded-lg border border-[#E4E4E7] px-4 text-[14px] font-semibold text-[#18181B] transition-colors hover:border-[#D4D4D8]"
                      >
                        {tier.cta}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — Footer CTA --------------------------------------------- */}
        <footer id="setup-call" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] lg:text-[36px]">
              Put an agent on your busiest channel this week
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#71717A] lg:text-[17px]">
              Build it yourself in an afternoon, or book a call and we will have your first
              agent live on WhatsApp and your site within five working days.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="flex h-12 items-center justify-center rounded-lg px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: ACCENT }}
              >
                Start free
              </Link>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center justify-center text-[15px] font-semibold transition-opacity hover:opacity-80 sm:px-2"
                style={{ color: ACCENT }}
              >
                Read the docs
              </a>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-2 border-t border-[#E4E4E7] pt-6 text-[13px] text-[#71717A] sm:flex-row sm:items-center sm:justify-between lg:mt-20">
            <span className="font-semibold text-[#18181B]">Qantonic</span>
            <span>© 2026 Arkaiver. All rights reserved.</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default LandingPage
