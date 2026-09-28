import User from "../models/user.model.js"

export const postUser = async (req, res) =>{
    try{
        const {firstName, lastName, email, password, gender, jobTitle, role} = req.body

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            gender,
            jobTitle,
            role
        });

        res.status(201).json({
            success: true,
            message: "user created",
            data: user
        })

    }catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}


export const getAllUsers = async (req,res) => {
    try{
        const allusers = await User.find({})

        res.status(200).json({
            message: "Users fetched successfully",
            success: true,
            data: allusers
        })

    }
    catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export const getUserById = async (req, res) => {
    try{
        const {idd} = req.params

        const user = await User.findById(id)

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "User fetched successfully",
            data: user
        })

    }
    catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const putUserById = async (req, res) =>{
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const patchUserById = async (req, res) =>{
    try{
        const user = await User.findByIdAndUpdate(req.params.id,
            {$set: req.body},
            {
                new: true,
                runValidators: true
            }
        )

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const deleteUserById = async (req, res) =>{
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }
}



export default {postUser, getAllUsers, getUserById, patchUserById, putUserById, deleteUserById }