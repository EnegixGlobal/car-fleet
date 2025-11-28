// Cloudinary configuration - COMMENTED OUT - Using local system uploads instead
// import { v2 as cloudinary } from 'cloudinary';

// Determine if Cloudinary is properly configured
// export const isCloudinaryConfigured = Boolean(
//   process.env.CLOUDINARY_CLOUD_NAME &&
//   process.env.CLOUDINARY_API_KEY &&
//   process.env.CLOUDINARY_API_SECRET
// );

// Configure only with provided env values; missing values mean uploads should be skipped/fallback
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// export const uploadToCloudinary = async (filePath: string, folder = 'drivers') => {
//   const res = await cloudinary.uploader.upload(filePath, { folder });
//   return { url: res.secure_url, publicId: res.public_id };
// };

// export const deleteFromCloudinary = async (publicId: string) => {
//   try { await cloudinary.uploader.destroy(publicId); } catch { /* ignore */ }
// };

// export default cloudinary;
