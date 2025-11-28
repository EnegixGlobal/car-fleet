// // Helper function to get the full URL for uploaded files
// export const getUploadUrl = (filename: string | undefined | null): string | undefined => {
//   if (!filename) return undefined;
//   // If it's already a full URL, return it as is
//   if (filename.startsWith('http://') || filename.startsWith('https://')) {
//     return filename;
//   }
//   // Otherwise, construct the URL from the API base URL
//   const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
//   const baseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get base URL
//   return `${baseUrl}/uploads/${filename}`;
// };

export const getUploadUrl = (
  filename: string | undefined | null
): string | undefined => {
  if (!filename) return undefined;

  // If image already has http/https link
  if (/^https?:\/\//.test(filename)) {
    return filename;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Remove trailing /api safely
  const baseUrl = apiBaseUrl.endsWith("/api")
    ? apiBaseUrl.slice(0, -4)
    : apiBaseUrl;

  return `${baseUrl}/uploads/${filename}`;
};
