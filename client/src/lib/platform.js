// Small platform helper so keyboard hints read correctly.
export const isApplePlatform = () => {
    if (typeof navigator === "undefined") return false
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}
