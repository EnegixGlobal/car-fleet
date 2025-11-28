// Helper function to get the full URL for uploaded files
export const getUploadUrl = (filename: string | undefined | null): string | undefined => {
  if (!filename) return undefined;
  // If it's already a full URL, return it as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  // Otherwise, construct the URL from the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get base URL
  return `${baseUrl}/uploads/${filename}`;
};

