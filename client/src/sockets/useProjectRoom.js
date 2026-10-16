import { useEffect } from "react"

import { getSocket } from "./socket.js"

// Used by a project page so the current viewer receives that project's live
// board updates. The server re-checks access before letting the socket join.
export const useProjectRoom = (projectId) => {
    useEffect(() => {
        if (!projectId) return undefined

        const socket = getSocket()
        if (!socket) return undefined

        const join = () => socket.emit("project:join", projectId)
        const leave = () => socket.emit("project:leave", projectId)

        if (socket.connected) join()

        socket.on("connect", join)

        return () => {
            leave()
            socket.off("connect", join)
        }
    }, [projectId])
}

export default useProjectRoom
