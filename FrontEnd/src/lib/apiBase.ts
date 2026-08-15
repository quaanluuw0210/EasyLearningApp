// Cập nhật URL mặc định sang domain Render mới của bạn
const DEFAULT_API_ORIGIN = "https://easylearningapp.onrender.com";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const stripApiV1Suffix = (value: string) =>
  trimTrailingSlash(value).replace(/\/api\/v1$/i, "");

export const getApiOrigin = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_ORIGIN;

  return stripApiV1Suffix(configuredUrl);
};

export const getApiV1BaseUrl = () => {
  // Ưu tiên BASE_URL trước để lấy chính xác đường dẫn /api/v1 nếu có
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_API_ORIGIN;

  const normalizedUrl = trimTrailingSlash(configuredUrl);
  return /\/api\/v1$/i.test(normalizedUrl)
    ? normalizedUrl
    : `${stripApiV1Suffix(normalizedUrl)}/api/v1`;
};