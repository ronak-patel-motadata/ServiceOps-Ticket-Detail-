import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

/**
 * TicketDetailsOnboarding — the In-App User Guide.
 *
 * A spotlight tour: a dark overlay with a cut-out around the element each step describes,
 * and a card beside it. It was written for the request detail page; every detail page now
 * runs it with its OWN steps (see `onboardingSteps.tsx`), passed through the `steps` prop —
 * leaving it out keeps the original request-page tour, so the two ticket drawers are
 * unchanged.
 *
 * It opens from the book button at the bottom of the right rail (or the floating button on
 * pages without a rail). The session key 'hasSeenTicketDetailsOnboarding' is cleared by the
 * opener and set again on finish, so the guide is always invited, never imposed.
 */

export interface OnboardingBullet {
  icon: ReactNode;
  label: string;
  text: string;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  /** CSS selector of the element to spotlight — normally a `[data-onboarding="…"]` hook. */
  targetSelector: string;
  /** Where the card sits relative to the target. A target that is missing or hidden falls
      back to a centred card with no spotlight, so a step can never strand the reader. */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  /** Optional "what is in here" list under the description — one line per item. */
  bullets?: OnboardingBullet[];
}

interface TicketDetailsOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
  /** The page's own steps. Defaults to the request detail page's tour. */
  steps?: OnboardingStep[];
}

/* The request page's bullet glyphs, kept as the same inline SVGs the tour always drew. */
const svg = (paths: ReactNode) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 mt-0.5 flex-shrink-0">{paths}</svg>
);
const ICON_FILE = svg(<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></>);
const ICON_ACTIVITY = svg(<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>);
const ICON_BOOK = svg(<><path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path></>);
const ICON_SEARCH = svg(<><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></>);
const ICON_FILTER = svg(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>);
const ICON_PIN = svg(<><line x1="12" x2="12" y1="17" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></>);

/** The request detail page's tour — the original, word for word. */
export const TICKET_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Your main workspace',
    description: 'Work from the left panel to review the request, switch between work tabs, and stay on top of conversations. The reply box stays fixed at the bottom, so actions are always within reach.',
    targetSelector: '[data-onboarding="main-workspace"]',
    position: 'right',
    highlightPadding: 16,
  },
  {
    id: 2,
    title: 'Quick access sidebar',
    description: 'Use this sidebar to switch between supporting views like ServiceOps AI, AI Suggestions, Request Properties, and Activity & Resources without leaving the request.',
    targetSelector: '[data-onboarding="right-sidebar"]',
    position: 'left',
    highlightPadding: 12,
    bullets: [
      { icon: ICON_FILE, label: 'Request Properties', text: 'See all request details and fields.' },
      { icon: ICON_ACTIVITY, label: 'Activity & Resources', text: 'Manage work updates and view attachments.' },
      { icon: ICON_BOOK, label: 'AI Suggestions', text: 'Discover similar requests and relevant KBs.' },
    ],
  },
  {
    id: 3,
    title: 'Request details, your way',
    description: 'View requests, statuses, additional fields, system fields, and custom fields in one place. Search, filter, or pin important fields to snap the details you need on tap.',
    targetSelector: '[data-onboarding="ticket-properties"]',
    position: 'left',
    highlightPadding: 16,
    bullets: [
      { icon: ICON_SEARCH, label: 'Search', text: 'Find any field quickly across all request details' },
      { icon: ICON_FILTER, label: 'Filter', text: 'Show only the fields you need, such as empty fields or pinned ones' },
      { icon: ICON_PIN, label: 'Pin', text: 'Mark the fields you want easy access to, your view works the way you do.' },
    ],
  },
  {
    id: 4,
    title: 'AI help, built in',
    description: 'Use AI to summarize the request, suggest next steps, draft responses, and help update the request faster.',
    targetSelector: '[data-onboarding="ai-prompt-box"]',
    position: 'top',
    highlightPadding: 16,
  },
];

const CARD_W = 400;
const GUTTER = 16;
const ARROW_GAP = 20;

export function TicketDetailsOnboarding({ onComplete, onSkip, onStepChange, steps = TICKET_ONBOARDING_STEPS }: TicketDetailsOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  /* Where the arrow points. It follows the step's position unless the target could not be
     found, in which case the card is centred and carries no arrow. */
  const [arrow, setArrow] = useState<OnboardingStep['position']>('center');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[Math.min(currentStep, steps.length - 1)];
  const padding = step.highlightPadding || 16;

  /* Measure the REAL card (a step with bullets is taller than one without) and keep the
     whole card inside the viewport — a step beside a target near the top or bottom edge used
     to push the card half off-screen. */
  const place = () => {
    const target = document.querySelector(step.targetSelector) as HTMLElement | null;
    let rect: DOMRect | null = target ? target.getBoundingClientRect() : null;
    if (rect && (rect.width === 0 || rect.height === 0)) rect = null;
    setHighlightRect(rect);

    const cardH = cardRef.current?.offsetHeight ?? 200;
    const pos: OnboardingStep['position'] = rect ? step.position : 'center';
    let top = 0;
    let left = 0;
    if (rect) {
      switch (pos) {
        case 'right':
          top = rect.top + rect.height / 2 - cardH / 2;
          left = rect.right + padding + ARROW_GAP;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - cardH / 2;
          left = rect.left - padding - ARROW_GAP - CARD_W;
          break;
        case 'top':
          top = rect.top - padding - ARROW_GAP - cardH;
          left = rect.left + rect.width / 2 - CARD_W / 2;
          break;
        case 'bottom':
          top = rect.bottom + padding + ARROW_GAP;
          left = rect.left + rect.width / 2 - CARD_W / 2;
          break;
        default:
          top = window.innerHeight / 2 - cardH / 2;
          left = window.innerWidth / 2 - CARD_W / 2;
      }
    } else {
      top = window.innerHeight / 2 - cardH / 2;
      left = window.innerWidth / 2 - CARD_W / 2;
    }
    top = Math.min(Math.max(top, GUTTER), Math.max(GUTTER, window.innerHeight - cardH - GUTTER));
    left = Math.min(Math.max(left, GUTTER), Math.max(GUTTER, window.innerWidth - CARD_W - GUTTER));
    setTooltipPosition({ top, left });
    setArrow(pos);
  };

  useLayoutEffect(() => {
    /* A target below the fold (an Overview card on a tall page) is brought into view first,
       only as far as needed, so the spotlight has something to cut out. */
    const target = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (target) {
      const r = target.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) target.scrollIntoView({ block: 'nearest' });
    }
    place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, steps]);

  useEffect(() => {
    window.addEventListener('resize', place);
    const drawerContent = document.querySelector('[data-onboarding-container]');
    drawerContent?.addEventListener('scroll', place);
    return () => {
      window.removeEventListener('resize', place);
      drawerContent?.removeEventListener('scroll', place);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, steps]);

  // Prevent ESC key and other keyboard shortcuts while the guide is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleNext = () => {
    if (isTransitioning) return;
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setIsTransitioning(false);
        onStepChange?.(nextStep);
      }, 250);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (isTransitioning || currentStep === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setIsTransitioning(false);
      onStepChange?.(prevStep);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* SVG mask definition for spotlight cut-out */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: 0, height: 0 }}>
        <defs>
          <mask id="spotlight-mask">
            {/* White background = visible overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle = transparent cut-out hole */}
            {highlightRect && (
              <rect
                x={highlightRect.left - padding}
                y={highlightRect.top - padding}
                width={highlightRect.width + (padding * 2)}
                height={highlightRect.height + (padding * 2)}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Dark overlay with spotlight cut-out - blocks all interactions */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto transition-all duration-300"
        style={{
          mask: 'url(#spotlight-mask)',
          WebkitMask: 'url(#spotlight-mask)'
        }}
      />

      {/* Highlighted section - visual only, not interactive */}
      {highlightRect && (
        <div
          className="absolute rounded-xl transition-all duration-300 pointer-events-none"
          style={{
            top: highlightRect.top - padding,
            left: highlightRect.left - padding,
            width: highlightRect.width + (padding * 2),
            height: highlightRect.height + (padding * 2),
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 3px rgba(61, 139, 208, 0.8), 0 0 40px rgba(61, 139, 208, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5)',
            zIndex: 2,
            opacity: isTransitioning ? 0 : 1
          }}
        />
      )}

      {/* Tooltip card - ONLY interactive element */}
      <div
        ref={cardRef}
        className="pointer-events-auto absolute w-[400px] max-w-[92vw] rounded-2xl bg-[#1F2937] shadow-2xl transition-all duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 3,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.95)' : 'scale(1)'
        }}
      >
        {/* Arrow pointing to highlighted element */}
        {arrow === 'right' && (
          <div
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{ borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #1F2937' }}
          />
        )}
        {arrow === 'left' && (
          <div
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-0 h-0"
            style={{ borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '12px solid #1F2937' }}
          />
        )}
        {arrow === 'top' && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0"
            style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid #1F2937' }}
          />
        )}
        {arrow === 'bottom' && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-0 h-0"
            style={{ borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '12px solid #1F2937' }}
          />
        )}

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-3">
            <h3 className="text-[16px] font-semibold text-white leading-tight">
              {step.title}
            </h3>
          </div>
          <p className="text-[14px] text-white/80 leading-relaxed">
            {step.description}
          </p>

          {/* "What is in here" — one line per item, the request page's own list style. */}
          {step.bullets && step.bullets.length > 0 && (
            <div className="mt-4 space-y-2 text-[13px] text-white/70">
              {step.bullets.map((b) => (
                <p key={b.label} className="flex items-start gap-2">
                  {b.icon}
                  <span><span className="text-white font-semibold">{b.label}</span> — {b.text}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="text-[13px] text-white/60 font-medium">
            {currentStep + 1}/{steps.length}
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-white text-[#1F2937] text-[13px] font-semibold rounded hover:bg-white/90 transition-colors"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
