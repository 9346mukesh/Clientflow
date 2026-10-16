import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"

import { COOKIE_CONSENT_KEY, setCookieConsent } from "../features/ui/uiSlice.js"
import { Button } from "./ui.jsx"

// A single, honest notice: we store one preference and nothing else yet.
const CookieBanner = () => {
    const dispatch = useDispatch()
    const consent = useSelector((state) => state.ui.cookieConsent)

    if (consent) return null

    const choose = (value) => {
        try {
            localStorage.setItem(COOKIE_CONSENT_KEY, value)
        } catch {
            // storage can be unavailable in private mode; the banner still closes
        }
        dispatch(setCookieConsent(value))
    }

    return (
        <div
            role="region"
            aria-label="Cookie notice"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur"
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p className="text-xs leading-relaxed text-muted">
                    ClientFlow stores a sign-in cookie and a single preference
                    for your theme. No advertising or third-party tracking
                    cookies are used.{" "}
                    <Link
                        to="/cookies"
                        className="text-ink underline underline-offset-4 hover:opacity-70"
                    >
                        Read the cookie policy
                    </Link>
                    .
                </p>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => choose("dismissed")}
                    >
                        Decline
                    </Button>
                    <Button size="sm" onClick={() => choose("accepted")}>
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CookieBanner
