import { Link } from "react-router-dom"

import PublicLayout from "../components/PublicLayout.jsx"
import { SUPPORT_EMAIL } from "../lib/constants.js"
import { useDocumentMeta } from "../lib/useDocumentMeta.js"

const EFFECTIVE_DATE = "16 October 2026"

const TEMPLATE_NOTE =
    "This document is a working template shipped with the demo. It is not legal advice — have it reviewed and replaced with your organisation's approved wording before running ClientFlow in production."

const Clause = ({ heading, children }) => (
    <section className="mt-8">
        <h2 className="font-display text-base font-semibold tracking-tight text-ink">
            {heading}
        </h2>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
            {children}
        </div>
    </section>
)

const Doc = ({ title, intro, children }) => (
    <article className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            Legal · effective {EFFECTIVE_DATE}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            {title}
        </h1>
        {intro ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p>
        ) : null}

        <div
            role="note"
            className="mt-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs leading-relaxed text-muted"
        >
            <strong className="font-semibold text-ink">
                Template notice.{" "}
            </strong>
            {TEMPLATE_NOTE}
        </div>

        {children}

        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
            Questions about this document? Email{" "}
            <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-ink underline underline-offset-4 hover:opacity-70"
            >
                {SUPPORT_EMAIL}
            </a>
            .{" "}
            <Link
                to="/privacy"
                className="text-ink underline underline-offset-4 hover:opacity-70"
            >
                Privacy
            </Link>
            {" · "}
            <Link
                to="/terms"
                className="text-ink underline underline-offset-4 hover:opacity-70"
            >
                Terms
            </Link>
            {" · "}
            <Link
                to="/cookies"
                className="text-ink underline underline-offset-4 hover:opacity-70"
            >
                Cookies
            </Link>
        </p>
    </article>
)

export const PrivacyPolicyPage = () => {
    useDocumentMeta(
        "Privacy Policy",
        "How ClientFlow collects, uses, stores and protects personal data.",
    )

    return (
        <PublicLayout>
            <Doc
                title="Privacy Policy"
                intro="This policy explains what personal data ClientFlow processes when your agency uses the dashboard, why we process it, and the choices available to you."
            >
                <Clause heading="1. Who we are">
                    <p>
                        ClientFlow is project-management software operated by the
                        agency that gave you an account (the “controller”). The
                        agency decides what is stored in the workspace; this
                        policy describes the processing that happens inside the
                        product.
                    </p>
                </Clause>

                <Clause heading="2. What we collect">
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>
                            <strong className="font-medium text-ink">
                                Account data
                            </strong>{" "}
                            — name, work email address, role and, if you upload
                            one, an avatar.
                        </li>
                        <li>
                            <strong className="font-medium text-ink">
                                Work data
                            </strong>{" "}
                            — clients, projects, tasks, comments, due dates and
                            the activity log that records who changed what.
                        </li>
                        <li>
                            <strong className="font-medium text-ink">
                                Session data
                            </strong>{" "}
                            — an HTTP-only refresh cookie, and short-lived access
                            tokens held in memory.
                        </li>
                        <li>
                            <strong className="font-medium text-ink">
                                Technical data
                            </strong>{" "}
                            — server logs (timestamp, route, status) used to keep
                            the service available and secure.
                        </li>
                    </ul>
                </Clause>

                <Clause heading="3. Why we process it">
                    <p>
                        To create and secure your account, to show you the
                        projects and tasks you have access to, to deliver
                        notifications and the live activity feed, to keep an
                        audit trail, and to provide support. We do not sell
                        personal data and we do not use it for advertising.
                    </p>
                </Clause>

                <Clause heading="4. Legal bases">
                    <p>
                        Where the GDPR applies, processing rests on performance
                        of a contract (providing the service), legitimate
                        interests (security, audit trails, service
                        improvements), and consent where we ask for it — for
                        example for optional cookies.
                    </p>
                </Clause>

                <Clause heading="5. Sharing">
                    <p>
                        Data is visible to people inside your agency according to
                        their role: administrators see everything, project
                        managers see their own projects, and developers see the
                        tasks assigned to them. We share data with infrastructure
                        providers (hosting, database, email) strictly to run the
                        service, under written data-processing terms.
                    </p>
                </Clause>

                <Clause heading="6. Retention">
                    <p>
                        Work data is kept while your agency's workspace is
                        active. Activity records are retained so the audit trail
                        stays meaningful. Server logs are rotated on a short
                        cycle. When a workspace closes, data is deleted or
                        anonymised within a reasonable period unless the law
                        requires otherwise.
                    </p>
                </Clause>

                <Clause heading="7. Security">
                    <p>
                        Passwords are stored only as bcrypt hashes. Access tokens
                        are short-lived and held in memory; the refresh token
                        lives in an HTTP-only, SameSite cookie that JavaScript
                        cannot read. All write endpoints validate input and
                        enforce role checks on the server.
                    </p>
                </Clause>

                <Clause heading="8. Your rights">
                    <p>
                        Depending on where you live you may request access to,
                        correction of, or deletion of your personal data, object
                        to processing, or ask for a portable copy. Contact your
                        agency administrator or email us and we will respond
                        within the time the law allows.
                    </p>
                </Clause>

                <Clause heading="9. Cookies">
                    <p>
                        We use one strictly necessary cookie to keep you signed
                        in and one local preference for your theme. See the{" "}
                        <Link
                            to="/cookies"
                            className="text-ink underline underline-offset-4 hover:opacity-70"
                        >
                            Cookie Policy
                        </Link>{" "}
                        for the full list.
                    </p>
                </Clause>

                <Clause heading="10. Children">
                    <p>
                        ClientFlow is a workplace tool and is not intended for
                        anyone under 16.
                    </p>
                </Clause>

                <Clause heading="11. Changes">
                    <p>
                        We will post any material change on this page and update
                        the effective date above. Continued use after a change
                        means you accept the updated policy.
                    </p>
                </Clause>
            </Doc>
        </PublicLayout>
    )
}

export const TermsPage = () => {
    useDocumentMeta(
        "Terms & Conditions",
        "The terms that govern your agency's use of the ClientFlow dashboard.",
    )

    return (
        <PublicLayout>
            <Doc
                title="Terms & Conditions"
                intro="These terms govern access to and use of ClientFlow. By signing in you accept them on behalf of yourself and the agency that invited you."
            >
                <Clause heading="1. Accounts and access">
                    <p>
                        Accounts are created by an agency administrator. Keep
                        your credentials confidential, use a strong password, and
                        tell your administrator immediately if you believe your
                        access has been compromised. Access is personal and must
                        not be shared.
                    </p>
                </Clause>

                <Clause heading="2. Acceptable use">
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>
                            Do not attempt to reach data outside your role, probe
                            or bypass access controls, or interfere with the
                            service.
                        </li>
                        <li>
                            Do not upload unlawful content, malware, or data you
                            do not have the right to share.
                        </li>
                        <li>
                            Do not scrape, resell, or reverse engineer the
                            service.
                        </li>
                    </ul>
                </Clause>

                <Clause heading="3. Your content">
                    <p>
                        You and your agency keep ownership of the clients,
                        projects, tasks and files you put into ClientFlow. You
                        grant us the limited licence needed to store, process and
                        display that content in order to run the service, and you
                        confirm you have the rights to share it.
                    </p>
                </Clause>

                <Clause heading="4. Our intellectual property">
                    <p>
                        The software, design and documentation remain ours. These
                        terms grant you a non-exclusive, non-transferable right to
                        use the service for your agency's internal business while
                        your workspace is active.
                    </p>
                </Clause>

                <Clause heading="5. Availability">
                    <p>
                        We work to keep the service available and to give notice
                        of planned maintenance, but we do not promise
                        uninterrupted access. The service is provided “as is”
                        without implied warranties beyond those the law does not
                        allow us to exclude.
                    </p>
                </Clause>

                <Clause heading="6. Liability">
                    <p>
                        To the extent the law permits, we are not liable for
                        indirect or consequential loss, lost profits, or lost
                        data. Nothing here limits liability that cannot lawfully
                        be limited.
                    </p>
                </Clause>

                <Clause heading="7. Suspension and termination">
                    <p>
                        We may suspend or end access if these terms are breached
                        or if the law requires it. On termination your access
                        stops and your agency can arrange an export of work data
                        within the agreed window.
                    </p>
                </Clause>

                <Clause heading="8. Governing law">
                    <p>
                        These terms are governed by the laws of the jurisdiction
                        in which the operating agency is established, and the
                        courts of that jurisdiction have exclusive jurisdiction.
                    </p>
                </Clause>

                <Clause heading="9. Changes">
                    <p>
                        We may update these terms. Material changes will be
                        announced in the product or by email, and the effective
                        date above will be revised.
                    </p>
                </Clause>
            </Doc>
        </PublicLayout>
    )
}

export const CookiePolicyPage = () => {
    useDocumentMeta(
        "Cookie Policy",
        "The cookies and local storage ClientFlow uses, and how to control them.",
    )

    return (
        <PublicLayout>
            <Doc
                title="Cookie Policy"
                intro="ClientFlow keeps cookie and local-storage use deliberately small: one cookie that keeps you signed in, plus local preferences that never leave your browser."
            >
                <Clause heading="1. What cookies and local storage are">
                    <p>
                        A cookie is a small piece of data a site stores in your
                        browser and sends back on each request. Local storage is
                        a browser-only key/value store that is never
                        automatically sent to a server.
                    </p>
                </Clause>

                <Clause heading="2. What we use">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                                    <th className="py-2 pr-4 font-medium">
                                        Name
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Type
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Purpose
                                    </th>
                                    <th className="py-2 font-medium">
                                        Lifetime
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-muted">
                                <tr className="border-b border-line">
                                    <td className="py-2.5 pr-4 font-mono text-xs text-ink">
                                        refreshToken
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Strictly necessary
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Keeps you signed in. HTTP-only, so page
                                        scripts cannot read it.
                                    </td>
                                    <td className="py-2.5">7 days</td>
                                </tr>
                                <tr className="border-b border-line">
                                    <td className="py-2.5 pr-4 font-mono text-xs text-ink">
                                        clientflow-theme
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Preference (local storage)
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Remembers light or dark mode.
                                    </td>
                                    <td className="py-2.5">Until cleared</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 pr-4 font-mono text-xs text-ink">
                                        clientflow-cookie-consent
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Preference (local storage)
                                    </td>
                                    <td className="py-2.5 pr-4">
                                        Remembers that you answered the cookie
                                        banner.
                                    </td>
                                    <td className="py-2.5">Until cleared</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Clause>

                <Clause heading="3. What we do not use">
                    <p>
                        No advertising cookies, no cross-site trackers, and no
                        third-party analytics on your work data. If that ever
                        changes, we will ask for consent first and update this
                        page.
                    </p>
                </Clause>

                <Clause heading="4. Managing them">
                    <p>
                        You can clear or block cookies in your browser settings.
                        Blocking the sign-in cookie will end your session, and
                        clearing local storage will reset your theme and cookie
                        preference.
                    </p>
                </Clause>

                <Clause heading="5. Changes">
                    <p>
                        If our cookie use changes we will update this table and
                        the effective date at the top of the page.
                    </p>
                </Clause>
            </Doc>
        </PublicLayout>
    )
}
