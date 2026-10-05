import { useEffect } from "react";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { EMAIL, PHONE_DISPLAY, PHONE_NUMBER } from "../lib/contact";
import { clearConsent } from "../lib/consent";
import { breadcrumbJsonLd, type Crumb } from "../lib/seo";

export const PRIVACY_PATH = "/privacy-policy";
export const PRIVACY_UPDATED = "October 5, 2026";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Privacy Policy", to: PRIVACY_PATH },
];

const h2 = "text-2xl md:text-3xl mt-12 mb-4";
const p = "text-foreground/85 leading-relaxed mb-4";
const ul = "list-disc pl-6 space-y-2 text-foreground/85 leading-relaxed mb-4";

/**
 * The privacy policy. It describes what the site actually does: the HubSpot quote form and chat, the optional Google
 * analytics and advertising tags (off until the visitor accepts), the configurator quote hand-off, and the hosting.
 * If one of those changes, change this page in the same commit.
 */
export default function PrivacyPolicyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="pt-28 pb-24">
      <Seo
        title="Privacy Policy"
        description="How Sunlite Signs LLC collects, uses and protects personal data on sunlitesigns.com: quote requests, uploaded artwork, live chat, cookies, analytics and advertising, and your rights."
        path={PRIVACY_PATH}
        jsonLd={breadcrumbJsonLd(crumbs)}
      />
      <div className="max-w-3xl mx-auto px-6">
        <Breadcrumbs items={crumbs} className="mb-8" />
        <p className="mono-label text-primary mb-3">Legal</p>
        <h1 className="text-5xl md:text-6xl">Privacy Policy</h1>
        <p className="mono-label text-muted-foreground mt-4">Last updated {PRIVACY_UPDATED}</p>

        <h2 className={h2}>1. Who we are</h2>
        <p className={p}>
          Sunlite Signs LLC (&ldquo;Sunlite Signs&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a wholesale sign manufacturer in the United States. This website,
          sunlitesigns.com, is for trade customers: sign companies, agencies and other professionals. We do not sell to consumers
          and we do not knowingly collect information from children. This policy explains what personal data we collect through this
          website, why, who receives it, and the choices you have.
        </p>
        <p className={p}>
          Contact for anything in this policy: <a className="text-primary hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> or{" "}
          <a className="text-primary hover:underline" href={`tel:${PHONE_NUMBER}`}>{PHONE_DISPLAY}</a>.
        </p>

        <h2 className={h2}>2. What we collect</h2>
        <h3 className="text-lg font-semibold mt-6 mb-2">Information you give us</h3>
        <ul className={ul}>
          <li><strong>Quote requests and the contact form:</strong> your name, company, email address, phone number, and the message and project details you write.</li>
          <li><strong>Files you upload:</strong> artwork, logos, drawings and similar files. Artwork can contain personal or confidential information, so please send only what is needed for the quote.</li>
          <li><strong>The 3D configurator:</strong> the design is built in your browser. If you send it as a quote request, we receive a description of your configuration (system, size, depth, mounting, colors), your artwork or text, and a preview image of the design, together with your contact details.</li>
          <li><strong>Live chat:</strong> the messages you type and any name or email address you give. The chat is provided by HubSpot.</li>
          <li><strong>Email and phone:</strong> what you send us when you write or call.</li>
        </ul>
        <h3 className="text-lg font-semibold mt-6 mb-2">Information collected automatically</h3>
        <ul className={ul}>
          <li><strong>Technical data:</strong> IP address, browser and device type, pages requested and the time. Our hosting provider and our content delivery and security provider (Cloudflare) process this to deliver the site and keep it secure.</li>
          <li>
            <strong>Analytics and advertising data, only if you accept cookies:</strong> which pages you view, how long, whether you use the configurator and
            send a quote request, the website you came from, and, if you arrived from an advertisement, its campaign tags and click ID.
          </li>
        </ul>

        <h2 className={h2}>3. Why we use it</h2>
        <ul className={ul}>
          <li>To answer your inquiry, prepare a quote and, if you order, produce and ship your order (performing a contract or taking steps you ask for).</li>
          <li>To operate, secure and fix the website (our legitimate interest in a working, safe site).</li>
          <li>To understand how the site is used and whether our advertising leads to inquiries, and to improve both (with your consent: nothing in this category runs until you accept).</li>
          <li>To meet legal obligations such as tax and accounting records.</li>
        </ul>
        <p className={p}>We do not use your information to make automated decisions that have legal or similarly significant effects on you.</p>

        <h2 className={h2}>4. Cookies, analytics and advertising</h2>
        <p className={p}>
          When you first visit, a notice lets you accept or decline optional cookies. Your choice is stored in your browser only. You can change it at any time
          with{" "}
          <button type="button" onClick={() => clearConsent()} className="text-primary underline underline-offset-2 hover:text-foreground">Cookie settings</button>{" "}
          (also in the footer).
        </p>
        <ul className={ul}>
          <li>
            <strong>Necessary:</strong> remembering your cookie choice (browser storage) and the technical operation of the site. These do not track you across sites.
          </li>
          <li>
            <strong>Analytics (optional):</strong> Google Tag Manager and Google Analytics measure page views, time on site and use of the configurator. They set cookies only if you accept.
          </li>
          <li>
            <strong>Advertising measurement (optional):</strong> Google Ads measures which advertisements lead to a quote request. If you arrive from an advertisement we keep
            its campaign tags with your inquiry so we can tell which advertisement led to it; in your browser they are stored for up to 90 days, and only if you accepted.
          </li>
          <li>
            <strong>Remarketing (optional):</strong> if you accept advertising cookies, Google Ads may recognise your browser as one that visited this site, so that our advertisements can be shown
            to you on Google&rsquo;s services and partner websites. You can turn this off with Cookie settings, and you can manage Google&rsquo;s ad personalisation in your Google account.
          </li>
          <li>
            <strong>YouTube (homepage video):</strong> the background video on the homepage is played from YouTube in its privacy-enhanced mode (youtube-nocookie.com). YouTube
            receives your IP address and browser details to deliver the video, like any server you connect to.
          </li>
          <li>
            <strong>HubSpot (form and chat):</strong> the quote form is provided by HubSpot, which may set cookies to operate the form and connect it to your inquiry. The
            chat widget loads only after you accept cookies or when you click &ldquo;Chat with us&rdquo;.
          </li>
        </ul>
        <p className={p}>
          Until you accept, the Google tags run in a restricted mode: they set no analytics or advertising cookies and receive no advertising identifiers. Like any
          server you connect to, Google still receives the technical data every web request carries, such as your IP address and browser type. If you decline, the quote form and the
          configurator work in the same way.
        </p>

        <h2 className={h2}>5. Who receives your data</h2>
        <p className={p}>We share personal data only with service providers that process it for us, and where the law requires it:</p>
        <ul className={ul}>
          <li><strong>HubSpot</strong>: stores quote requests, uploaded files and chat conversations, and sends them to us (our customer relationship management, forms and chat provider).</li>
          <li><strong>Google</strong>: Tag Manager, Analytics and Ads, only if you accept cookies.</li>
          <li><strong>Cloudflare</strong>: delivers the site and protects it against attacks.</li>
          <li><strong>Our hosting provider</strong>: runs the servers the site is served from.</li>
          <li><strong>Our email and file-sharing providers</strong>: to correspond with you and exchange artwork.</li>
          <li>Professional advisers, authorities or a buyer of the business, where required by law or in a sale of the business.</li>
        </ul>
        <p className={p}>
          We do not sell your personal information. We do not share it with advertisers or data brokers. If you accept advertising cookies, Google processes the data described in section 4 as
          our service provider, to measure our advertisements and to show our advertisements to people who visited the site (remarketing); you can withdraw that at any time with Cookie settings.
        </p>
        <p className={p}>
          Some of these providers are in, or process data in, the United States and other countries. Where personal data of people in the European Economic Area, the United Kingdom or
          Switzerland is transferred outside those regions, we rely on the safeguards our providers offer, such as standard contractual clauses.
        </p>

        <h2 className={h2}>6. How long we keep it</h2>
        <ul className={ul}>
          <li>Quote requests and the related correspondence: while we are dealing with you, and afterwards as long as needed for follow-up, warranty and legal or accounting reasons.</li>
          <li>Uploaded artwork and configurator previews: as long as needed to quote and produce your order, then deleted unless we must keep them (for example, for a repeat order you ask us to prepare, or by law).</li>
          <li>Chat conversations: as long as needed to answer you and keep the inquiry record.</li>
          <li>Analytics data: for the period set in our Google Analytics account. Campaign tags in your browser: up to 90 days, only if you accepted.</li>
          <li>Server logs: for a short period, for security and troubleshooting.</li>
        </ul>

        <h2 className={h2}>7. Your rights</h2>
        <p className={p}>Depending on where you live (for example California and other US states, the European Economic Area, the United Kingdom), you may have the right to:</p>
        <ul className={ul}>
          <li>know what personal data we hold about you and get a copy of it;</li>
          <li>have inaccurate data corrected and ask us to delete your data;</li>
          <li>object to or restrict our processing, and withdraw consent at any time (with Cookie settings for cookies);</li>
          <li>receive your data in a portable format;</li>
          <li>not be treated worse for using these rights; and</li>
          <li>complain to your data protection authority or state attorney general.</li>
        </ul>
        <p className={p}>
          To use these rights, email <a className="text-primary hover:underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> or call {PHONE_DISPLAY}. We may need to confirm
          your identity first, and we answer within the period the law gives us (usually 30 to 45 days).
        </p>

        <h2 className={h2}>8. Security</h2>
        <p className={p}>
          The site is served over an encrypted (HTTPS) connection. We limit access to quote requests and files to the people who need them, and we choose service providers that
          protect data. No online service is completely secure, so please do not send us information you do not want to share, such as payment card numbers or passwords.
        </p>

        <h2 className={h2}>9. Links to other websites</h2>
        <p className={p}>This site may link to other websites. We are not responsible for their content or privacy practices.</p>

        <h2 className={h2}>10. Changes to this policy</h2>
        <p className={p}>
          We update this policy when our practices or the law change, and show the date at the top. Material changes will be highlighted on this page.
        </p>
      </div>
    </div>
  );
}
