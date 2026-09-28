import express from"express"
import {postUser, getAllUsers, getUserById, patchUserById, putUserById, deleteUserById} from "../controllers/user.controllers.js"
const router = express.Router()

router
.route("/")
.post(postUser)
.get(getAllUsers)


router
.route("/:id")
.get(getUserById)
.patch(patchUserById)
.put(putUserById)
.delete(deleteUserById)

export default router