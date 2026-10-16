import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { toggleTheme, THEME_STORAGE_KEY } from "./themeSlice.js"
import { IconButton } from "../../components/ui.jsx"
import { IconMoon, IconSun } from "../../components/icons.jsx"

// Writes the chosen mode to <html> and to storage. Mounted once at the root.
export const ThemeSync = () => {
    const mode = useSelector((state) => state.theme.mode)

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle("dark", mode === "dark")
        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode)
        } catch {
            // storage can be unavailable in private mode; the toggle still works
        }
    }, [mode])

    return null
}

const ThemeToggle = ({ className = "" }) => {
    const dispatch = useDispatch()
    const mode = useSelector((state) => state.theme.mode)
    const isDark = mode === "dark"

    return (
        <IconButton
            label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={isDark}
            onClick={() => dispatch(toggleTheme())}
            className={className}
        >
            {isDark ? <IconSun /> : <IconMoon />}
        </IconButton>
    )
}

export default ThemeToggle
