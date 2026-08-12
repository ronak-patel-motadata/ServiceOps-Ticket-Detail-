import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Play, Maximize2, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

/* Knowledge detail page body — the article itself. The Knowledge page has NO tabs: the full
 * article is the content, ending with the Helpful / Not Helpful feedback controls. */

interface Block {
  /** p = paragraph · h = section heading · steps = ordered list · bullets = unordered list ·
   *  note = tinted callout · code = command block · table = two-column reference ·
   *  image = captioned screenshot (click to zoom) · video = captioned player */
  kind: 'p' | 'h' | 'steps' | 'bullets' | 'note' | 'warn' | 'code' | 'table' | 'image' | 'video';
  text?: string;
  items?: string[];
  rows?: [string, string][];
  /** image/video: caption under the figure */
  caption?: string;
  /** video: runtime badge, e.g. "2:14" */
  duration?: string;
  /** image/video: which inline mock to draw (no real assets in this prototype) */
  art?: 'client' | 'portal';
  /** video: real YouTube id. Swap this for the product's own video — everything else follows. */
  youtubeId?: string;
}

/* Stand-in video until the product's own is available — Blender's 'Big Buck Bunny', the
 * industry-standard sample clip. Replace this id (or set youtubeId on a block) to use a real one. */
const SAMPLE_VIDEO_ID = 'aqz-KE-bpKQ';

/* YouTube embed with a FACADE: the poster is just the thumbnail image until the reader clicks,
 * then the real iframe mounts with autoplay. Nothing from YouTube loads on page view, so an
 * article with several videos stays fast and no third-party player runs unasked. */
function YouTubeFigure({ id, duration, caption }: { id: string; duration?: string; caption?: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <figure className="mb-5 mt-1">
      <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#0F172A]">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={caption ?? 'Article video'}
            className="block aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative block w-full"
            aria-label="Play video"
          >
            {thumbFailed ? (
              /* Offline / blocked thumbnail — fall back to the drawn poster so the layout holds */
              <ScreenshotArt variant="portal" dim />
            ) : (
              <img
                src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
                alt=""
                loading="lazy"
                onError={() => setThumbFailed(true)}
                className="block aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              />
            )}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-16 items-center justify-center rounded-lg bg-[#0F172A]/70 backdrop-blur-sm transition-all group-hover:bg-[#FF0000]">
                <Play size={20} className="ml-0.5 fill-white text-white" />
              </span>
            </span>
            {duration && (
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded bg-[#0F172A]/80 px-2 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                <Clock size={11} /> {duration}
              </span>
            )}
          </button>
        )}
      </div>
      {caption && <figcaption className="mt-2 text-[12px] leading-relaxed text-[#7B8FA5]">{caption}</figcaption>}
    </figure>
  );
}

/* Inline SVG stand-ins for real media. The prototype ships no binary assets, so screenshots and
 * video posters are drawn — they scale crisply at any width and keep the repo light. */
function ScreenshotArt({ variant = 'client', dim = false }: { variant?: 'client' | 'portal'; dim?: boolean }) {
  return (
    <svg viewBox="0 0 800 450" className="block h-auto w-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Application screenshot">
      <rect width="800" height="450" fill="#F1F5F9" />
      {/* App window */}
      <rect x="70" y="52" width="660" height="346" rx="10" fill="#FFFFFF" stroke="#DFE5ED" strokeWidth="1.5" />
      {/* Title bar */}
      <path d="M70 62a10 10 0 0 1 10-10h640a10 10 0 0 1 10 10v28H70z" fill="#F8FAFC" />
      <line x1="70" y1="90" x2="730" y2="90" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="94" cy="71" r="5" fill="#F04438" /><circle cx="112" cy="71" r="5" fill="#F79009" /><circle cx="130" cy="71" r="5" fill="#12B76A" />
      <rect x="152" y="65" width="150" height="12" rx="6" fill="#E2E8F0" />
      {variant === 'client' ? (
        <>
          {/* Connection form */}
          <rect x="110" y="126" width="120" height="10" rx="5" fill="#CBD5E1" />
          <rect x="110" y="146" width="580" height="38" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          <rect x="126" y="159" width="180" height="12" rx="6" fill="#94A3B8" />
          <rect x="110" y="204" width="90" height="10" rx="5" fill="#CBD5E1" />
          <rect x="110" y="224" width="580" height="38" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          <rect x="126" y="237" width="230" height="12" rx="6" fill="#94A3B8" />
          {/* Connected status */}
          <rect x="110" y="290" width="216" height="34" rx="17" fill="#ECFDF3" />
          <circle cx="132" cy="307" r="6" fill="#12B76A" />
          <rect x="148" y="301" width="160" height="12" rx="6" fill="#12B76A" opacity="0.55" />
          {/* Primary button */}
          <rect x="560" y="288" width="130" height="38" rx="6" fill="#3D8BD0" />
          <rect x="592" y="302" width="66" height="10" rx="5" fill="#FFFFFF" opacity="0.9" />
        </>
      ) : (
        <>
          {/* Portal: left nav + list rows */}
          <rect x="70" y="90" width="150" height="308" fill="#F8FAFC" />
          <line x1="220" y1="90" x2="220" y2="398" stroke="#E5E7EB" strokeWidth="1.5" />
          {[120, 152, 184, 216, 248].map((y, i) => (
            <g key={y}>
              <rect x="90" y={y} width="16" height="12" rx="3" fill={i === 1 ? '#3D8BD0' : '#CBD5E1'} />
              <rect x="114" y={y + 1} width={i === 1 ? 86 : 74} height="10" rx="5" fill={i === 1 ? '#3D8BD0' : '#CBD5E1'} opacity={i === 1 ? 0.85 : 1} />
            </g>
          ))}
          <rect x="244" y="118" width="462" height="30" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          {[172, 216, 260, 304, 348].map((y) => (
            <g key={y}>
              <rect x="244" y={y} width="60" height="18" rx="4" fill="#E8F4FD" />
              <rect x="318" y={y + 4} width="210" height="10" rx="5" fill="#CBD5E1" />
              <circle cx="566" cy={y + 9} r="5" fill="#12B76A" />
              <rect x="580" y={y + 4} width="60" height="10" rx="5" fill="#E2E8F0" />
              <line x1="244" y1={y + 32} x2="706" y2={y + 32} stroke="#F0F2F5" strokeWidth="1.5" />
            </g>
          ))}
        </>
      )}
      {dim && <rect width="800" height="450" fill="#0F172A" opacity="0.35" />}
    </svg>
  );
}

/** A full-length article. Keyed loosely on the id so different articles read differently;
 *  everything falls back to the generic VPN-style walkthrough. */
const ARTICLES: Record<string, Block[]> = {
  'KB-1': [
    { kind: 'p', text: 'This article explains how to connect to the company VPN from a remote location so you can reach internal resources — file shares, line-of-business applications and the intranet — exactly as you would from the office. It covers first-time setup, day-to-day connection, and the issues our service desk sees most often.' },
    { kind: 'video', duration: '10:34', caption: 'Watch the full setup — installing the client, signing in, and approving the authentication prompt.' },
    { kind: 'h', text: 'Before you begin' },
    { kind: 'bullets', items: [
      'A company-managed laptop with the corporate device certificate installed.',
      'Your company email address and password.',
      'Multi-factor authentication enrolled on your phone (see "Setting Up Multi-Factor Authentication").',
      'A stable internet connection — a hotel or café network is fine, but avoid captive portals that block VPN traffic.',
    ] },
    { kind: 'h', text: 'Installing the VPN client' },
    { kind: 'steps', items: [
      'Open the Software Portal from your desktop shortcut, or browse to the Package Management section of the service portal.',
      'Search for "VPN Client" and click Install. The package is approved for all employees, so no additional approval is required.',
      'Wait for the installation to finish — it usually takes under two minutes. The client appears in your Start menu as "Company VPN".',
      'Restart your machine if prompted. The virtual network adapter is only registered after a restart.',
    ] },
    { kind: 'h', text: 'Connecting for the first time' },
    { kind: 'steps', items: [
      'Launch the Company VPN client from the Start menu.',
      'Enter the server address: vpn.company.com',
      'Sign in with your company email address and password.',
      'Approve the multi-factor authentication prompt on your phone.',
      'Wait for the status to change to Connected. The tray icon turns green.',
    ] },
    { kind: 'image', art: 'client', caption: 'Figure 1 — the VPN client after a successful connection. The status pill turns green and the tray icon follows.' },
    { kind: 'note', text: 'Once connected you have secure access to internal resources including file shares, internal applications and the intranet. Your internet browsing continues to use your local connection, so streaming and video calls are not slowed down by the tunnel.' },
    { kind: 'h', text: 'Reconnecting day to day' },
    { kind: 'p', text: 'After the first successful sign-in the client remembers the server address and your username. On subsequent days you only need to launch the client, click Connect, and approve the authentication prompt. Sessions expire after twelve hours or when the laptop sleeps for an extended period, so reconnecting each morning is normal and expected.' },
    { kind: 'h', text: 'Troubleshooting' },
    { kind: 'p', text: 'If the connection fails, work through these checks in order before raising a ticket. The majority of VPN issues are resolved by one of the first three.' },
    { kind: 'steps', items: [
      'Verify your internet connection is stable — open any public website in a browser.',
      'Confirm the VPN client is updated to the latest version from the Software Portal.',
      'Restart the client completely. Right-click the tray icon and choose Exit, then relaunch it.',
      'If you are on a hotel or public network, open a browser first and accept the network terms page, then retry.',
      'Check that your device clock is correct. A clock more than five minutes out will cause certificate validation to fail.',
      'Restart your machine. This clears a stale virtual adapter, which is the most common cause of a connection that hangs at "Connecting…".',
    ] },
    { kind: 'warn', text: 'If you see "Certificate validation failed", do not attempt to bypass the warning. Raise a ticket with the service desk — your device certificate may have expired and needs to be reissued.' },
    { kind: 'h', text: 'Common error messages' },
    { kind: 'table', rows: [
      ['Authentication failed', 'Your password has expired or was recently changed. Sign in to the portal to reset it, then retry.'],
      ['Server unreachable', 'The client cannot resolve vpn.company.com. Check your internet connection or switch networks.'],
      ['Certificate validation failed', 'The device certificate has expired. Raise a ticket — this cannot be fixed locally.'],
      ['Session timed out', 'Your twelve-hour session expired. Simply reconnect.'],
      ['Already connected', 'A previous session did not close cleanly. Exit the client from the tray and relaunch.'],
    ] },
    { kind: 'h', text: 'Checking your connection' },
    { kind: 'p', text: 'To confirm you are routed through the tunnel, open a command prompt and run the following. The address returned should be inside the corporate range.' },
    { kind: 'code', text: 'ipconfig /all | findstr "Company VPN"' },
    { kind: 'h', text: 'Getting further help' },
    { kind: 'p', text: 'If none of the steps above resolve the issue, raise a ticket with the service desk and include the exact error message, the network you are connecting from, and the time the failure occurred. Attaching a screenshot of the client window speeds up diagnosis considerably.' },
  ],
};

const GENERIC = (title: string): Block[] => [
  { kind: 'p', text: `This article covers ${title.toLowerCase()}. It walks through what you need before you start, the steps to follow, and what to do if something does not work as expected. Follow the steps in order — most issues are caused by skipping one of the prerequisites.` },
  { kind: 'h', text: 'Before you begin' },
  { kind: 'bullets', items: [
    'A company-managed device with the latest updates applied.',
    'Your company account credentials and multi-factor authentication enrolled.',
    'The relevant application installed from the Software Portal.',
  ] },
  { kind: 'image', art: 'portal', caption: 'Figure 1 — the service portal. The left-hand menu is where each section lives.' },
  { kind: 'h', text: 'Steps to follow' },
  { kind: 'steps', items: [
    'Open the service portal and sign in with your company account.',
    'Navigate to the relevant section from the left-hand menu.',
    'Complete the required fields, taking care to select the correct option for your department.',
    'Review your entries, then submit. You will receive a confirmation by email within a few minutes.',
    'Keep the reference number from the confirmation — the service desk will ask for it if you need to follow up.',
  ] },
  { kind: 'note', text: 'Requests raised outside business hours are picked up on the next working day unless they are marked as urgent. If the issue is stopping you from working, call the service desk directly rather than waiting on the ticket.' },
  { kind: 'video', duration: '10:34', caption: 'A short walkthrough of the same steps, if you would rather watch than read.' },
  { kind: 'h', text: 'If something goes wrong' },
  { kind: 'p', text: 'Start by refreshing the page and retrying — transient errors usually clear on a second attempt. If the problem persists, sign out completely and sign back in, which resolves most session-related failures. Clearing your browser cache is worth trying before escalating.' },
  { kind: 'steps', items: [
    'Refresh the page and retry the action.',
    'Sign out completely, close the browser, then sign back in.',
    'Clear your browser cache and cookies for the portal.',
    'Try a different browser to rule out an extension conflict.',
  ] },
  { kind: 'warn', text: 'Never share your credentials with a colleague to work around an access problem. Raise an access request instead — sharing accounts breaches the Acceptable Use Policy and makes issues far harder to trace.' },
  { kind: 'h', text: 'Getting further help' },
  { kind: 'p', text: 'If the steps above do not resolve the issue, raise a ticket with the service desk. Include the exact error message, what you were trying to do, and the time it happened. Screenshots are always helpful and usually remove a round trip of questions.' },
];

export function KnowledgeArticleContent({ articleId, title, centered = false }: { articleId: string; title: string; /** Requester preview: portal-style centred reading column. */ centered?: boolean }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  // Lightbox — images zoom, videos "play" full-bleed. One piece of state serves both.
  const [lightbox, setLightbox] = useState<{ caption?: string; art?: 'client' | 'portal' } | null>(null);
  const blocks = ARTICLES[articleId] ?? GENERIC(title);

  const castVote = (v: 'up' | 'down') => {
    setVote(v);
    toast.success(v === 'up' ? 'Thanks — glad this was helpful' : 'Thanks — we will review this article');
  };

  return (
    <div className={centered ? 'px-10 py-8' : 'px-6 py-6'}>
      <article className={centered ? 'mx-auto max-w-[760px]' : 'max-w-[860px]'}>
        {blocks.map((b, i) => {
          switch (b.kind) {
            case 'h':
              return <h2 key={i} className="mb-2.5 mt-7 text-[15px] font-semibold text-[#1E293B] first:mt-0">{b.text}</h2>;
            case 'steps':
              return (
                <ol key={i} className="mb-4 space-y-2">
                  {b.items!.map((it, j) => (
                    <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-[#364658]">
                      <span className="mt-[1px] flex size-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-[11px] font-semibold text-[#3D8BD0]">{j + 1}</span>
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ol>
              );
            case 'bullets':
              return (
                <ul key={i} className="mb-4 space-y-1.5">
                  {b.items!.map((it, j) => (
                    <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-[#364658]">
                      <span className="mt-[7px] size-1.5 flex-shrink-0 rounded-full bg-[#CBD5E1]" />
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ul>
              );
            case 'note':
              return (
                <div key={i} className="mb-4 rounded border-l-2 border-[#3D8BD0] bg-[#F5F9FD] px-3.5 py-3 text-[13px] leading-relaxed text-[#364658]">
                  {b.text}
                </div>
              );
            case 'warn':
              return (
                <div key={i} className="mb-4 rounded border-l-2 border-[#F59E0B] bg-[#FFFBEB] px-3.5 py-3 text-[13px] leading-relaxed text-[#7C4A03]">
                  {b.text}
                </div>
              );
            case 'code':
              return (
                <pre key={i} className="mb-4 overflow-x-auto rounded bg-[#1E293B] px-3.5 py-3 font-mono text-[12px] leading-relaxed text-[#E2E8F0]">{b.text}</pre>
              );
            case 'image':
              return (
                <figure key={i} className="mb-5 mt-1">
                  <button
                    onClick={() => setLightbox({ caption: b.caption, art: b.art })}
                    className="group relative block w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] transition-colors hover:border-[#3D8BD0]"
                    aria-label="Open image"
                  >
                    <ScreenshotArt variant={b.art ?? 'client'} />
                    {/* Zoom affordance — appears on hover so the still stays clean at rest */}
                    <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded bg-[#0F172A]/75 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Maximize2 size={12} /> Click to enlarge
                    </span>
                  </button>
                  {b.caption && <figcaption className="mt-2 text-[12px] leading-relaxed text-[#7B8FA5]">{b.caption}</figcaption>}
                </figure>
              );
            case 'video':
              return <YouTubeFigure key={i} id={b.youtubeId ?? SAMPLE_VIDEO_ID} duration={b.duration} caption={b.caption} />;
            case 'table':
              return (
                <div key={i} className="mb-4 overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead className="border-b border-[#e5e7eb]">
                      <tr>
                        <th className="w-[38%] px-3 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Message</th>
                        <th className="px-3 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">What to do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {b.rows!.map(([k, v]) => (
                        <tr key={k}>
                          <td className="px-3 py-2.5 align-top text-[13px] font-medium text-[#364658]">{k}</td>
                          <td className="px-3 py-2.5 align-top text-[13px] leading-relaxed text-[#364658]">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            default:
              return <p key={i} className="mb-4 text-[13px] leading-relaxed text-[#364658]">{b.text}</p>;
          }
        })}

        {/* Feedback — closes the article, like the live Knowledge page */}
        <div className="mt-8 border-t border-[#E5E7EB] pt-5">
          <div className="mb-2.5 text-[13px] text-[#7B8FA5]">Was this article helpful?</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => castVote('up')}
              className={`inline-flex items-center gap-1.5 rounded border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                vote === 'up'
                  ? 'border-[#12B76A] bg-[#ECFDF3] text-[#067647]'
                  : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#12B76A] hover:bg-[#ECFDF3] hover:text-[#067647]'
              }`}
            >
              <ThumbsUp size={15} />
              Helpful
            </button>
            <button
              onClick={() => castVote('down')}
              className={`inline-flex items-center gap-1.5 rounded border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                vote === 'down'
                  ? 'border-[#F04438] bg-[#FEF3F2] text-[#B42318]'
                  : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#F04438] hover:bg-[#FEF3F2] hover:text-[#B42318]'
              }`}
            >
              <ThumbsDown size={15} />
              Not Helpful
            </button>
            {vote && <span className="text-[12px] text-[#7B8FA5]">Thanks for your feedback.</span>}
          </div>
        </div>
      </article>

      {/* Lightbox — click the backdrop or ✕ to close; Esc-free by design (prototype). */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-[980px]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-11 right-0 flex size-8 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            {/* Images only — video plays inline in its own figure, not here. */}
            <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
              <ScreenshotArt variant={lightbox.art ?? 'client'} />
            </div>
            {lightbox.caption && <div className="mt-3 text-center text-[12px] text-white/80">{lightbox.caption}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
