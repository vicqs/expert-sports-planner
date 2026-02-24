/**
 * Custom Hooks Index
 *
 * Central export file for all custom hooks
 */

export { useForm } from "./useForm";
export { useAsync } from "./useAsync";
export { useLocalStorage } from "./useLocalStorage";
export { useDebounce, useDebouncedCallback } from "./useDebounce";
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "./useMediaQuery";
export { useAthleteId, clearAthleteSession } from "../utils/auth";
export { useModal, useConfirm } from "./useModal";
export { default as useTheme } from "./useTheme";
