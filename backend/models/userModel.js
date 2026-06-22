import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, required: true, maxlength: 128 },
    //Optional: accounts created via an OAuth provider (Google, ...) have no password
    password: { type: String, maxlength: 256, select: false },
    //OAuth provider subject ids. Not secret, so left selectable for the find-or-link lookup
    googleId: { type: String },
    facebookId: { type: String },
    //resetToken is for password change
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    //refreshToken is for jwt refresh
    refreshToken: { type: String, select: false },
    refreshTokenExpiry: { type: Date, select: false }
}, { timestamps: true });

//Sparse indexes so null tokens don't consume index space for inactive users
userSchema.index({ refreshToken: 1 }, { sparse: true });
userSchema.index({ resetToken: 1 }, { sparse: true });
//Unique+sparse: one account per provider id, but users without that provider are exempt
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ facebookId: 1 }, { unique: true, sparse: true });
//NOTE: do NOT add a TTL index on refreshTokenExpiry, MongoDB TTL deletes entire documents, not fields.
//Expiry is enforced at query time via { refreshTokenExpiry: { $gt: Date.now() } }.

const User = mongoose.model("User", userSchema);
export default User;
